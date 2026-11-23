<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    protected $fillable = [
        'source_id', 'guest_profile_id', 'room_type_id', 'room_id',
        'check_in', 'check_out', 'guests', 'status', 'total_amount',
        'base_amount', 'applied_offer', 'offer_discount_amount', 'requests',
    ];

    protected $casts = [
        'check_in' => 'date:Y-m-d',
        'check_out' => 'date:Y-m-d',
        'guests' => 'integer',
        'total_amount' => 'float',
        'base_amount' => 'float',
        'offer_discount_amount' => 'float',
        'applied_offer' => 'array',
    ];

    public function guestProfile(): BelongsTo
    {
        return $this->belongsTo(GuestProfile::class);
    }

    public function roomType(): BelongsTo
    {
        return $this->belongsTo(RoomType::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
