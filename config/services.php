<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    | SaaS-level Meta app (one app for all tenants).
    | Each company connects their own Facebook Pages via OAuth.
    */
    'meta' => [
        'app_id' => env('META_APP_ID'),
        'app_secret' => env('META_APP_SECRET'),
        'graph_version' => env('META_GRAPH_VERSION', 'v21.0'),
        'webhook_verify_token' => env('META_WEBHOOK_VERIFY_TOKEN', 'girafe_meta_verify'),
        'redirect_uri' => env('META_REDIRECT_URI'), // defaults to route in service
        // Facebook Login for Business configuration ID (App Dashboard → Facebook Login for Business → Configurations).
        // Required for lead/page business permissions; when set, OAuth uses config_id instead of raw scope list.
        'login_config_id' => env('META_LOGIN_CONFIG_ID'),
        // Used only when META_LOGIN_CONFIG_ID is empty (classic Login — limited for CRM leadgen).
        'scopes' => array_values(array_filter(array_map('trim', explode(',', (string) env(
            'META_SCOPES',
            'pages_show_list,pages_read_engagement,pages_manage_metadata,pages_manage_ads,leads_retrieval,ads_management,business_management'
        ))))),
    ],

];
