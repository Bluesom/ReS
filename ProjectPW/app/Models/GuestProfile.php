<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GuestProfile extends Model
{
    protected $fillable = [
        'user_id', 'guest_number', 'country', 'phone', 'active',
        'total_bookings', 'last_stay',
    ];

    protected $casts = [
        'active' => 'boolean',
        'total_bookings' => 'integer',
        'last_stay' => 'date:Y-m-d',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
