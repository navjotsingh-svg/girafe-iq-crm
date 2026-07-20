import CrmLayout from '@/Layouts/CrmLayout';
import { Head, Link } from '@inertiajs/react';

type Kpi = { key: string; label: string; value: string | number };

export default function DashboardIndex({
    company,
    kpis,
    recentEnquiries,
    recentLeads,
    dueToday,
}: {
    company: { name: string; industry: string } | null;
    kpis: Kpi[];
    recentEnquiries: { id: number; name: string; status: string; created_at: string }[];
    recentLeads: { id: number; name: string; temperature: string; status: string | null; created_at: string }[];
    dueToday: { id: number; title: string; lead: string | null; due_at: string | null }[];
}) {
    return (
        <CrmLayout title="Dashboard">
            <Head title="Dashboard" />
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Welcome to {company?.name ?? 'Girafe IQ'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Industry pack: {company?.industry ?? 'General'} · Live CRM metrics
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href={route('enquiries.index', { create: 1 })}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                        + Add enquiry
                    </Link>
                    <Link
                        href={route('companies.index')}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700"
                    >
                        Companies
                    </Link>
                    <Link
                        href={route('contacts.index')}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700"
                    >
                        Contacts
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((kpi) => (
                    <div
                        key={kpi.key}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            {kpi.label}
                        </div>
                        <div className="mt-2 text-2xl font-bold">{kpi.value}</div>
                    </div>
                ))}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Recent Enquiries</h3>
                        <Link href={route('enquiries.index')} className="text-xs font-semibold text-emerald-600">
                            View all
                        </Link>
                    </div>
                    <ul className="mt-4 space-y-2">
                        {recentEnquiries.length === 0 ? (
                            <li className="text-sm text-slate-500">No enquiries yet</li>
                        ) : (
                            recentEnquiries.map((e) => (
                                <li
                                    key={e.id}
                                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60"
                                >
                                    <span>{e.name}</span>
                                    <span className="text-xs text-slate-500">{e.created_at}</span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Recent Leads</h3>
                        <Link href={route('leads.index')} className="text-xs font-semibold text-emerald-600">
                            View all
                        </Link>
                    </div>
                    <ul className="mt-4 space-y-2">
                        {recentLeads.length === 0 ? (
                            <li className="text-sm text-slate-500">No leads yet</li>
                        ) : (
                            recentLeads.map((l) => (
                                <li
                                    key={l.id}
                                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60"
                                >
                                    <Link
                                        href={route('leads.show', l.id)}
                                        className="hover:text-emerald-600"
                                    >
                                        {l.name}{' '}
                                        <span className="text-xs capitalize text-slate-500">
                                            · {l.temperature}
                                        </span>
                                    </Link>
                                    <span className="text-xs text-slate-500">{l.created_at}</span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Today&apos;s follow-ups</h3>
                    <Link href={route('tasks.index', { filter: 'today' })} className="text-xs font-semibold text-emerald-600">
                        View all
                    </Link>
                </div>
                <ul className="mt-4 space-y-2">
                    {dueToday.length === 0 ? (
                        <li className="text-sm text-slate-500">Nothing due today</li>
                    ) : (
                        dueToday.map((t) => (
                            <li
                                key={t.id}
                                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60"
                            >
                                <span>
                                    {t.title}
                                    {t.lead && (
                                        <span className="text-xs text-slate-500"> · {t.lead}</span>
                                    )}
                                </span>
                                <span className="text-xs text-slate-500">{t.due_at ?? ''}</span>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </CrmLayout>
    );
}
