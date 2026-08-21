<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->unique()->nullable()->after('email');
            $table->enum('role', ['buyer', 'seller', 'admin'])->default('buyer')->after('phone');
            $table->boolean('is_verified')->default(false)->after('role');
            $table->string('national_id')->nullable()->after('is_verified');
            $table->string('national_id_document')->nullable()->after('national_id');
            $table->decimal('farm_latitude', 10, 7)->nullable();
            $table->decimal('farm_longitude', 10, 7)->nullable();
            $table->decimal('farm_size', 8, 2)->nullable()->comment('in acres or hectares');
            $table->text('crops_grown')->nullable();
            $table->string('otp')->nullable();
            $table->timestamp('otp_expires_at')->nullable();
            $table->boolean('phone_verified')->default(false);
            $table->string('profile_photo')->nullable();
            $table->text('bio')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
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
                'bio'
            ]);
        });
    }
};