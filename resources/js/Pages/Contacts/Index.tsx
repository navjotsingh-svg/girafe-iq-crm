import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import CrmLayout from '@/Layouts/CrmLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

type ContactRow = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    job_title: string | null;
    is_primary: boolean;
    status: string;
    account: { id: number; name: string } | null;
    assignee: string | null;
};

type Option = { id: number; name: string };

const fieldClass =
    'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

export default function ContactsIndex({
    contacts,
    accounts,
    stats,
}: {
    contacts: { data: ContactRow[] };
    accounts: Option[];
    team: Option[];
    stats: { total: number; primary: number };
}) {
    const flash = (usePage().props as {
        flash?: { success?: string; import_errors?: string[] };
    }).flash;
    const [showForm, setShowForm] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        job_title: '',
        account_id: '' as string | number,
        is_primary: false,
    });

    const importForm = useForm<{ file: File | null }>({ file: null });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('contacts.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const submitImport: FormEventHandler = (e) => {
        e.preventDefault();
        if (!importForm.data.file) return;
        importForm.post(route('contacts.import'), {
            forceFormData: true,
            onSuccess: () => {
                importForm.reset();
                setShowImport(false);
                if (fileRef.current) fileRef.current.value = '';
            },
        });
    };

    return (
        <CrmLayout title="Contacts">
            <Head title="Contacts" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {flash.success}
                </div>
            )}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">Contacts</h2>
                    <p className="text-sm text-slate-500">
                        People linked to company accounts
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
                        {showForm ? 'Close' : '+ Add contact'}
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
                    <h3 className="font-semibold">Import contacts from CSV</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Columns: first_name, last_name, email, phone, job_title, company, is_primary,
                        notes
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
                            href={route('contacts.sample')}
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
                <StatCard label="Total contacts" value={stats.total} />
                <StatCard label="Primary contacts" value={stats.primary} />
            </div>

            {showForm && (
                <form
                    onSubmit={submit}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                    <h3 className="font-semibold">New contact</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="first_name" value="First name *" />
                            <TextInput
                                id="first_name"
                                value={data.first_name}
                                className={fieldClass}
                                onChange={(e) => setData('first_name', e.target.value)}
                                required
                            />
                            <InputError message={errors.first_name} />
                        </div>
                        <div>
                            <InputLabel htmlFor="last_name" value="Last name" />
                            <TextInput
                                id="last_name"
                                value={data.last_name}
                                className={fieldClass}
                                onChange={(e) => setData('last_name', e.target.value)}
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
                            <InputLabel htmlFor="job_title" value="Job title" />
                            <TextInput
                                id="job_title"
                                value={data.job_title}
                                className={fieldClass}
                                onChange={(e) => setData('job_title', e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="account_id" value="Company" />
                            <select
                                id="account_id"
                                className={fieldClass}
                                value={data.account_id}
                                onChange={(e) => setData('account_id', e.target.value)}
                            >
                                <option value="">None</option>
                                {accounts.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 sm:col-span-2">
                            <input
                                id="is_primary"
                                type="checkbox"
                                checked={data.is_primary}
                                onChange={(e) => setData('is_primary', e.target.checked)}
                            />
                            <label htmlFor="is_primary" className="text-sm">
                                Primary contact for this company
                            </label>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
                    >
                        Save contact
                    </button>
                </form>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3">Contact</th>
                            <th className="px-4 py-3">Company</th>
                            <th className="px-4 py-3">Title</th>
                            <th className="px-4 py-3">Phone</th>
                            <th className="px-4 py-3">Primary</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {contacts.data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                                    No contacts yet.
                                </td>
                            </tr>
                        ) : (
                            contacts.data.map((c) => (
                                <tr key={c.id}>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{c.name}</div>
                                        <div className="text-xs text-slate-500">
                                            {c.email || '—'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {c.account ? (
                                            <Link
                                                href={route('companies.show', c.account.id)}
                                                className="text-emerald-600 hover:underline"
                                            >
                                                {c.account.name}
                                            </Link>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="px-4 py-3">{c.job_title || '—'}</td>
                                    <td className="px-4 py-3">{c.phone || '—'}</td>
                                    <td className="px-4 py-3">{c.is_primary ? 'Yes' : '—'}</td>
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
