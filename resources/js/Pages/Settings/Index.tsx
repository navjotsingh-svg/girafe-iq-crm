import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import CrmLayout from '@/Layouts/CrmLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

type CompanyData = {
    name: string;
    email: string | null;
    phone: string | null;
    country: string | null;
    timezone: string | null;
    currency: string | null;
    industry_key: string | null;
};

type LeadField = {
    id: number;
    name: string;
    key: string;
    type: string;
    options: string[] | null;
    is_required: boolean;
    is_system: boolean;
    show_in_list: boolean;
};

type Stage = {
    id: number;
    name: string;
    color: string;
    probability: number;
    sort_order: number;
    is_won: boolean;
    is_lost: boolean;
    deals_count: number;
};

type MetaPageRow = {
    id: number;
    page_id: string;
    page_name: string | null;
    subscribed_leadgen: boolean;
    has_instagram: boolean;
};

type IntegrationCard = {
    key: string;
    name: string;
    description: string;
    docs: string;
    icon: string;
    auth: 'oauth' | 'webhook';
    enabled: boolean;
    webhook_url: string;
    webhook_secret: string | null;
    verify_token: string | null;
    has_access_token: boolean;
    connected_at: string | null;
    meta_pages?: MetaPageRow[];
    meta_configured?: boolean;
    connect_url?: string | null;
    disconnect_url?: string | null;
};

const TABS = [
    { key: 'company', label: 'Company' },
    { key: 'fields', label: 'Lead fields' },
    { key: 'assignment', label: 'Lead assignment' },
    { key: 'pipeline', label: 'Pipeline stages' },
    { key: 'providers', label: 'Providers' },
    { key: 'integrations', label: 'Integrations' },
];

const fieldClass =
    'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

export default function SettingsIndex({
    tab,
    company,
    industries,
    leadFields,
    pipeline,
    timezones,
    currencies,
    providers,
    integrations = [],
    leadAssignment,
    team = [],
}: {
    tab: string;
    company: CompanyData;
    industries: { key: string; name: string }[];
    leadFields: LeadField[];
    pipeline: { id: number; name: string; stages: Stage[] } | null;
    timezones: string[];
    currencies: string[];
    providers: {
        email: {
            driver: string;
            host: string;
            port: number;
            username: string;
            encryption: string;
            from_address: string;
            from_name: string;
            has_password: boolean;
        };
        whatsapp: {
            driver: string;
            phone_number_id: string;
            has_token: boolean;
        };
    };
    integrations?: IntegrationCard[];
    leadAssignment?: {
        enabled: boolean;
        mode: string;
        user_ids: number[];
        weights?: Record<number, number>;
        last_assigned_user_id: number | null;
        last_assigned_name: string | null;
    };
    team?: { id: number; name: string }[];
}) {
    const flash = (
        usePage().props as { flash?: { success?: string; error?: string } }
    ).flash;

    return (
        <CrmLayout title="Settings">
            <Head title="Settings" />

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

            <div className="mb-6">
                <h2 className="text-xl font-bold">Settings</h2>
                <p className="text-sm text-slate-500">
                    Company profile, lead fields, pipeline & lead integrations
                </p>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
                {TABS.map((t) => (
                    <Link
                        key={t.key}
                        href={
                            t.key === 'integrations'
                                ? route('integrations.index')
                                : route('settings.index', { tab: t.key })
                        }
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                            tab === t.key
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                    >
                        {t.label}
                    </Link>
                ))}
            </div>

            {tab === 'company' && (
                <CompanyTab
                    company={company}
                    industries={industries}
                    timezones={timezones}
                    currencies={currencies}
                />
            )}
            {tab === 'fields' && <FieldsTab fields={leadFields} />}
            {tab === 'assignment' && (
                <AssignmentTab
                    leadAssignment={
                        leadAssignment ?? {
                            enabled: false,
                            mode: 'all_active',
                            user_ids: [],
                            weights: {},
                            last_assigned_user_id: null,
                            last_assigned_name: null,
                        }
                    }
                    team={team}
                />
            )}
            {tab === 'pipeline' && <PipelineTab pipeline={pipeline} />}
            {tab === 'providers' && <ProvidersTab providers={providers} />}
            {tab === 'integrations' && <IntegrationsTab integrations={integrations} />}
        </CrmLayout>
    );
}

function CompanyTab({
    company,
    industries,
    timezones,
    currencies,
}: {
    company: CompanyData;
    industries: { key: string; name: string }[];
    timezones: string[];
    currencies: string[];
}) {
    const { data, setData, patch, processing, errors } = useForm({
        name: company.name,
        email: company.email ?? '',
        phone: company.phone ?? '',
        country: company.country ?? '',
        timezone: company.timezone ?? 'Asia/Kolkata',
        currency: company.currency ?? 'INR',
        industry_key: company.industry_key ?? 'custom',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('settings.company'));
    };

    return (
        <form
            onSubmit={submit}
            className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
            <h3 className="font-semibold">Company profile</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="name" value="Company name *" />
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
                    <InputLabel htmlFor="industry_key" value="Industry" />
                    <select
                        id="industry_key"
                        className={fieldClass}
                        value={data.industry_key}
                        onChange={(e) => setData('industry_key', e.target.value)}
                    >
                        {industries.map((i) => (
                            <option key={i.key} value={i.key}>
                                {i.name}
                            </option>
                        ))}
                    </select>
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
                    <InputLabel htmlFor="phone" value="Phone" />
                    <TextInput
                        id="phone"
                        value={data.phone}
                        className={fieldClass}
                        onChange={(e) => setData('phone', e.target.value)}
                    />
                </div>
                <div>
                    <InputLabel htmlFor="timezone" value="Timezone" />
                    <select
                        id="timezone"
                        className={fieldClass}
                        value={data.timezone}
                        onChange={(e) => setData('timezone', e.target.value)}
                    >
                        {timezones.map((tz) => (
                            <option key={tz} value={tz}>
                                {tz}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <InputLabel htmlFor="currency" value="Currency" />
                    <select
                        id="currency"
                        className={fieldClass}
                        value={data.currency}
                        onChange={(e) => setData('currency', e.target.value)}
                    >
                        {currencies.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <InputLabel htmlFor="country" value="Country" />
                    <TextInput
                        id="country"
                        value={data.country}
                        className={fieldClass}
                        onChange={(e) => setData('country', e.target.value)}
                    />
                </div>
            </div>
            <button
                type="submit"
                disabled={processing}
                className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
                Save company
            </button>
        </form>
    );
}

function AssignmentTab({
    leadAssignment,
    team,
}: {
    leadAssignment: {
        enabled: boolean;
        mode: string;
        user_ids: number[];
        weights?: Record<number, number> | Record<string, number>;
        last_assigned_user_id: number | null;
        last_assigned_name: string | null;
    };
    team: { id: number; name: string }[];
}) {
    const initialWeights: Record<string, string> = {};
    const storedWeights = (leadAssignment.weights ?? {}) as Record<string, number>;
    team.forEach((u) => {
        const stored = storedWeights[String(u.id)] ?? storedWeights[u.id as unknown as string];
        initialWeights[String(u.id)] = String(
            stored !== undefined && stored !== null ? stored : 1,
        );
    });

    const { data, setData, patch, processing } = useForm({
        enabled: leadAssignment.enabled,
        mode: leadAssignment.mode === 'selected' ? 'selected' : 'all_active',
        user_ids: leadAssignment.user_ids.map(String),
        weights: initialWeights,
    });

    const toggleUser = (id: number) => {
        const key = String(id);
        setData(
            'user_ids',
            data.user_ids.includes(key)
                ? data.user_ids.filter((x) => x !== key)
                : [...data.user_ids, key],
        );
    };

    const setWeight = (id: number, value: string) => {
        setData('weights', {
            ...data.weights,
            [String(id)]: value,
        });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('settings.lead-assignment'));
    };

    const visibleTeam =
        data.mode === 'selected'
            ? team.filter((u) => data.user_ids.includes(String(u.id)))
            : team;

    const cycleTotal = visibleTeam.reduce((sum, u) => {
        const w = Math.max(0, Math.min(100, parseInt(data.weights[String(u.id)] || '0', 10) || 0));
        return sum + w;
    }, 0);

    return (
        <form
            onSubmit={submit}
            className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
            <h3 className="font-semibold">Weighted round-robin assignment</h3>
            <p className="mt-1 text-sm text-slate-500">
                Distribute new leads by weight. Example: Staff A = 2, Staff B = 1, Staff C = 10
                means in every 13 leads, A gets 2, B gets 1, and C gets 10.
            </p>

            <label className="mt-5 flex cursor-pointer items-start gap-3">
                <input
                    type="checkbox"
                    checked={data.enabled}
                    onChange={(e) => setData('enabled', e.target.checked)}
                    className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                    <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">
                        Enable auto assignment
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                        Manual “Assign to” still overrides auto assignment when set. Weight 0
                        excludes a person from the rotation.
                    </span>
                </span>
            </label>

            <div className={`mt-5 space-y-4 ${data.enabled ? '' : 'pointer-events-none opacity-50'}`}>
                <div>
                    <InputLabel value="Assignment pool" />
                    <div className="mt-2 flex flex-wrap gap-3">
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                            <input
                                type="radio"
                                name="mode"
                                checked={data.mode === 'all_active'}
                                onChange={() => setData('mode', 'all_active')}
                                className="border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            All active team members
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                            <input
                                type="radio"
                                name="mode"
                                checked={data.mode === 'selected'}
                                onChange={() => setData('mode', 'selected')}
                                className="border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            Selected members only
                        </label>
                    </div>
                </div>

                {data.mode === 'selected' && (
                    <div>
                        <InputLabel value="Include in rotation" />
                        {team.length === 0 ? (
                            <p className="mt-2 text-sm text-slate-500">No active team members.</p>
                        ) : (
                            <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                                {team.map((u) => (
                                    <li key={u.id}>
                                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={data.user_ids.includes(String(u.id))}
                                                onChange={() => toggleUser(u.id)}
                                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            {u.name}
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                <div>
                    <InputLabel value="Staff weights" />
                    {visibleTeam.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">
                            {data.mode === 'selected'
                                ? 'Select at least one team member above.'
                                : 'No active team members.'}
                        </p>
                    ) : (
                        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-3 py-2">Staff</th>
                                        <th className="w-28 px-3 py-2">Weight</th>
                                        <th className="w-24 px-3 py-2">Share</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleTeam.map((u) => {
                                        const w = Math.max(
                                            0,
                                            Math.min(
                                                100,
                                                parseInt(data.weights[String(u.id)] || '0', 10) ||
                                                    0,
                                            ),
                                        );
                                        const pct =
                                            cycleTotal > 0
                                                ? Math.round((w / cycleTotal) * 100)
                                                : 0;
                                        return (
                                            <tr
                                                key={u.id}
                                                className="border-t border-slate-100 dark:border-slate-800"
                                            >
                                                <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">
                                                    {u.name}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        value={data.weights[String(u.id)] ?? '1'}
                                                        onChange={(e) =>
                                                            setWeight(u.id, e.target.value)
                                                        }
                                                        className="w-20 rounded-lg border-slate-200 bg-slate-50 px-2 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                                                    />
                                                </td>
                                                <td className="px-3 py-2 tabular-nums text-slate-500">
                                                    {pct}%
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {cycleTotal > 0 && (
                        <p className="mt-2 text-xs text-slate-500">
                            Cycle size: {cycleTotal} lead{cycleTotal === 1 ? '' : 's'} before the
                            pattern repeats.
                        </p>
                    )}
                </div>

                {leadAssignment.last_assigned_name && (
                    <p className="text-xs text-slate-500">
                        Last auto-assigned to{' '}
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                            {leadAssignment.last_assigned_name}
                        </span>
                        . Next lead continues the weighted sequence.
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={processing}
                className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
                Save assignment
            </button>
        </form>
    );
}

function FieldsTab({ fields }: { fields: LeadField[] }) {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<LeadField | null>(null);
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        name: '',
        key: '',
        type: 'text',
        options: '',
        is_required: false,
        show_in_list: false,
    });

    const openCreate = () => {
        setEditing(null);
        reset();
        setShowForm(true);
    };

    const openEdit = (field: LeadField) => {
        setEditing(field);
        setData({
            name: field.name,
            key: field.key,
            type: field.type,
            options: (field.options ?? []).join(', '),
            is_required: field.is_required,
            show_in_list: field.show_in_list,
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditing(null);
        reset();
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editing) {
            patch(route('settings.fields.update', editing.id), {
                onSuccess: () => closeForm(),
            });
            return;
        }

        post(route('settings.fields.store'), {
            onSuccess: () => closeForm(),
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => (showForm ? closeForm() : openCreate())}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                    {showForm ? 'Close' : '+ Add field'}
                </button>
            </div>

            {showForm && (
                <form
                    onSubmit={submit}
                    className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                    <h3 className="font-semibold">
                        {editing ? `Edit field: ${editing.name}` : 'New lead field'}
                    </h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="fname" value="Field name *" />
                            <TextInput
                                id="fname"
                                value={data.name}
                                className={fieldClass}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div>
                            <InputLabel htmlFor="ftype" value="Type" />
                            <select
                                id="ftype"
                                className={fieldClass}
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                            >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="select">Select</option>
                                <option value="textarea">Textarea</option>
                                <option value="date">Date</option>
                                <option value="boolean">Boolean</option>
                                <option value="phone">Phone</option>
                                <option value="email">Email</option>
                            </select>
                        </div>
                        {data.type === 'select' && (
                            <div className="sm:col-span-2">
                                <InputLabel
                                    htmlFor="foptions"
                                    value="Options (comma-separated)"
                                />
                                <TextInput
                                    id="foptions"
                                    value={data.options}
                                    className={fieldClass}
                                    onChange={(e) => setData('options', e.target.value)}
                                    placeholder="Option A, Option B, Option C"
                                />
                            </div>
                        )}
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={data.is_required}
                                onChange={(e) => setData('is_required', e.target.checked)}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            Required on Add Lead
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={data.show_in_list}
                                onChange={(e) => setData('show_in_list', e.target.checked)}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            Show in leads list
                        </label>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                        {editing ? 'Update field' : 'Save field'}
                    </button>
                </form>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Key</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Required</th>
                            <th className="px-4 py-3">System</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {fields.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                    No custom lead fields yet
                                </td>
                            </tr>
                        ) : (
                            fields.map((f) => (
                                <tr key={f.id}>
                                    <td className="px-4 py-3 font-medium">{f.name}</td>
                                    <td className="px-4 py-3 font-mono text-xs">{f.key}</td>
                                    <td className="px-4 py-3 capitalize">{f.type}</td>
                                    <td className="px-4 py-3">{f.is_required ? 'Yes' : 'No'}</td>
                                    <td className="px-4 py-3">{f.is_system ? 'Yes' : 'No'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-3">
                                            {!f.is_system && (
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(f)}
                                                    className="text-xs font-semibold text-emerald-700 hover:underline"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            {!f.is_system && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        router.delete(
                                                            route('settings.fields.destroy', f.id),
                                                        )
                                                    }
                                                    className="text-xs font-semibold text-rose-600"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function PipelineTab({
    pipeline,
}: {
    pipeline: { id: number; name: string; stages: Stage[] } | null;
}) {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Stage | null>(null);
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        pipeline_id: pipeline?.id ?? '',
        name: '',
        color: '#64748b',
        probability: 50,
        is_won: false,
        is_lost: false,
    });

    if (!pipeline) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                No pipeline configured. Complete onboarding first.
            </div>
        );
    }

    const closeForm = () => {
        setShowForm(false);
        setEditing(null);
        reset();
        setData('pipeline_id', pipeline.id);
    };

    const openCreate = () => {
        setEditing(null);
        reset();
        setData({
            pipeline_id: pipeline.id,
            name: '',
            color: '#64748b',
            probability: 50,
            is_won: false,
            is_lost: false,
        });
        setShowForm(true);
    };

    const openEdit = (stage: Stage) => {
        setEditing(stage);
        setData({
            pipeline_id: pipeline.id,
            name: stage.name,
            color: stage.color || '#64748b',
            probability: stage.probability,
            is_won: stage.is_won,
            is_lost: stage.is_lost,
        });
        setShowForm(true);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editing) {
            patch(route('settings.stages.update', editing.id), {
                onSuccess: () => closeForm(),
            });
            return;
        }

        post(route('settings.stages.store'), {
            onSuccess: () => closeForm(),
        });
    };

    const deleteStage = (stage: Stage) => {
        const others = pipeline.stages.filter((s) => s.id !== stage.id);
        if (others.length === 0) {
            window.alert('You cannot delete the only stage in this pipeline.');
            return;
        }

        if (stage.deals_count > 0) {
            const ok = window.confirm(
                `"${stage.name}" has ${stage.deals_count} deal(s). Delete it and move those deals to "${others[0].name}"?`,
            );
            if (!ok) {
                return;
            }
            router.delete(route('settings.stages.destroy', stage.id), {
                data: { reassign_stage_id: others[0].id },
                preserveScroll: true,
            });
            return;
        }

        if (!window.confirm(`Delete stage "${stage.name}"?`)) {
            return;
        }

        router.delete(route('settings.stages.destroy', stage.id), {
            preserveScroll: true,
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                    Pipeline:{' '}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {pipeline.name}
                    </span>
                </p>
                <button
                    type="button"
                    onClick={() => (showForm ? closeForm() : openCreate())}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                    {showForm ? 'Close' : '+ Add stage'}
                </button>
            </div>

            {showForm && (
                <form
                    onSubmit={submit}
                    className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                    <h3 className="font-semibold">
                        {editing ? `Edit stage: ${editing.name}` : 'New pipeline stage'}
                    </h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        <div>
                            <InputLabel htmlFor="sname" value="Stage name *" />
                            <TextInput
                                id="sname"
                                value={data.name}
                                className={fieldClass}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div>
                            <InputLabel htmlFor="scolor" value="Color" />
                            <input
                                id="scolor"
                                type="color"
                                value={data.color}
                                className="mt-1 h-10 w-full rounded-xl border border-slate-200"
                                onChange={(e) => setData('color', e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="sprob" value="Probability %" />
                            <TextInput
                                id="sprob"
                                type="number"
                                value={data.probability}
                                className={fieldClass}
                                onChange={(e) =>
                                    setData('probability', Number(e.target.value))
                                }
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex gap-4 text-sm">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={data.is_won}
                                onChange={(e) => {
                                    setData('is_won', e.target.checked);
                                    if (e.target.checked) {
                                        setData('is_lost', false);
                                    }
                                }}
                            />
                            Won stage
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={data.is_lost}
                                onChange={(e) => {
                                    setData('is_lost', e.target.checked);
                                    if (e.target.checked) {
                                        setData('is_won', false);
                                    }
                                }}
                            />
                            Lost stage
                        </label>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                        {editing ? 'Update stage' : 'Save stage'}
                    </button>
                </form>
            )}

            <div className="space-y-2">
                {pipeline.stages.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                        No stages yet. Add your first stage.
                    </div>
                ) : (
                    pipeline.stages.map((s) => (
                        <div
                            key={s.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                            style={{ borderLeftWidth: 4, borderLeftColor: s.color }}
                        >
                            <div>
                                <div className="font-medium">{s.name}</div>
                                <div className="text-xs text-slate-500">
                                    {s.probability}% · {s.deals_count} deals
                                    {s.is_won && ' · Won'}
                                    {s.is_lost && ' · Lost'}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => openEdit(s)}
                                    className="text-xs font-semibold text-emerald-700 hover:underline"
                                >
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => deleteStage(s)}
                                    disabled={pipeline.stages.length <= 1}
                                    className="text-xs font-semibold text-rose-600 hover:underline disabled:opacity-40"
                                    title={
                                        pipeline.stages.length <= 1
                                            ? 'Keep at least one stage'
                                            : s.deals_count > 0
                                              ? 'Delete and move deals to another stage'
                                              : 'Delete stage'
                                    }
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function ProvidersTab({
    providers,
}: {
    providers: {
        email: {
            driver: string;
            host: string;
            port: number;
            username: string;
            encryption: string;
            from_address: string;
            from_name: string;
            has_password: boolean;
        };
        whatsapp: {
            driver: string;
            phone_number_id: string;
            has_token: boolean;
        };
    };
}) {
    const { data, setData, patch, processing } = useForm({
        email_driver: providers.email.driver,
        email_host: providers.email.host,
        email_port: providers.email.port,
        email_username: providers.email.username,
        email_password: '',
        email_encryption: providers.email.encryption || 'tls',
        email_from_address: providers.email.from_address,
        email_from_name: providers.email.from_name,
        whatsapp_driver: providers.whatsapp.driver,
        whatsapp_api_token: '',
        whatsapp_phone_number_id: providers.whatsapp.phone_number_id,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('settings.providers'));
    };

    return (
        <form
            onSubmit={submit}
            className="space-y-6"
        >
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-semibold">Email (SMTP)</h3>
                <p className="mt-1 text-xs text-slate-500">
                    Use <strong>log</strong> for demo (writes to Laravel log). Switch to{' '}
                    <strong>smtp</strong> for real delivery.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="email_driver" value="Driver" />
                        <select
                            id="email_driver"
                            className={fieldClass}
                            value={data.email_driver}
                            onChange={(e) => setData('email_driver', e.target.value)}
                        >
                            <option value="log">Log (demo)</option>
                            <option value="smtp">SMTP</option>
                        </select>
                    </div>
                    <div>
                        <InputLabel htmlFor="email_from_address" value="From address" />
                        <TextInput
                            id="email_from_address"
                            type="email"
                            value={data.email_from_address}
                            className={fieldClass}
                            onChange={(e) => setData('email_from_address', e.target.value)}
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="email_host" value="SMTP host" />
                        <TextInput
                            id="email_host"
                            value={data.email_host}
                            className={fieldClass}
                            onChange={(e) => setData('email_host', e.target.value)}
                            placeholder="smtp.example.com"
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="email_port" value="Port" />
                        <TextInput
                            id="email_port"
                            type="number"
                            value={data.email_port}
                            className={fieldClass}
                            onChange={(e) => setData('email_port', Number(e.target.value))}
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="email_username" value="Username" />
                        <TextInput
                            id="email_username"
                            value={data.email_username}
                            className={fieldClass}
                            onChange={(e) => setData('email_username', e.target.value)}
                        />
                    </div>
                    <div>
                        <InputLabel
                            htmlFor="email_password"
                            value={
                                providers.email.has_password
                                    ? 'Password (leave blank to keep)'
                                    : 'Password'
                            }
                        />
                        <TextInput
                            id="email_password"
                            type="password"
                            value={data.email_password}
                            className={fieldClass}
                            onChange={(e) => setData('email_password', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-semibold">WhatsApp</h3>
                <p className="mt-1 text-xs text-slate-500">
                    Use <strong>log</strong> for demo. <strong>meta</strong> requires Cloud API
                    token + phone number ID.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="whatsapp_driver" value="Driver" />
                        <select
                            id="whatsapp_driver"
                            className={fieldClass}
                            value={data.whatsapp_driver}
                            onChange={(e) => setData('whatsapp_driver', e.target.value)}
                        >
                            <option value="log">Log (demo)</option>
                            <option value="meta">Meta Cloud API</option>
                        </select>
                    </div>
                    <div>
                        <InputLabel htmlFor="whatsapp_phone_number_id" value="Phone number ID" />
                        <TextInput
                            id="whatsapp_phone_number_id"
                            value={data.whatsapp_phone_number_id}
                            className={fieldClass}
                            onChange={(e) =>
                                setData('whatsapp_phone_number_id', e.target.value)
                            }
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <InputLabel
                            htmlFor="whatsapp_api_token"
                            value={
                                providers.whatsapp.has_token
                                    ? 'API token (leave blank to keep)'
                                    : 'API token'
                            }
                        />
                        <TextInput
                            id="whatsapp_api_token"
                            type="password"
                            value={data.whatsapp_api_token}
                            className={fieldClass}
                            onChange={(e) => setData('whatsapp_api_token', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={processing}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
                Save providers
            </button>
        </form>
    );
}

function IntegrationsTab({ integrations }: { integrations: IntegrationCard[] }) {
    const page = usePage().props as {
        auth?: { user?: { can_manage_integrations?: boolean } };
    };
    const canManage = page.auth?.user?.can_manage_integrations !== false;
    const [copied, setCopied] = useState<string | null>(null);
    const meta = integrations.find((i) => i.key === 'meta');
    const others = integrations.filter((i) => i.key !== 'meta');

    const copyText = async (key: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(key);
            setTimeout(() => setCopied(null), 1800);
        } catch {
            // ignore
        }
    };

    const save = (payload: Record<string, string | boolean | number>) => {
        router.patch(route('settings.integrations'), payload, { preserveScroll: true });
    };

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 dark:border-emerald-900 dark:from-emerald-950/40 dark:to-slate-900">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Connect your ad accounts
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Each company connects <strong>their own</strong> Meta / Google accounts. Leads
                    sync into <strong>Enquiries</strong> automatically — no shared credentials
                    between tenants.
                </p>
            </div>

            {meta && (
                <div
                    className={`rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900 ${
                        meta.enabled
                            ? 'border-emerald-300 dark:border-emerald-700'
                            : 'border-slate-200 dark:border-slate-800'
                    }`}
                >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1877F2] text-lg font-bold text-white">
                                f
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                    {meta.name}
                                </h4>
                                <p className="mt-0.5 text-sm text-slate-500">{meta.description}</p>
                                <p className="mt-2 text-xs text-slate-500">{meta.docs}</p>
                            </div>
                        </div>

                        {meta.enabled ? (
                            canManage ? (
                            <form method="post" action={meta.disconnect_url || '#'}>
                                <input
                                    type="hidden"
                                    name="_token"
                                    value={
                                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
                                            ?.content || ''
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.post(route('integrations.meta.disconnect'), {}, {
                                            preserveScroll: true,
                                        })
                                    }
                                    className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                                >
                                    Disconnect
                                </button>
                            </form>
                            ) : (
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                                    Connected
                                </span>
                            )
                        ) : canManage ? (
                            <a
                                href={
                                    meta.meta_configured
                                        ? route('integrations.meta.connect')
                                        : undefined
                                }
                                onClick={(e) => {
                                    if (!meta.meta_configured) {
                                        e.preventDefault();
                                    }
                                }}
                                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 ${
                                    meta.meta_configured
                                        ? 'bg-[#1877F2] hover:bg-[#166fe5]'
                                        : 'cursor-not-allowed bg-slate-400'
                                }`}
                            >
                                <span className="text-base font-bold">f</span>
                                Connect with Facebook
                            </a>
                        ) : (
                            <span className="text-sm text-slate-500">
                                Ask a company admin to connect Meta.
                            </span>
                        )}
                    </div>

                    {!meta.meta_configured && (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                            Platform admin must set <code>META_APP_ID</code> and{' '}
                            <code>META_APP_SECRET</code> in the server <code>.env</code> before
                            tenants can connect.
                        </div>
                    )}

                    {meta.enabled && (
                        <div className="mt-5 space-y-3">
                            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                Connected
                                {meta.connected_at
                                    ? ` · ${new Date(meta.connected_at).toLocaleString()}`
                                    : ''}
                            </div>

                            {(meta.meta_pages?.length ?? 0) > 0 ? (
                                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                                    <div className="bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/50">
                                        Linked Facebook Pages
                                    </div>
                                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {meta.meta_pages!.map((page) => (
                                            <li
                                                key={page.id}
                                                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                                            >
                                                <div>
                                                    <div className="font-medium">{page.page_name}</div>
                                                    <div className="text-xs text-slate-500">
                                                        Page ID {page.page_id}
                                                        {page.has_instagram ? ' · Instagram linked' : ''}
                                                    </div>
                                                </div>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                        page.subscribed_leadgen
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}
                                                >
                                                    {page.subscribed_leadgen
                                                        ? 'Lead Ads subscribed'
                                                        : 'Pending subscribe'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">
                                    No Pages found. Reconnect with a Meta user that manages a Page.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div>
                <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Other lead sources (webhook)
                </h4>
                <div className="grid gap-4 lg:grid-cols-2">
                    {others.map((item) => (
                        <div
                            key={item.key}
                            className={`rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900 ${
                                item.enabled
                                    ? 'border-emerald-300 dark:border-emerald-700'
                                    : 'border-slate-200 dark:border-slate-800'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                        {item.name}
                                    </h4>
                                    <p className="text-xs text-slate-500">{item.description}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        save({
                                            platform: item.key,
                                            enabled: !item.enabled,
                                        })
                                    }
                                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                                        item.enabled
                                            ? 'bg-emerald-600'
                                            : 'bg-slate-300 dark:bg-slate-700'
                                    }`}
                                    aria-label={item.enabled ? 'Disable' : 'Enable'}
                                >
                                    <span
                                        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                                            item.enabled ? 'left-5' : 'left-0.5'
                                        }`}
                                    />
                                </button>
                            </div>

                            <p className="mt-3 text-xs leading-relaxed text-slate-500">{item.docs}</p>

                            {item.enabled && (
                                <div className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                                    <div>
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Your webhook URL
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    copyText(`${item.key}-url`, item.webhook_url)
                                                }
                                                className="text-xs font-semibold text-emerald-600 hover:underline"
                                            >
                                                {copied === `${item.key}-url` ? 'Copied' : 'Copy'}
                                            </button>
                                        </div>
                                        <code className="block break-all rounded-lg bg-white px-2.5 py-2 text-[11px] text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                                            {item.webhook_url}
                                        </code>
                                    </div>

                                    {item.webhook_secret && (
                                        <div>
                                            <div className="mb-1 flex items-center justify-between">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Secret
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        copyText(
                                                            `${item.key}-secret`,
                                                            item.webhook_secret || '',
                                                        )
                                                    }
                                                    className="text-xs font-semibold text-emerald-600 hover:underline"
                                                >
                                                    {copied === `${item.key}-secret`
                                                        ? 'Copied'
                                                        : 'Copy'}
                                                </button>
                                            </div>
                                            <code className="block break-all rounded-lg bg-white px-2.5 py-2 text-[11px] text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                                                {item.webhook_secret}
                                            </code>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

