<?php

namespace App\Services;

use App\Models\GuestProfile;
use App\Models\User;
use App\Support\LegacyScrypt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AccountService
{
    public function authenticate(string $email, string $password): ?User
    {
        $user = User::query()->where('email', mb_strtolower(trim($email)))->first();
        if (!$user || !in_array($user->role, ['admin', 'guest'], true) ||
            ($user->role === 'guest' && !$user->guestProfile?->active) ||
            !$this->verifyPassword($user, $password)) {
            return null;
        }

        if ($user->password_scheme === 'scrypt') {
            $user->forceFill([
                'password' => Hash::make($password),
                'password_scheme' => 'laravel',
                'legacy_password_salt' => null,
            ])->save();
        }

        return $user;
    }

    public function registerGuest(array $data, string $email, string $country, string $phone): array
    {
        return DB::transaction(function () use ($data, $email, $country, $phone) {
            $sequence = DB::table('sequences')->where('sequence_name', 'guestNumber')->lockForUpdate()->first();
            $max = GuestProfile::query()->pluck('guest_number')->reduce(
                fn (int $highest, string $number) => preg_match('/^G-(\d+)$/', $number, $match)
                    ? max($highest, (int) $match[1])
                    : $highest,
                0
            );
            $next = max((int) ($sequence->current_value ?? 0), $max) + 1;
            DB::table('sequences')->where('sequence_name', 'guestNumber')->update(['current_value' => $next]);

            $user = User::query()->create([
                'source_id' => 'G-'.Str::uuid(),
                'role' => 'guest',
                'name' => trim($data['name']),
                'email' => $email,
                'password' => Hash::make($data['password']),
                'password_scheme' => 'laravel',
            ]);
            $profile = $user->guestProfile()->create([
                'guest_number' => 'G-'.str_pad((string) $next, 3, '0', STR_PAD_LEFT),
                'country' => $country,
                'phone' => $phone,
                'active' => true,
            ]);

            return [$user, $profile];
        });
    }

    public function resetPassword(User $user, string $password): void
    {
        DB::transaction(function () use ($user, $password) {
            $user->forceFill([
                'password' => Hash::make($password),
                'password_scheme' => 'laravel',
                'legacy_password_salt' => null,
            ])->save();
            $user->tokens()->delete();
        });

        Auth::forgetGuards();
    }

    public function logout(Request $request): void
    {
        $request->user()->currentAccessToken()?->delete();
        Auth::forgetGuards();
    }

    private function verifyPassword(User $user, string $password): bool
    {
        if ($user->password_scheme === 'scrypt') {
            return LegacyScrypt::verify($password, (string) $user->legacy_password_salt, (string) $user->password);
        }

        return Hash::check($password, $user->password);
    }
}
