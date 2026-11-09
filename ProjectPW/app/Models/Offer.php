<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Offer extends Model
{
    protected $fillable = [
        'source_id', 'title', 'description', 'discount_type', 'discount_value',
        'start_date', 'end_date', 'active', 'image_path',
    ];

    protected $casts = [
        'discount_value' => 'float',
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'active' => 'boolean',
    ];
}
