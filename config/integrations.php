<?php

return [
    /*
    | Lead sync platforms shown in Settings → Integrations.
    | Meta (Facebook / Instagram) uses OAuth — each tenant connects their own account.
    */
    'platforms' => [
        'meta' => [
            'name' => 'Meta (Facebook & Instagram)',
            'description' => 'Connect your Facebook Page to sync Lead Ads & Instagram lead forms automatically.',
            'source_slug' => 'facebook_ads',
            'icon' => 'meta',
            'docs' => 'Click Connect — each company links their own Meta Business / Page. No shared credentials.',
            'auth' => 'oauth',
        ],
        'google_ads' => [
            'name' => 'Google Ads',
            'description' => 'Receive leads from Google Ads lead form extensions.',
            'source_slug' => 'google_ads',
            'icon' => 'google',
            'docs' => 'Use Google Ads lead form webhook or Zapier → this CRM webhook.',
            'auth' => 'webhook',
        ],
        'website' => [
            'name' => 'Website form',
            'description' => 'POST leads from your website contact / landing forms.',
            'source_slug' => 'website',
            'icon' => 'website',
            'docs' => 'Send JSON: name, email, phone, message.',
            'auth' => 'webhook',
        ],
        'zapier' => [
            'name' => 'Zapier / Make',
            'description' => 'Connect 5,000+ apps (LinkedIn, Typeform, HubSpot…)',
            'source_slug' => 'excel_other',
            'icon' => 'zapier',
            'docs' => 'Create a Zap → Webhooks by Zapier → POST to your CRM URL.',
            'auth' => 'webhook',
        ],
        'whatsapp' => [
            'name' => 'WhatsApp Click-to-Chat',
            'description' => 'Ingest leads tagged from WhatsApp campaigns.',
            'source_slug' => 'whatsapp',
            'icon' => 'whatsapp',
            'docs' => 'POST leads from your WhatsApp funnel or Meta ads CTWA.',
            'auth' => 'webhook',
        ],
    ],
];
