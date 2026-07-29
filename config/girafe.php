<?php

return [
    'name' => env('APP_NAME', 'Girafe IQ'),
    'tagline' => env('GIRAFE_TAGLINE', 'CRM for every industry'),
    'trial_days' => (int) env('GIRAFE_TRIAL_DAYS', 14),
    'default_currency' => env('GIRAFE_DEFAULT_CURRENCY', 'INR'),
    'default_timezone' => env('GIRAFE_DEFAULT_TIMEZONE', 'Asia/Kolkata'),
    'default_country' => env('GIRAFE_DEFAULT_COUNTRY', 'IN'),
    'phone' => [
        // Digits only (spaces/dashes/+ are allowed in input but not counted)
        'min_digits' => (int) env('PHONE_MIN_DIGITS', 10),
        'max_digits' => (int) env('PHONE_MAX_DIGITS', 15),
        'max_chars' => 30,
    ],
];
