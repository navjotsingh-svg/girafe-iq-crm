import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import CrmLayout from '@/Layouts/CrmLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

type EnquiryRow = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
    channel: string | null;
    message: string | null;
    source: string | null;
    assignee: string | null;
    lead_id: number | null;
    created_at: string | null;
};

type Option = { id: number; name: string };

const statusLabel: Record<string, string> = {
    new: 'New',
    in_progress: 'In progress',
    converted: 'Converted',
    junk: 'Junk',
};

const statusClass: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
    in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
    converted: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    junk: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export default function EnquiriesIndex({
    enquiries,
    sources,
    team,
    stats,
    openCreate,
    roundRobinEnabled = false,
}: {
    enquiries: { data: EnquiryRow[]; links: unknown[] };
    sources: Option[];
    team: Option[];
    stats: { new: number; in_progress: number; converted: number };
    openCreate?: boolean;
    roundRobinEnabled?: boolean;
}) {
    const flash = (usePage().props as { flash?: { success?: string } }).flash;
    const [showForm, setShowForm] = useState(!!openCreate);

    useEffect(() => {
        if (openCreate) setShowForm(true);
    }, [openCreate]);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        lead_source_id: '' as string | number,
        channel: '',
        message: '',
        assigned_user_id: '' as string | number,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('enquiries.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const convert = (id: number) => {
        router.post(route('enquiries.convert', id));
    };

    const fieldClass =
        'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

    return (
        <CrmLayout title="Enquiries">
            <Head title="Enquiries" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {flash.success}
                </div>
            )}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">Marketing Enquiries</h2>
                    <p className="text-sm text-slate-500">
                        Capture walk-ins, calls, ads & website leads
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowForm(!showForm)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                    {showForm ? 'Close form' : '+ Add enquiry'}
                </button>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <StatCard label="New" value={stats.new} />
                <StatCard label="In progress" value={stats.in_progress} />
                <StatCard label="Converted" value={stats.converted} />
            </div>

            {showForm && (
                <form
                    onSubmit={submit}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                    <h3 className="font-semibold">Add first enquiry</h3>
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
                            <InputLabel htmlFor="email" value="Email" />
                            <TextInput
                                id="email"
                                type="email"
                                value={data.email}
                                className={fieldClass}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="lead_source_id" value="Source" />
                            <select
                                id="lead_source_id"
                                className={fieldClass}
                                value={data.lead_source_id}
                                onChange={(e) =>
                                    setData('lead_source_id', e.target.value)
                                }
                            >
                                <option value="">Select source</option>
                                {sources.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="channel" value="Channel" />
                            <TextInput
                                id="channel"
                                placeholder="Walk-in, Phone, Website…"
                                value={data.channel}
                                className={fieldClass}
                                onChange={(e) => setData('channel', e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="assigned_user_id" value="Assign to" />
                            <select
                                id="assigned_user_id"
                                className={fieldClass}
                                value={data.assigned_user_id}
                                onChange={(e) =>
                                    setData('assigned_user_id', e.target.value)
                                }
                            >
                                <option value="">
                                    {roundRobinEnabled
                                        ? 'Auto (round robin)'
                                        : 'Auto assign me'}
                                </option>
                                {team.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="message" value="Message / Notes" />
                            <textarea
                                id="message"
                                rows={3}
                                className={fieldClass}
                                value={data.message}
                                onChange={(e) => setData('message', e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        Save enquiry
                    </button>
                </form>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Contact</th>
                            <th className="px-4 py-3">Source</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Assignee</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {enquiries.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                                    No enquiries yet. Add your first enquiry above.
                                </td>
                            </tr>
                        ) : (
                            enquiries.data.map((e) => (
                                <tr key={e.id}>
                                    <td className="px-4 py-3 font-medium">{e.name}</td>
                                    <td className="px-4 py-3 text-slate-500">
                                        {e.phone || e.email || '—'}
                                    </td>
                                    <td className="px-4 py-3">{e.source || '—'}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass[e.status] ?? ''}`}
                                        >
                                            {statusLabel[e.status] ?? e.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{e.assignee || '—'}</td>
                                    <td className="px-4 py-3 text-right">
                                        {e.status === 'converted' ? (
                                            <Link
                                                href={route('leads.index')}
                                                className="text-xs font-semibold text-emerald-600"
                                            >
                                                View leads
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => convert(e.id)}
                                                className="text-xs font-semibold text-emerald-600 hover:text-emerald-500"
                                            >
                                                Convert to lead
                                            </button>
                                        )}
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
