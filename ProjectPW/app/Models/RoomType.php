<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RoomType extends Model
{
    protected $fillable = [
        'source_id', 'name', 'description', 'rate_per_night', 'image_path',
        'capacity', 'bed_type', 'smoking_allowed', 'sofa', 'amenities', 'meal_plan',
    ];

    protected $casts = [
        'rate_per_night' => 'float',
        'capacity' => 'integer',
        'smoking_allowed' => 'boolean',
        'sofa' => 'boolean',
        'amenities' => 'array',
    ];

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
