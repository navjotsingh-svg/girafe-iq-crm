<?php

namespace Tests\Unit;

use App\Rules\PhoneNumber;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PhoneNumberTest extends TestCase
{
    #[DataProvider('validPhones')]
    public function test_accepts_valid_phones(string $value): void
    {
        $failed = false;
        (new PhoneNumber)->validate('phone', $value, function () use (&$failed) {
            $failed = true;
        });

        $this->assertFalse($failed, "Expected valid: {$value}");
    }

    #[DataProvider('invalidPhones')]
    public function test_rejects_invalid_phones(string $value): void
    {
        $failed = false;
        (new PhoneNumber)->validate('phone', $value, function () use (&$failed) {
            $failed = true;
        });

        $this->assertTrue($failed, "Expected invalid: {$value}");
    }

    public static function validPhones(): array
    {
        return [
            ['9876543210'],
            ['+91 98765 43210'],
            ['(022) 1234-5678'],
            ['+1-202-555-0173'],
            ['919876543210'],
        ];
    }

    public static function invalidPhones(): array
    {
        return [
            ['12345'], // too few digits
            ['123456789'], // 9 digits
            ['abcdefghij'],
            ['+91 abc'],
            [str_repeat('9', 16)], // too many digits
        ];
    }
}
