import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useEffect, useMemo, useState } from 'react';

type NavItem = {
    name: string;
    href: string;
    routeName: string;
    icon: ReactNode;
    permission?: string;
    adminOnly?: boolean;
    isActive?: (url: string) => boolean;
};

const iconClass = 'h-[18px] w-[18px] shrink-0';

const Icons = {
    dashboard: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25zM3.75 15.75a2.25 2.25 0 012.25-2.25h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6z" />
        </svg>
    ),
    enquiries: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
    ),
    leads: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
    ),
    pipeline: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
        </svg>
    ),
    customers: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
    ),
    companies: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3.75 3v18m4.5-9h3m-3 4.5h3m-3-9h9v9h-9V3zm9 0h4.5v18H12V3z" />
        </svg>
    ),
    contacts: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
    ),
    tasks: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    calendar: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
    ),
    team: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
    ),
    reports: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
    ),
    automation: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    integrations: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
    ),
    whatsapp: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97l-1.557 1.557a.75.75 0 01-1.06-1.06l1.557-1.557A5.972 5.972 0 013.75 12C3.75 7.444 7.78 3.75 12.75 3.75S21.75 7.444 21.75 12z" />
        </svg>
    ),
    email: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
    ),
    campaigns: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
    ),
    documents: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    ),
    settings: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
};

const NAV: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', routeName: 'dashboard', icon: Icons.dashboard },
    { name: 'Enquiries', href: '/enquiries', routeName: 'enquiries.index', icon: Icons.enquiries, permission: 'enquiries.view' },
    { name: 'Leads', href: '/leads', routeName: 'leads.index', icon: Icons.leads, permission: 'leads.view' },
    { name: 'Pipeline', href: '/pipeline', routeName: 'pipeline.index', icon: Icons.pipeline, permission: 'pipeline.view' },
    { name: 'Customers', href: '/customers', routeName: 'customers.index', icon: Icons.customers, permission: 'customers.view' },
    { name: 'Companies', href: '/companies', routeName: 'companies.index', icon: Icons.companies, permission: 'leads.view' },
    { name: 'Contacts', href: '/contacts', routeName: 'contacts.index', icon: Icons.contacts, permission: 'leads.view' },
    { name: 'Tasks', href: '/tasks', routeName: 'tasks.index', icon: Icons.tasks, permission: 'tasks.view' },
    { name: 'Calendar', href: '/calendar', routeName: 'calendar.index', icon: Icons.calendar, permission: 'calendar.view' },
    { name: 'Documents', href: '/documents', routeName: 'documents.index', icon: Icons.documents, permission: 'documents.view' },
    { name: 'Email', href: '/email', routeName: 'email.index', icon: Icons.email, permission: 'email.view' },
    { name: 'Campaigns', href: '/campaigns', routeName: 'campaigns.index', icon: Icons.campaigns, permission: 'campaigns.view' },
    { name: 'WhatsApp', href: '/whatsapp', routeName: 'whatsapp.index', icon: Icons.whatsapp, permission: 'whatsapp.view', adminOnly: true },
    { name: 'Team', href: '/team', routeName: 'team.index', icon: Icons.team, permission: 'team.view', adminOnly: true },
    { name: 'Reports', href: '/reports', routeName: 'reports.index', icon: Icons.reports, permission: 'reports.view', adminOnly: true },
    { name: 'Automation', href: '/automation', routeName: 'automation.index', icon: Icons.automation, permission: 'automation.view', adminOnly: true },
    { name: 'Integrations', href: '/integrations', routeName: 'integrations.index', icon: Icons.integrations, permission: 'settings.view', adminOnly: true },
    {
        name: 'Settings',
        href: '/settings',
        routeName: 'settings.index',
        icon: Icons.settings,
        permission: 'settings.view',
        adminOnly: true,
        isActive: (url) => url.startsWith('/settings') && !url.includes('tab=integrations'),
    },
];

function groupLabelFor(item: NavItem): string {
    if (item.adminOnly) {
        return item.routeName === 'whatsapp.index' ? 'Outreach' : 'Admin';
    }

    switch (item.routeName) {
        case 'dashboard':
            return 'Overview';
        case 'enquiries.index':
        case 'leads.index':
        case 'pipeline.index':
        case 'customers.index':
        case 'companies.index':
        case 'contacts.index':
            return 'Sales';
        case 'tasks.index':
        case 'calendar.index':
        case 'documents.index':
            return 'Work';
        case 'email.index':
        case 'campaigns.index':
            return 'Outreach';
        default:
            return 'Overview';
    }
}

function applyTheme(theme: string) {
    const root = document.documentElement;
    const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = theme === 'dark' || (theme === 'system' && preferDark);
    root.classList.toggle('dark', dark);
}

function userInitials(name?: string) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

export default function CrmLayout({
    title,
    children,
}: PropsWithChildren<{ title?: string }>) {
    const inertiaPage = usePage();
    const page = inertiaPage.props as any;
    const user = page.auth?.user;
    const company = page.auth?.company;
    const appName = page.app?.name ?? 'Girafe IQ';
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState(user?.theme ?? 'system');

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const cycleTheme = () => {
        const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
        setTheme(next);
        localStorage.setItem('girafe-theme', next);
    };

    useEffect(() => {
        const saved = localStorage.getItem('girafe-theme');
        if (saved) setTheme(saved);
    }, []);

    const permissions: string[] = Array.isArray(user?.permissions)
        ? user.permissions
        : [];
    const roles: string[] = Array.isArray(user?.roles)
        ? user.roles.map((r: string) => String(r))
        : Object.values(user?.roles ?? {}).map((r) => String(r));
    const roleSet = new Set(roles);
    const isAdmin =
        user?.can_access_admin_modules === true ||
        user?.can_manage_team === true ||
        roleSet.has('company_admin') ||
        roleSet.has('super_admin') ||
        roleSet.has('manager');
    const isStaffOnly =
        roleSet.has('sales_executive') &&
        !roleSet.has('company_admin') &&
        !roleSet.has('super_admin') &&
        !roleSet.has('manager');

    const hasPermission = (permission?: string) =>
        !!permission && permissions.includes(permission);

    const can = (item: NavItem) => {
        if (item.routeName === 'team.index') {
            return (
                user?.can_manage_team === true ||
                hasPermission('team.view') ||
                hasPermission('team.manage')
            );
        }

        if (item.adminOnly) {
            if (isAdmin && !isStaffOnly) return true;
            return hasPermission(item.permission);
        }

        if (!item.permission) return true;
        if (isAdmin && !isStaffOnly) return true;

        if (permissions.length === 0) {
            return [
                'enquiries.view',
                'leads.view',
                'pipeline.view',
                'customers.view',
                'tasks.view',
                'calendar.view',
                'documents.view',
            ].includes(item.permission);
        }

        return hasPermission(item.permission);
    };

    const nav = useMemo(
        () => NAV.filter((item) => can(item)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [permissions.join('|'), roles.join('|'), isAdmin, isStaffOnly, user?.can_manage_team],
    );

    const navGroups = useMemo(() => {
        const order = ['Overview', 'Sales', 'Work', 'Outreach', 'Admin'];
        const buckets = new Map<string, NavItem[]>();

        for (const item of nav) {
            const key = groupLabelFor(item);
            if (!buckets.has(key)) buckets.set(key, []);
            buckets.get(key)!.push(item);
        }

        return order
            .filter((label) => buckets.has(label))
            .map((label) => ({ label, items: buckets.get(label)! }));
    }, [nav]);

    const isItemActive = (item: NavItem) => {
        try {
            return item.isActive
                ? item.isActive(inertiaPage.url)
                : Boolean(route().current(item.routeName));
        } catch {
            return inertiaPage.url.startsWith(item.href);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <div className="flex min-h-screen">
                <aside
                    className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-[#0f172a] shadow-2xl transition-transform duration-200 lg:static lg:translate-x-0 ${
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    {/* Brand */}
                    <div className="flex h-[4.25rem] shrink-0 items-center gap-3 border-b border-white/10 px-5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                            <ApplicationLogo className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">{appName}</p>
                            <p className="truncate text-[11px] text-slate-400">
                                {company?.name ?? 'Workspace'}
                            </p>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 scrollbar-thin">
                        {navGroups.map((group) => (
                            <div key={group.label}>
                                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                                    {group.label}
                                </p>
                                <ul className="space-y-0.5">
                                    {group.items.map((item) => {
                                        const active = isItemActive(item);
                                        return (
                                            <li key={item.href}>
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setSidebarOpen(false)}
                                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                                                        active
                                                            ? 'bg-emerald-500/15 text-emerald-400 shadow-sm'
                                                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                                    }`}
                                                >
                                                    <span
                                                        className={
                                                            active
                                                                ? 'text-emerald-400'
                                                                : 'text-slate-500'
                                                        }
                                                    >
                                                        {item.icon}
                                                    </span>
                                                    <span className="truncate">{item.name}</span>
                                                    {active && (
                                                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                    )}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </nav>

                    {/* User footer */}
                    <div className="shrink-0 border-t border-white/10 p-3">
                        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                                {userInitials(user?.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-white">
                                    {user?.name}
                                </p>
                                <p className="truncate text-[10px] text-slate-500">
                                    {company?.industry ?? 'CRM user'}
                                </p>
                            </div>
                            <Link
                                href={route('profile.edit')}
                                className="rounded-md p-1 text-slate-500 transition hover:bg-white/10 hover:text-slate-300"
                                title="Profile"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </aside>

                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 lg:px-6">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden dark:border-slate-700 dark:text-slate-300"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            </button>
                            <h1 className="text-sm font-semibold text-slate-900 dark:text-white">
                                {title ?? 'Dashboard'}
                            </h1>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={cycleTheme}
                                className="flex h-8 items-center rounded-lg border border-slate-200 px-2.5 text-xs text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                title="Toggle theme"
                            >
                                {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '💻'}
                            </button>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="hidden h-8 items-center rounded-lg bg-slate-900 px-3 text-xs font-medium text-white transition hover:bg-slate-800 sm:flex dark:bg-emerald-600 dark:hover:bg-emerald-500"
                            >
                                Log out
                            </Link>
                        </div>
                    </header>
                    <main className="flex-1 p-4 lg:p-6">{children}</main>
                </div>
            </div>
        </div>
    );
}
