import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import CrmLayout from '@/Layouts/CrmLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

type Rule = {
    id: number;
    name: string;
    trigger: string;
    action: string;
    config: Record<string, unknown> | null;
    is_active: boolean;
    runs_count: number;
    last_run_at: string | null;
};

type Option = { value: string; label: string };

const fieldClass =
    'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

export default function AutomationIndex({
    rules,
    triggers,
    actions,
    sources,
    stats,
}: {
    rules: Rule[];
    triggers: Option[];
    actions: Option[];
    sources: { id: number; name: string }[];
    stats: { total: number; active: number; runs: number };
}) {
    const flash = (usePage().props as { flash?: { success?: string } }).flash;
    const [showForm, setShowForm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        trigger: 'enquiry.created',
        action: 'create_follow_up',
        due_in_hours: 24,
        title: '',
        subject: '',
        body: 'Hello {{name}}, thanks for connecting with us!',
        temperature: 'hot',
        is_active: true,
        require_email: false,
        require_phone: false,
        condition_temperature: '',
        condition_source_id: '' as string | number,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('automation.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const labelFor = (list: Option[], value: string) =>
        list.find((o) => o.value === value)?.label ?? value;

    return (
        <CrmLayout title="Automation">
            <Head title="Automation" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {flash.success}
                </div>
            )}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">Automation</h2>
                    <p className="text-sm text-slate-500">
                        Trigger → action rules for enquiries, leads & deals
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowForm(!showForm)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                    {showForm ? 'Close' : '+ New rule'}
                </button>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <StatCard label="Rules" value={stats.total} />
                <StatCard label="Active" value={stats.active} />
                <StatCard label="Total runs" value={stats.runs} />
            </div>

            {showForm && (
                <form
                    onSubmit={submit}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                    <h3 className="font-semibold">New automation rule</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="name" value="Rule name *" />
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
                            <InputLabel htmlFor="trigger" value="When (trigger)" />
                            <select
                                id="trigger"
                                className={fieldClass}
                                value={data.trigger}
                                onChange={(e) => setData('trigger', e.target.value)}
                            >
                                {triggers.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="action" value="Then (action)" />
                            <select
                                id="action"
                                className={fieldClass}
                                value={data.action}
                                onChange={(e) => setData('action', e.target.value)}
                            >
                                {actions.map((a) => (
                                    <option key={a.value} value={a.value}>
                                        {a.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {data.action === 'create_follow_up' && (
                            <>
                                <div>
                                    <InputLabel htmlFor="due_in_hours" value="Due in (hours)" />
                                    <TextInput
                                        id="due_in_hours"
                                        type="number"
                                        value={data.due_in_hours}
                                        className={fieldClass}
                                        onChange={(e) =>
                                            setData('due_in_hours', Number(e.target.value))
                                        }
                                    />
                                </div>
                                <div>
                                    <InputLabel htmlFor="title" value="Follow-up title" />
                                    <TextInput
                                        id="title"
                                        value={data.title}
                                        className={fieldClass}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="Optional"
                                    />
                                </div>
                            </>
                        )}

                        {(data.action === 'send_email' || data.action === 'send_whatsapp') && (
                            <>
                                {data.action === 'send_email' && (
                                    <div className="sm:col-span-2">
                                        <InputLabel htmlFor="subject" value="Email subject" />
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
                                        rows={3}
                                        className={fieldClass}
                                        value={data.body}
                                        onChange={(e) => setData('body', e.target.value)}
                                    />
                                    <p className="mt-1 text-xs text-slate-500">
                                        Use {'{{name}}'} for the contact name
                                    </p>
                                </div>
                            </>
                        )}

                        {data.action === 'set_temperature' && (
                            <div>
                                <InputLabel htmlFor="temperature" value="Temperature" />
                                <select
                                    id="temperature"
                                    className={fieldClass}
                                    value={data.temperature}
                                    onChange={(e) => setData('temperature', e.target.value)}
                                >
                                    <option value="cold">Cold</option>
                                    <option value="warm">Warm</option>
                                    <option value="hot">Hot</option>
                                </select>
                            </div>
                        )}

                        <div className="sm:col-span-2 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                            <h4 className="text-sm font-semibold">Conditions (optional)</h4>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Rule only runs when these match
                            </p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={data.require_email}
                                        onChange={(e) =>
                                            setData('require_email', e.target.checked)
                                        }
                                    />
                                    Require email
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={data.require_phone}
                                        onChange={(e) =>
                                            setData('require_phone', e.target.checked)
                                        }
                                    />
                                    Require phone
                                </label>
                                <div>
                                    <InputLabel
                                        htmlFor="condition_temperature"
                                        value="Only if temperature"
                                    />
                                    <select
                                        id="condition_temperature"
                                        className={fieldClass}
                                        value={data.condition_temperature}
                                        onChange={(e) =>
                                            setData('condition_temperature', e.target.value)
                                        }
                                    >
                                        <option value="">Any</option>
                                        <option value="cold">Cold</option>
                                        <option value="warm">Warm</option>
                                        <option value="hot">Hot</option>
                                    </select>
                                </div>
                                <div>
                                    <InputLabel
                                        htmlFor="condition_source_id"
                                        value="Only if source"
                                    />
                                    <select
                                        id="condition_source_id"
                                        className={fieldClass}
                                        value={data.condition_source_id}
                                        onChange={(e) =>
                                            setData('condition_source_id', e.target.value)
                                        }
                                    >
                                        <option value="">Any</option>
                                        {sources.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
                    >
                        Save rule
                    </button>
                </form>
            )}

            <div className="space-y-2">
                {rules.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
                        No automation rules yet. Create one to auto-schedule follow-ups or send messages.
                    </div>
                ) : (
                    rules.map((r) => (
                        <div
                            key={r.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div>
                                <div className="font-medium">{r.name}</div>
                                <div className="mt-0.5 text-xs text-slate-500">
                                    When <strong>{labelFor(triggers, r.trigger)}</strong> →{' '}
                                    <strong>{labelFor(actions, r.action)}</strong>
                                    {' · '}
                                    {r.runs_count} runs
                                    {r.last_run_at && ` · last ${r.last_run_at}`}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.post(route('automation.toggle', r.id))
                                    }
                                    className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                                        r.is_active
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-slate-100 text-slate-600'
                                    }`}
                                >
                                    {r.is_active ? 'Active' : 'Off'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.delete(route('automation.destroy', r.id))
                                    }
                                    className="text-xs font-semibold text-rose-600"
                                >
                                    Delete
                                </button>
                            </div>
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
