<?php

namespace App\Support;

use App\Rules\PhoneNumber;

class Phone
{
    /**
     * Laravel validation rules for a phone field.
     *
     * @return list<mixed>
     */
    public static function rules(bool $required = false): array
    {
        return [
            $required ? 'required' : 'nullable',
            'string',
            'max:'.(int) config('girafe.phone.max_chars', 30),
            new PhoneNumber,
        ];
    }

    public static function minDigits(): int
    {
        return (int) config('girafe.phone.min_digits', 10);
    }

    public static function maxDigits(): int
    {
        return (int) config('girafe.phone.max_digits', 15);
    }

    public static function digitCount(?string $phone): int
    {
        if ($phone === null || $phone === '') {
            return 0;
        }

        return strlen(preg_replace('/\D+/', '', $phone) ?? '');
    }
}
