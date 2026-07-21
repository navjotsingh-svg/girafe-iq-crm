import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, useEffect, useMemo, useState } from 'react';

type NavItem = {
    name: string;
    href: string;
    routeName: string;
    isActive?: (url: string) => boolean;
};

const NAV: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', routeName: 'dashboard' },
    { name: 'Enquiries', href: '/enquiries', routeName: 'enquiries.index' },
    { name: 'Leads', href: '/leads', routeName: 'leads.index' },
    { name: 'Pipeline', href: '/pipeline', routeName: 'pipeline.index' },
    { name: 'Customers', href: '/customers', routeName: 'customers.index' },
    { name: 'Companies', href: '/companies', routeName: 'companies.index' },
    { name: 'Contacts', href: '/contacts', routeName: 'contacts.index' },
    { name: 'Tasks', href: '/tasks', routeName: 'tasks.index' },
    { name: 'Calendar', href: '/calendar', routeName: 'calendar.index' },
    { name: 'Team', href: '/team', routeName: 'team.index' },
    { name: 'Reports', href: '/reports', routeName: 'reports.index' },
    { name: 'Automation', href: '/automation', routeName: 'automation.index' },
    { name: 'Integrations', href: '/integrations', routeName: 'integrations.index' },
    { name: 'WhatsApp', href: '/whatsapp', routeName: 'whatsapp.index' },
    { name: 'Email', href: '/email', routeName: 'email.index' },
    { name: 'Campaigns', href: '/campaigns', routeName: 'campaigns.index' },
    { name: 'Documents', href: '/documents', routeName: 'documents.index' },
    { name: 'Settings', href: '/settings', routeName: 'settings.index', isActive: (url) =>
            url.startsWith('/settings') && !url.includes('tab=integrations'),
    },
];

function applyTheme(theme: string) {
    const root = document.documentElement;
    const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = theme === 'dark' || (theme === 'system' && preferDark);
    root.classList.toggle('dark', dark);
}

export default function CrmLayout({
    title,
    children,
}: PropsWithChildren<{ title?: string }>) {
    const inertiaPage = usePage();
    const page = inertiaPage.props as any;
    const user = page.auth?.user;
    const company = page.auth?.company;
    const appName = page.app?.name ?? 'Girafe IQ CRM';
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

    const nav = useMemo(() => NAV, []);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <div className="flex min-h-screen">
                <aside
                    className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-4 dark:border-slate-800">
                        <ApplicationLogo className="h-8 w-8 fill-current text-emerald-600" />
                        <div>
                            <div className="text-sm font-bold leading-tight">{appName}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                {company?.industry ?? 'CRM'}
                            </div>
                        </div>
                    </div>
                    <nav className="h-[calc(100vh-4rem)] space-y-0.5 overflow-y-auto p-3">
                        {nav.map((item) => {
                            const active = item.isActive
                                ? item.isActive(inertiaPage.url)
                                : route().current(item.routeName);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                                        active
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                    }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className="rounded-md border border-slate-200 px-2 py-1 text-sm lg:hidden dark:border-slate-700"
                                onClick={() => setSidebarOpen(true)}
                            >
                                Menu
                            </button>
                            <div>
                                <h1 className="text-base font-semibold">{title ?? 'Dashboard'}</h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {company?.name ?? 'Workspace'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={cycleTheme}
                                className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium dark:border-slate-700"
                            >
                                Theme: {theme}
                            </button>
                            <Link
                                href={route('profile.edit')}
                                className="rounded-md px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                {user?.name}
                            </Link>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-emerald-600"
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
