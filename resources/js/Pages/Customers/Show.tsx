import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import CrmLayout from '@/Layouts/CrmLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type CustomerDetail = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
    lifetime_value: number;
    currency: string;
    notes: string | null;
    converted_at: string | null;
    assignee: { id: number; name: string } | null;
    deal: {
        id: number;
        title: string;
        value: number;
        stage: { id: number; name: string; color: string } | null;
    } | null;
    lead: { id: number; name: string; temperature: string } | null;
};

type Option = { id: number; name: string };

export default function CustomerShow({
    customer,
    team,
}: {
    customer: CustomerDetail;
    team: Option[];
}) {
    const flash = (usePage().props as { flash?: { success?: string } }).flash;

    const { data, setData, patch, processing } = useForm({
        name: customer.name,
        email: customer.email ?? '',
        phone: customer.phone ?? '',
        status: customer.status,
        lifetime_value: String(customer.lifetime_value),
        notes: customer.notes ?? '',
        assigned_user_id: customer.assignee?.id ?? '',
    });

    const fieldClass =
        'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('customers.update', customer.id));
    };

    return (
        <CrmLayout title={customer.name}>
            <Head title={customer.name} />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {flash.success}
                </div>
            )}

            <div className="mb-4">
                <Link
                    href={route('customers.index')}
                    className="text-sm text-emerald-600 hover:underline"
                >
                    ← Back to customers
                </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-2xl font-bold">{customer.name}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {customer.phone || customer.email || 'No contact info'}
                        </p>
                        <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                            <div>
                                <dt className="text-slate-500">Status</dt>
                                <dd className="font-medium capitalize">{customer.status}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Lifetime value</dt>
                                <dd className="font-medium">
                                    {customer.currency}{' '}
                                    {customer.lifetime_value.toLocaleString()}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Assignee</dt>
                                <dd className="font-medium">{customer.assignee?.name ?? '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Converted</dt>
                                <dd className="font-medium">
                                    {customer.converted_at
                                        ? new Date(customer.converted_at).toLocaleDateString()
                                        : '—'}
                                </dd>
                            </div>
                        </dl>

                        {customer.deal && (
                            <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                                <div className="text-xs font-medium uppercase text-slate-500">
                                    Won deal
                                </div>
                                <div className="mt-1 flex justify-between">
                                    <span className="font-semibold">{customer.deal.title}</span>
                                    <Link
                                        href={route('pipeline.index')}
                                        className="text-xs text-emerald-600 hover:underline"
                                    >
                                        {customer.deal.stage?.name ?? 'Pipeline'}
                                    </Link>
                                </div>
                            </div>
                        )}

                        {customer.lead && (
                            <div className="mt-3 text-sm">
                                From lead:{' '}
                                <Link
                                    href={route('leads.show', customer.lead.id)}
                                    className="font-medium text-emerald-600 hover:underline"
                                >
                                    {customer.lead.name}
                                </Link>
                            </div>
                        )}
                    </div>

                    <form
                        onSubmit={submit}
                        className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                    >
                        <h3 className="font-semibold">Update customer</h3>
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
                                    <option value="churned">Churned</option>
                                </select>
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
                                    onChange={(e) =>
                                        setData('lifetime_value', e.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="assigned_user_id" value="Assignee" />
                                <select
                                    id="assigned_user_id"
                                    className={fieldClass}
                                    value={data.assigned_user_id}
                                    onChange={(e) =>
                                        setData('assigned_user_id', e.target.value)
                                    }
                                >
                                    <option value="">—</option>
                                    {team.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
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
                            Save changes
                        </button>
                    </form>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-semibold">Account snapshot</h3>
                    <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                        <li>Support tickets & documents come in a later phase.</li>
                        <li>Upsell opportunities can be tracked via new deals on related leads.</li>
                        <li>
                            Quick links:{' '}
                            <Link href={route('pipeline.index')} className="text-emerald-600">
                                Pipeline
                            </Link>
                            {' · '}
                            <Link href={route('tasks.index')} className="text-emerald-600">
                                Tasks
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </CrmLayout>
    );
}
