import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import CrmLayout from '@/Layouts/CrmLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

type AccountRow = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    industry: string | null;
    city: string | null;
    status: string;
    contacts_count: number;
    leads_count: number;
    assignee: string | null;
};

type Option = { id: number; name: string };

const fieldClass =
    'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

export default function CompaniesIndex({
    accounts,
    team,
    stats,
}: {
    accounts: { data: AccountRow[] };
    team: Option[];
    stats: { total: number; active: number };
}) {
    const flash = (usePage().props as {
        flash?: { success?: string; import_errors?: string[] };
    }).flash;
    const [showForm, setShowForm] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        website: '',
        industry: '',
        city: '',
        country: '',
        notes: '',
    });

    const importForm = useForm<{ file: File | null }>({ file: null });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('companies.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const submitImport: FormEventHandler = (e) => {
        e.preventDefault();
        if (!importForm.data.file) return;
        importForm.post(route('companies.import'), {
            forceFormData: true,
            onSuccess: () => {
                importForm.reset();
                setShowImport(false);
                if (fileRef.current) fileRef.current.value = '';
            },
        });
    };

    return (
        <CrmLayout title="Companies">
            <Head title="Companies" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {flash.success}
                </div>
            )}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">Companies</h2>
                    <p className="text-sm text-slate-500">
                        B2B accounts linked to contacts & leads
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setShowImport(!showImport);
                            setShowForm(false);
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900"
                    >
                        {showImport ? 'Close' : 'Import CSV'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setShowForm(!showForm);
                            setShowImport(false);
                        }}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                        {showForm ? 'Close' : '+ Add company'}
                    </button>
                </div>
            </div>

            {flash?.import_errors && flash.import_errors.length > 0 && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                    <p className="font-semibold">Import notes</p>
                    <ul className="mt-1 list-inside list-disc">
                        {flash.import_errors.slice(0, 8).map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            {showImport && (
                <form
                    onSubmit={submitImport}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                    <h3 className="font-semibold">Import companies from CSV</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Columns: name, email, phone, website, industry, city, country, notes
                    </p>
                    <div className="mt-4 flex flex-wrap items-end gap-3">
                        <div className="min-w-[220px] flex-1">
                            <InputLabel htmlFor="csv_file" value="CSV file" />
                            <input
                                ref={fileRef}
                                id="csv_file"
                                type="file"
                                accept=".csv,text/csv"
                                className={fieldClass}
                                onChange={(e) =>
                                    importForm.setData('file', e.target.files?.[0] ?? null)
                                }
                                required
                            />
                            <InputError message={importForm.errors.file} />
                        </div>
                        <a
                            href={route('companies.sample')}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-700"
                        >
                            Sample CSV
                        </a>
                        <button
                            type="submit"
                            disabled={importForm.processing || !importForm.data.file}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            Upload
                        </button>
                    </div>
                </form>
            )}

            <div className="mb-6 grid gap-3 sm:grid-cols-2">
                <StatCard label="Total" value={stats.total} />
                <StatCard label="Active" value={stats.active} />
            </div>

            {showForm && (
                <form
                    onSubmit={submit}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                    <h3 className="font-semibold">New company</h3>
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
                            <InputError message={errors.name} />
                        </div>
                        <div>
                            <InputLabel htmlFor="industry" value="Industry" />
                            <TextInput
                                id="industry"
                                value={data.industry}
                                className={fieldClass}
                                onChange={(e) => setData('industry', e.target.value)}
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
                            <InputLabel htmlFor="phone" value="Phone" />
                            <TextInput
                                id="phone"
                                value={data.phone}
                                className={fieldClass}
                                onChange={(e) => setData('phone', e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="city" value="City" />
                            <TextInput
                                id="city"
                                value={data.city}
                                className={fieldClass}
                                onChange={(e) => setData('city', e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="website" value="Website" />
                            <TextInput
                                id="website"
                                value={data.website}
                                className={fieldClass}
                                onChange={(e) => setData('website', e.target.value)}
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
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3">Company</th>
                            <th className="px-4 py-3">Industry</th>
                            <th className="px-4 py-3">Contacts</th>
                            <th className="px-4 py-3">Leads</th>
                            <th className="px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {accounts.data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                                    No companies yet. Add a B2B account to get started.
                                </td>
                            </tr>
                        ) : (
                            accounts.data.map((a) => (
                                <tr key={a.id}>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={route('companies.show', a.id)}
                                            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                                        >
                                            {a.name}
                                        </Link>
                                        <div className="text-xs text-slate-500">
                                            {a.phone || a.email || a.city || '—'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">{a.industry || '—'}</td>
                                    <td className="px-4 py-3">{a.contacts_count}</td>
                                    <td className="px-4 py-3">{a.leads_count}</td>
                                    <td className="px-4 py-3 capitalize">{a.status}</td>
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
