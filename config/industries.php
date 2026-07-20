<?php

return [
    'default' => 'custom',

    /** Shown on onboarding Step 2 — Choose industry */
    'onboarding' => [
        'real_estate',
        'education',
        'healthcare',
        'immigration',
        'travel',
        'finance',
        'insurance',
        'manufacturing',
        'retail',
        'automobile',
        'construction',
        'consultancy',
        'recruitment',
        'hospital',
        'gym',
        'salon',
        'hotel',
        'legal',
        'ngo',
        'custom',
    ],

    'profiles' => [
        'real_estate' => [
            'name' => 'Real Estate',
            'tagline' => 'Agencies, builders & brokers',
            'icon' => 'building',
        ],
        'education' => [
            'name' => 'Education',
            'tagline' => 'Schools, colleges & coaching',
            'icon' => 'graduation-cap',
        ],
        'healthcare' => [
            'name' => 'Healthcare',
            'tagline' => 'Clinics & medical practices',
            'icon' => 'heart',
        ],
        'immigration' => [
            'name' => 'Immigration',
            'tagline' => 'Visa consultants & migration',
            'icon' => 'passport',
        ],
        'travel' => [
            'name' => 'Travel',
            'tagline' => 'Tours & travel agencies',
            'icon' => 'plane',
        ],
        'finance' => [
            'name' => 'Finance',
            'tagline' => 'Lending, wealth & advisory',
            'icon' => 'landmark',
        ],
        'insurance' => [
            'name' => 'Insurance',
            'tagline' => 'Agency & brokerage',
            'icon' => 'shield',
        ],
        'manufacturing' => [
            'name' => 'Manufacturing',
            'tagline' => 'Factories & B2B supply',
            'icon' => 'factory',
        ],
        'retail' => [
            'name' => 'Retail',
            'tagline' => 'Stores & ecommerce',
            'icon' => 'shopping-bag',
        ],
        'automobile' => [
            'name' => 'Automobile',
            'tagline' => 'Dealers & showrooms',
            'icon' => 'car',
        ],
        'construction' => [
            'name' => 'Construction',
            'tagline' => 'Contractors & developers',
            'icon' => 'hard-hat',
        ],
        'consultancy' => [
            'name' => 'Consultancy',
            'tagline' => 'Professional services',
            'icon' => 'handshake',
        ],
        'recruitment' => [
            'name' => 'Recruitment',
            'tagline' => 'Staffing & hiring',
            'icon' => 'users',
        ],
        'hospital' => [
            'name' => 'Hospital',
            'tagline' => 'Hospitals & multi-specialty care',
            'icon' => 'hospital',
        ],
        'gym' => [
            'name' => 'Gym',
            'tagline' => 'Fitness centers & studios',
            'icon' => 'dumbbell',
        ],
        'salon' => [
            'name' => 'Salon',
            'tagline' => 'Beauty, spa & wellness',
            'icon' => 'scissors',
        ],
        'hotel' => [
            'name' => 'Hotel',
            'tagline' => 'Hospitality & stays',
            'icon' => 'hotel',
        ],
        'legal' => [
            'name' => 'Legal',
            'tagline' => 'Law firms & practices',
            'icon' => 'scale',
        ],
        'ngo' => [
            'name' => 'NGO',
            'tagline' => 'Non-profits & foundations',
            'icon' => 'heart-handshake',
        ],
        'custom' => [
            'name' => 'Any custom business',
            'tagline' => 'General CRM setup for any industry',
            'icon' => 'briefcase',
        ],

        // Legacy / pack fallback key
        'general' => [
            'name' => 'General',
            'tagline' => 'Default industry pack',
            'icon' => 'briefcase',
        ],
    ],
];
