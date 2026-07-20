import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import CrmLayout from '@/Layouts/CrmLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

const ACTION_LABELS: Record<string, string> = {
    'enquiry.created': 'Enquiry created',
    'enquiry.converted': 'Converted to lead',
    'lead.created': 'Lead created',
    'lead.updated': 'Lead updated',
    'deal.created': 'Added to pipeline',
    'deal.updated': 'Deal updated',
    'deal.stage_changed': 'Pipeline stage changed',
    'follow_up.created': 'Follow-up scheduled',
    'follow_up.completed': 'Follow-up completed',
};

type LeadDetail = {
    id: number;
    uuid: string;
    name: string;
    email: string | null;
    phone: string | null;
    temperature: string;
    notes: string | null;
    next_follow_up_at: string | null;
    created_at: string | null;
    account_id: number | null;
    contact_id: number | null;
    status: { id: number; name: string; color: string } | null;
    source: { id: number; name: string } | null;
    assignee: { id: number; name: string } | null;
    enquiry: { id: number; name: string; status: string; created_at: string } | null;
    deal: {
        id: number;
        title: string;
        value: number;
        currency: string;
        stage: { id: number; name: string; color: string } | null;
    } | null;
    account: { id: number; name: string } | null;
    contact: { id: number; name: string; email: string | null; phone: string | null } | null;
};

type ContactOption = { id: number; name: string; account_id: number | null; email: string | null };

type FollowUpRow = {
    id: number;
    title: string;
    description: string | null;
    status: string;
    due_at: string | null;
    task_type: { id: number; name: string; color: string } | null;
    assignee: string | null;
    is_overdue: boolean;
};

type Activity = {
    id: number;
    action: string;
    user: string;
    properties: Record<string, unknown> | null;
    created_at: string;
};

type Option = { id: number; name: string; color?: string };

export default function LeadShow({
    lead,
    followUps,
    activities,
    statuses,
    taskTypes,
    accounts,
    contacts,
}: {
    lead: LeadDetail;
    followUps: FollowUpRow[];
    activities: Activity[];
    statuses: Option[];
    taskTypes: Option[];
    accounts: Option[];
    contacts: ContactOption[];
    team: Option[];
}) {
    const flash = (usePage().props as { flash?: { success?: string } }).flash;
    const [showFollowUp, setShowFollowUp] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        lead_id: lead.id,
        task_type_id: '' as string | number,
        due_at: '',
        redirect_lead: 1,
    });

    const { data: editData, setData: setEditData, patch, processing: editProcessing } = useForm({
        lead_status_id: lead.status?.id ?? '',
        temperature: lead.temperature,
        notes: lead.notes ?? '',
        account_id: (lead.account_id ?? '') as string | number,
        contact_id: (lead.contact_id ?? '') as string | number,
    });

    const filteredContacts = contacts.filter(
        (c) =>
            !editData.account_id ||
            !c.account_id ||
            String(c.account_id) === String(editData.account_id),
    );

    const fieldClass =
        'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

    const submitFollowUp: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('tasks.store'), {
            onSuccess: () => {
                reset('title', 'description', 'due_at');
                setShowFollowUp(false);
            },
        });
    };

    const saveLead: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('leads.update', lead.id));
    };

    const completeFollowUp = (id: number) => {
        router.post(route('tasks.complete', id), {}, { preserveScroll: true });
    };

    const tempClass: Record<string, string> = {
        cold: 'bg-sky-100 text-sky-800',
        warm: 'bg-amber-100 text-amber-800',
        hot: 'bg-rose-100 text-rose-800',
    };

    return (
        <CrmLayout title={lead.name}>
            <Head title={lead.name} />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {flash.success}
                </div>
            )}

            <div className="mb-4">
                <Link
                    href={route('leads.index')}
                    className="text-sm text-emerald-600 hover:underline"
                >
                    ← Back to leads
                </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h2 className="text-2xl font-bold">{lead.name}</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {lead.phone || lead.email || 'No contact info'}
                                </p>
                            </div>
                            <span
                                className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${tempClass[lead.temperature] ?? ''}`}
                            >
                                {lead.temperature}
                            </span>
                        </div>

                        <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                            <div>
                                <dt className="text-slate-500">Status</dt>
                                <dd className="font-medium">
                                    {lead.status?.name ?? '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Source</dt>
                                <dd className="font-medium">{lead.source?.name ?? '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Assignee</dt>
                                <dd className="font-medium">{lead.assignee?.name ?? '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Next follow-up</dt>
                                <dd className="font-medium">
                                    {lead.next_follow_up_at
                                        ? new Date(lead.next_follow_up_at).toLocaleString()
                                        : '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Company</dt>
                                <dd className="font-medium">
                                    {lead.account ? (
                                        <Link
                                            href={route('companies.show', lead.account.id)}
                                            className="text-emerald-600 hover:underline"
                                        >
                                            {lead.account.name}
                                        </Link>
                                    ) : (
                                        '—'
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Contact</dt>
                                <dd className="font-medium">{lead.contact?.name ?? '—'}</dd>
                            </div>
                        </dl>

                        {lead.deal && (
                            <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                                <div className="text-xs font-medium uppercase text-slate-500">
                                    Pipeline deal
                                </div>
                                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-semibold">{lead.deal.title}</span>
                                    <Link
                                        href={route('pipeline.index')}
                                        className="text-xs text-emerald-600 hover:underline"
                                    >
                                        {lead.deal.stage?.name ?? 'View pipeline'}
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    <form
                        onSubmit={saveLead}
                        className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                    >
                        <h3 className="font-semibold">Update lead</h3>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="lead_status_id" value="Status" />
                                <select
                                    id="lead_status_id"
                                    className={fieldClass}
                                    value={editData.lead_status_id}
                                    onChange={(e) =>
                                        setEditData('lead_status_id', e.target.value)
                                    }
                                >
                                    <option value="">—</option>
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
                                    value={editData.temperature}
                                    onChange={(e) =>
                                        setEditData('temperature', e.target.value)
                                    }
                                >
                                    <option value="cold">Cold</option>
                                    <option value="warm">Warm</option>
                                    <option value="hot">Hot</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="notes" value="Notes" />
                                <textarea
                                    id="notes"
                                    rows={3}
                                    className={fieldClass}
                                    value={editData.notes}
                                    onChange={(e) => setEditData('notes', e.target.value)}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="account_id" value="Link company" />
                                <select
                                    id="account_id"
                                    className={fieldClass}
                                    value={editData.account_id}
                                    onChange={(e) => {
                                        setEditData('account_id', e.target.value);
                                        setEditData('contact_id', '');
                                    }}
                                >
                                    <option value="">— None —</option>
                                    {accounts.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <InputLabel htmlFor="contact_id" value="Link contact" />
                                <select
                                    id="contact_id"
                                    className={fieldClass}
                                    value={editData.contact_id}
                                    onChange={(e) => setEditData('contact_id', e.target.value)}
                                >
                                    <option value="">— None —</option>
                                    {filteredContacts.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                            {c.email ? ` (${c.email})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={editProcessing}
                            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-emerald-600"
                        >
                            Save changes
                        </button>
                    </form>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Follow-ups</h3>
                            <button
                                type="button"
                                onClick={() => setShowFollowUp(!showFollowUp)}
                                className="text-sm font-semibold text-emerald-600"
                            >
                                {showFollowUp ? 'Cancel' : '+ Schedule'}
                            </button>
                        </div>

                        {showFollowUp && (
                            <form onSubmit={submitFollowUp} className="mt-4 space-y-3">
                                <div>
                                    <InputLabel htmlFor="fu_title" value="Title *" />
                                    <TextInput
                                        id="fu_title"
                                        value={data.title}
                                        className={fieldClass}
                                        onChange={(e) => setData('title', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.title} />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="fu_type" value="Type" />
                                        <select
                                            id="fu_type"
                                            className={fieldClass}
                                            value={data.task_type_id}
                                            onChange={(e) =>
                                                setData('task_type_id', e.target.value)
                                            }
                                        >
                                            <option value="">Default</option>
                                            {taskTypes.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="fu_due" value="Due" />
                                        <TextInput
                                            id="fu_due"
                                            type="datetime-local"
                                            className={fieldClass}
                                            value={data.due_at}
                                            onChange={(e) =>
                                                setData('due_at', e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                                >
                                    Schedule
                                </button>
                            </form>
                        )}

                        <ul className="mt-4 space-y-2">
                            {followUps.length === 0 ? (
                                <li className="text-sm text-slate-500">No follow-ups yet</li>
                            ) : (
                                followUps.map((f) => (
                                    <li
                                        key={f.id}
                                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                                            f.is_overdue
                                                ? 'bg-rose-50 dark:bg-rose-950/30'
                                                : 'bg-slate-50 dark:bg-slate-800/60'
                                        }`}
                                    >
                                        <div>
                                            <div className="font-medium">{f.title}</div>
                                            {f.due_at && (
                                                <div className="text-xs text-slate-500">
                                                    Due {new Date(f.due_at).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                        {f.status === 'pending' ? (
                                            <button
                                                type="button"
                                                onClick={() => completeFollowUp(f.id)}
                                                className="text-xs font-semibold text-emerald-600"
                                            >
                                                Complete
                                            </button>
                                        ) : (
                                            <span className="text-xs text-slate-500">Done</span>
                                        )}
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-semibold">Activity timeline</h3>
                    <ul className="mt-4 space-y-4">
                        {activities.length === 0 ? (
                            <li className="text-sm text-slate-500">No activity yet</li>
                        ) : (
                            activities.map((a) => (
                                <li key={a.id} className="relative border-l-2 border-slate-200 pl-4 dark:border-slate-700">
                                    <div className="text-sm font-medium">
                                        {ACTION_LABELS[a.action] ?? a.action}
                                    </div>
                                    {a.action === 'deal.stage_changed' &&
                                    a.properties?.stage_name ? (
                                        <div className="text-xs text-slate-500">
                                            Moved to {String(a.properties.stage_name)}
                                        </div>
                                    ) : null}
                                    <div className="text-xs text-slate-500">
                                        {a.user} · {a.created_at}
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </CrmLayout>
    );
}
