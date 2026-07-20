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

const TABS = [
    { key: 'company', label: 'Company' },
    { key: 'fields', label: 'Lead fields' },
    { key: 'pipeline', label: 'Pipeline stages' },
    { key: 'providers', label: 'Providers' },
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
                    Company profile, lead fields & pipeline stages
                </p>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
                {TABS.map((t) => (
                    <Link
                        key={t.key}
                        href={route('settings.index', { tab: t.key })}
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
            {tab === 'pipeline' && <PipelineTab pipeline={pipeline} />}
            {tab === 'providers' && <ProvidersTab providers={providers} />}
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

function FieldsTab({ fields }: { fields: LeadField[] }) {
    const [showForm, setShowForm] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        key: '',
        type: 'text',
        options: '',
        is_required: false,
        show_in_list: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('settings.fields.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => setShowForm(!showForm)}
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
                    <div className="grid gap-4 sm:grid-cols-2">
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
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                        Save field
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
                            <th className="px-4 py-3">System</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {fields.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                    No custom lead fields yet
                                </td>
                            </tr>
                        ) : (
                            fields.map((f) => (
                                <tr key={f.id}>
                                    <td className="px-4 py-3 font-medium">{f.name}</td>
                                    <td className="px-4 py-3 font-mono text-xs">{f.key}</td>
                                    <td className="px-4 py-3 capitalize">{f.type}</td>
                                    <td className="px-4 py-3">{f.is_system ? 'Yes' : 'No'}</td>
                                    <td className="px-4 py-3 text-right">
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
    const { data, setData, post, processing, errors, reset } = useForm({
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

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('settings.stages.store'), {
            onSuccess: () => {
                reset('name', 'color', 'probability', 'is_won', 'is_lost');
                setShowForm(false);
            },
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                    Pipeline: <span className="font-semibold text-slate-800 dark:text-slate-200">{pipeline.name}</span>
                </p>
                <button
                    type="button"
                    onClick={() => setShowForm(!showForm)}
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
                    <div className="grid gap-4 sm:grid-cols-3">
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
                                onChange={(e) => setData('is_won', e.target.checked)}
                            />
                            Won stage
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={data.is_lost}
                                onChange={(e) => setData('is_lost', e.target.checked)}
                            />
                            Lost stage
                        </label>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                        Save stage
                    </button>
                </form>
            )}

            <div className="space-y-2">
                {pipeline.stages.map((s) => (
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
                        <button
                            type="button"
                            disabled={s.deals_count > 0}
                            onClick={() =>
                                router.delete(route('settings.stages.destroy', s.id))
                            }
                            className="text-xs font-semibold text-rose-600 disabled:opacity-40"
                            title={
                                s.deals_count > 0
                                    ? 'Move deals out of this stage first'
                                    : 'Delete stage'
                            }
                        >
                            Delete
                        </button>
                    </div>
                ))}
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

