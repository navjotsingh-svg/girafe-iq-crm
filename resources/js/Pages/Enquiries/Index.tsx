import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PhoneTextInput from '@/Components/PhoneTextInput';
import TextInput from '@/Components/TextInput';
import CrmLayout from '@/Layouts/CrmLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

type EnquiryRow = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
    channel: string | null;
    message: string | null;
    source: string | null;
    assignee: string | null;
    lead_id: number | null;
    created_at: string | null;
    notes_count: number;
    follow_ups_count: number;
};

type Option = { id: number; name: string };
type Filters = {
    search: string;
    status: string;
    source: string;
    assignee: string;
};

const statusLabel: Record<string, string> = {
    new: 'New',
    in_progress: 'In progress',
    converted: 'Converted',
    junk: 'Junk',
};

const statusClass: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
    in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
    converted: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    junk: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export default function EnquiriesIndex({
    enquiries,
    filters,
    sources,
    team,
    stats,
    openCreate,
    roundRobinEnabled = false,
}: {
    enquiries: {
        data: EnquiryRow[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: Filters;
    sources: Option[];
    team: Option[];
    stats: { new: number; in_progress: number; converted: number };
    openCreate?: boolean;
    roundRobinEnabled?: boolean;
}) {
    const flash = (usePage().props as { flash?: { success?: string } }).flash;
    const [showForm, setShowForm] = useState(!!openCreate);
    const [showFilters, setShowFilters] = useState(() =>
        Object.values(filters).some((v) => v !== ''),
    );
    const [filterState, setFilterState] = useState<Filters>(filters);
    const [selected, setSelected] = useState<number[]>([]);

    useEffect(() => {
        if (openCreate) setShowForm(true);
    }, [openCreate]);

    useEffect(() => {
        setFilterState(filters);
    }, [filters]);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        lead_source_id: '' as string | number,
        channel: '',
        message: '',
        assigned_user_id: '' as string | number,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('enquiries.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const convert = (id: number) => {
        router.post(route('enquiries.convert', id));
    };

    const applyFilters = (next?: Partial<Filters>) => {
        const payload = { ...filterState, ...next };
        setFilterState(payload);
        router.get(route('enquiries.index'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        const empty = { search: '', status: '', source: '', assignee: '' };
        setFilterState(empty);
        router.get(route('enquiries.index'), empty, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const bulkConvert = () => {
        if (selected.length === 0) return;
        router.post(
            route('enquiries.bulk-convert'),
            { ids: selected },
            {
                preserveScroll: true,
                onSuccess: () => setSelected([]),
            },
        );
    };

    const toggleSelected = (id: number) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const selectableIds = useMemo(
        () => enquiries.data.filter((e) => e.status !== 'converted').map((e) => e.id),
        [enquiries.data],
    );

    const toggleAll = () => {
        const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.includes(id));
        setSelected(allSelected ? [] : selectableIds);
    };

    const fieldClass =
        'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

    return (
        <CrmLayout title="Enquiries">
            <Head title="Enquiries" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {flash.success}
                </div>
            )}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">Marketing Enquiries</h2>
                    <p className="text-sm text-slate-500">
                        Capture walk-ins, calls, ads & website leads
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowForm(!showForm)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                    {showForm ? 'Close form' : '+ Add enquiry'}
                </button>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <StatCard label="New" value={stats.new} />
                <StatCard label="In progress" value={stats.in_progress} />
                <StatCard label="Converted" value={stats.converted} />
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => setShowFilters((v) => !v)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                        showFilters
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200'
                    }`}
                >
                    Filters
                </button>
                <button
                    type="button"
                    onClick={bulkConvert}
                    disabled={selected.length === 0}
                    className="rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-40"
                >
                    Convert selected ({selected.length})
                </button>
            </div>

            {showFilters && (
                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="grid gap-3 lg:grid-cols-4">
                        <div>
                            <InputLabel htmlFor="enquiry_search" value="Search" />
                            <TextInput
                                id="enquiry_search"
                                value={filterState.search}
                                className={fieldClass}
                                placeholder="Name, phone, email, channel..."
                                onChange={(e) =>
                                    setFilterState((s) => ({ ...s, search: e.target.value }))
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
                            <InputLabel htmlFor="filter_status" value="Status" />
                            <select
                                id="filter_status"
                                className={fieldClass}
                                value={filterState.status}
                                onChange={(e) => applyFilters({ status: e.target.value })}
                            >
                                <option value="">All statuses</option>
                                <option value="new">New</option>
                                <option value="in_progress">In progress</option>
                                <option value="converted">Converted</option>
                                <option value="junk">Junk</option>
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="filter_source" value="Source" />
                            <select
                                id="filter_source"
                                className={fieldClass}
                                value={filterState.source}
                                onChange={(e) => applyFilters({ source: e.target.value })}
                            >
                                <option value="">All sources</option>
                                {sources.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="filter_assignee" value="Assignee" />
                            <select
                                id="filter_assignee"
                                className={fieldClass}
                                value={filterState.assignee}
                                onChange={(e) => applyFilters({ assignee: e.target.value })}
                            >
                                <option value="">All team</option>
                                {team.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => applyFilters()}
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-emerald-600"
                        >
                            Search
                        </button>
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {showForm && (
                <form
                    onSubmit={submit}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                    <h3 className="font-semibold">Add first enquiry</h3>
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
                            <PhoneTextInput
                                id="phone"
                                value={data.phone}
                                className={fieldClass}
                                onChange={(e) => setData('phone', e.target.value)}
                            />
                            <InputError message={errors.phone} className="mt-1" />
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
                            <InputLabel htmlFor="lead_source_id" value="Source" />
                            <select
                                id="lead_source_id"
                                className={fieldClass}
                                value={data.lead_source_id}
                                onChange={(e) =>
                                    setData('lead_source_id', e.target.value)
                                }
                            >
                                <option value="">Select source</option>
                                {sources.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="channel" value="Channel" />
                            <TextInput
                                id="channel"
                                placeholder="Walk-in, Phone, Website…"
                                value={data.channel}
                                className={fieldClass}
                                onChange={(e) => setData('channel', e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="assigned_user_id" value="Assign to" />
                            <select
                                id="assigned_user_id"
                                className={fieldClass}
                                value={data.assigned_user_id}
                                onChange={(e) =>
                                    setData('assigned_user_id', e.target.value)
                                }
                            >
                                <option value="">
                                    {roundRobinEnabled
                                        ? 'Auto (round robin)'
                                        : 'Auto assign me'}
                                </option>
                                {team.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="message" value="Message / Notes" />
                            <textarea
                                id="message"
                                rows={3}
                                className={fieldClass}
                                value={data.message}
                                onChange={(e) => setData('message', e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        Save enquiry
                    </button>
                </form>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={
                                        selectableIds.length > 0 &&
                                        selectableIds.every((id) => selected.includes(id))
                                    }
                                    onChange={toggleAll}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                            </th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Contact</th>
                            <th className="px-4 py-3">Source</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Assignee</th>
                            <th className="px-4 py-3">Captured</th>
                            <th className="px-4 py-3">Activity</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {enquiries.data.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                                    No enquiries yet. Add your first enquiry above.
                                </td>
                            </tr>
                        ) : (
                            enquiries.data.map((e) => (
                                <tr key={e.id}>
                                    <td className="px-4 py-3">
                                        {e.status !== 'converted' ? (
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(e.id)}
                                                onChange={() => toggleSelected(e.id)}
                                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                        ) : null}
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        <Link
                                            href={route('enquiries.show', e.id)}
                                            className="text-emerald-700 hover:text-emerald-600 dark:text-emerald-400"
                                        >
                                            {e.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">
                                        {e.phone || e.email || '—'}
                                    </td>
                                    <td className="px-4 py-3">{e.source || '—'}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass[e.status] ?? ''}`}
                                        >
                                            {statusLabel[e.status] ?? e.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{e.assignee || '—'}</td>
                                    <td className="px-4 py-3 text-slate-500">
                                        {e.created_at || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-500">
                                        {e.notes_count > 0 || e.follow_ups_count > 0 || e.message ? (
                                            <div className="space-y-0.5">
                                                {e.message ? <div>Has message</div> : null}
                                                {e.notes_count > 0 ? (
                                                    <div>
                                                        {e.notes_count} comment
                                                        {e.notes_count === 1 ? '' : 's'}
                                                    </div>
                                                ) : null}
                                                {e.follow_ups_count > 0 ? (
                                                    <div>
                                                        {e.follow_ups_count} follow-up
                                                        {e.follow_ups_count === 1 ? '' : 's'}
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {e.status === 'converted' ? (
                                            <Link
                                                href={e.lead_id ? route('leads.show', e.lead_id) : route('leads.index')}
                                                className="text-xs font-semibold text-emerald-600"
                                            >
                                                View lead
                                            </Link>
                                        ) : (
                                            <div className="flex flex-col items-end gap-1">
                                                <Link
                                                    href={route('enquiries.show', e.id)}
                                                    className="text-xs font-semibold text-slate-600 hover:text-emerald-600"
                                                >
                                                    Open
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => convert(e.id)}
                                                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-500"
                                                >
                                                    Convert to lead
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {enquiries.links?.length > 1 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {enquiries.links.map((link, i) => (
                        <button
                            key={`${link.label}-${i}`}
                            type="button"
                            disabled={!link.url}
                            onClick={() =>
                                link.url &&
                                router.visit(link.url, {
                                    preserveScroll: true,
                                    preserveState: true,
                                })
                            }
                            className={`rounded-lg px-3 py-1.5 text-sm ${
                                link.active
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 text-slate-600 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
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
