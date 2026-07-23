import CrmLayout from '@/Layouts/CrmLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

type DealCard = {
    id: number;
    title: string;
    value: number;
    currency: string;
    lead: { id: number; name: string; phone: string | null; temperature: string } | null;
    assignee: string | null;
};

type Stage = {
    id: number;
    name: string;
    color: string;
    probability: number;
    is_won: boolean;
    is_lost: boolean;
    deals: DealCard[];
};

export default function PipelineIndex({
    pipeline,
    stages,
    stats,
}: {
    pipeline: { id: number; name: string } | null;
    stages: Stage[];
    stats: { open_deals: number; won_deals: number; pipeline_value: number; currency: string };
}) {
    const flash = (usePage().props as { flash?: { success?: string } }).flash;

    const moveDeal = (dealId: number, stageId: number) => {
        router.patch(route('deals.move-stage', dealId), {
            pipeline_stage_id: stageId,
        }, { preserveScroll: true });
    };

    const formatValue = (value: number, currency: string) =>
        `${currency} ${value.toLocaleString()}`;

    return (
        <CrmLayout title="Pipeline">
            <Head title="Pipeline" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {flash.success}
                </div>
            )}

            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">Sales Pipeline</h2>
                    <p className="text-sm text-slate-500">
                        {pipeline?.name ?? 'No pipeline configured'} · {stages.length} stages
                        {stages.length > 4 ? ' · scroll sideways to see all' : ''}
                    </p>
                </div>
                <Link
                    href={route('settings.index', { tab: 'pipeline' })}
                    className="text-sm font-medium text-emerald-700 hover:underline"
                >
                    Manage stages
                </Link>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <StatCard label="Open deals" value={stats.open_deals} />
                <StatCard label="Deals won" value={stats.won_deals} />
                <StatCard
                    label="Pipeline value"
                    value={formatValue(stats.pipeline_value, stats.currency)}
                />
            </div>

            {!pipeline ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
                    Complete onboarding to set up your pipeline.
                </div>
            ) : (
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {stages.map((stage) => (
                        <div
                            key={stage.id}
                            className="min-w-[280px] flex-shrink-0 rounded-2xl border border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50"
                        >
                            <div
                                className="border-b border-slate-200 px-4 py-3 dark:border-slate-800"
                                style={{ borderTopColor: stage.color, borderTopWidth: 3 }}
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">{stage.name}</h3>
                                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium dark:bg-slate-800">
                                        {stage.deals.length}
                                    </span>
                                </div>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {stage.probability}% probability
                                </p>
                            </div>
                            <div className="space-y-2 p-3">
                                {stage.deals.length === 0 ? (
                                    <p className="py-6 text-center text-xs text-slate-400">
                                        No deals
                                    </p>
                                ) : (
                                    stage.deals.map((deal) => (
                                        <div
                                            key={deal.id}
                                            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                                        >
                                            <div className="font-medium">{deal.title}</div>
                                            {deal.lead && (
                                                <Link
                                                    href={route('leads.show', deal.lead.id)}
                                                    className="text-xs text-emerald-600 hover:underline"
                                                >
                                                    {deal.lead.name}
                                                </Link>
                                            )}
                                            <div className="mt-1 text-xs text-slate-500">
                                                {formatValue(deal.value, deal.currency)}
                                                {deal.assignee && ` · ${deal.assignee}`}
                                            </div>
                                            <select
                                                className="mt-2 w-full rounded-lg border-slate-200 text-xs dark:border-slate-700 dark:bg-slate-800"
                                                value={stage.id}
                                                onChange={(e) =>
                                                    moveDeal(deal.id, Number(e.target.value))
                                                }
                                            >
                                                {stages.map((s) => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name}
                                                        {s.id === stage.id ? ' (current)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </CrmLayout>
    );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    );
}
