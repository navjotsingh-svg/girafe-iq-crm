import CrmLayout from '@/Layouts/CrmLayout';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState, type ReactNode } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type Kpi = { key: string; label: string; value: string | number };
type FunnelStep = { label: string; value: number; rate?: string };
type SourceRow = { name: string; enquiries: number; leads: number; won: number };
type TeamRow = {
    name: string;
    leads: number;
    deals_won: number;
    revenue: number;
    follow_ups_done: number;
};
type NamedCount = { name: string; count: number; color?: string };
type PipelineStage = { name: string; color: string; count: number; value: number };
type TrendPoint = { label: string; leads: number; enquiries: number; won: number };
type RevenuePoint = { label: string; revenue: number };
type DealSlice = { name: string; value: number; color: string };

const RANGES = [
    { key: '7', label: '7 days' },
    { key: '30', label: '30 days' },
    { key: '90', label: '90 days' },
    { key: '365', label: '12 months' },
    { key: 'all', label: 'All time' },
] as const;

const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'funnel', label: 'Funnel' },
    { key: 'leads', label: 'Leads' },
    { key: 'pipeline', label: 'Pipeline' },
    { key: 'sources', label: 'Sources' },
    { key: 'team', label: 'Team' },
    { key: 'tasks', label: 'Tasks' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const CHART_COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#f43f5e', '#8b5cf6', '#64748b', '#14b8a6'];

export default function ReportsIndex({
    range = '30',
    kpis,
    funnel,
    bySource,
    teamPerformance,
    lostReasons,
    temperature,
    leadStatuses = [],
    enquiryStatuses = [],
    pipelineStages = [],
    followUpStats = {
        pending: 0,
        completed: 0,
        overdue: 0,
        due_today: 0,
    },
    trend = [],
    revenueTrend = [],
    dealsBreakdown = [],
    currency,
}: {
    range?: string;
    kpis: Kpi[];
    funnel: FunnelStep[];
    bySource: SourceRow[];
    teamPerformance: TeamRow[];
    lostReasons: { reason: string; count: number }[];
    temperature: { hot: number; warm: number; cold: number };
    leadStatuses?: NamedCount[];
    enquiryStatuses?: NamedCount[];
    pipelineStages?: PipelineStage[];
    followUpStats?: {
        pending: number;
        completed: number;
        overdue: number;
        due_today: number;
    };
    trend?: TrendPoint[];
    revenueTrend?: RevenuePoint[];
    dealsBreakdown?: DealSlice[];
    currency: string;
}) {
    const [tab, setTab] = useState<TabKey>('overview');

    const tempPie = useMemo(
        () =>
            [
                { name: 'Hot', value: temperature.hot, color: '#f43f5e' },
                { name: 'Warm', value: temperature.warm, color: '#f59e0b' },
                { name: 'Cold', value: temperature.cold, color: '#0ea5e9' },
            ].filter((d) => d.value > 0),
        [temperature],
    );

    const lostPie = useMemo(
        () =>
            lostReasons.map((r, i) => ({
                name: r.reason,
                value: r.count,
                color: CHART_COLORS[i % CHART_COLORS.length],
            })),
        [lostReasons],
    );

    const followPie = useMemo(
        () =>
            [
                { name: 'Pending', value: followUpStats.pending, color: '#0ea5e9' },
                { name: 'Completed', value: followUpStats.completed, color: '#10b981' },
                { name: 'Overdue', value: followUpStats.overdue, color: '#f43f5e' },
            ].filter((d) => d.value > 0),
        [followUpStats],
    );

    const funnelMax = Math.max(1, ...funnel.map((f) => f.value));
    const setRange = (next: string) => {
        router.get(route('reports.index'), { range: next }, { preserveState: true, replace: true });
    };

    return (
        <CrmLayout title="Reports">
            <Head title="Reports" />

            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">Reports</h2>
                    <p className="text-sm text-slate-500">
                        Funnel, leads, pipeline, sources, team, tasks — with charts
                    </p>
                </div>
                <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
                    {RANGES.map((r) => (
                        <button
                            key={r.key}
                            type="button"
                            onClick={() => setRange(r.key)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                range === r.key
                                    ? 'bg-emerald-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                            }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setTab(t.key)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                            tab === t.key
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((kpi) => (
                    <div
                        key={kpi.key}
                        className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            {kpi.label}
                        </div>
                        <div className="mt-2 text-2xl font-bold tabular-nums">{kpi.value}</div>
                    </div>
                ))}
            </div>

            {tab === 'overview' && (
                <div className="grid gap-4 lg:grid-cols-2">
                    <ChartCard title="Leads & enquiries trend">
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={trend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="enquiries"
                                    name="Enquiries"
                                    stroke="#0ea5e9"
                                    fill="#0ea5e9"
                                    fillOpacity={0.15}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="leads"
                                    name="Leads"
                                    stroke="#10b981"
                                    fill="#10b981"
                                    fillOpacity={0.2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="won"
                                    name="Won"
                                    stroke="#f59e0b"
                                    fill="#f59e0b"
                                    fillOpacity={0.15}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Revenue by month">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={revenueTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip
                                    formatter={(value) => [
                                        `${currency} ${Number(value ?? 0).toLocaleString()}`,
                                        'Revenue',
                                    ]}
                                />
                                <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Deals breakdown">
                        <Donut data={dealsBreakdown} />
                    </ChartCard>

                    <ChartCard title="Lead temperature">
                        <Donut data={tempPie} empty="No lead temperature data" />
                    </ChartCard>
                </div>
            )}

            {tab === 'funnel' && (
                <div className="grid gap-4 lg:grid-cols-2">
                    <ChartCard title="Conversion funnel">
                        <div className="space-y-3">
                            {funnel.map((step) => (
                                <div key={step.label}>
                                    <div className="mb-1 flex justify-between text-sm">
                                        <span>{step.label}</span>
                                        <span className="font-semibold tabular-nums">
                                            {step.value}
                                            {step.rate && (
                                                <span className="ml-2 text-xs font-normal text-emerald-600">
                                                    {step.rate}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className="h-full rounded-full bg-emerald-500"
                                            style={{
                                                width: `${Math.max(4, (step.value / funnelMax) * 100)}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ChartCard>

                    <ChartCard title="Funnel chart">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={funnel} layout="vertical" margin={{ left: 24 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                <YAxis
                                    type="category"
                                    dataKey="label"
                                    width={110}
                                    tick={{ fontSize: 11 }}
                                />
                                <Tooltip />
                                <Bar dataKey="value" name="Count" fill="#10b981" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Enquiry statuses">
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={enquiryStatuses}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="count" name="Enquiries" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Lost reasons">
                        <Donut data={lostPie} empty="No lost reasons logged yet" />
                    </ChartCard>
                </div>
            )}

            {tab === 'leads' && (
                <div className="grid gap-4 lg:grid-cols-2">
                    <ChartCard title="Leads created over time">
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={trend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="leads"
                                    name="Leads"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Temperature mix">
                        <Donut data={tempPie} empty="No leads yet" />
                    </ChartCard>

                    <ChartCard title="Leads by status">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={leadStatuses}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="count" name="Leads" radius={[6, 6, 0, 0]}>
                                    {leadStatuses.map((s, i) => (
                                        <Cell
                                            key={s.name}
                                            fill={s.color || CHART_COLORS[i % CHART_COLORS.length]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Temperature cards">
                        <div className="grid grid-cols-3 gap-3">
                            <TempCard label="Hot" value={temperature.hot} color="rose" />
                            <TempCard label="Warm" value={temperature.warm} color="amber" />
                            <TempCard label="Cold" value={temperature.cold} color="sky" />
                        </div>
                    </ChartCard>
                </div>
            )}

            {tab === 'pipeline' && (
                <div className="grid gap-4 lg:grid-cols-2">
                    <ChartCard title="Deals by stage">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={pipelineStages}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="count" name="Deals" radius={[6, 6, 0, 0]}>
                                    {pipelineStages.map((s) => (
                                        <Cell key={s.name} fill={s.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Pipeline value by stage">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={pipelineStages}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip
                                    formatter={(value) => [
                                        `${currency} ${Number(value ?? 0).toLocaleString()}`,
                                        'Value',
                                    ]}
                                />
                                <Bar dataKey="value" name="Value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Open / won / lost">
                        <Donut data={dealsBreakdown} />
                    </ChartCard>

                    <ChartCard title="Stage table">
                        {pipelineStages.length === 0 ? (
                            <p className="text-sm text-slate-500">No pipeline stages</p>
                        ) : (
                            <table className="min-w-full text-sm">
                                <thead className="text-left text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="pb-2 pr-4">Stage</th>
                                        <th className="pb-2 pr-4">Deals</th>
                                        <th className="pb-2">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {pipelineStages.map((s) => (
                                        <tr key={s.name}>
                                            <td className="py-2 pr-4">
                                                <span className="inline-flex items-center gap-2">
                                                    <span
                                                        className="h-2.5 w-2.5 rounded-full"
                                                        style={{ backgroundColor: s.color }}
                                                    />
                                                    {s.name}
                                                </span>
                                            </td>
                                            <td className="py-2 pr-4 tabular-nums">{s.count}</td>
                                            <td className="py-2 tabular-nums">
                                                {currency} {s.value.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </ChartCard>
                </div>
            )}

            {tab === 'sources' && (
                <div className="grid gap-4 lg:grid-cols-2">
                    <ChartCard title="Leads by source">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={bySource}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="enquiries" name="Enquiries" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="leads" name="Leads" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="won" name="Won" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Source share (leads)">
                        <Donut
                            data={bySource.map((s, i) => ({
                                name: s.name,
                                value: s.leads,
                                color: CHART_COLORS[i % CHART_COLORS.length],
                            }))}
                            empty="No source data yet"
                        />
                    </ChartCard>

                    <div className="lg:col-span-2">
                        <ChartCard title="By source">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="text-left text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="pb-2 pr-4">Source</th>
                                            <th className="pb-2 pr-4">Enquiries</th>
                                            <th className="pb-2 pr-4">Leads</th>
                                            <th className="pb-2">Won</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {bySource.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-6 text-slate-500">
                                                    No source data yet
                                                </td>
                                            </tr>
                                        ) : (
                                            bySource.map((s) => (
                                                <tr key={s.name}>
                                                    <td className="py-2 pr-4 font-medium">{s.name}</td>
                                                    <td className="py-2 pr-4 tabular-nums">
                                                        {s.enquiries}
                                                    </td>
                                                    <td className="py-2 pr-4 tabular-nums">{s.leads}</td>
                                                    <td className="py-2 tabular-nums">{s.won}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </ChartCard>
                    </div>
                </div>
            )}

            {tab === 'team' && (
                <div className="grid gap-4 lg:grid-cols-2">
                    <ChartCard title="Leads by team member">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={teamPerformance}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="leads" name="Leads" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar
                                    dataKey="deals_won"
                                    name="Deals won"
                                    fill="#f59e0b"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Revenue by team member">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={teamPerformance}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip
                                    formatter={(value) => [
                                        `${currency} ${Number(value ?? 0).toLocaleString()}`,
                                        'Revenue',
                                    ]}
                                />
                                <Bar dataKey="revenue" name="Revenue" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <div className="lg:col-span-2">
                        <ChartCard title="Team performance">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="text-left text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="pb-2 pr-4">Member</th>
                                            <th className="pb-2 pr-4">Leads</th>
                                            <th className="pb-2 pr-4">Deals won</th>
                                            <th className="pb-2 pr-4">Revenue</th>
                                            <th className="pb-2">Follow-ups done</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {teamPerformance.map((t) => (
                                            <tr key={t.name}>
                                                <td className="py-2 pr-4 font-medium">{t.name}</td>
                                                <td className="py-2 pr-4 tabular-nums">{t.leads}</td>
                                                <td className="py-2 pr-4 tabular-nums">{t.deals_won}</td>
                                                <td className="py-2 pr-4 tabular-nums">
                                                    {currency} {t.revenue.toLocaleString()}
                                                </td>
                                                <td className="py-2 tabular-nums">
                                                    {t.follow_ups_done}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ChartCard>
                    </div>
                </div>
            )}

            {tab === 'tasks' && (
                <div className="grid gap-4 lg:grid-cols-2">
                    <ChartCard title="Follow-up status">
                        <Donut data={followPie} empty="No tasks yet" />
                    </ChartCard>

                    <ChartCard title="Task snapshot">
                        <div className="grid grid-cols-2 gap-3">
                            <Metric label="Pending" value={followUpStats.pending} />
                            <Metric label="Completed" value={followUpStats.completed} />
                            <Metric label="Overdue" value={followUpStats.overdue} tone="danger" />
                            <Metric label="Due today" value={followUpStats.due_today} tone="warn" />
                        </div>
                    </ChartCard>

                    <ChartCard title="Won deals over time">
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={trend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="won"
                                    name="Deals won"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Follow-ups completed by team">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={teamPerformance}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar
                                    dataKey="follow_ups_done"
                                    name="Completed"
                                    fill="#14b8a6"
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            )}
        </CrmLayout>
    );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 font-semibold">{title}</h3>
            {children}
        </div>
    );
}

function Donut({
    data,
    empty = 'No data',
}: {
    data: { name: string; value: number; color: string }[];
    empty?: string;
}) {
    if (!data.length || data.every((d) => d.value === 0)) {
        return <p className="py-16 text-center text-sm text-slate-500">{empty}</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={260}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                >
                    {data.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}

function TempCard({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: 'rose' | 'amber' | 'sky';
}) {
    const colors = {
        rose: 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200',
        amber: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
        sky: 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200',
    };

    return (
        <div className={`rounded-xl p-3 text-center ${colors[color]}`}>
            <div className="text-xs font-medium uppercase">{label}</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
        </div>
    );
}

function Metric({
    label,
    value,
    tone = 'neutral',
}: {
    label: string;
    value: number;
    tone?: 'neutral' | 'danger' | 'warn';
}) {
    const tones = {
        neutral: 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60',
        danger: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40',
        warn: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40',
    };

    return (
        <div className={`rounded-xl border p-4 ${tones[tone]}`}>
            <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
        </div>
    );
}
