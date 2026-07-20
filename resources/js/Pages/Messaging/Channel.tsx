import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import CrmLayout from '@/Layouts/CrmLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

type Template = {
    id: number;
    name: string;
    subject: string | null;
    body: string;
};

type Message = {
    id: number;
    to_name: string | null;
    to_address: string;
    subject: string | null;
    body: string;
    status: string;
    sent_at: string | null;
};

type Lead = { id: number; name: string; email: string | null; phone: string | null };

const fieldClass =
    'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

export default function MessagingChannel({
    channel,
    title,
    templates,
    messages,
    leads,
    stats,
}: {
    channel: 'email' | 'whatsapp';
    title: string;
    templates: Template[];
    messages: Message[];
    leads: Lead[];
    stats: { templates: number; sent: number };
}) {
    const flash = (usePage().props as { flash?: { success?: string } }).flash;
    const [tab, setTab] = useState<'compose' | 'templates' | 'log'>('compose');

    const storeRoute =
        channel === 'whatsapp' ? 'whatsapp.templates.store' : 'email.templates.store';
    const sendRoute = channel === 'whatsapp' ? 'whatsapp.send' : 'email.send';
    const destroyRoute =
        channel === 'whatsapp' ? 'whatsapp.templates.destroy' : 'email.templates.destroy';

    const templateForm = useForm({
        name: '',
        subject: '',
        body: 'Hello {{name}}, ',
    });

    const sendForm = useForm({
        to_name: '',
        to_address: '',
        subject: '',
        body: '',
        template_id: '' as string | number,
        lead_id: '' as string | number,
    });

    const saveTemplate: FormEventHandler = (e) => {
        e.preventDefault();
        templateForm.post(route(storeRoute), {
            onSuccess: () => templateForm.reset(),
        });
    };

    const sendMessage: FormEventHandler = (e) => {
        e.preventDefault();
        sendForm.post(route(sendRoute), {
            onSuccess: () => sendForm.reset(),
        });
    };

    const applyTemplate = (id: string) => {
        sendForm.setData('template_id', id);
        const t = templates.find((x) => String(x.id) === id);
        if (t) {
            sendForm.setData('body', t.body);
            if (t.subject) sendForm.setData('subject', t.subject);
        }
    };

    const pickLead = (id: string) => {
        sendForm.setData('lead_id', id);
        const lead = leads.find((l) => String(l.id) === id);
        if (!lead) return;
        sendForm.setData('to_name', lead.name);
        sendForm.setData(
            'to_address',
            channel === 'email' ? lead.email ?? '' : lead.phone ?? '',
        );
    };

    return (
        <CrmLayout title={title}>
            <Head title={title} />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {flash.success}
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="text-sm text-slate-500">
                    Templates & outbound log · demo mode (messages are logged as sent)
                </p>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <StatCard label="Templates" value={stats.templates} />
                <StatCard label="Messages sent" value={stats.sent} />
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                {(['compose', 'templates', 'log'] as const).map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
                            tab === t
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {tab === 'compose' && (
                <form
                    onSubmit={sendMessage}
                    className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                    <h3 className="font-semibold">Compose {title} message</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="lead_id" value="Lead (optional)" />
                            <select
                                id="lead_id"
                                className={fieldClass}
                                value={sendForm.data.lead_id}
                                onChange={(e) => pickLead(e.target.value)}
                            >
                                <option value="">Select lead…</option>
                                {leads.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="template_id" value="Template" />
                            <select
                                id="template_id"
                                className={fieldClass}
                                value={sendForm.data.template_id}
                                onChange={(e) => applyTemplate(e.target.value)}
                            >
                                <option value="">None</option>
                                {templates.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="to_name" value="To name" />
                            <TextInput
                                id="to_name"
                                value={sendForm.data.to_name}
                                className={fieldClass}
                                onChange={(e) => sendForm.setData('to_name', e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="to_address"
                                value={channel === 'email' ? 'Email *' : 'Phone *'}
                            />
                            <TextInput
                                id="to_address"
                                value={sendForm.data.to_address}
                                className={fieldClass}
                                onChange={(e) =>
                                    sendForm.setData('to_address', e.target.value)
                                }
                                required
                            />
                            <InputError message={sendForm.errors.to_address} />
                        </div>
                        {channel === 'email' && (
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="subject" value="Subject *" />
                                <TextInput
                                    id="subject"
                                    value={sendForm.data.subject}
                                    className={fieldClass}
                                    onChange={(e) =>
                                        sendForm.setData('subject', e.target.value)
                                    }
                                    required
                                />
                            </div>
                        )}
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="body" value="Message *" />
                            <textarea
                                id="body"
                                rows={4}
                                className={fieldClass}
                                value={sendForm.data.body}
                                onChange={(e) => sendForm.setData('body', e.target.value)}
                                required
                            />
                            <InputError message={sendForm.errors.body} />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={sendForm.processing}
                        className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
                    >
                        Send {title}
                    </button>
                </form>
            )}

            {tab === 'templates' && (
                <div className="space-y-4">
                    <form
                        onSubmit={saveTemplate}
                        className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                    >
                        <h3 className="font-semibold">New template</h3>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="tname" value="Name *" />
                                <TextInput
                                    id="tname"
                                    value={templateForm.data.name}
                                    className={fieldClass}
                                    onChange={(e) =>
                                        templateForm.setData('name', e.target.value)
                                    }
                                    required
                                />
                            </div>
                            {channel === 'email' && (
                                <div>
                                    <InputLabel htmlFor="tsubject" value="Subject *" />
                                    <TextInput
                                        id="tsubject"
                                        value={templateForm.data.subject}
                                        className={fieldClass}
                                        onChange={(e) =>
                                            templateForm.setData('subject', e.target.value)
                                        }
                                        required
                                    />
                                </div>
                            )}
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="tbody" value="Body *" />
                                <textarea
                                    id="tbody"
                                    rows={3}
                                    className={fieldClass}
                                    value={templateForm.data.body}
                                    onChange={(e) =>
                                        templateForm.setData('body', e.target.value)
                                    }
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={templateForm.processing}
                            className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                            Save template
                        </button>
                    </form>

                    <div className="space-y-2">
                        {templates.length === 0 ? (
                            <p className="text-sm text-slate-500">No templates yet</p>
                        ) : (
                            templates.map((t) => (
                                <div
                                    key={t.id}
                                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <div>
                                        <div className="font-medium">{t.name}</div>
                                        {t.subject && (
                                            <div className="text-xs text-slate-500">
                                                {t.subject}
                                            </div>
                                        )}
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                            {t.body}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.delete(route(destroyRoute, t.id))
                                        }
                                        className="text-xs font-semibold text-rose-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {tab === 'log' && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3">To</th>
                                <th className="px-4 py-3">Message</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Sent</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {messages.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                        No messages yet
                                    </td>
                                </tr>
                            ) : (
                                messages.map((m) => (
                                    <tr key={m.id}>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">
                                                {m.to_name || '—'}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {m.to_address}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {m.subject && (
                                                <div className="text-xs font-medium">
                                                    {m.subject}
                                                </div>
                                            )}
                                            <div className="line-clamp-2 text-slate-600 dark:text-slate-300">
                                                {m.body}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 capitalize">{m.status}</td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {m.sent_at || '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
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
