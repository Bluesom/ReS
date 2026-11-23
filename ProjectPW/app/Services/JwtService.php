<?php

namespace App\Services;

use App\Models\JwtToken;
use App\Models\User;
use Illuminate\Support\Str;
use RuntimeException;

class JwtService
{
    private const TOKEN_LIFETIME_SECONDS = 7200;

    public function issue(User $user): string
    {
        $issuedAt = now()->timestamp;
        $expiresAt = $issuedAt + self::TOKEN_LIFETIME_SECONDS;
        $jti = (string) Str::uuid();
        $header = $this->encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = $this->encode([
            'iss' => config('app.url'),
            'sub' => $user->getKey(),
            'iat' => $issuedAt,
            'exp' => $expiresAt,
            'jti' => $jti,
        ]);
        $unsignedToken = $header.'.'.$payload;
        $signature = hash_hmac('sha256', $unsignedToken, $this->signingKey(), true);

        JwtToken::query()->create([
            'jti' => $jti,
            'user_id' => $user->getKey(),
            'expires_at' => now()->setTimestamp($expiresAt),
        ]);

        return $unsignedToken.'.'.$this->base64UrlEncode($signature);
    }

    public function authenticate(?string $token): ?array
    {
        if (! $token) {
            return null;
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3 || ! $this->isBase64Url($parts[0]) ||
            ! $this->isBase64Url($parts[1]) || ! $this->isBase64Url($parts[2])) {
            return null;
        }

        $header = $this->decode($parts[0]);
        $claims = $this->decode($parts[1]);
        $signature = $this->base64UrlDecode($parts[2]);
        if (! $header || ! $claims || $signature === false ||
            ($header['typ'] ?? null) !== 'JWT' || ($header['alg'] ?? null) !== 'HS256') {
            return null;
        }

        $expectedSignature = hash_hmac('sha256', $parts[0].'.'.$parts[1], $this->signingKey(), true);
        if (! hash_equals($expectedSignature, $signature)) {
            return null;
        }

        $issuedAt = $claims['iat'] ?? null;
        $expiresAt = $claims['exp'] ?? null;
        $userId = $claims['sub'] ?? null;
        $jti = $claims['jti'] ?? null;
        if (($claims['iss'] ?? null) !== config('app.url') ||
            ! is_int($issuedAt) || $issuedAt > now()->timestamp ||
            ! is_int($expiresAt) || $expiresAt <= now()->timestamp ||
            ! (is_int($userId) || (is_string($userId) && ctype_digit($userId))) ||
            ! is_string($jti) || ! Str::isUuid($jti)) {
            return null;
        }

        $record = JwtToken::query()->where('jti', $jti)
            ->where('user_id', $userId)
            ->where('expires_at', '>', now())
            ->first();
        $user = $record ? User::query()->find($userId) : null;
        if (! $user || ($user->role === 'guest' && ! $user->guestProfile?->active)) {
            return null;
        }

        return ['user' => $user, 'jti' => $jti];
    }

    public function revoke(string $jti): void
    {
        JwtToken::query()->where('jti', $jti)->delete();
    }

    public function revokeAll(User $user): void
    {
        JwtToken::query()->where('user_id', $user->getKey())->delete();
    }

    private function signingKey(): string
    {
        $key = config('app.key');
        if (! is_string($key) || strlen($key) < 32) {
            throw new RuntimeException('APP_KEY must contain at least 32 bytes to sign JWTs.');
        }

        return $key;
    }

    private function encode(array $value): string
    {
        return $this->base64UrlEncode(json_encode($value, JSON_THROW_ON_ERROR));
    }

    private function decode(string $value): ?array
    {
        $json = $this->base64UrlDecode($value);
        if ($json === false) {
            return null;
        }

        $decoded = json_decode($json, true);

        return is_array($decoded) ? $decoded : null;
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string|false
    {
        return base64_decode(strtr($value, '-_', '+/'), true);
    }

    private function isBase64Url(string $value): bool
    {
        return $value !== '' && preg_match('/^[A-Za-z0-9_-]+$/D', $value) === 1;
    }
}
