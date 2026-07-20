import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import CrmLayout from '@/Layouts/CrmLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

type FollowUpRow = {
    id: number;
    title: string;
    description: string | null;
    status: string;
    due_at: string | null;
    completed_at: string | null;
    lead: { id: number; name: string } | null;
    task_type: { id: number; name: string; color: string } | null;
    assignee: string | null;
    is_overdue: boolean;
};

type Option = { id: number; name: string; color?: string };

const FILTERS = [
    { key: 'pending', label: 'Pending' },
    { key: 'today', label: 'Due today' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'completed', label: 'Completed' },
];

export default function TasksIndex({
    followUps,
    filter,
    leads,
    taskTypes,
    stats,
}: {
    followUps: { data: FollowUpRow[] };
    filter: string;
    leads: Option[];
    taskTypes: Option[];
    team: Option[];
    stats: { pending: number; due_today: number; overdue: number };
}) {
    const flash = (usePage().props as { flash?: { success?: string } }).flash;
    const [showForm, setShowForm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        lead_id: '' as string | number,
        task_type_id: '' as string | number,
        due_at: '',
    });

    const fieldClass =
        'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('tasks.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const complete = (id: number) => {
        router.post(route('tasks.complete', id), {}, { preserveScroll: true });
    };

    return (
        <CrmLayout title="Tasks">
            <Head title="Tasks & Follow-ups" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {flash.success}
                </div>
            )}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">Tasks & Follow-ups</h2>
                    <p className="text-sm text-slate-500">
                        Calls, meetings, reminders & scheduled follow-ups
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowForm(!showForm)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                    {showForm ? 'Close' : '+ Schedule follow-up'}
                </button>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <StatCard label="Pending" value={stats.pending} />
                <StatCard label="Due today" value={stats.due_today} />
                <StatCard label="Overdue" value={stats.overdue} />
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                    <Link
                        key={f.key}
                        href={route('tasks.index', { filter: f.key })}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                            filter === f.key
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                    >
                        {f.label}
                    </Link>
                ))}
            </div>

            {showForm && (
                <form
                    onSubmit={submit}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                    <h3 className="font-semibold">New follow-up</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="title" value="Title *" />
                            <TextInput
                                id="title"
                                value={data.title}
                                className={fieldClass}
                                onChange={(e) => setData('title', e.target.value)}
                                required
                            />
                            <InputError message={errors.title} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="lead_id" value="Lead" />
                            <select
                                id="lead_id"
                                className={fieldClass}
                                value={data.lead_id}
                                onChange={(e) => setData('lead_id', e.target.value)}
                            >
                                <option value="">No lead linked</option>
                                {leads.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="task_type_id" value="Type" />
                            <select
                                id="task_type_id"
                                className={fieldClass}
                                value={data.task_type_id}
                                onChange={(e) => setData('task_type_id', e.target.value)}
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
                            <InputLabel htmlFor="due_at" value="Due date & time" />
                            <TextInput
                                id="due_at"
                                type="datetime-local"
                                value={data.due_at}
                                className={fieldClass}
                                onChange={(e) => setData('due_at', e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
                    >
                        Save follow-up
                    </button>
                </form>
            )}

            <div className="space-y-2">
                {followUps.data.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
                        No follow-ups in this view.
                    </div>
                ) : (
                    followUps.data.map((f) => (
                        <div
                            key={f.id}
                            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 dark:bg-slate-900 ${
                                f.is_overdue
                                    ? 'border-rose-300 dark:border-rose-900'
                                    : 'border-slate-200 dark:border-slate-800'
                            }`}
                        >
                            <div>
                                <div className="font-medium">{f.title}</div>
                                <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-slate-500">
                                    {f.task_type && (
                                        <span
                                            className="rounded-full px-2 py-0.5"
                                            style={{
                                                backgroundColor: `${f.task_type.color}22`,
                                                color: f.task_type.color,
                                            }}
                                        >
                                            {f.task_type.name}
                                        </span>
                                    )}
                                    {f.lead && (
                                        <Link
                                            href={route('leads.show', f.lead.id)}
                                            className="text-emerald-600 hover:underline"
                                        >
                                            {f.lead.name}
                                        </Link>
                                    )}
                                    {f.due_at && (
                                        <span>
                                            Due{' '}
                                            {new Date(f.due_at).toLocaleString()}
                                        </span>
                                    )}
                                    {f.assignee && <span>· {f.assignee}</span>}
                                </div>
                            </div>
                            {f.status === 'pending' && (
                                <button
                                    type="button"
                                    onClick={() => complete(f.id)}
                                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                                >
                                    Complete
                                </button>
                            )}
                            {f.status === 'completed' && (
                                <span className="text-xs font-medium text-emerald-600">
                                    Completed
                                </span>
                            )}
                        </div>
                    ))
                )}
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
