<?php

namespace Tests\Unit;

use App\Support\LegacyScrypt;
use PHPUnit\Framework\TestCase;

class LegacyScryptTest extends TestCase
{
    public function test_it_verifies_the_node_scrypt_64_byte_format(): void
    {
        $hash = 'a1d38bb942c0c1411551f3a3f64ee38424b97b05702b314040b6cfbf2d5c0323'.
            'f1c77645c8552b067a8b812e5297c1eb8af7b520b08c29f5fccdcb27343a1e32';

        $this->assertTrue(LegacyScrypt::verify('abc', '30313233343536373839616263646566', $hash));
        $this->assertFalse(LegacyScrypt::verify('wrong', '30313233343536373839616263646566', $hash));
        $this->assertFalse(LegacyScrypt::verify('abc', 'invalid', $hash));
    }
}
