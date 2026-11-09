<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\GuestProfile;
use App\Models\Offer;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class HotelApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_routes_preserve_occupied_room_status_and_require_admin_authentication(): void
    {
        $type = $this->roomType();
        Room::query()->create([
            'source_id' => 'R-101',
            'room_number' => '101',
            'room_type_id' => $type->id,
            'floor' => 1,
            'status' => 'occupied',
        ]);
        $admin = $this->admin();
        $token = $admin->createToken('test', ['*'], now()->addHours(2))->plainTextToken;

        $this->getJson('/api/rooms')->assertUnauthorized();
        $this->withToken($token)->getJson('/api/rooms')
            ->assertOk()
            ->assertJsonPath('0.id', 'R-101')
            ->assertJsonPath('0.status', 'occupied');
        $this->withToken($token)->getJson('/api/auth/admin-session')
            ->assertOk()
            ->assertJsonPath('adminNumber', 'ADM-001');
        $this->withToken($token)->getJson('/api/offers?admin=true')->assertOk();
    }

    public function test_guest_can_create_a_pending_booking_with_source_compatible_shape(): void
    {
        $type = $this->roomType();
        $guest = User::query()->create([
            'source_id' => 'G-100',
            'role' => 'guest',
            'name' => 'Guest One',
            'email' => 'guest@example.test',
            'password' => Hash::make('Password1'),
            'password_scheme' => 'laravel',
        ]);
        $profile = $guest->guestProfile()->create([
            'guest_number' => 'G-100',
            'country' => 'Indonesia',
            'phone' => '+628123456789',
        ]);
        $token = $guest->createToken('test', ['*'], now()->addHours(2))->plainTextToken;
        $checkIn = now('UTC')->addDays(5)->toDateString();
        $checkOut = now('UTC')->addDays(7)->toDateString();

        $this->withToken($token)->postJson('/api/auth/guest-bookings', [
            'roomTypeId' => $type->source_id,
            'checkIn' => $checkIn,
            'checkOut' => $checkOut,
            'guests' => 2,
        ])->assertCreated()
            ->assertJsonPath('booking.status', 'pending')
            ->assertJsonPath('booking.roomType', 'Lake View Room');

        $this->assertDatabaseHas('bookings', [
            'guest_profile_id' => $profile->id,
            'status' => 'pending',
            'room_id' => null,
        ]);
    }

    public function test_password_reset_revokes_every_token_for_the_account(): void
    {
        $admin = $this->admin();
        $token = $admin->createToken('admin-browser', ['*'], now()->addHours(2))->plainTextToken;

        $this->postJson('/api/auth/reset-password', [
            'email' => $admin->email,
            'password' => 'NewPassword2',
            'confirmPassword' => 'NewPassword2',
        ])->assertOk();

        $this->withToken($token)->getJson('/api/auth/admin-session')->assertUnauthorized();
        $this->assertSame(0, $admin->tokens()->count());
    }

    public function test_registration_and_logout_use_same_origin_bearer_authentication(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'New Guest',
            'email' => 'new-guest@example.test',
            'countryCode' => 'US',
            'phoneCountryCode' => 'US',
            'phone' => '4155552671',
            'password' => 'Password1',
            'confirmPassword' => 'Password1',
        ])->assertCreated()
            ->assertJsonPath('email', 'new-guest@example.test');

        $login = $this->postJson('/api/auth/login', [
            'email' => 'NEW-GUEST@example.test',
            'password' => 'Password1',
        ])->assertOk()->assertJsonPath('role', 'guest');
        $token = $login->json('token');

        $this->withToken($token)->getJson('/api/auth/guest-session')
            ->assertOk()
            ->assertJsonPath('country', 'United States')
            ->assertJsonPath('phone', '+14155552671');
        $this->withToken($token)->postJson('/api/auth/logout')->assertNoContent();
        $this->withToken($token)->getJson('/api/auth/guest-session')->assertUnauthorized();
    }

    public function test_api_tokens_expire_after_two_hours(): void
    {
        $admin = $this->admin();
        $token = $admin->createToken('test', ['*'], now()->addHours(2))->plainTextToken;

        $this->travel(121)->minutes();
        $this->withToken($token)->getJson('/api/auth/admin-session')->assertUnauthorized();
        $this->travelBack();
    }

    public function test_successful_legacy_scrypt_login_rehashes_the_password(): void
    {
        $user = User::query()->create([
            'source_id' => 'ADM-LEGACY',
            'role' => 'admin',
            'name' => 'Legacy Administrator',
            'email' => 'legacy-admin@example.test',
            'password' => 'a1d38bb942c0c1411551f3a3f64ee38424b97b05702b314040b6cfbf2d5c0323f1c77645c8552b067a8b812e5297c1eb8af7b520b08c29f5fccdcb27343a1e32',
            'password_scheme' => 'scrypt',
            'legacy_password_salt' => '30313233343536373839616263646566',
        ]);
        $user->adminProfile()->create(['admin_number' => 'ADM-LEGACY']);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'abc',
        ])->assertOk()->assertJsonPath('role', 'admin');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'password_scheme' => 'laravel',
            'legacy_password_salt' => null,
        ]);
        $this->assertTrue(Hash::check('abc', $user->fresh()->password));
    }

    public function test_admin_can_assign_a_room_and_apply_an_offer_without_changing_the_booking_contract(): void
    {
        $type = $this->roomType();
        $guest = User::query()->create([
            'source_id' => 'G-200',
            'role' => 'guest',
            'name' => 'Booking Guest',
            'email' => 'booking-guest@example.test',
            'password' => Hash::make('Password1'),
            'password_scheme' => 'laravel',
        ]);
        $profile = $guest->guestProfile()->create([
            'guest_number' => 'G-200',
            'country' => 'United States',
            'phone' => '+14155552671',
        ]);
        $room = Room::query()->create([
            'source_id' => 'R-101',
            'room_number' => '101',
            'room_type_id' => $type->id,
            'floor' => 1,
            'status' => 'available',
        ]);
        $checkIn = now('UTC')->addDays(10)->toDateString();
        $checkOut = now('UTC')->addDays(12)->toDateString();
        Booking::query()->create([
            'source_id' => 'B-200',
            'guest_profile_id' => $profile->id,
            'room_type_id' => $type->id,
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'guests' => 2,
            'status' => 'pending',
            'base_amount' => 360,
            'total_amount' => 360,
        ]);
        Offer::query()->create([
            'source_id' => 'O-200',
            'title' => 'Stay discount',
            'description' => 'Test offer',
            'discount_type' => 'percentage',
            'discount_value' => 25,
            'start_date' => $checkIn,
            'end_date' => $checkOut,
            'active' => true,
        ]);
        $token = $this->admin()->createToken('test', ['*'], now()->addHours(2))->plainTextToken;

        $this->withToken($token)->patchJson('/api/bookings/B-200', [
            'status' => 'confirmed',
            'roomId' => $room->source_id,
            'offerId' => 'O-200',
        ])->assertOk()
            ->assertJsonPath('status', 'confirmed')
            ->assertJsonPath('roomId', 'R-101')
            ->assertJsonPath('totalAmount', 270);

        $this->assertDatabaseHas('bookings', [
            'source_id' => 'B-200',
            'status' => 'confirmed',
            'room_id' => $room->id,
            'total_amount' => 270,
        ]);
    }

    public function test_admin_guest_update_and_delete_preserve_soft_deactivation_and_revoke_guest_tokens(): void
    {
        $guest = User::query()->create([
            'source_id' => 'G-300',
            'role' => 'guest',
            'name' => 'Guest to deactivate',
            'email' => 'deactivate@example.test',
            'password' => Hash::make('Password1'),
            'password_scheme' => 'laravel',
        ]);
        $guest->guestProfile()->create([
            'guest_number' => 'G-300',
            'country' => 'United States',
            'phone' => '+14155552671',
        ]);
        $guestToken = $guest->createToken('guest-device', ['*'], now()->addHours(2))->plainTextToken;
        $adminToken = $this->admin()->createToken('admin-device', ['*'], now()->addHours(2))->plainTextToken;

        $this->withToken($adminToken)->patchJson('/api/guests/G-300', [
            'name' => 'Updated Guest',
            'email' => 'updated@example.test',
            'country' => 'Canada',
            'phone' => '+14165552671',
            'active' => false,
        ])->assertOk()
            ->assertJsonPath('name', 'Updated Guest')
            ->assertJsonPath('active', false);
        $this->withToken($guestToken)->getJson('/api/auth/guest-session')->assertUnauthorized();

        $this->withToken($adminToken)->deleteJson('/api/guests/G-300')
            ->assertOk()
            ->assertJsonPath('active', false);
        $this->assertDatabaseHas('guest_profiles', ['guest_number' => 'G-300', 'active' => 0]);
    }

    public function test_source_json_import_is_idempotent_and_keeps_occupied_room_status(): void
    {
        $source = [
            'guests' => [[
                'id' => 'G-IMPORT',
                'guestNumber' => 'G-001',
                'name' => 'Imported Guest',
                'email' => 'imported@example.test',
                'country' => 'United States',
                'phone' => '+14155552671',
                'createdAt' => '2025-01-02T03:04:05.000Z',
            ]],
            'guestCredentials' => [[
                'id' => 'G-IMPORT',
                'salt' => '30313233343536373839616263646566',
                'passwordHash' => str_repeat('a', 128),
            ]],
            'admins' => [[
                'id' => 'ADM-IMPORT',
                'adminNumber' => 'ADM-001',
                'email' => 'import-admin@example.test',
                'name' => 'Imported Admin',
            ]],
            'adminCredentials' => [[
                'id' => 'ADM-IMPORT',
                'salt' => '30313233343536373839616263646566',
                'passwordHash' => str_repeat('b', 128),
            ]],
            'roomTypes' => [[
                'id' => 'RT-IMPORT',
                'name' => 'Imported Room',
                'ratePerNight' => 180,
            ]],
            'rooms' => [[
                'id' => 'R-IMPORT',
                'roomNumber' => '101',
                'roomTypeId' => 'RT-IMPORT',
                'floor' => 1,
                'status' => 'occupied',
            ]],
            'bookings' => [],
            'offers' => [],
            'sequences' => ['guestNumber' => 1],
        ];
        $path = tempnam(sys_get_temp_dir(), 'res-import-');
        file_put_contents($path, json_encode($source, JSON_THROW_ON_ERROR));

        try {
            $this->artisan('app:import-legacy-json', ['source' => $path])->assertExitCode(0);
            $this->assertDatabaseHas('rooms', ['source_id' => 'R-IMPORT', 'status' => 'occupied']);
            $this->assertDatabaseHas('users', [
                'source_id' => 'G-IMPORT',
                'password_scheme' => 'scrypt',
                'legacy_password_salt' => '30313233343536373839616263646566',
            ]);
            $user = User::query()->where('source_id', 'G-IMPORT')->firstOrFail();
            $this->assertSame('2025-01-02 03:04:05', $user->created_at->format('Y-m-d H:i:s'));
            $user->update(['name' => 'Locally Edited Guest']);

            $this->artisan('app:import-legacy-json', ['source' => $path])->assertExitCode(0);
            $this->assertSame('Locally Edited Guest', $user->fresh()->name);
            $this->assertSame(1, User::query()->where('source_id', 'G-IMPORT')->count());
        } finally {
            @unlink($path);
        }
    }

    private function admin(): User
    {
        $admin = User::query()->create([
            'source_id' => 'ADM-100',
            'role' => 'admin',
            'name' => 'Hotel Administrator',
            'email' => 'admin@example.test',
            'password' => Hash::make('Password1'),
            'password_scheme' => 'laravel',
        ]);
        $admin->adminProfile()->create(['admin_number' => 'ADM-001']);
        return $admin;
    }

    private function roomType(): RoomType
    {
        return RoomType::query()->create([
            'source_id' => 'RT-01',
            'name' => 'Lake View Room',
            'description' => '',
            'rate_per_night' => 180,
            'image_path' => '',
            'capacity' => 2,
            'bed_type' => 'Queen',
            'smoking_allowed' => false,
            'sofa' => false,
            'amenities' => [],
            'meal_plan' => 'No meals',
        ]);
    }
}
