import CrmLayout from '@/Layouts/CrmLayout';
import { Head, Link } from '@inertiajs/react';

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

export default function ReportsIndex({
    kpis,
    funnel,
    bySource,
    teamPerformance,
    lostReasons,
    temperature,
    currency,
}: {
    kpis: Kpi[];
    funnel: FunnelStep[];
    bySource: SourceRow[];
    teamPerformance: TeamRow[];
    lostReasons: { reason: string; count: number }[];
    temperature: { hot: number; warm: number; cold: number };
    currency: string;
}) {
    return (
        <CrmLayout title="Reports">
            <Head title="Reports" />

            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">Reports snapshot</h2>
                    <p className="text-sm text-slate-500">
                        Funnel · source · team performance · conversion
                    </p>
                </div>
                <Link
                    href={route('dashboard')}
                    className="text-sm font-semibold text-emerald-600 hover:underline"
                >
                    ← Dashboard
                </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((kpi) => (
                    <div
                        key={kpi.key}
                        className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            {kpi.label}
                        </div>
                        <div className="mt-2 text-2xl font-bold">{kpi.value}</div>
                    </div>
                ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-semibold">Conversion funnel</h3>
                    <ul className="mt-4 space-y-3">
                        {funnel.map((step) => (
                            <li
                                key={step.label}
                                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60"
                            >
                                <span>{step.label}</span>
                                <span className="font-semibold">
                                    {step.value}
                                    {step.rate && (
                                        <span className="ml-2 text-xs font-normal text-emerald-600">
                                            {step.rate}
                                        </span>
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-semibold">Lead temperature</h3>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                        <TempCard label="Hot" value={temperature.hot} color="rose" />
                        <TempCard label="Warm" value={temperature.warm} color="amber" />
                        <TempCard label="Cold" value={temperature.cold} color="sky" />
                    </div>

                    <h3 className="mt-6 font-semibold">Lost reasons</h3>
                    <ul className="mt-3 space-y-2">
                        {lostReasons.length === 0 ? (
                            <li className="text-sm text-slate-500">No lost reasons logged yet</li>
                        ) : (
                            lostReasons.map((r) => (
                                <li
                                    key={r.reason}
                                    className="flex justify-between text-sm"
                                >
                                    <span>{r.reason}</span>
                                    <span className="font-semibold">{r.count}</span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-semibold">By source</h3>
                <div className="mt-4 overflow-x-auto">
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
                                        <td className="py-2 pr-4">{s.enquiries}</td>
                                        <td className="py-2 pr-4">{s.leads}</td>
                                        <td className="py-2">{s.won}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-semibold">Team performance</h3>
                <div className="mt-4 overflow-x-auto">
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
                                    <td className="py-2 pr-4">{t.leads}</td>
                                    <td className="py-2 pr-4">{t.deals_won}</td>
                                    <td className="py-2 pr-4">
                                        {currency} {t.revenue.toLocaleString()}
                                    </td>
                                    <td className="py-2">{t.follow_ups_done}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </CrmLayout>
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
            <div className="mt-1 text-2xl font-bold">{value}</div>
        </div>
    );
}
