import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import CrmLayout from '@/Layouts/CrmLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

type CampaignRow = {
    id: number;
    name: string;
    channel: string;
    status: string;
    audience: string;
    audience_count: number;
    sent_count: number;
    template: string | null;
    completed_at: string | null;
};

type Template = {
    id: number;
    name: string;
    channel: string;
    subject: string | null;
    body: string;
};

const fieldClass =
    'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

const statusClass: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    active: 'bg-blue-100 text-blue-800',
    paused: 'bg-amber-100 text-amber-800',
    completed: 'bg-emerald-100 text-emerald-800',
};

export default function CampaignsIndex({
    campaigns,
    templates,
    stats,
}: {
    campaigns: CampaignRow[];
    templates: Template[];
    stats: { total: number; completed: number; sent: number };
}) {
    const flash = (
        usePage().props as { flash?: { success?: string; error?: string } }
    ).flash;
    const [showForm, setShowForm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        channel: 'email',
        audience: 'all_leads',
        template_id: '' as string | number,
        subject: '',
        body: 'Hello {{name}}, ',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('campaigns.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const onTemplate = (id: string) => {
        setData('template_id', id);
        const t = templates.find((x) => String(x.id) === id);
        if (t) {
            setData('channel', t.channel);
            setData('body', t.body);
            if (t.subject) setData('subject', t.subject);
        }
    };

    const filteredTemplates = templates.filter((t) => t.channel === data.channel);

    return (
        <CrmLayout title="Campaigns">
            <Head title="Campaigns" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    {flash.error}
                </div>
            )}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">Campaigns</h2>
                    <p className="text-sm text-slate-500">
                        Bulk email / WhatsApp to leads or customers
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowForm(!showForm)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                    {showForm ? 'Close' : '+ New campaign'}
                </button>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <StatCard label="Campaigns" value={stats.total} />
                <StatCard label="Completed" value={stats.completed} />
                <StatCard label="Messages sent" value={stats.sent} />
            </div>

            {showForm && (
                <form
                    onSubmit={submit}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                    <h3 className="font-semibold">New campaign</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="name" value="Name *" />
                            <TextInput
                                id="name"
                                value={data.name}
                                className={fieldClass}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div>
                            <InputLabel htmlFor="channel" value="Channel" />
                            <select
                                id="channel"
                                className={fieldClass}
                                value={data.channel}
                                onChange={(e) => {
                                    setData('channel', e.target.value);
                                    setData('template_id', '');
                                }}
                            >
                                <option value="email">Email</option>
                                <option value="whatsapp">WhatsApp</option>
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="audience" value="Audience" />
                            <select
                                id="audience"
                                className={fieldClass}
                                value={data.audience}
                                onChange={(e) => setData('audience', e.target.value)}
                            >
                                <option value="all_leads">All leads</option>
                                <option value="hot_leads">Hot leads</option>
                                <option value="customers">Customers</option>
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="template_id" value="Template" />
                            <select
                                id="template_id"
                                className={fieldClass}
                                value={data.template_id}
                                onChange={(e) => onTemplate(e.target.value)}
                            >
                                <option value="">None</option>
                                {filteredTemplates.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {data.channel === 'email' && (
                            <div>
                                <InputLabel htmlFor="subject" value="Subject" />
                                <TextInput
                                    id="subject"
                                    value={data.subject}
                                    className={fieldClass}
                                    onChange={(e) => setData('subject', e.target.value)}
                                />
                            </div>
                        )}
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="body" value="Message body" />
                            <textarea
                                id="body"
                                rows={4}
                                className={fieldClass}
                                value={data.body}
                                onChange={(e) => setData('body', e.target.value)}
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                Use {'{{name}}'} for personalization
                            </p>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
                    >
                        Create draft
                    </button>
                </form>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3">Campaign</th>
                            <th className="px-4 py-3">Channel</th>
                            <th className="px-4 py-3">Audience</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Sent</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {campaigns.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                                    No campaigns yet. Create a draft then launch it.
                                </td>
                            </tr>
                        ) : (
                            campaigns.map((c) => (
                                <tr key={c.id}>
                                    <td className="px-4 py-3 font-medium">{c.name}</td>
                                    <td className="px-4 py-3 capitalize">{c.channel}</td>
                                    <td className="px-4 py-3">
                                        {c.audience.replace('_', ' ')}
                                        <span className="text-xs text-slate-500">
                                            {' '}
                                            ({c.audience_count})
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusClass[c.status] ?? ''}`}
                                        >
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{c.sent_count}</td>
                                    <td className="px-4 py-3 text-right">
                                        {c.status === 'draft' && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.post(
                                                        route('campaigns.launch', c.id),
                                                    )
                                                }
                                                className="text-xs font-semibold text-emerald-600"
                                            >
                                                Launch
                                            </button>
                                        )}
                                        {c.status === 'completed' && c.completed_at && (
                                            <span className="text-xs text-slate-500">
                                                {c.completed_at}
                                            </span>
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
