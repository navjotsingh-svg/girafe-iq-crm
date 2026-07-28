import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import CrmLayout from '@/Layouts/CrmLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type FollowUpItem = {
    id: number;
    title: string;
    description: string | null;
    status: string;
    due_at: string | null;
    completed_at: string | null;
    task_type: { id: number; name: string; slug: string; color: string } | null;
    assignee: string | null;
    is_overdue: boolean;
};

type Enquiry = {
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
    lead_name: string | null;
    created_at: string | null;
};

const statusLabel: Record<string, string> = {
    new: 'New',
    in_progress: 'In progress',
    converted: 'Converted',
    junk: 'Junk',
};

export default function EnquiryShow({
    enquiry,
    notes,
    followUps,
    team,
}: {
    enquiry: Enquiry;
    notes: FollowUpItem[];
    followUps: FollowUpItem[];
    team: { id: number; name: string }[];
}) {
    const { flash } = usePage().props as { flash?: { success?: string } };

    const noteForm = useForm({
        kind: 'note' as 'note' | 'call',
        description: '',
        outcome: '',
        duration_minutes: '',
    });

    const followForm = useForm({
        title: `Follow up with ${enquiry.name}`,
        description: '',
        due_at: '',
        assigned_user_id: '',
    });

    const submitNote: FormEventHandler = (e) => {
        e.preventDefault();
        noteForm.post(route('enquiries.log', enquiry.id), {
            preserveScroll: true,
            onSuccess: () => noteForm.reset('description', 'outcome', 'duration_minutes'),
        });
    };

    const submitFollowUp: FormEventHandler = (e) => {
        e.preventDefault();
        followForm.post(route('enquiries.follow-ups.store', enquiry.id), {
            preserveScroll: true,
            onSuccess: () => followForm.reset('description', 'due_at'),
        });
    };

    return (
        <CrmLayout>
            <Head title={enquiry.name} />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {flash.success}
                </div>
            )}

            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <Link
                        href={route('enquiries.index')}
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                    >
                        ← Enquiries
                    </Link>
                    <h2 className="mt-1 text-2xl font-bold">{enquiry.name}</h2>
                    <p className="text-sm text-slate-500">
                        {enquiry.phone || enquiry.email || 'No contact'} ·{' '}
                        {statusLabel[enquiry.status] ?? enquiry.status}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {enquiry.status === 'converted' && enquiry.lead_id ? (
                        <Link
                            href={route('leads.show', enquiry.lead_id)}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                            View lead
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={() =>
                                router.post(route('enquiries.convert', enquiry.id))
                            }
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                            Convert to lead
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-1">
                    <h3 className="mb-3 font-semibold">Details</h3>
                    <dl className="space-y-2 text-sm">
                        <div>
                            <dt className="text-slate-500">Source</dt>
                            <dd>{enquiry.source || '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Channel</dt>
                            <dd>{enquiry.channel || '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Assignee</dt>
                            <dd>{enquiry.assignee || '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Captured</dt>
                            <dd>
                                {enquiry.created_at
                                    ? new Date(enquiry.created_at).toLocaleString()
                                    : '—'}
                            </dd>
                        </div>
                        {enquiry.message && (
                            <div>
                                <dt className="text-slate-500">Original message</dt>
                                <dd className="whitespace-pre-wrap">{enquiry.message}</dd>
                            </div>
                        )}
                    </dl>
                </div>

                <div className="space-y-4 lg:col-span-2">
                    <form
                        onSubmit={submitNote}
                        className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                    >
                        <h3 className="mb-3 font-semibold">Add comment / call</h3>
                        <div className="mb-3 flex gap-2">
                            {(['note', 'call'] as const).map((kind) => (
                                <button
                                    key={kind}
                                    type="button"
                                    onClick={() => noteForm.setData('kind', kind)}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
                                        noteForm.data.kind === kind
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                                    }`}
                                >
                                    {kind}
                                </button>
                            ))}
                        </div>
                        <InputLabel htmlFor="description" value={noteForm.data.kind === 'call' ? 'Call notes' : 'Comment'} />
                        <textarea
                            id="description"
                            className="mt-1 w-full rounded-xl border-slate-300 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800"
                            rows={3}
                            value={noteForm.data.description}
                            onChange={(e) => noteForm.setData('description', e.target.value)}
                        />
                        <InputError message={noteForm.errors.description} className="mt-1" />
                        {noteForm.data.kind === 'call' && (
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="outcome" value="Outcome" />
                                    <TextInput
                                        id="outcome"
                                        className="mt-1 block w-full"
                                        value={noteForm.data.outcome}
                                        onChange={(e) =>
                                            noteForm.setData('outcome', e.target.value)
                                        }
                                    />
                                </div>
                                <div>
                                    <InputLabel htmlFor="duration" value="Duration (min)" />
                                    <TextInput
                                        id="duration"
                                        type="number"
                                        className="mt-1 block w-full"
                                        value={noteForm.data.duration_minutes}
                                        onChange={(e) =>
                                            noteForm.setData('duration_minutes', e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={noteForm.processing}
                            className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            Save
                        </button>
                    </form>

                    <form
                        onSubmit={submitFollowUp}
                        className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                    >
                        <h3 className="mb-3 font-semibold">Schedule follow-up</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="title" value="Title" />
                                <TextInput
                                    id="title"
                                    className="mt-1 block w-full"
                                    value={followForm.data.title}
                                    onChange={(e) => followForm.setData('title', e.target.value)}
                                />
                                <InputError message={followForm.errors.title} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="due_at" value="Due at" />
                                <TextInput
                                    id="due_at"
                                    type="datetime-local"
                                    className="mt-1 block w-full"
                                    value={followForm.data.due_at}
                                    onChange={(e) => followForm.setData('due_at', e.target.value)}
                                />
                                <InputError message={followForm.errors.due_at} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="assigned_user_id" value="Assign to" />
                                <select
                                    id="assigned_user_id"
                                    className="mt-1 w-full rounded-xl border-slate-300 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800"
                                    value={followForm.data.assigned_user_id}
                                    onChange={(e) =>
                                        followForm.setData('assigned_user_id', e.target.value)
                                    }
                                >
                                    <option value="">Default assignee</option>
                                    {team.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="fu_description" value="Notes" />
                                <textarea
                                    id="fu_description"
                                    className="mt-1 w-full rounded-xl border-slate-300 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800"
                                    rows={2}
                                    value={followForm.data.description}
                                    onChange={(e) =>
                                        followForm.setData('description', e.target.value)
                                    }
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={followForm.processing}
                            className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            Schedule
                        </button>
                    </form>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="mb-3 font-semibold">Pending follow-ups</h3>
                    {followUps.length === 0 ? (
                        <p className="text-sm text-slate-500">No follow-ups scheduled.</p>
                    ) : (
                        <ul className="space-y-3">
                            {followUps.map((f) => (
                                <li
                                    key={f.id}
                                    className="rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-800"
                                >
                                    <div className="font-medium">{f.title}</div>
                                    <div className="text-xs text-slate-500">
                                        {f.due_at
                                            ? new Date(f.due_at).toLocaleString()
                                            : 'No due date'}
                                        {f.is_overdue ? ' · Overdue' : ''}
                                        {f.assignee ? ` · ${f.assignee}` : ''}
                                    </div>
                                    {f.description && (
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                            {f.description}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="mb-3 font-semibold">Comments & calls</h3>
                    {notes.length === 0 ? (
                        <p className="text-sm text-slate-500">No comments yet.</p>
                    ) : (
                        <ul className="space-y-3">
                            {notes.map((n) => (
                                <li
                                    key={n.id}
                                    className="rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-800"
                                >
                                    <div className="font-medium">{n.title}</div>
                                    <div className="text-xs text-slate-500">
                                        {n.completed_at
                                            ? new Date(n.completed_at).toLocaleString()
                                            : ''}
                                        {n.assignee ? ` · ${n.assignee}` : ''}
                                    </div>
                                    {n.description && (
                                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                                            {n.description}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </CrmLayout>
    );
}
