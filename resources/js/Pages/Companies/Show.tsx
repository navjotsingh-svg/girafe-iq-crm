import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import CrmLayout from '@/Layouts/CrmLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

type AccountDetail = {
    id: number;
    name: string;
    legal_name: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    industry: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    status: string;
    notes: string | null;
    assignee: { id: number; name: string } | null;
    contacts: {
        id: number;
        name: string;
        email: string | null;
        phone: string | null;
        job_title: string | null;
        is_primary: boolean;
    }[];
    leads: { id: number; name: string; temperature: string }[];
};

type Option = { id: number; name: string };

const fieldClass =
    'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

export default function CompanyShow({
    account,
    team,
}: {
    account: AccountDetail;
    team: Option[];
}) {
    const flash = (usePage().props as { flash?: { success?: string } }).flash;
    const [showContact, setShowContact] = useState(false);

    const { data, setData, patch, processing } = useForm({
        name: account.name,
        email: account.email ?? '',
        phone: account.phone ?? '',
        website: account.website ?? '',
        industry: account.industry ?? '',
        city: account.city ?? '',
        status: account.status,
        notes: account.notes ?? '',
        assigned_user_id: account.assignee?.id ?? '',
    });

    const contactForm = useForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        job_title: '',
        account_id: account.id,
        is_primary: false,
        redirect_account: 1,
    });

    const save: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('companies.update', account.id));
    };

    const addContact: FormEventHandler = (e) => {
        e.preventDefault();
        contactForm.post(route('contacts.store'), {
            onSuccess: () => {
                contactForm.reset('first_name', 'last_name', 'email', 'phone', 'job_title');
                setShowContact(false);
            },
        });
    };

    return (
        <CrmLayout title={account.name}>
            <Head title={account.name} />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {flash.success}
                </div>
            )}

            <div className="mb-4">
                <Link href={route('companies.index')} className="text-sm text-emerald-600 hover:underline">
                    ← Back to companies
                </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-2xl font-bold">{account.name}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {account.industry || 'Company'} · {account.city || account.country || '—'}
                        </p>
                    </div>

                    <form
                        onSubmit={save}
                        className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                    >
                        <h3 className="font-semibold">Update company</h3>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="name" value="Name" />
                                <TextInput
                                    id="name"
                                    value={data.name}
                                    className={fieldClass}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="status" value="Status" />
                                <select
                                    id="status"
                                    className={fieldClass}
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div>
                                <InputLabel htmlFor="email" value="Email" />
                                <TextInput
                                    id="email"
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
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="notes" value="Notes" />
                                <textarea
                                    id="notes"
                                    rows={3}
                                    className={fieldClass}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-emerald-600"
                        >
                            Save
                        </button>
                    </form>
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Contacts</h3>
                            <button
                                type="button"
                                onClick={() => setShowContact(!showContact)}
                                className="text-sm font-semibold text-emerald-600"
                            >
                                {showContact ? 'Cancel' : '+ Add'}
                            </button>
                        </div>
                        {showContact && (
                            <form onSubmit={addContact} className="mt-3 space-y-2">
                                <TextInput
                                    placeholder="First name"
                                    value={contactForm.data.first_name}
                                    className={fieldClass}
                                    onChange={(e) =>
                                        contactForm.setData('first_name', e.target.value)
                                    }
                                    required
                                />
                                <TextInput
                                    placeholder="Email"
                                    value={contactForm.data.email}
                                    className={fieldClass}
                                    onChange={(e) =>
                                        contactForm.setData('email', e.target.value)
                                    }
                                />
                                <button
                                    type="submit"
                                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                                >
                                    Save contact
                                </button>
                            </form>
                        )}
                        <ul className="mt-3 space-y-2">
                            {account.contacts.length === 0 ? (
                                <li className="text-sm text-slate-500">No contacts</li>
                            ) : (
                                account.contacts.map((c) => (
                                    <li
                                        key={c.id}
                                        className="rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60"
                                    >
                                        <div className="font-medium">
                                            {c.name}
                                            {c.is_primary && (
                                                <span className="ml-2 text-xs text-emerald-600">
                                                    Primary
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {c.job_title || c.email || c.phone || '—'}
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-semibold">Linked leads</h3>
                        <ul className="mt-3 space-y-2">
                            {account.leads.length === 0 ? (
                                <li className="text-sm text-slate-500">No linked leads</li>
                            ) : (
                                account.leads.map((l) => (
                                    <li key={l.id}>
                                        <Link
                                            href={route('leads.show', l.id)}
                                            className="text-sm text-emerald-600 hover:underline"
                                        >
                                            {l.name}
                                        </Link>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </CrmLayout>
    );
}
