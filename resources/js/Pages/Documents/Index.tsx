import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import CrmLayout from '@/Layouts/CrmLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

type DocRow = {
    id: number;
    title: string;
    original_name: string;
    category: string | null;
    mime_type: string | null;
    size: string;
    url: string | null;
    uploader: string | null;
    related: string | null;
    created_at: string | null;
};

type Option = { id: number; name: string };
type Cat = { value: string; label: string };

const fieldClass =
    'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

export default function DocumentsIndex({
    documents,
    leads,
    customers,
    stats,
    categories,
}: {
    documents: { data: DocRow[] };
    leads: Option[];
    customers: Option[];
    stats: { total: number; this_month: number };
    categories: Cat[];
}) {
    const flash = (usePage().props as { flash?: { success?: string } }).flash;
    const [showForm, setShowForm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        file: null as File | null,
        title: '',
        category: 'other',
        related_type: '' as string,
        related_id: '' as string | number,
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('documents.store'), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const relatedOptions =
        data.related_type === 'lead'
            ? leads
            : data.related_type === 'customer'
              ? customers
              : [];

    return (
        <CrmLayout title="Documents">
            <Head title="Documents" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {flash.success}
                </div>
            )}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">Documents</h2>
                    <p className="text-sm text-slate-500">
                        Contracts, invoices & files linked to leads or customers
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowForm(!showForm)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                    {showForm ? 'Close' : '+ Upload'}
                </button>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2">
                <StatCard label="Total documents" value={stats.total} />
                <StatCard label="Uploaded this month" value={stats.this_month} />
            </div>

            {showForm && (
                <form
                    onSubmit={submit}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                    <h3 className="font-semibold">Upload document</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="file" value="File * (max 10MB)" />
                            <input
                                id="file"
                                type="file"
                                className={fieldClass}
                                onChange={(e) =>
                                    setData('file', e.target.files?.[0] ?? null)
                                }
                                required
                            />
                            <InputError message={errors.file} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="title" value="Title" />
                            <TextInput
                                id="title"
                                value={data.title}
                                className={fieldClass}
                                onChange={(e) => setData('title', e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="category" value="Category" />
                            <select
                                id="category"
                                className={fieldClass}
                                value={data.category}
                                onChange={(e) => setData('category', e.target.value)}
                            >
                                {categories.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="related_type" value="Link to" />
                            <select
                                id="related_type"
                                className={fieldClass}
                                value={data.related_type}
                                onChange={(e) => {
                                    setData('related_type', e.target.value);
                                    setData('related_id', '');
                                }}
                            >
                                <option value="">None</option>
                                <option value="lead">Lead</option>
                                <option value="customer">Customer</option>
                            </select>
                        </div>
                        {data.related_type && (
                            <div>
                                <InputLabel htmlFor="related_id" value="Record" />
                                <select
                                    id="related_id"
                                    className={fieldClass}
                                    value={data.related_id}
                                    onChange={(e) =>
                                        setData('related_id', e.target.value)
                                    }
                                >
                                    <option value="">Select…</option>
                                    {relatedOptions.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {o.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
                    >
                        Upload
                    </button>
                </form>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3">Document</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Linked</th>
                            <th className="px-4 py-3">Size</th>
                            <th className="px-4 py-3">Uploaded by</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {documents.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                                    No documents yet. Upload a contract or invoice.
                                </td>
                            </tr>
                        ) : (
                            documents.data.map((d) => (
                                <tr key={d.id}>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{d.title}</div>
                                        <div className="text-xs text-slate-500">
                                            {d.original_name}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 capitalize">
                                        {(d.category ?? 'other').replace('_', ' ')}
                                    </td>
                                    <td className="px-4 py-3">{d.related || '—'}</td>
                                    <td className="px-4 py-3">{d.size}</td>
                                    <td className="px-4 py-3">{d.uploader || '—'}</td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <a
                                            href={route('documents.download', d.id)}
                                            className="text-xs font-semibold text-emerald-600"
                                        >
                                            Download
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.delete(
                                                    route('documents.destroy', d.id),
                                                )
                                            }
                                            className="text-xs font-semibold text-rose-600"
                                        >
                                            Delete
                                        </button>
                                    </td>
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
