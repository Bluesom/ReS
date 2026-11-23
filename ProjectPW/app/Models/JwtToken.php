<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JwtToken extends Model
{
    protected $fillable = ['jti', 'user_id', 'expires_at'];

    protected $casts = ['expires_at' => 'datetime'];
}
