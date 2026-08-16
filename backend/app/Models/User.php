<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'is_verified',
        'national_id',
        'national_id_document',
        'farm_latitude',
        'farm_longitude',
        'farm_size',
        'crops_grown',
        'otp',
        'otp_expires_at',
        'phone_verified',
        'profile_photo',
        'bio',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'otp',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'otp_expires_at' => 'datetime',
            'is_verified' => 'boolean',
            'phone_verified' => 'boolean',
            'farm_latitude' => 'decimal:7',
            'farm_longitude' => 'decimal:7',
            'farm_size' => 'decimal:2',
        ];
    }

    // Helper methods
    public function isBuyer(): bool
    {
        return $this->role === 'buyer';
    }

    public function isSeller(): bool
    {
        return $this->role === 'seller';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isVerifiedSeller(): bool
    {
        return $this->role === 'seller' && $this->is_verified;
    }

        public function products()
    {
        return $this->hasMany(Product::class);
    }
}