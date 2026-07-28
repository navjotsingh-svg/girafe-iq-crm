<?php

return [
    'roles' => [
        'super_admin',
        'company_admin',
        'manager',
        'sales_manager',
        'sales_executive',
        'marketing',
        'support',
        'viewer',
    ],

    /*
    | Modules only company_admin / manager may use (not staff).
    */
    'admin_only' => [
        'team.view', 'team.manage',
        'reports.view', 'reports.export',
        'automation.view', 'automation.manage',
        'whatsapp.view', 'whatsapp.manage',
    ],

    'permissions' => [
        'dashboard.view',
        'enquiries.view', 'enquiries.create', 'enquiries.update', 'enquiries.delete', 'enquiries.convert',
        'leads.view', 'leads.create', 'leads.update', 'leads.delete', 'leads.assign', 'leads.merge',
        'pipeline.view', 'pipeline.manage', 'deals.view', 'deals.create', 'deals.update', 'deals.delete',
        'customers.view', 'customers.create', 'customers.update', 'customers.delete',
        'tasks.view', 'tasks.create', 'tasks.update', 'tasks.delete',
        'calendar.view', 'calendar.manage',
        'team.view', 'team.manage',
        'reports.view', 'reports.export',
        'automation.view', 'automation.manage',
        'whatsapp.view', 'whatsapp.manage',
        'email.view', 'email.manage',
        'campaigns.view', 'campaigns.manage',
        'documents.view', 'documents.manage',
        'settings.view', 'settings.manage',
    ],

    /*
    | Explicit permission grants per tenant role.
    | company_admin / manager get all permissions.
    | null = all permissions; 'view' = all *.view except admin_only; list = exact names.
    */
    'role_grants' => [
        'company_admin' => null,
        'manager' => null,
        'sales_manager' => [
            'dashboard.view',
            'enquiries.view', 'enquiries.create', 'enquiries.update', 'enquiries.convert',
            'leads.view', 'leads.create', 'leads.update', 'leads.assign', 'leads.merge',
            'pipeline.view', 'pipeline.manage', 'deals.view', 'deals.create', 'deals.update', 'deals.delete',
            'customers.view', 'customers.create', 'customers.update',
            'tasks.view', 'tasks.create', 'tasks.update', 'tasks.delete',
            'calendar.view', 'calendar.manage',
            'documents.view', 'documents.manage',
        ],
        'sales_executive' => [
            'dashboard.view',
            'enquiries.view', 'enquiries.create', 'enquiries.update', 'enquiries.convert',
            'leads.view', 'leads.create', 'leads.update',
            'pipeline.view', 'deals.view', 'deals.create', 'deals.update',
            'customers.view',
            'tasks.view', 'tasks.create', 'tasks.update',
            'calendar.view',
            'documents.view',
        ],
        'marketing' => [
            'dashboard.view',
            'leads.view', 'leads.create',
            'campaigns.view', 'campaigns.manage',
            'email.view', 'email.manage',
        ],
        'support' => [
            'dashboard.view',
            'customers.view', 'customers.update',
            'tasks.view', 'tasks.create', 'tasks.update',
            'documents.view',
        ],
        'viewer' => 'view_except_admin',
    ],
];
