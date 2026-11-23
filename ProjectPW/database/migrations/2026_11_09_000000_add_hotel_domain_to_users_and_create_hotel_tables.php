<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('source_id', 64)->nullable()->unique();
            $table->string('role', 20)->nullable()->index();
            $table->string('password_scheme', 20)->default('laravel');
            $table->string('legacy_password_salt', 64)->nullable();
        });

        Schema::create('guest_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->restrictOnDelete();
            $table->string('guest_number', 32)->unique();
            $table->string('country', 80);
            $table->string('phone', 32);
            $table->boolean('active')->default(true);
            $table->unsignedInteger('total_bookings')->default(0);
            $table->date('last_stay')->nullable();
            $table->timestamps();
        });

        Schema::create('admin_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->restrictOnDelete();
            $table->string('admin_number', 32)->unique();
            $table->timestamps();
        });

        Schema::create('sequences', function (Blueprint $table) {
            $table->string('sequence_name', 64)->primary();
            $table->unsignedInteger('current_value')->default(0);
        });

        Schema::create('room_types', function (Blueprint $table) {
            $table->id();
            $table->string('source_id', 64)->unique();
            $table->string('name', 80);
            $table->text('description')->nullable();
            $table->decimal('rate_per_night', 10, 2)->default(0);
            $table->string('image_path')->default('');
            $table->unsignedTinyInteger('capacity')->default(2);
            $table->string('bed_type', 20)->default('Queen');
            $table->boolean('smoking_allowed')->default(false);
            $table->boolean('sofa')->default(false);
            $table->json('amenities')->nullable();
            $table->string('meal_plan', 40)->default('No meals');
            $table->timestamps();
        });

        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->string('source_id', 64)->unique();
            $table->string('title', 100);
            $table->string('description', 500);
            $table->string('discount_type', 16);
            $table->decimal('discount_value', 10, 2);
            $table->date('start_date')->index();
            $table->date('end_date')->index();
            $table->boolean('active')->default(false);
            $table->string('image_path')->default('');
            $table->timestamps();
            $table->index(['active', 'start_date', 'end_date']);
        });

        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->string('source_id', 64)->unique();
            $table->string('room_number', 32)->unique();
            $table->foreignId('room_type_id')->constrained()->restrictOnDelete();
            $table->unsignedTinyInteger('floor')->default(0);
            // String-valued by design: existing source data includes "occupied".
            $table->string('status', 24)->default('available');
            $table->timestamps();
            $table->index(['room_type_id', 'status']);
        });

        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('source_id', 64)->unique();
            $table->foreignId('guest_profile_id')->constrained()->restrictOnDelete();
            $table->foreignId('room_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('room_id')->nullable()->constrained()->restrictOnDelete();
            $table->date('check_in');
            $table->date('check_out');
            $table->unsignedTinyInteger('guests');
            $table->string('status', 24)->default('pending');
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->decimal('base_amount', 12, 2)->default(0);
            $table->json('applied_offer')->nullable();
            $table->decimal('offer_discount_amount', 12, 2)->default(0);
            $table->text('requests')->nullable();
            $table->timestamps();
            $table->index(['guest_profile_id', 'check_in']);
            $table->index(['room_id', 'status', 'check_in', 'check_out']);
            $table->index(['room_type_id', 'status', 'check_in', 'check_out']);
            $table->index('status');
        });

        \Illuminate\Support\Facades\DB::table('sequences')->insert([
            'sequence_name' => 'guestNumber',
            'current_value' => 0,
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('rooms');
        Schema::dropIfExists('offers');
        Schema::dropIfExists('room_types');
        Schema::dropIfExists('sequences');
        Schema::dropIfExists('admin_profiles');
        Schema::dropIfExists('guest_profiles');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['source_id', 'role', 'password_scheme', 'legacy_password_salt']);
        });
    }
};
