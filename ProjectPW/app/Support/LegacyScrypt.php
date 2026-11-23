<?php

namespace App\Support;

use Symfony\Component\Process\Process;

/**
 * Verifies the Node.js crypto.scrypt format used by the original JSON store
 * (N=16384, r=8, p=1, 64-byte output). Successful logins are rehashed by the
 * account service with Laravel's configured hasher.
 */
class LegacyScrypt
{
    private const N = 16384;
    private const R = 8;

    public static function verify(string $password, string $saltHex, string $expectedHex): bool
    {
        if (!preg_match('/^[a-f0-9]{32}$/i', $saltHex) ||
            !preg_match('/^[a-f0-9]{128}$/i', $expectedHex)) {
            return false;
        }

        $expected = hex2bin($expectedHex);
        $derivedHex = self::deriveWithNode($password, $saltHex) ?? bin2hex(self::derive($password, hex2bin($saltHex)));

        return hash_equals(strtolower($expectedHex), strtolower($derivedHex));
    }

    private static function deriveWithNode(string $password, string $saltHex): ?string
    {
        try {
            $script = <<<'JS'
const { scryptSync } = require('node:crypto');
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => input += chunk);
process.stdin.on('end', () => {
    const data = JSON.parse(input);
    process.stdout.write(scryptSync(data.password, Buffer.from(data.salt, 'hex'), 64, {
        N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024
    }).toString('hex'));
});
JS;
            $process = new Process(['node', '-e', $script]);
            $process->setTimeout(10);
            $process->setInput(json_encode(['password' => $password, 'salt' => $saltHex], JSON_THROW_ON_ERROR));
            $process->run();
            return $process->isSuccessful() && preg_match('/^[a-f0-9]{128}$/i', trim($process->getOutput()))
                ? trim($process->getOutput())
                : null;
        } catch (\Throwable) {
            return null;
        }
    }

    private static function derive(string $password, string $salt): string
    {
        $block = hash_pbkdf2('sha256', $password, $salt, 1, 128 * self::R, true);
        for ($offset = 0; $offset < strlen($block); $offset += 128 * self::R) {
            $block = substr_replace($block, self::romix(substr($block, $offset, 128 * self::R)), $offset, 128 * self::R);
        }
        return hash_pbkdf2('sha256', $password, $block, 1, 64, true);
    }

    private static function romix(string $block): string
    {
        $values = [];
        $current = $block;
        for ($i = 0; $i < self::N; $i++) {
            $values[$i] = $current;
            $current = self::blockMix($current);
        }

        for ($i = 0; $i < self::N; $i++) {
            $words = unpack('Vlow/Vhigh', substr($current, -64, 8));
            $index = $words['low'] & (self::N - 1);
            $current = self::blockMix($current ^ $values[$index]);
        }

        return $current;
    }

    private static function blockMix(string $block): string
    {
        $lastOffset = (2 * self::R - 1) * 64;
        $x = substr($block, $lastOffset, 64);
        $even = [];
        $odd = [];

        for ($i = 0; $i < 2 * self::R; $i++) {
            $x = self::salsa208($x ^ substr($block, $i * 64, 64));
            if (($i & 1) === 0) {
                $even[] = $x;
            } else {
                $odd[] = $x;
            }
        }

        return implode('', [...$even, ...$odd]);
    }

    private static function salsa208(string $block): string
    {
        $original = array_values(unpack('V16', $block));
        $x = $original;

        for ($i = 0; $i < 8; $i += 2) {
            $x[4] ^= self::rotate(self::add($x[0], $x[12]), 7);
            $x[8] ^= self::rotate(self::add($x[4], $x[0]), 9);
            $x[12] ^= self::rotate(self::add($x[8], $x[4]), 13);
            $x[0] ^= self::rotate(self::add($x[12], $x[8]), 18);
            $x[9] ^= self::rotate(self::add($x[5], $x[1]), 7);
            $x[13] ^= self::rotate(self::add($x[9], $x[5]), 9);
            $x[1] ^= self::rotate(self::add($x[13], $x[9]), 13);
            $x[5] ^= self::rotate(self::add($x[1], $x[13]), 18);
            $x[14] ^= self::rotate(self::add($x[10], $x[6]), 7);
            $x[2] ^= self::rotate(self::add($x[14], $x[10]), 9);
            $x[6] ^= self::rotate(self::add($x[2], $x[14]), 13);
            $x[10] ^= self::rotate(self::add($x[6], $x[2]), 18);
            $x[3] ^= self::rotate(self::add($x[15], $x[11]), 7);
            $x[7] ^= self::rotate(self::add($x[3], $x[15]), 9);
            $x[11] ^= self::rotate(self::add($x[7], $x[3]), 13);
            $x[15] ^= self::rotate(self::add($x[11], $x[7]), 18);

            $x[1] ^= self::rotate(self::add($x[0], $x[3]), 7);
            $x[2] ^= self::rotate(self::add($x[1], $x[0]), 9);
            $x[3] ^= self::rotate(self::add($x[2], $x[1]), 13);
            $x[0] ^= self::rotate(self::add($x[3], $x[2]), 18);
            $x[6] ^= self::rotate(self::add($x[5], $x[4]), 7);
            $x[7] ^= self::rotate(self::add($x[6], $x[5]), 9);
            $x[4] ^= self::rotate(self::add($x[7], $x[6]), 13);
            $x[5] ^= self::rotate(self::add($x[4], $x[7]), 18);
            $x[11] ^= self::rotate(self::add($x[10], $x[9]), 7);
            $x[8] ^= self::rotate(self::add($x[11], $x[10]), 9);
            $x[9] ^= self::rotate(self::add($x[8], $x[11]), 13);
            $x[10] ^= self::rotate(self::add($x[9], $x[8]), 18);
            $x[12] ^= self::rotate(self::add($x[15], $x[14]), 7);
            $x[13] ^= self::rotate(self::add($x[12], $x[15]), 9);
            $x[14] ^= self::rotate(self::add($x[13], $x[12]), 13);
            $x[15] ^= self::rotate(self::add($x[14], $x[13]), 18);
        }

        foreach ($x as $index => $word) {
            $x[$index] = self::add($word, $original[$index]);
        }

        return pack('V*', ...$x);
    }

    private static function add(int $left, int $right): int
    {
        return ($left + $right) & 0xffffffff;
    }

    private static function rotate(int $value, int $bits): int
    {
        return (($value << $bits) | ($value >> (32 - $bits))) & 0xffffffff;
    }
}
