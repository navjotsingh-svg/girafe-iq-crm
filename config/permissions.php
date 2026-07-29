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
    | Roles company admins can customize for their staff.
    */
    'editable_roles' => [
        'sales_manager',
        'sales_executive',
        'marketing',
        'support',
        'viewer',
    ],

    /*
    | Modules only company_admin / manager get by default (staff can still be granted by admin).
    */
    'admin_only' => [
        'team.view', 'team.manage',
        'reports.view', 'reports.export',
        'automation.view', 'automation.manage',
        'whatsapp.view', 'whatsapp.manage',
        'settings.view', 'settings.manage',
    ],

    /*
    | Permissions company admin cannot grant to staff.
    */
    'locked_from_staff' => [
        'settings.manage',
        'team.manage',
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
    | UI matrix: menu visibility (view) + create / update / other actions.
    */
    'modules' => [
        [
            'key' => 'dashboard',
            'label' => 'Dashboard',
            'actions' => [
                ['key' => 'view', 'label' => 'See menu', 'permission' => 'dashboard.view'],
            ],
        ],
        [
            'key' => 'enquiries',
            'label' => 'Enquiries',
            'actions' => [
                ['key' => 'view', 'label' => 'See menu', 'permission' => 'enquiries.view'],
                ['key' => 'create', 'label' => 'Create', 'permission' => 'enquiries.create'],
                ['key' => 'update', 'label' => 'Edit', 'permission' => 'enquiries.update'],
                ['key' => 'convert', 'label' => 'Convert', 'permission' => 'enquiries.convert'],
                ['key' => 'delete', 'label' => 'Delete', 'permission' => 'enquiries.delete'],
            ],
        ],
        [
            'key' => 'leads',
            'label' => 'Leads',
            'actions' => [
                ['key' => 'view', 'label' => 'See menu', 'permission' => 'leads.view'],
                ['key' => 'create', 'label' => 'Create', 'permission' => 'leads.create'],
                ['key' => 'update', 'label' => 'Edit', 'permission' => 'leads.update'],
                ['key' => 'assign', 'label' => 'Assign', 'permission' => 'leads.assign'],
                ['key' => 'delete', 'label' => 'Delete', 'permission' => 'leads.delete'],
            ],
        ],
        [
            'key' => 'pipeline',
            'label' => 'Pipeline / Deals',
            'actions' => [
                ['key' => 'view', 'label' => 'See menu', 'permission' => 'pipeline.view'],
                ['key' => 'create', 'label' => 'Create deals', 'permission' => 'deals.create'],
                ['key' => 'update', 'label' => 'Edit deals', 'permission' => 'deals.update'],
                ['key' => 'manage', 'label' => 'Manage stages', 'permission' => 'pipeline.manage'],
                ['key' => 'delete', 'label' => 'Delete deals', 'permission' => 'deals.delete'],
            ],
        ],
        [
            'key' => 'customers',
            'label' => 'Customers',
            'actions' => [
                ['key' => 'view', 'label' => 'See menu', 'permission' => 'customers.view'],
                ['key' => 'create', 'label' => 'Create', 'permission' => 'customers.create'],
                ['key' => 'update', 'label' => 'Edit', 'permission' => 'customers.update'],
                ['key' => 'delete', 'label' => 'Delete', 'permission' => 'customers.delete'],
            ],
        ],
        [
            'key' => 'companies',
            'label' => 'Companies / Contacts',
            'actions' => [
                ['key' => 'view', 'label' => 'See menu', 'permission' => 'leads.view'],
            ],
        ],
        [
            'key' => 'tasks',
            'label' => 'Tasks',
            'actions' => [
                ['key' => 'view', 'label' => 'See menu', 'permission' => 'tasks.view'],
                ['key' => 'create', 'label' => 'Create', 'permission' => 'tasks.create'],
                ['key' => 'update', 'label' => 'Edit', 'permission' => 'tasks.update'],
                ['key' => 'delete', 'label' => 'Delete', 'permission' => 'tasks.delete'],
            ],
        ],
        [
            'key' => 'calendar',
            'label' => 'Calendar',
            'actions' => [
                ['key' => 'view', 'label' => 'See menu', 'permission' => 'calendar.view'],
                ['key' => 'manage', 'label' => 'Manage', 'permission' => 'calendar.manage'],
            ],
        ],
        [
            'key' => 'team',
            'label' => 'Team',
            'actions' => [
                ['key' => 'view', 'label' => 'See menu', 'permission' => 'team.view'],
            ],
        ],
        [
            'key' => 'reports',
            'label' => 'Reports',
            'actions' => [
                ['key' => 'view', 'label' => 'See menu', 'permission' => 'reports.view'],
                ['key' => 'export', 'label' => 'Export', 'permission' => 'reports.export'],
            ],
        ],
        [
            'key' => 'automation',
            'label' => 'Automation',
            'actions' => [
                ['key' => 'view', 'label' => 'See menu', 'permission' => 'automation.view'],
                ['key' => 'manage', 'label' => 'Manage', 'permission' => 'automation.manage'],
            ],
        ],
        [
            'key' => 'whatsapp',
            'label' => 'WhatsApp',
            'actions' => [
                ['key' => 'view', 'label' => 'See menu', 'permission' => 'whatsapp.view'],
                ['key' => 'manage', 'label' => 'Manage templates', 'permission' => 'whatsapp.manage'],
            ],
        ],
        [
            'key' => 'email',
            'label' => 'Email',
            'actions' => [
                ['key' => 'view', 'label' => 'See menu', 'permission' => 'email.view'],
                ['key' => 'manage', 'label' => 'Manage templates', 'permission' => 'email.manage'],
            ],
        ],
        [
            'key' => 'campaigns',
            'label' => 'Campaigns',
            'actions' => [
                ['key' => 'view', 'label' => 'See menu', 'permission' => 'campaigns.view'],
                ['key' => 'manage', 'label' => 'Manage', 'permission' => 'campaigns.manage'],
            ],
        ],
        [
            'key' => 'documents',
            'label' => 'Documents',
            'actions' => [
                ['key' => 'view', 'label' => 'See menu', 'permission' => 'documents.view'],
                ['key' => 'manage', 'label' => 'Manage', 'permission' => 'documents.manage'],
            ],
        ],
        [
            'key' => 'settings',
            'label' => 'Settings / Integrations',
            'actions' => [
                ['key' => 'view', 'label' => 'See menu', 'permission' => 'settings.view'],
            ],
        ],
    ],

    /*
    | Explicit permission grants per tenant role (defaults).
    | company_admin / manager get all permissions.
    | null = all permissions; 'view_except_admin' = all *.view except admin_only; list = exact names.
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
