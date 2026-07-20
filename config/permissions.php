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
];
