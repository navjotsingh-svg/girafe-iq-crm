import CrmLayout from '@/Layouts/CrmLayout';
import { Head, Link, router } from '@inertiajs/react';

type DocDetail = {
    id: number;
    uuid: string;
    title: string;
    original_name: string;
    category: string | null;
    mime_type: string | null;
    size: string;
    url: string | null;
    notes: string | null;
    uploader: string | null;
    uploader_email: string | null;
    related: string | null;
    related_href: string | null;
    is_deleted: boolean;
    created_at: string | null;
    created_at_human: string | null;
    deleted_at_human: string | null;
};

type HistoryRow = {
    id: number;
    action: string;
    label: string;
    user: string;
    properties: Record<string, unknown> | null;
    created_at: string | null;
    created_at_human: string | null;
};

export default function DocumentsShow({
    document,
    history,
    can_manage,
}: {
    document: DocDetail;
    history: HistoryRow[];
    is_admin: boolean;
    can_manage: boolean;
}) {
    return (
        <CrmLayout title={document.title}>
            <Head title={document.title} />

            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <Link
                        href={route('documents.index')}
                        className="text-xs font-semibold text-emerald-700"
                    >
                        ← All documents
                    </Link>
                    <h2 className="mt-2 text-xl font-bold">{document.title}</h2>
                    <p className="text-sm text-slate-500">{document.original_name}</p>
                    {document.is_deleted && (
                        <span className="mt-2 inline-block rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                            Deleted{document.deleted_at_human ? ` · ${document.deleted_at_human}` : ''}
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    {!document.is_deleted && (
                        <a
                            href={route('documents.download', document.id)}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                            Download
                        </a>
                    )}
                    {can_manage && !document.is_deleted && (
                        <button
                            type="button"
                            onClick={() =>
                                router.delete(route('documents.destroy', document.id))
                            }
                            className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
                    <h3 className="font-semibold">Details</h3>
                    <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                        <div>
                            <dt className="text-xs uppercase text-slate-500">Uploaded by</dt>
                            <dd className="mt-0.5 font-medium">
                                {document.uploader || '—'}
                                {document.uploader_email && (
                                    <div className="text-xs font-normal text-slate-500">
                                        {document.uploader_email}
                                    </div>
                                )}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase text-slate-500">Uploaded at</dt>
                            <dd className="mt-0.5 font-medium">
                                {document.created_at_human || '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase text-slate-500">Category</dt>
                            <dd className="mt-0.5 font-medium capitalize">
                                {(document.category ?? 'other').replace('_', ' ')}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase text-slate-500">Size / type</dt>
                            <dd className="mt-0.5 font-medium">
                                {document.size}
                                {document.mime_type ? ` · ${document.mime_type}` : ''}
                            </dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="text-xs uppercase text-slate-500">Linked record</dt>
                            <dd className="mt-0.5 font-medium">
                                {document.related_href ? (
                                    <Link
                                        href={document.related_href}
                                        className="text-emerald-700 hover:underline"
                                    >
                                        {document.related}
                                    </Link>
                                ) : (
                                    document.related || '—'
                                )}
                            </dd>
                        </div>
                        {document.notes && (
                            <div className="sm:col-span-2">
                                <dt className="text-xs uppercase text-slate-500">Notes</dt>
                                <dd className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                                    {document.notes}
                                </dd>
                            </div>
                        )}
                    </dl>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-semibold">History</h3>
                    <p className="mt-1 text-xs text-slate-500">
                        Upload and delete activity for this file
                    </p>
                    {history.length === 0 ? (
                        <p className="mt-6 text-sm text-slate-500">No activity recorded.</p>
                    ) : (
                        <ul className="mt-4 space-y-4">
                            {history.map((h) => (
                                <li key={h.id} className="relative border-l-2 border-slate-200 pl-4 dark:border-slate-700">
                                    <span
                                        className={`absolute -left-1.5 top-1 h-3 w-3 rounded-full ${
                                            h.action === 'document.deleted'
                                                ? 'bg-rose-500'
                                                : 'bg-emerald-500'
                                        }`}
                                    />
                                    <div className="text-sm font-semibold">{h.label}</div>
                                    <div className="text-xs text-slate-500">
                                        by {h.user} · {h.created_at_human}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </CrmLayout>
    );
}
