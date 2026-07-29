import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import CrmLayout from '@/Layouts/CrmLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

type DocRow = {
    id: number;
    title: string;
    original_name: string;
    category: string | null;
    mime_type: string | null;
    size: string;
    url: string | null;
    uploader: string | null;
    uploader_email: string | null;
    related: string | null;
    related_href: string | null;
    notes: string | null;
    is_deleted: boolean;
    created_at: string | null;
    created_at_human: string | null;
    deleted_at: string | null;
};

type HistoryRow = {
    id: number;
    action: string;
    label: string;
    user: string;
    title: string;
    original_name: string | null;
    category: string | null;
    document_id: number | null;
    created_at: string | null;
    created_at_human: string | null;
};

type Option = { id: number; name: string };
type Cat = { value: string; label: string };

type Filters = {
    search: string;
    category: string;
    uploader: string;
    related: string;
    include_deleted: boolean;
};

type Paginated = {
    data: DocRow[];
    links: { url: string | null; label: string; active: boolean }[];
    from: number | null;
    to: number | null;
    total: number;
};

const fieldClass =
    'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

export default function DocumentsIndex({
    documents,
    history,
    filters,
    is_admin,
    can_manage,
    leads,
    customers,
    uploaders,
    stats,
    categories,
}: {
    documents: Paginated;
    history: HistoryRow[];
    filters: Filters;
    is_admin: boolean;
    can_manage: boolean;
    leads: Option[];
    customers: Option[];
    uploaders: Option[];
    stats: { total: number; this_month: number; deleted: number; uploaders: number };
    categories: Cat[];
}) {
    const flash = (usePage().props as { flash?: { success?: string } }).flash;
    const [showForm, setShowForm] = useState(false);
    const [showFilters, setShowFilters] = useState(() =>
        Boolean(
            filters.search ||
                filters.category ||
                filters.uploader ||
                filters.related ||
                filters.include_deleted,
        ),
    );
    const [tab, setTab] = useState<'documents' | 'history'>('documents');
    const [filterState, setFilterState] = useState<Filters>({ ...filters });

    useEffect(() => {
        setFilterState(filters);
    }, [filters]);

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

    const applyFilters = (patch: Partial<Filters> = {}) => {
        const next = { ...filterState, ...patch };
        setFilterState(next);
        setTab('documents');
        router.get(
            route('documents.index'),
            {
                search: next.search || undefined,
                category: next.category || undefined,
                uploader: next.uploader || undefined,
                related: next.related || undefined,
                include_deleted: next.include_deleted ? 1 : undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        setFilterState({
            search: '',
            category: '',
            uploader: '',
            related: '',
            include_deleted: false,
        });
        router.get(route('documents.index'), {}, { preserveState: true, replace: true });
    };

    const hasActiveFilters = useMemo(
        () =>
            Boolean(
                filters.search ||
                    filters.category ||
                    filters.uploader ||
                    filters.related ||
                    filters.include_deleted,
            ),
        [filters],
    );

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

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                    <h2 className="text-xl font-bold">Documents</h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
                        <span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {stats.total}
                            </span>{' '}
                            total
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {stats.this_month}
                            </span>{' '}
                            this month
                        </span>
                        {is_admin && (
                            <>
                                <span className="text-slate-300 dark:text-slate-700">·</span>
                                <span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                                        {stats.uploaders}
                                    </span>{' '}
                                    uploaders
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {tab === 'documents' && (
                        <button
                            type="button"
                            onClick={() => setShowFilters((v) => !v)}
                            className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                                showFilters || hasActiveFilters
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                                    : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200'
                            }`}
                        >
                            Filters{hasActiveFilters ? ' · on' : ''}
                        </button>
                    )}
                    {is_admin && (
                        <button
                            type="button"
                            onClick={() =>
                                setTab((t) => (t === 'history' ? 'documents' : 'history'))
                            }
                            className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                                tab === 'history'
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                                    : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200'
                            }`}
                        >
                            {tab === 'history' ? 'All documents' : 'History'}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowForm(!showForm)}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                        {showForm ? 'Close' : '+ Upload'}
                    </button>
                </div>
            </div>

            {tab === 'documents' && showFilters && (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div
                        className={`grid gap-3 sm:grid-cols-2 ${
                            is_admin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
                        }`}
                    >
                        <div>
                            <InputLabel htmlFor="doc_search" value="Search" />
                            <TextInput
                                id="doc_search"
                                value={filterState.search}
                                className={fieldClass}
                                placeholder="Title or file name"
                                onChange={(e) =>
                                    setFilterState((s) => ({
                                        ...s,
                                        search: e.target.value,
                                    }))
                                }
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        applyFilters();
                                    }
                                }}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="filter_category" value="Category" />
                            <select
                                id="filter_category"
                                className={fieldClass}
                                value={filterState.category}
                                onChange={(e) =>
                                    applyFilters({ category: e.target.value })
                                }
                            >
                                <option value="">All categories</option>
                                {categories.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {is_admin && (
                            <div>
                                <InputLabel htmlFor="filter_uploader" value="Uploaded by" />
                                <select
                                    id="filter_uploader"
                                    className={fieldClass}
                                    value={filterState.uploader}
                                    onChange={(e) =>
                                        applyFilters({ uploader: e.target.value })
                                    }
                                >
                                    <option value="">Anyone</option>
                                    {uploaders.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <InputLabel htmlFor="filter_related" value="Linked to" />
                            <select
                                id="filter_related"
                                className={fieldClass}
                                value={filterState.related}
                                onChange={(e) =>
                                    applyFilters({ related: e.target.value })
                                }
                            >
                                <option value="">All records</option>
                                <option value="lead">Lead</option>
                                <option value="customer">Customer</option>
                                <option value="none">Unlinked</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => applyFilters()}
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-emerald-600"
                        >
                            Search
                        </button>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                            >
                                Clear filters
                            </button>
                        )}
                        {is_admin && (
                            <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={filterState.include_deleted}
                                    onChange={(e) =>
                                        applyFilters({
                                            include_deleted: e.target.checked,
                                        })
                                    }
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                Show deleted
                                {stats.deleted > 0 ? ` (${stats.deleted})` : ''}
                            </label>
                        )}
                    </div>
                </div>
            )}

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
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="notes" value="Notes" />
                            <TextInput
                                id="notes"
                                value={data.notes}
                                className={fieldClass}
                                onChange={(e) => setData('notes', e.target.value)}
                            />
                        </div>
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

            {tab === 'history' && is_admin ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                        <h3 className="font-semibold">Document activity history</h3>
                        <p className="text-xs text-slate-500">
                            Who uploaded or deleted each file (latest 50 events)
                        </p>
                    </div>
                    {history.length === 0 ? (
                        <p className="px-4 py-10 text-center text-sm text-slate-500">
                            No document activity yet.
                        </p>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {history.map((h) => (
                                <li
                                    key={h.id}
                                    className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
                                >
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                                    h.action === 'document.deleted'
                                                        ? 'bg-rose-50 text-rose-700'
                                                        : 'bg-emerald-50 text-emerald-700'
                                                }`}
                                            >
                                                {h.label}
                                            </span>
                                            {h.document_id ? (
                                                <Link
                                                    href={route('documents.show', h.document_id)}
                                                    className="font-medium text-slate-900 hover:text-emerald-700 dark:text-slate-100"
                                                >
                                                    {h.title}
                                                </Link>
                                            ) : (
                                                <span className="font-medium">{h.title}</span>
                                            )}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            by <span className="font-medium text-slate-700 dark:text-slate-300">{h.user}</span>
                                            {h.original_name ? ` · ${h.original_name}` : ''}
                                            {h.category ? ` · ${h.category.replace('_', ' ')}` : ''}
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-500">{h.created_at_human}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : (
                <>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-4 py-3">Document</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Linked</th>
                                    {is_admin && (
                                        <th className="px-4 py-3">Uploaded by</th>
                                    )}
                                    <th className="px-4 py-3">Uploaded at</th>
                                    <th className="px-4 py-3">Size</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {documents.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={is_admin ? 7 : 6}
                                            className="px-4 py-10 text-center text-slate-500"
                                        >
                                            {hasActiveFilters
                                                ? 'No documents match your filters.'
                                                : 'No documents yet. Upload a contract or invoice.'}
                                        </td>
                                    </tr>
                                ) : (
                                    documents.data.map((d) => (
                                        <tr
                                            key={d.id}
                                            className={d.is_deleted ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}
                                        >
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={route('documents.show', d.id)}
                                                    className="font-medium hover:text-emerald-700"
                                                >
                                                    {d.title}
                                                </Link>
                                                <div className="text-xs text-slate-500">
                                                    {d.original_name}
                                                    {d.is_deleted && (
                                                        <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-rose-700">
                                                            Deleted
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 capitalize">
                                                {(d.category ?? 'other').replace('_', ' ')}
                                            </td>
                                            <td className="px-4 py-3">
                                                {d.related_href ? (
                                                    <Link
                                                        href={d.related_href}
                                                        className="text-emerald-700 hover:underline"
                                                    >
                                                        {d.related}
                                                    </Link>
                                                ) : (
                                                    d.related || '—'
                                                )}
                                            </td>
                                            {is_admin && (
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">
                                                        {d.uploader || '—'}
                                                    </div>
                                                    {d.uploader_email && (
                                                        <div className="text-xs text-slate-500">
                                                            {d.uploader_email}
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                                                {d.created_at_human || '—'}
                                            </td>
                                            <td className="px-4 py-3">{d.size}</td>
                                            <td className="space-x-2 px-4 py-3 text-right">
                                                {is_admin && (
                                                    <Link
                                                        href={route('documents.show', d.id)}
                                                        className="text-xs font-semibold text-slate-600"
                                                    >
                                                        History
                                                    </Link>
                                                )}
                                                {!d.is_deleted && (
                                                    <a
                                                        href={route('documents.download', d.id)}
                                                        className="text-xs font-semibold text-emerald-600"
                                                    >
                                                        Download
                                                    </a>
                                                )}
                                                {can_manage && !d.is_deleted && (
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
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {documents.links.length > 3 && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
                            <div>
                                {documents.from != null &&
                                    `Showing ${documents.from}–${documents.to} of ${documents.total}`}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {documents.links.map((link, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        className={`rounded-lg px-3 py-1 text-xs font-medium ${
                                            link.active
                                                ? 'bg-emerald-600 text-white'
                                                : 'border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                                        } disabled:opacity-40`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </CrmLayout>
    );
}
