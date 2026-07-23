import CustomFieldInputs, { CustomFieldDef } from '@/Components/CustomFieldInputs';
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
    'follow_up.logged': 'Call / note logged',
    'document.uploaded': 'Attachment uploaded',
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
    custom_fields: Record<string, string | boolean | number | null>;
    lead_status_id: number | null;
    lead_source_id: number | null;
    assigned_user_id: number | null;
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

type DocRow = {
    id: number;
    title: string;
    original_name: string;
    category: string | null;
    size: string;
    mime_type: string | null;
    created_at: string | null;
    download_url: string;
};

type Option = { id: number; name: string; color?: string };

export default function LeadShow({
    lead,
    followUps,
    documents = [],
    activities,
    statuses,
    sources = [],
    taskTypes,
    accounts,
    contacts,
    team = [],
    leadFields = [],
}: {
    lead: LeadDetail;
    followUps: FollowUpRow[];
    documents?: DocRow[];
    activities: Activity[];
    statuses: Option[];
    sources?: Option[];
    taskTypes: Option[];
    accounts: Option[];
    contacts: ContactOption[];
    team?: Option[];
    leadFields?: CustomFieldDef[];
}) {
    const flash = (usePage().props as { flash?: { success?: string } }).flash;
    const [showFollowUp, setShowFollowUp] = useState(false);
    const [logKind, setLogKind] = useState<'call' | 'note' | null>(null);
    const [showUpload, setShowUpload] = useState(false);

    const initialCustomFields = (): Record<string, string | boolean | number> => {
        const values: Record<string, string | boolean | number> = {};
        leadFields.forEach((f) => {
            const current = lead.custom_fields?.[f.key];
            if (f.type === 'boolean') {
                values[f.key] = Boolean(current);
            } else {
                values[f.key] = current == null ? '' : String(current);
            }
        });
        return values;
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        lead_id: lead.id,
        task_type_id: '' as string | number,
        due_at: '',
        redirect_lead: 1,
    });

    const {
        data: logData,
        setData: setLogData,
        post: postLog,
        processing: logProcessing,
        errors: logErrors,
        reset: resetLog,
    } = useForm({
        kind: 'call' as 'call' | 'note',
        title: '',
        description: '',
        outcome: '',
        duration_minutes: '' as string | number,
    });

    const {
        data: docData,
        setData: setDocData,
        post: postDoc,
        processing: docProcessing,
        errors: docErrors,
        reset: resetDoc,
    } = useForm({
        file: null as File | null,
        title: '',
        category: 'other',
        notes: '',
    });

    const { data: editData, setData: setEditData, patch, processing: editProcessing, errors: editErrors } = useForm({
        name: lead.name,
        email: lead.email ?? '',
        phone: lead.phone ?? '',
        lead_status_id: lead.status?.id ?? lead.lead_status_id ?? '',
        lead_source_id: lead.source?.id ?? lead.lead_source_id ?? '',
        temperature: lead.temperature,
        next_follow_up_at: lead.next_follow_up_at
            ? lead.next_follow_up_at.slice(0, 16)
            : '',
        notes: lead.notes ?? '',
        assigned_user_id: lead.assignee?.id ?? lead.assigned_user_id ?? '',
        account_id: (lead.account_id ?? '') as string | number,
        contact_id: (lead.contact_id ?? '') as string | number,
        custom_fields: initialCustomFields(),
    });

    const filteredContacts = contacts.filter(
        (c) =>
            !editData.account_id ||
            !c.account_id ||
            String(c.account_id) === String(editData.account_id),
    );

    const fieldClass =
        'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

    const openLog = (kind: 'call' | 'note') => {
        setLogKind(kind);
        setLogData({
            kind,
            title: '',
            description: '',
            outcome: '',
            duration_minutes: '',
        });
    };

    const submitLog: FormEventHandler = (e) => {
        e.preventDefault();
        postLog(route('leads.log', lead.id), {
            onSuccess: () => {
                resetLog();
                setLogKind(null);
            },
        });
    };

    const submitDoc: FormEventHandler = (e) => {
        e.preventDefault();
        postDoc(route('leads.documents.store', lead.id), {
            forceFormData: true,
            onSuccess: () => {
                resetDoc();
                setShowUpload(false);
            },
        });
    };

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
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${tempClass[lead.temperature] ?? ''}`}
                                >
                                    {lead.temperature}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        document
                                            .getElementById('edit-lead-form')
                                            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }}
                                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                                >
                                    Edit lead
                                </button>
                            </div>
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
                            {leadFields.map((field) => {
                                const raw = lead.custom_fields?.[field.key];
                                const display =
                                    field.type === 'boolean'
                                        ? raw
                                            ? 'Yes'
                                            : 'No'
                                        : raw == null || raw === ''
                                          ? '—'
                                          : String(raw);
                                return (
                                    <div key={field.id}>
                                        <dt className="text-slate-500">{field.name}</dt>
                                        <dd className="font-medium">{display}</dd>
                                    </div>
                                );
                            })}
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
                        id="edit-lead-form"
                        onSubmit={saveLead}
                        className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h3 className="font-semibold">Edit lead</h3>
                                <p className="text-xs text-slate-500">
                                    Name, contact, status, source, assignee & custom fields
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="edit_name" value="Name *" />
                                <TextInput
                                    id="edit_name"
                                    className={fieldClass}
                                    value={editData.name}
                                    required
                                    onChange={(e) => setEditData('name', e.target.value)}
                                />
                                <InputError message={editErrors.name} />
                            </div>
                            <div>
                                <InputLabel htmlFor="edit_phone" value="Mobile *" />
                                <TextInput
                                    id="edit_phone"
                                    className={fieldClass}
                                    value={editData.phone}
                                    required
                                    onChange={(e) => setEditData('phone', e.target.value)}
                                    placeholder="Mobile number"
                                />
                                <InputError message={editErrors.phone} />
                            </div>
                            <div>
                                <InputLabel htmlFor="edit_email" value="Email" />
                                <TextInput
                                    id="edit_email"
                                    type="email"
                                    className={fieldClass}
                                    value={editData.email}
                                    onChange={(e) => setEditData('email', e.target.value)}
                                />
                                <InputError message={editErrors.email} />
                            </div>
                            <div>
                                <InputLabel htmlFor="lead_source_id" value="Source" />
                                <select
                                    id="lead_source_id"
                                    className={fieldClass}
                                    value={editData.lead_source_id}
                                    onChange={(e) =>
                                        setEditData('lead_source_id', e.target.value)
                                    }
                                >
                                    <option value="">—</option>
                                    {sources.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
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
                            <div>
                                <InputLabel htmlFor="assigned_user_id" value="Assign to" />
                                <select
                                    id="assigned_user_id"
                                    className={fieldClass}
                                    value={editData.assigned_user_id}
                                    onChange={(e) =>
                                        setEditData('assigned_user_id', e.target.value)
                                    }
                                >
                                    <option value="">Unassigned</option>
                                    {team.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <InputLabel htmlFor="next_follow_up_at" value="Next follow-up" />
                                <TextInput
                                    id="next_follow_up_at"
                                    type="datetime-local"
                                    className={fieldClass}
                                    value={editData.next_follow_up_at}
                                    onChange={(e) =>
                                        setEditData('next_follow_up_at', e.target.value)
                                    }
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="notes" value="Summary notes" />
                                <textarea
                                    id="notes"
                                    rows={3}
                                    className={fieldClass}
                                    value={editData.notes}
                                    onChange={(e) => setEditData('notes', e.target.value)}
                                />
                            </div>
                            <CustomFieldInputs
                                fields={leadFields}
                                values={editData.custom_fields}
                                fieldClass={fieldClass}
                                onChange={(key, value) =>
                                    setEditData('custom_fields', {
                                        ...editData.custom_fields,
                                        [key]: value,
                                    })
                                }
                            />
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
                            className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
                        >
                            {editProcessing ? 'Saving…' : 'Save lead'}
                        </button>
                    </form>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h3 className="font-semibold">Call log, notes & attachments</h3>
                                <p className="text-xs text-slate-500">
                                    Log calls, add notes, and upload files on this lead
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => openLog('call')}
                                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                                >
                                    + Log call
                                </button>
                                <button
                                    type="button"
                                    onClick={() => openLog('note')}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold dark:border-slate-700"
                                >
                                    + Add note
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowUpload(!showUpload)}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold dark:border-slate-700"
                                >
                                    {showUpload ? 'Cancel upload' : '+ Attachment'}
                                </button>
                            </div>
                        </div>

                        {logKind && (
                            <form
                                onSubmit={submitLog}
                                className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40"
                            >
                                <h4 className="text-sm font-semibold">
                                    {logKind === 'call' ? 'Log call' : 'Add note'}
                                </h4>
                                {logKind === 'call' && (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="call_outcome" value="Outcome" />
                                            <select
                                                id="call_outcome"
                                                className={fieldClass}
                                                value={logData.outcome}
                                                onChange={(e) =>
                                                    setLogData('outcome', e.target.value)
                                                }
                                            >
                                                <option value="">Select…</option>
                                                <option value="Connected">Connected</option>
                                                <option value="No answer">No answer</option>
                                                <option value="Busy">Busy</option>
                                                <option value="Voicemail">Voicemail</option>
                                                <option value="Wrong number">Wrong number</option>
                                                <option value="Callback requested">
                                                    Callback requested
                                                </option>
                                            </select>
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="call_duration"
                                                value="Duration (minutes)"
                                            />
                                            <TextInput
                                                id="call_duration"
                                                type="number"
                                                min={1}
                                                className={fieldClass}
                                                value={logData.duration_minutes}
                                                onChange={(e) =>
                                                    setLogData(
                                                        'duration_minutes',
                                                        e.target.value
                                                            ? Number(e.target.value)
                                                            : '',
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <InputLabel
                                        htmlFor="log_description"
                                        value={logKind === 'call' ? 'Call notes *' : 'Note *'}
                                    />
                                    <textarea
                                        id="log_description"
                                        rows={3}
                                        className={fieldClass}
                                        value={logData.description}
                                        required
                                        onChange={(e) =>
                                            setLogData('description', e.target.value)
                                        }
                                        placeholder={
                                            logKind === 'call'
                                                ? 'What was discussed…'
                                                : 'Write your note…'
                                        }
                                    />
                                    <InputError message={logErrors.description} />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={logProcessing}
                                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                                    >
                                        {logKind === 'call' ? 'Save call log' : 'Save note'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLogKind(null)}
                                        className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {showUpload && (
                            <form
                                onSubmit={submitDoc}
                                className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40"
                            >
                                <h4 className="text-sm font-semibold">Upload attachment</h4>
                                <div>
                                    <InputLabel htmlFor="lead_file" value="File *" />
                                    <input
                                        id="lead_file"
                                        type="file"
                                        className={fieldClass}
                                        onChange={(e) =>
                                            setDocData(
                                                'file',
                                                e.target.files?.[0] ?? null,
                                            )
                                        }
                                        required
                                    />
                                    <InputError message={docErrors.file} />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="doc_title" value="Title" />
                                        <TextInput
                                            id="doc_title"
                                            className={fieldClass}
                                            value={docData.title}
                                            onChange={(e) =>
                                                setDocData('title', e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="doc_cat" value="Category" />
                                        <select
                                            id="doc_cat"
                                            className={fieldClass}
                                            value={docData.category}
                                            onChange={(e) =>
                                                setDocData('category', e.target.value)
                                            }
                                        >
                                            <option value="other">Other</option>
                                            <option value="proposal">Proposal</option>
                                            <option value="contract">Contract</option>
                                            <option value="invoice">Invoice</option>
                                            <option value="id_proof">ID proof</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={docProcessing}
                                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                                >
                                    Upload
                                </button>
                            </form>
                        )}

                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <div>
                                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Recent calls & notes
                                </h4>
                                <ul className="space-y-2">
                                    {followUps.filter(
                                        (f) =>
                                            f.status === 'completed' &&
                                            ['call', 'note'].includes(
                                                f.task_type?.name?.toLowerCase() ?? '',
                                            ),
                                    ).length === 0 &&
                                    followUps.filter((f) => f.status === 'completed')
                                        .length === 0 ? (
                                        <li className="text-sm text-slate-500">
                                            No call logs or notes yet
                                        </li>
                                    ) : (
                                        followUps
                                            .filter((f) => f.status === 'completed')
                                            .slice(0, 8)
                                            .map((f) => (
                                                <li
                                                    key={f.id}
                                                    className="rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60"
                                                >
                                                    <div className="font-medium">
                                                        {f.task_type?.name
                                                            ? `${f.task_type.name}: `
                                                            : ''}
                                                        {f.title}
                                                    </div>
                                                    {f.description && (
                                                        <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-300">
                                                            {f.description}
                                                        </p>
                                                    )}
                                                    <div className="mt-1 text-[11px] text-slate-400">
                                                        {f.completed_at
                                                            ? new Date(
                                                                  f.completed_at,
                                                              ).toLocaleString()
                                                            : ''}
                                                    </div>
                                                </li>
                                            ))
                                    )}
                                </ul>
                            </div>
                            <div>
                                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Attachments
                                </h4>
                                <ul className="space-y-2">
                                    {documents.length === 0 ? (
                                        <li className="text-sm text-slate-500">
                                            No attachments yet
                                        </li>
                                    ) : (
                                        documents.map((d) => (
                                            <li
                                                key={d.id}
                                                className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60"
                                            >
                                                <div>
                                                    <div className="font-medium">{d.title}</div>
                                                    <div className="text-[11px] text-slate-400">
                                                        {d.original_name} · {d.size}
                                                    </div>
                                                </div>
                                                <a
                                                    href={d.download_url}
                                                    className="text-xs font-semibold text-emerald-600 hover:underline"
                                                >
                                                    Download
                                                </a>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>
                        </div>

                        {lead.notes && (
                            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm dark:border-amber-900 dark:bg-amber-950/30">
                                <div className="text-xs font-semibold uppercase text-amber-800 dark:text-amber-200">
                                    Summary notes
                                </div>
                                <p className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-200">
                                    {lead.notes}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    Edit summary notes in the Update lead section below.
                                </p>
                            </div>
                        )}
                    </div>

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
