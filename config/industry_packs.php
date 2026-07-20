<?php

/**
 * Seed templates applied during onboarding Step 5.
 * Keys must match config/industries.php profiles.
 */
return [

    'source_catalog' => [
        'facebook_ads' => 'Facebook Ads',
        'google_ads' => 'Google Ads',
        'website' => 'Website',
        'whatsapp' => 'WhatsApp',
        'instagram' => 'Instagram',
        'referrals' => 'Referrals',
        'walk_ins' => 'Walk-ins',
        'excel_other' => 'Excel / Other',
    ],

    'common' => [
        'task_types' => [
            ['name' => 'Follow-up', 'slug' => 'follow-up', 'icon' => 'phone', 'color' => '#2563eb'],
            ['name' => 'Meeting', 'slug' => 'meeting', 'icon' => 'calendar', 'color' => '#7c3aed'],
            ['name' => 'Call', 'slug' => 'call', 'icon' => 'phone-call', 'color' => '#059669'],
            ['name' => 'Reminder', 'slug' => 'reminder', 'icon' => 'bell', 'color' => '#d97706'],
            ['name' => 'Visit', 'slug' => 'visit', 'icon' => 'map-pin', 'color' => '#dc2626'],
            ['name' => 'Email', 'slug' => 'email', 'icon' => 'mail', 'color' => '#0891b2'],
        ],
        'widgets' => [
            ['key' => 'leads_today', 'label' => "Today's Leads"],
            ['key' => 'followups_today', 'label' => "Today's Follow-ups"],
            ['key' => 'overdue', 'label' => 'Overdue'],
            ['key' => 'deals_won', 'label' => 'Deals Won'],
            ['key' => 'revenue', 'label' => 'Revenue'],
            ['key' => 'conversion', 'label' => 'Conversion Rate'],
            ['key' => 'pipeline_value', 'label' => 'Pipeline Value'],
            ['key' => 'hot_leads', 'label' => 'Hot Leads'],
        ],
        'lead_fields' => [
            ['name' => 'Budget', 'key' => 'budget', 'type' => 'select', 'options' => [], 'show_in_list' => true],
            ['name' => 'City', 'key' => 'city', 'type' => 'text', 'show_in_list' => true],
            ['name' => 'Notes', 'key' => 'notes', 'type' => 'textarea'],
        ],
    ],

    'packs' => [

        'general' => [
            'statuses' => [
                ['name' => 'New', 'slug' => 'new', 'color' => '#3b82f6', 'is_default' => true],
                ['name' => 'Contacted', 'slug' => 'contacted', 'color' => '#6366f1'],
                ['name' => 'Qualified', 'slug' => 'qualified', 'color' => '#8b5cf6'],
                ['name' => 'Proposal', 'slug' => 'proposal', 'color' => '#f59e0b'],
                ['name' => 'Negotiation', 'slug' => 'negotiation', 'color' => '#ea580c'],
                ['name' => 'Won', 'slug' => 'won', 'color' => '#16a34a', 'is_won' => true],
                ['name' => 'Lost', 'slug' => 'lost', 'color' => '#dc2626', 'is_lost' => true],
            ],
            'pipeline' => [
                'name' => 'Sales Pipeline',
                'stages' => [
                    ['name' => 'Discovery', 'slug' => 'discovery', 'probability' => 10],
                    ['name' => 'Qualification', 'slug' => 'qualification', 'probability' => 25],
                    ['name' => 'Proposal', 'slug' => 'proposal', 'probability' => 50],
                    ['name' => 'Negotiation', 'slug' => 'negotiation', 'probability' => 75],
                    ['name' => 'Closed Won', 'slug' => 'closed-won', 'probability' => 100, 'is_won' => true],
                    ['name' => 'Closed Lost', 'slug' => 'closed-lost', 'probability' => 0, 'is_lost' => true],
                ],
            ],
            'lead_fields' => [
                ['name' => 'Category', 'key' => 'category', 'type' => 'select', 'options' => ['General', 'Product', 'Service', 'Enterprise', 'Other'], 'show_in_list' => true],
                ['name' => 'Budget', 'key' => 'budget', 'type' => 'select', 'options' => ['Under 1L', '1L-5L', '5L-10L', '10L+', 'Not decided'], 'show_in_list' => true],
            ],
        ],

        'real_estate' => [
            'statuses' => [
                ['name' => 'New', 'slug' => 'new', 'color' => '#3b82f6', 'is_default' => true],
                ['name' => 'Exploring', 'slug' => 'exploring', 'color' => '#6366f1'],
                ['name' => 'Site Visit', 'slug' => 'site-visit', 'color' => '#8b5cf6'],
                ['name' => 'Negotiation', 'slug' => 'negotiation', 'color' => '#f59e0b'],
                ['name' => 'Booked', 'slug' => 'booked', 'color' => '#16a34a', 'is_won' => true],
                ['name' => 'Lost', 'slug' => 'lost', 'color' => '#dc2626', 'is_lost' => true],
            ],
            'pipeline' => [
                'name' => 'Property Sales',
                'stages' => [
                    ['name' => 'Requirement', 'slug' => 'requirement', 'probability' => 10],
                    ['name' => 'Options Shared', 'slug' => 'options-shared', 'probability' => 30],
                    ['name' => 'Site Visit', 'slug' => 'site-visit', 'probability' => 50],
                    ['name' => 'Negotiation', 'slug' => 'negotiation', 'probability' => 70],
                    ['name' => 'Booking', 'slug' => 'booking', 'probability' => 100, 'is_won' => true],
                    ['name' => 'Lost', 'slug' => 'lost', 'probability' => 0, 'is_lost' => true],
                ],
            ],
            'lead_fields' => [
                ['name' => 'Property Type', 'key' => 'property_type', 'type' => 'select', 'options' => ['Apartment', 'Villa', 'Plot', 'Commercial', 'Office'], 'show_in_list' => true],
                ['name' => 'BHK', 'key' => 'bhk', 'type' => 'select', 'options' => ['1 BHK', '2 BHK', '3 BHK', '4+ BHK'], 'show_in_list' => true],
                ['name' => 'Budget', 'key' => 'budget', 'type' => 'select', 'options' => ['Below 50L', '50L-1Cr', '1-2Cr', '2Cr+'], 'show_in_list' => true],
                ['name' => 'Preferred Location', 'key' => 'preferred_location', 'type' => 'text', 'show_in_list' => true],
            ],
        ],

        'immigration' => [
            'statuses' => [
                ['name' => 'New', 'slug' => 'new', 'color' => '#3b82f6', 'is_default' => true],
                ['name' => 'Eligibility Check', 'slug' => 'eligibility', 'color' => '#6366f1'],
                ['name' => 'Consultation', 'slug' => 'consultation', 'color' => '#8b5cf6'],
                ['name' => 'Documents Pending', 'slug' => 'documents', 'color' => '#f59e0b'],
                ['name' => 'Application Filed', 'slug' => 'filed', 'color' => '#0ea5e9'],
                ['name' => 'Approved', 'slug' => 'approved', 'color' => '#16a34a', 'is_won' => true],
                ['name' => 'Rejected', 'slug' => 'rejected', 'color' => '#dc2626', 'is_lost' => true],
            ],
            'pipeline' => [
                'name' => 'Immigration Pipeline',
                'stages' => [
                    ['name' => 'Enquiry', 'slug' => 'enquiry', 'probability' => 10],
                    ['name' => 'Eligibility', 'slug' => 'eligibility', 'probability' => 25],
                    ['name' => 'Consultation', 'slug' => 'consultation', 'probability' => 40],
                    ['name' => 'Documentation', 'slug' => 'documentation', 'probability' => 60],
                    ['name' => 'Submitted', 'slug' => 'submitted', 'probability' => 80],
                    ['name' => 'Approved', 'slug' => 'approved', 'probability' => 100, 'is_won' => true],
                    ['name' => 'Closed', 'slug' => 'closed', 'probability' => 0, 'is_lost' => true],
                ],
            ],
            'lead_fields' => [
                ['name' => 'Visa Type', 'key' => 'visa_type', 'type' => 'select', 'options' => ['Work', 'Student', 'PR', 'Visitor', 'Family', 'Business'], 'show_in_list' => true],
                ['name' => 'Destination Country', 'key' => 'destination_country', 'type' => 'text', 'show_in_list' => true],
                ['name' => 'Service Budget', 'key' => 'budget', 'type' => 'select', 'options' => ['Under $1k', '$1k-$3k', '$3k-$7k', '$7k+', 'Not decided'], 'show_in_list' => true],
            ],
        ],

        'healthcare' => [
            'statuses' => [
                ['name' => 'New', 'slug' => 'new', 'color' => '#3b82f6', 'is_default' => true],
                ['name' => 'Scheduled', 'slug' => 'scheduled', 'color' => '#8b5cf6'],
                ['name' => 'Consulted', 'slug' => 'consulted', 'color' => '#f59e0b'],
                ['name' => 'Treated', 'slug' => 'treated', 'color' => '#16a34a', 'is_won' => true],
                ['name' => 'No Show', 'slug' => 'no-show', 'color' => '#dc2626', 'is_lost' => true],
            ],
            'pipeline' => [
                'name' => 'Patient Journey',
                'stages' => [
                    ['name' => 'Enquiry', 'slug' => 'enquiry', 'probability' => 20],
                    ['name' => 'Appointment', 'slug' => 'appointment', 'probability' => 50],
                    ['name' => 'Consultation', 'slug' => 'consultation', 'probability' => 70],
                    ['name' => 'Admitted', 'slug' => 'admitted', 'probability' => 100, 'is_won' => true],
                    ['name' => 'Closed', 'slug' => 'closed', 'probability' => 0, 'is_lost' => true],
                ],
            ],
            'lead_fields' => [
                ['name' => 'Department', 'key' => 'department', 'type' => 'select', 'options' => ['General', 'Dental', 'Ortho', 'Cardiology', 'Other'], 'show_in_list' => true],
            ],
        ],

        'education' => [
            'statuses' => [
                ['name' => 'New', 'slug' => 'new', 'color' => '#3b82f6', 'is_default' => true],
                ['name' => 'Counseling', 'slug' => 'counseling', 'color' => '#8b5cf6'],
                ['name' => 'Application', 'slug' => 'application', 'color' => '#f59e0b'],
                ['name' => 'Enrolled', 'slug' => 'enrolled', 'color' => '#16a34a', 'is_won' => true],
                ['name' => 'Dropped', 'slug' => 'dropped', 'color' => '#dc2626', 'is_lost' => true],
            ],
            'pipeline' => [
                'name' => 'Admissions',
                'stages' => [
                    ['name' => 'Enquiry', 'slug' => 'enquiry', 'probability' => 15],
                    ['name' => 'Counseling', 'slug' => 'counseling', 'probability' => 40],
                    ['name' => 'Application', 'slug' => 'application', 'probability' => 70],
                    ['name' => 'Enrolled', 'slug' => 'enrolled', 'probability' => 100, 'is_won' => true],
                    ['name' => 'Lost', 'slug' => 'lost', 'probability' => 0, 'is_lost' => true],
                ],
            ],
            'lead_fields' => [
                ['name' => 'Program', 'key' => 'program', 'type' => 'select', 'options' => ['UG', 'PG', 'Certification', 'Coaching', 'Other'], 'show_in_list' => true],
            ],
        ],
    ],

    // Fallback pack key when industry has no dedicated pack
    'fallback' => 'general',
];
