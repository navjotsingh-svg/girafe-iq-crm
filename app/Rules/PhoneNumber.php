<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class PhoneNumber implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return;
        }

        if (! is_string($value) && ! is_numeric($value)) {
            $fail('The :attribute must be a valid phone number.');

            return;
        }

        $raw = trim((string) $value);
        $maxChars = (int) config('girafe.phone.max_chars', 30);

        if (strlen($raw) > $maxChars) {
            $fail("The :attribute may not be greater than {$maxChars} characters.");

            return;
        }

        // Allow digits, spaces, +, -, (), .
        if (! preg_match('/^[0-9+\-\s().]+$/', $raw)) {
            $fail('The :attribute may only contain digits and + - ( ) . spaces.');

            return;
        }

        $digits = preg_replace('/\D+/', '', $raw) ?? '';
        $min = (int) config('girafe.phone.min_digits', 10);
        $max = (int) config('girafe.phone.max_digits', 15);

        if (strlen($digits) < $min || strlen($digits) > $max) {
            $fail("The :attribute must contain between {$min} and {$max} digits.");
        }
    }
}
