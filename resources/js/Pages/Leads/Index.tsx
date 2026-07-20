import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import CrmLayout from '@/Layouts/CrmLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

type LeadRow = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    temperature: string;
    status: { name: string; color: string } | null;
    source: string | null;
    assignee: string | null;
    next_follow_up_at: string | null;
    created_at: string | null;
};

type Option = { id: number; name: string; color?: string };

export default function LeadsIndex({
    leads,
    statuses,
    sources,
    team,
    stats,
}: {
    leads: { data: LeadRow[] };
    statuses: Option[];
    sources: Option[];
    team: Option[];
    stats: { total: number; hot: number; due_today: number };
}) {
    const flash = (usePage().props as { flash?: { success?: string } }).flash;
    const [showForm, setShowForm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        lead_status_id: '' as string | number,
        lead_source_id: '' as string | number,
        temperature: 'warm',
        next_follow_up_at: '',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('leads.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const fieldClass =
        'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

    const tempClass: Record<string, string> = {
        cold: 'bg-sky-100 text-sky-800',
        warm: 'bg-amber-100 text-amber-800',
        hot: 'bg-rose-100 text-rose-800',
    };

    return (
        <CrmLayout title="Leads">
            <Head title="Leads" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {flash.success}
                </div>
            )}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">Leads & Follow-ups</h2>
                    <p className="text-sm text-slate-500">
                        Qualified leads with status, temperature & follow-ups
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowForm(!showForm)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                    {showForm ? 'Close' : '+ Add lead'}
                </button>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <StatCard label="Total leads" value={stats.total} />
                <StatCard label="Hot leads" value={stats.hot} />
                <StatCard label="Follow-ups today" value={stats.due_today} />
            </div>

            {showForm && (
                <form
                    onSubmit={submit}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                    <h3 className="font-semibold">New lead</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="name" value="Name *" />
                            <TextInput
                                id="name"
                                value={data.name}
                                className={fieldClass}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="phone" value="Phone" />
                            <TextInput
                                id="phone"
                                value={data.phone}
                                className={fieldClass}
                                onChange={(e) => setData('phone', e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="lead_status_id" value="Status" />
                            <select
                                id="lead_status_id"
                                className={fieldClass}
                                value={data.lead_status_id}
                                onChange={(e) =>
                                    setData('lead_status_id', e.target.value)
                                }
                            >
                                <option value="">Default status</option>
                                {statuses.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="temperature" value="Temperature" />
                            <select
                                id="temperature"
                                className={fieldClass}
                                value={data.temperature}
                                onChange={(e) =>
                                    setData('temperature', e.target.value)
                                }
                            >
                                <option value="cold">Cold</option>
                                <option value="warm">Warm</option>
                                <option value="hot">Hot</option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
                    >
                        Save lead
                    </button>
                </form>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3">Lead</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Temp</th>
                            <th className="px-4 py-3">Source</th>
                            <th className="px-4 py-3">Assignee</th>
                            <th className="px-4 py-3">Next follow-up</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {leads.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                                    No leads yet. Convert an enquiry or add a lead.
                                </td>
                            </tr>
                        ) : (
                            leads.data.map((l) => (
                                <tr key={l.id}>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={route('leads.show', l.id)}
                                            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                                        >
                                            {l.name}
                                        </Link>
                                        <div className="text-xs text-slate-500">
                                            {l.phone || l.email || '—'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {l.status ? (
                                            <span
                                                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                                                style={{
                                                    backgroundColor: `${l.status.color}22`,
                                                    color: l.status.color,
                                                }}
                                            >
                                                {l.status.name}
                                            </span>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${tempClass[l.temperature] ?? ''}`}
                                        >
                                            {l.temperature}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{l.source || '—'}</td>
                                    <td className="px-4 py-3">{l.assignee || '—'}</td>
                                    <td className="px-4 py-3 text-slate-500">
                                        {l.next_follow_up_at
                                            ? new Date(
                                                  l.next_follow_up_at,
                                              ).toLocaleDateString()
                                            : '—'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </CrmLayout>
    );
}

function StatCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    );
}
