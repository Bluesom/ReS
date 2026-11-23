<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Models\GuestProfile;
use App\Models\Offer;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ImportLegacyJson extends Command
{
    protected $signature = 'app:import-legacy-json {source? : Path to the source JSON file}';

    protected $description = 'Import source JSON records once without deleting or overwriting existing Laravel records.';

    public function handle(): int
    {
        $path = $this->argument('source') ?: database_path('seeders/data/db.json');
        if (!is_file($path) || !is_readable($path)) {
            $this->error('The source JSON file does not exist or cannot be read.');
            return self::FAILURE;
        }

        try {
            $source = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
            $counts = DB::transaction(fn () => Model::unguarded(fn () => $this->import($source)));
        } catch (\Throwable $exception) {
            $this->error('Import failed; no source or target records were changed.');
            $this->line($exception->getMessage());
            return self::FAILURE;
        }

        $this->info('Import completed without deleting or overwriting existing source-ID records.');
        foreach ($counts as $entity => $count) {
            $this->line("{$entity}: {$count} inserted");
        }

        return self::SUCCESS;
    }

    private function import(array $source): array
    {
        $counts = [
            'users and profiles' => 0,
            'room types' => 0,
            'rooms' => 0,
            'offers' => 0,
            'bookings' => 0,
        ];

        foreach (($source['guests'] ?? []) as $guest) {
            $credential = $this->credential($source['guestCredentials'] ?? [], $guest['id'] ?? '');
            $user = $this->account($guest, 'guest', $credential);
            $profile = GuestProfile::query()->firstOrCreate(
                ['user_id' => $user->id],
                [
                    'guest_number' => $guest['guestNumber'],
                    'country' => $guest['country'] ?? '',
                    'phone' => $guest['phone'] ?? '',
                    'active' => $guest['active'] ?? true,
                    'total_bookings' => $guest['totalBookings'] ?? 0,
                    'last_stay' => $guest['lastStay'] ?? null,
                    'created_at' => $this->sourceDate($guest['createdAt'] ?? null),
                    'updated_at' => $this->sourceDate($guest['createdAt'] ?? null),
                ]
            );
            if ($profile->wasRecentlyCreated || $user->wasRecentlyCreated) {
                $counts['users and profiles']++;
            }
        }

        foreach (($source['admins'] ?? []) as $admin) {
            $credential = $this->credential($source['adminCredentials'] ?? [], $admin['id'] ?? '');
            $user = $this->account($admin, 'admin', $credential);
            $profile = $user->adminProfile()->firstOrCreate(
                ['user_id' => $user->id],
                ['admin_number' => $admin['adminNumber']]
            );
            if ($profile->wasRecentlyCreated || $user->wasRecentlyCreated) {
                $counts['users and profiles']++;
            }
        }

        foreach (($source['roomTypes'] ?? []) as $item) {
            $created = RoomType::query()->firstOrCreate(
                ['source_id' => $item['id']],
                [
                    'name' => $item['name'],
                    'description' => $item['description'] ?? '',
                    'rate_per_night' => $item['ratePerNight'] ?? 0,
                    'image_path' => $item['imagePath'] ?? '',
                    'capacity' => $item['capacity'] ?? 2,
                    'bed_type' => $item['bedType'] ?? 'Queen',
                    'smoking_allowed' => $item['smokingAllowed'] ?? false,
                    'sofa' => $item['sofa'] ?? false,
                    'amenities' => $item['amenities'] ?? [],
                    'meal_plan' => $item['mealPlan'] ?? 'No meals',
                ]
            );
            $counts['room types'] += $created->wasRecentlyCreated ? 1 : 0;
        }

        foreach (($source['rooms'] ?? []) as $item) {
            $roomTypeId = RoomType::query()->where('source_id', $item['roomTypeId'] ?? null)->value('id');
            if (!$roomTypeId) {
                throw new RuntimeException('A source room references a missing room type.');
            }
            $created = Room::query()->firstOrCreate(
                ['source_id' => $item['id']],
                [
                    'room_number' => $item['roomNumber'],
                    'room_type_id' => $roomTypeId,
                    'floor' => $item['floor'] ?? 0,
                    // Keep the source value as-is, including the legacy "occupied" fixture.
                    'status' => $item['status'] ?? 'available',
                ]
            );
            $counts['rooms'] += $created->wasRecentlyCreated ? 1 : 0;
        }

        foreach (($source['offers'] ?? []) as $item) {
            $created = Offer::query()->firstOrCreate(
                ['source_id' => $item['id']],
                [
                    'title' => $item['title'],
                    'description' => $item['description'] ?? '',
                    'discount_type' => $item['discountType'],
                    'discount_value' => $item['discountValue'],
                    'start_date' => $item['startDate'],
                    'end_date' => $item['endDate'],
                    'active' => $item['active'] ?? false,
                    'image_path' => $item['imagePath'] ?? '',
                ]
            );
            $counts['offers'] += $created->wasRecentlyCreated ? 1 : 0;
        }

        foreach (($source['bookings'] ?? []) as $item) {
            $guest = User::query()->where('source_id', $item['guestId'] ?? null)->first();
            $guestProfile = $guest?->guestProfile;
            $roomTypeId = RoomType::query()->where('source_id', $item['roomTypeId'] ?? null)->value('id');
            $roomId = !empty($item['roomId'])
                ? Room::query()->where('source_id', $item['roomId'])->value('id')
                : null;
            if (!$guestProfile || !$roomTypeId || (!empty($item['roomId']) && !$roomId)) {
                throw new RuntimeException('A source booking references a missing guest, room type, or physical room.');
            }
            $created = Booking::query()->firstOrCreate(
                ['source_id' => $item['id']],
                [
                    'guest_profile_id' => $guestProfile->id,
                    'room_type_id' => $roomTypeId,
                    'room_id' => $roomId,
                    'check_in' => $item['checkIn'],
                    'check_out' => $item['checkOut'],
                    'guests' => $item['guests'],
                    'status' => $item['status'],
                    'total_amount' => $item['totalAmount'] ?? 0,
                    'base_amount' => $item['baseAmount'] ?? ($item['totalAmount'] ?? 0),
                    'applied_offer' => $this->offerSnapshot($item['appliedOffer'] ?? null),
                    'offer_discount_amount' => $item['offerDiscountAmount'] ?? 0,
                    'requests' => $item['requests'] ?? null,
                    'created_at' => $this->sourceDate($item['createdAt'] ?? null),
                    'updated_at' => $this->sourceDate($item['createdAt'] ?? null),
                ]
            );
            $counts['bookings'] += $created->wasRecentlyCreated ? 1 : 0;
        }

        $storedSequence = (int) DB::table('sequences')->where('sequence_name', 'guestNumber')->value('current_value');
        $sourceSequence = (int) ($source['sequences']['guestNumber'] ?? 0);
        $guestMaximum = GuestProfile::query()->pluck('guest_number')->reduce(
            fn (int $highest, string $number) => preg_match('/^G-(\d+)$/', $number, $match)
                ? max($highest, (int) $match[1])
                : $highest,
            0
        );
        DB::table('sequences')->updateOrInsert(
            ['sequence_name' => 'guestNumber'],
            ['current_value' => max($storedSequence, $sourceSequence, $guestMaximum)]
        );

        return $counts;
    }

    private function account(array $account, string $role, array $credential): User
    {
        $sourceId = $account['id'] ?? '';
        $email = mb_strtolower(trim($account['email'] ?? ''));
        if ($sourceId === '' || $email === '' || empty($account['name'])) {
            throw new RuntimeException("A source {$role} account is missing its ID, name, or email.");
        }

        $user = User::query()->where('source_id', $sourceId)->first();
        if ($user) {
            return $user;
        }
        if (User::query()->where('email', $email)->exists()) {
            throw new RuntimeException("The source {$role} email conflicts with an existing Laravel account.");
        }

        return User::query()->create([
            'source_id' => $sourceId,
            'role' => $role,
            'name' => $account['name'],
            'email' => $email,
            'password' => $credential['passwordHash'],
            'password_scheme' => 'scrypt',
            'legacy_password_salt' => $credential['salt'],
            'created_at' => $this->sourceDate($account['createdAt'] ?? null),
            'updated_at' => $this->sourceDate($account['createdAt'] ?? null),
        ]);
    }

    private function credential(array $credentials, string $sourceId): array
    {
        foreach ($credentials as $credential) {
            if (($credential['id'] ?? null) === $sourceId &&
                !empty($credential['salt']) && !empty($credential['passwordHash'])) {
                return $credential;
            }
        }

        throw new RuntimeException('A source account is missing its password credential.');
    }

    private function sourceDate(?string $value): Carbon
    {
        return $value ? Carbon::parse($value) : now();
    }

    private function offerSnapshot(?array $offer): ?array
    {
        if (!$offer) {
            return null;
        }

        return [
            'id' => $offer['id'] ?? null,
            'title' => $offer['title'] ?? '',
            'discountType' => $offer['discountType'] ?? '',
            'discountValue' => $offer['discountValue'] ?? 0,
        ];
    }
}
