<?php

return [
    /*
    | Lead sync platforms shown in Settings → Integrations.
    | Each company gets a unique webhook URL + secret token.
    */
    'platforms' => [
        'facebook_ads' => [
            'name' => 'Facebook Lead Ads',
            'description' => 'Sync leads from Meta / Facebook lead forms into Enquiries.',
            'source_slug' => 'facebook_ads',
            'icon' => 'facebook',
            'docs' => 'Connect your Facebook Page lead forms via webhook or Zapier.',
        ],
        'instagram' => [
            'name' => 'Instagram Lead Forms',
            'description' => 'Capture Instagram lead form submissions (via Meta).',
            'source_slug' => 'instagram',
            'icon' => 'instagram',
            'docs' => 'Uses the same Meta lead webhook flow as Facebook Ads.',
        ],
        'google_ads' => [
            'name' => 'Google Ads',
            'description' => 'Receive leads from Google Ads lead form extensions.',
            'source_slug' => 'google_ads',
            'icon' => 'google',
            'docs' => 'Use Google Ads lead form webhook or Zapier → this CRM webhook.',
        ],
        'website' => [
            'name' => 'Website form',
            'description' => 'POST leads from your website contact / landing forms.',
            'source_slug' => 'website',
            'icon' => 'website',
            'docs' => 'Send JSON: name, email, phone, message.',
        ],
        'zapier' => [
            'name' => 'Zapier / Make',
            'description' => 'Connect 5,000+ apps (FB, Google, LinkedIn, Typeform…).',
            'source_slug' => 'excel_other',
            'icon' => 'zapier',
            'docs' => 'Create a Zap → Webhooks by Zapier → POST to your CRM URL.',
        ],
        'whatsapp' => [
            'name' => 'WhatsApp Click-to-Chat',
            'description' => 'Ingest leads tagged from WhatsApp campaigns.',
            'source_slug' => 'whatsapp',
            'icon' => 'whatsapp',
            'docs' => 'POST leads from your WhatsApp funnel or Meta ads CTWA.',
        ],
    ],
];
