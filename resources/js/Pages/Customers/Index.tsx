import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import CrmLayout from '@/Layouts/CrmLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

type CustomerRow = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
    lifetime_value: number;
    currency: string;
    assignee: string | null;
    deal: string | null;
    converted_at: string | null;
};

type Option = { id: number; name: string };

const statusClass: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800',
    inactive: 'bg-slate-100 text-slate-700',
    churned: 'bg-rose-100 text-rose-800',
};

export default function CustomersIndex({
    customers,
    team,
    stats,
}: {
    customers: { data: CustomerRow[] };
    team: Option[];
    stats: { total: number; active: number; lifetime_value: number; currency: string };
}) {
    const flash = (usePage().props as { flash?: { success?: string } }).flash;
    const [showForm, setShowForm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        status: 'active',
        lifetime_value: '',
        notes: '',
        assigned_user_id: '' as string | number,
    });

    const fieldClass =
        'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('customers.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    return (
        <CrmLayout title="Customers">
            <Head title="Customers" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {flash.success}
                </div>
            )}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">Customers / Clients</h2>
                    <p className="text-sm text-slate-500">
                        Won deals become customers · Manage accounts & lifetime value
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowForm(!showForm)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                    {showForm ? 'Close' : '+ Add customer'}
                </button>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <StatCard label="Total customers" value={stats.total} />
                <StatCard label="Active" value={stats.active} />
                <StatCard
                    label="Lifetime value"
                    value={`${stats.currency} ${stats.lifetime_value.toLocaleString()}`}
                />
            </div>

            {showForm && (
                <form
                    onSubmit={submit}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                    <h3 className="font-semibold">New customer</h3>
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
                            <InputError message={errors.name} className="mt-1" />
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
                            <InputLabel htmlFor="lifetime_value" value="Lifetime value" />
                            <TextInput
                                id="lifetime_value"
                                type="number"
                                value={data.lifetime_value}
                                className={fieldClass}
                                onChange={(e) => setData('lifetime_value', e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="assigned_user_id" value="Assignee" />
                            <select
                                id="assigned_user_id"
                                className={fieldClass}
                                value={data.assigned_user_id}
                                onChange={(e) => setData('assigned_user_id', e.target.value)}
                            >
                                <option value="">Me</option>
                                {team.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
                    >
                        Save customer
                    </button>
                </form>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3">Customer</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">LTV</th>
                            <th className="px-4 py-3">Deal</th>
                            <th className="px-4 py-3">Assignee</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {customers.data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                                    No customers yet. Win a deal on the pipeline or add one manually.
                                </td>
                            </tr>
                        ) : (
                            customers.data.map((c) => (
                                <tr key={c.id}>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={route('customers.show', c.id)}
                                            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                                        >
                                            {c.name}
                                        </Link>
                                        <div className="text-xs text-slate-500">
                                            {c.phone || c.email || '—'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusClass[c.status] ?? ''}`}
                                        >
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {c.currency} {c.lifetime_value.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">{c.deal || '—'}</td>
                                    <td className="px-4 py-3">{c.assignee || '—'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </CrmLayout>
    );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    );
}
