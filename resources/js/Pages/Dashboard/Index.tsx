import CrmLayout from '@/Layouts/CrmLayout';
import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

type Attention = {
    key: string;
    label: string;
    value: number;
    hint: string | null;
    tone: string;
    href: string;
};

type Stat = {
    key: string;
    label: string;
    value: string | number;
    sub?: string;
    href: string;
};

type TaskRow = {
    id: number;
    title: string;
    lead: string | null;
    lead_id: number | null;
    assignee: string | null;
    mine: boolean;
    due_at: string | null;
};

type LeadRow = {
    id: number;
    name: string;
    phone: string | null;
    temperature: string;
    status: string | null;
    status_color?: string | null;
    assignee: string | null;
    created_at: string | null;
};

type EnquiryRow = {
    id: number;
    name: string;
    status: string;
    phone: string | null;
    assignee: string | null;
    created_at: string | null;
};

const toneClass: Record<string, string> = {
    danger: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100',
    warn: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
    hot: 'border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-100',
    info: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100',
    neutral:
        'border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100',
};

const tempClass: Record<string, string> = {
    cold: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
    warm: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
    hot: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
};

export default function DashboardIndex({
    company,
    userName,
    todayLabel,
    attention,
    stats,
    week,
    activity,
    activityMax,
    temperature,
    pipelineStages,
    recentEnquiries,
    recentLeads,
    dueToday,
    overdueTasks,
}: {
    company: { name: string; industry: string; currency: string } | null;
    userName: string;
    todayLabel: string;
    attention: Attention[];
    stats: Stat[];
    week: { leads: number; previous: number; delta: number };
    activity: { label: string; date: string; count: number }[];
    activityMax: number;
    temperature: { hot: number; warm: number; cold: number };
    pipelineStages: { id: number; name: string; color: string; count: number; value: number }[];
    recentEnquiries: EnquiryRow[];
    recentLeads: LeadRow[];
    dueToday: TaskRow[];
    overdueTasks: TaskRow[];
}) {
    const tempTotal = temperature.hot + temperature.warm + temperature.cold || 1;
    const stageMax = Math.max(1, ...pipelineStages.map((s) => s.count), 0);

    return (
        <CrmLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        {todayLabel}
                    </p>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Hi {userName.split(' ')[0]}, here&apos;s {company?.name ?? 'your CRM'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        {company?.industry ?? 'General'} · Focus on overdue work, hot leads, and
                        pipeline
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link
                        href={route('leads.index')}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                        + Add lead
                    </Link>
                    <Link
                        href={route('enquiries.index', { create: 1 })}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700"
                    >
                        + Enquiry
                    </Link>
                    <Link
                        href={route('pipeline.index')}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700"
                    >
                        Pipeline
                    </Link>
                    <Link
                        href={route('tasks.index')}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700"
                    >
                        Tasks
                    </Link>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {attention.map((item) => (
                    <Link
                        key={item.key}
                        href={item.href}
                        className={`rounded-2xl border p-4 transition hover:shadow-sm ${toneClass[item.tone] ?? toneClass.neutral}`}
                    >
                        <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                            {item.label}
                        </div>
                        <div className="mt-1 text-3xl font-bold tabular-nums">{item.value}</div>
                        {item.hint && <div className="mt-1 text-xs opacity-80">{item.hint}</div>}
                    </Link>
                ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="font-medium text-slate-700 dark:text-slate-200">This week</span>
                <span className="tabular-nums text-slate-600 dark:text-slate-300">
                    {week.leads} leads
                </span>
                <span
                    className={`tabular-nums ${
                        week.delta > 0
                            ? 'text-emerald-600'
                            : week.delta < 0
                              ? 'text-rose-600'
                              : 'text-slate-400'
                    }`}
                >
                    {week.delta > 0 ? '+' : ''}
                    {week.delta} vs last week
                </span>
                <div className="ml-auto flex items-end gap-1.5">
                    {activity.map((d) => (
                        <div key={d.date} className="flex w-6 flex-col items-center gap-1">
                            <div
                                className="w-full rounded-sm bg-emerald-500/80 dark:bg-emerald-400/70"
                                style={{
                                    height: `${Math.max(4, (d.count / activityMax) * 28)}px`,
                                }}
                                title={`${d.count} on ${d.date}`}
                            />
                            <span className="text-[10px] text-slate-400">{d.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Link
                        key={stat.key}
                        href={stat.href}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-800"
                    >
                        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            {stat.label}
                        </div>
                        <div className="mt-1 text-xl font-bold tabular-nums">{stat.value}</div>
                        {stat.sub && (
                            <div className="mt-0.5 text-xs text-slate-500">{stat.sub}</div>
                        )}
                    </Link>
                ))}
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-3">
                <Panel
                    title="Needs attention"
                    actionHref={route('tasks.index', { filter: 'overdue' })}
                    actionLabel="All overdue"
                    className="xl:col-span-1"
                >
                    {overdueTasks.length === 0 ? (
                        <Empty>No overdue tasks</Empty>
                    ) : (
                        <ul className="space-y-2">
                            {overdueTasks.map((t) => (
                                <TaskItem key={t.id} task={t} overdue />
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel
                    title="Due today"
                    actionHref={route('tasks.index', { filter: 'today' })}
                    actionLabel="View all"
                    className="xl:col-span-1"
                >
                    {dueToday.length === 0 ? (
                        <Empty>Nothing due today</Empty>
                    ) : (
                        <ul className="space-y-2">
                            {dueToday.map((t) => (
                                <TaskItem key={t.id} task={t} />
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel
                    title="Lead temperature"
                    actionHref={route('leads.index')}
                    actionLabel="All leads"
                >
                    <div className="space-y-3">
                        {(
                            [
                                ['hot', temperature.hot, 'Hot'],
                                ['warm', temperature.warm, 'Warm'],
                                ['cold', temperature.cold, 'Cold'],
                            ] as const
                        ).map(([key, value, label]) => (
                            <Link
                                key={key}
                                href={route('leads.index', { temperature: key })}
                                className="block"
                            >
                                <div className="mb-1 flex justify-between text-sm">
                                    <span>{label}</span>
                                    <span className="font-semibold tabular-nums">{value}</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div
                                        className={`h-full rounded-full ${
                                            key === 'hot'
                                                ? 'bg-rose-500'
                                                : key === 'warm'
                                                  ? 'bg-amber-500'
                                                  : 'bg-sky-500'
                                        }`}
                                        style={{ width: `${(value / tempTotal) * 100}%` }}
                                    />
                                </div>
                            </Link>
                        ))}
                    </div>

                    {pipelineStages.length > 0 && (
                        <div className="mt-6">
                            <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-sm font-semibold">Pipeline</h4>
                                <Link
                                    href={route('pipeline.index')}
                                    className="text-xs font-semibold text-emerald-600"
                                >
                                    Board
                                </Link>
                            </div>
                            <ul className="space-y-2">
                                {pipelineStages.map((s) => (
                                    <li key={s.id} className="text-sm">
                                        <div className="mb-1 flex items-center justify-between gap-2">
                                            <span className="flex items-center gap-2 truncate">
                                                <span
                                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                    style={{ backgroundColor: s.color }}
                                                />
                                                {s.name}
                                            </span>
                                            <span className="shrink-0 tabular-nums text-slate-500">
                                                {s.count}
                                            </span>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${(s.count / stageMax) * 100}%`,
                                                    backgroundColor: s.color,
                                                }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </Panel>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <Panel
                    title="Recent leads"
                    actionHref={route('leads.index')}
                    actionLabel="View all"
                >
                    {recentLeads.length === 0 ? (
                        <Empty>No leads yet</Empty>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentLeads.map((l) => (
                                <li key={l.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                                    <div className="min-w-0">
                                        <Link
                                            href={route('leads.show', l.id)}
                                            className="truncate font-medium hover:text-emerald-600"
                                        >
                                            {l.name}
                                        </Link>
                                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                            <span
                                                className={`rounded px-1.5 py-0.5 capitalize ${tempClass[l.temperature] ?? ''}`}
                                            >
                                                {l.temperature}
                                            </span>
                                            {l.status && <span>{l.status}</span>}
                                            {l.assignee && <span>· {l.assignee}</span>}
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-xs text-slate-400">
                                        {l.created_at}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel
                    title="Recent enquiries"
                    actionHref={route('enquiries.index')}
                    actionLabel="View all"
                >
                    {recentEnquiries.length === 0 ? (
                        <Empty>No enquiries yet</Empty>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentEnquiries.map((e) => (
                                <li
                                    key={e.id}
                                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate font-medium">{e.name}</div>
                                        <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-slate-500">
                                            <span className="capitalize">
                                                {e.status.replace('_', ' ')}
                                            </span>
                                            {e.phone && <span>· {e.phone}</span>}
                                            {e.assignee && <span>· {e.assignee}</span>}
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-xs text-slate-400">
                                        {e.created_at}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>
        </CrmLayout>
    );
}

function Panel({
    title,
    actionHref,
    actionLabel,
    children,
    className = '',
}: {
    title: string;
    actionHref: string;
    actionLabel: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 ${className}`}
        >
            <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="font-semibold">{title}</h3>
                <Link href={actionHref} className="text-xs font-semibold text-emerald-600">
                    {actionLabel}
                </Link>
            </div>
            {children}
        </div>
    );
}

function Empty({ children }: { children: ReactNode }) {
    return <p className="text-sm text-slate-500">{children}</p>;
}

function TaskItem({ task, overdue = false }: { task: TaskRow; overdue?: boolean }) {
    return (
        <li
            className={`rounded-lg px-3 py-2 text-sm ${
                overdue
                    ? 'bg-rose-50 dark:bg-rose-950/30'
                    : 'bg-slate-50 dark:bg-slate-800/60'
            }`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    {task.lead_id ? (
                        <Link
                            href={route('leads.show', task.lead_id)}
                            className="font-medium hover:text-emerald-600"
                        >
                            {task.title}
                        </Link>
                    ) : (
                        <span className="font-medium">{task.title}</span>
                    )}
                    <div className="mt-0.5 truncate text-xs text-slate-500">
                        {task.lead && <span>{task.lead}</span>}
                        {task.assignee && (
                            <span>
                                {task.lead ? ' · ' : ''}
                                {task.mine ? 'You' : task.assignee}
                            </span>
                        )}
                    </div>
                </div>
                <span
                    className={`shrink-0 text-xs ${overdue ? 'font-semibold text-rose-600' : 'text-slate-500'}`}
                >
                    {task.due_at}
                </span>
            </div>
        </li>
    );
}
