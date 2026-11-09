<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Offer;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

class HotelDomainService
{
    public function createGuestBooking(User $user, array $data): array
    {
        $checkIn = Carbon::createFromFormat('Y-m-d', $data['checkIn'], 'UTC')->startOfDay();
        $checkOut = Carbon::createFromFormat('Y-m-d', $data['checkOut'], 'UTC')->startOfDay();
        if ($checkIn->lt(now('UTC')->startOfDay()) || !$checkOut->gt($checkIn)) {
            throw new HttpException(400, 'Choose valid stay dates, with departure after arrival and arrival no earlier than today.');
        }

        $roomType = RoomType::query()->where('source_id', $data['roomTypeId'])->first();
        if (!$roomType || $roomType->rate_per_night < 0) {
            throw new HttpException(400, 'Choose a valid room type.');
        }
        if ((int) $data['guests'] > $roomType->capacity) {
            throw new HttpException(400, "This room type accommodates up to {$roomType->capacity} guests.");
        }

        $booking = DB::transaction(function () use ($user, $data, $checkIn, $checkOut, $roomType) {
            $amount = $checkOut->diffInDays($checkIn) * (float) $roomType->rate_per_night;
            $booking = Booking::query()->create([
                'source_id' => 'B-'.Str::uuid(),
                'guest_profile_id' => $user->guestProfile->id,
                'room_type_id' => $roomType->id,
                'check_in' => $checkIn->toDateString(),
                'check_out' => $checkOut->toDateString(),
                'guests' => $data['guests'],
                'status' => 'pending',
                'total_amount' => $amount,
                'base_amount' => $amount,
                'offer_discount_amount' => 0,
                'requests' => $data['requests'] ?? '',
            ]);
            $user->guestProfile->increment('total_bookings');
            return $booking;
        });

        return [$booking, $roomType];
    }

    public function updateBooking(Booking $booking, array $data): Booking
    {
        return DB::transaction(function () use ($booking, $data) {
            $booking = Booking::query()->whereKey($booking->id)->lockForUpdate()->first();
            $status = $data['status'] ?? $booking->status;
            $roomId = array_key_exists('roomId', $data)
                ? ($data['roomId'] === null ? null : Room::query()->where('source_id', $data['roomId'])->value('id'))
                : $booking->room_id;
            if (array_key_exists('roomId', $data) && $data['roomId'] !== null && $roomId === null) {
                throw new HttpException(400, 'Choose a valid physical room.');
            }
            $room = $roomId ? Room::query()->whereKey($roomId)->first() : null;
            if ($room && (int) $room->room_type_id !== (int) $booking->room_type_id) {
                throw new HttpException(400, 'The assigned room must be a physical room of the requested room type.');
            }
            if ($room && $room->status === 'maintenance' &&
                !in_array($status, ['pending', 'cancelled', 'checked-out'], true)) {
                throw new HttpException(400, 'A room under maintenance cannot be assigned to an active stay.');
            }
            if ($room && !in_array($status, ['pending', 'cancelled', 'checked-out'], true)) {
                $conflict = Booking::query()->where('room_id', $room->id)->where('id', '<>', $booking->id)
                    ->whereIn('status', ['confirmed', 'checked-in'])
                    ->whereDate('check_in', '<', $booking->check_out)
                    ->whereDate('check_out', '>', $booking->check_in)->exists();
                if ($conflict) {
                    throw new HttpException(409, 'This room is already assigned to an overlapping confirmed stay.');
                }
            }
            if (in_array($status, ['confirmed', 'checked-in'], true) && !$roomId) {
                throw new HttpException(400, 'Assign a physical room before confirming or checking a guest in.');
            }

            $applied = $booking->applied_offer;
            if (array_key_exists('offerId', $data)) {
                $applied = null;
                if ($data['offerId']) {
                    $snapshot = $booking->applied_offer;
                    $offer = Offer::query()->where('source_id', $data['offerId'])->first();
                    if ($snapshot && ($snapshot['id'] ?? null) === $data['offerId']) {
                        $applied = $snapshot;
                    } elseif (!$offer || !$offer->active ||
                        $offer->start_date->format('Y-m-d') > $booking->check_in->format('Y-m-d') ||
                        $offer->end_date->format('Y-m-d') < $booking->check_out->format('Y-m-d')) {
                        throw new HttpException(400, 'Choose an active offer that covers the entire stay, or select no offer.');
                    } else {
                        $applied = [
                            'id' => $offer->source_id,
                            'title' => $offer->title,
                            'discountType' => $offer->discount_type,
                            'discountValue' => (float) $offer->discount_value,
                        ];
                    }
                }
            }
            $base = (float) ($booking->base_amount ?: $booking->total_amount);
            $discount = !$applied ? 0 : (($applied['discountType'] ?? null) === 'percentage'
                ? $base * (float) $applied['discountValue'] / 100
                : min($base, (float) $applied['discountValue']));
            $booking->update([
                'status' => $status,
                'room_id' => $roomId,
                'applied_offer' => $applied,
                'base_amount' => $base,
                'offer_discount_amount' => $discount,
                'total_amount' => max(0, $base - $discount),
            ]);

            return $booking->fresh()->load(['guestProfile.user', 'roomType']);
        });
    }
}
