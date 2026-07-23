import CustomFieldInputs, { CustomFieldDef } from '@/Components/CustomFieldInputs';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import CrmLayout from '@/Layouts/CrmLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

type LeadRow = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    temperature: string;
    status: { name: string; color: string } | null;
    source: string | null;
    assignee: string | null;
    next_follow_up_at: string | null;
    created_at: string | null;
    custom_fields: Record<string, string | boolean | number | null>;
};

type Option = { id: number; name: string; color?: string };

type Filters = {
    search: string;
    status: string;
    temperature: string;
    source: string;
    assignee: string;
    follow_up: string;
};

type PaginatedLeads = {
    data: LeadRow[];
    links: { url: string | null; label: string; active: boolean }[];
    from: number | null;
    to: number | null;
    total: number;
};

const COLUMN_STORAGE_KEY = 'girafe-lead-list-columns';

export default function LeadsIndex({
    leads,
    filters,
    statuses,
    sources,
    team,
    leadFields = [],
    stats,
    roundRobinEnabled = false,
}: {
    leads: PaginatedLeads;
    filters: Filters;
    statuses: Option[];
    sources: Option[];
    team: Option[];
    leadFields?: CustomFieldDef[];
    stats: { total: number; hot: number; due_today: number };
    roundRobinEnabled?: boolean;
}) {
    const flash = (usePage().props as { flash?: { success?: string } }).flash;
    const [showForm, setShowForm] = useState(false);
    const [showColumns, setShowColumns] = useState(false);
    const [showFilters, setShowFilters] = useState(() =>
        Object.values(filters).some((v) => v !== '' && v != null),
    );
    const [filterState, setFilterState] = useState<Filters>({
        follow_up: '',
        ...filters,
    });

    const defaultVisibleKeys = useMemo(
        () => leadFields.filter((f) => f.show_in_list).map((f) => f.key),
        [leadFields],
    );

    const [visibleFieldKeys, setVisibleFieldKeys] = useState<string[]>(defaultVisibleKeys);

    useEffect(() => {
        setFilterState(filters);
    }, [filters]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(COLUMN_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as string[];
                const valid = parsed.filter((key) =>
                    leadFields.some((f) => f.key === key),
                );
                setVisibleFieldKeys(valid.length ? valid : defaultVisibleKeys);
                return;
            }
        } catch {
            // ignore
        }
        setVisibleFieldKeys(defaultVisibleKeys);
    }, [leadFields, defaultVisibleKeys]);

    const visibleFields = useMemo(
        () => leadFields.filter((f) => visibleFieldKeys.includes(f.key)),
        [leadFields, visibleFieldKeys],
    );

    const toggleColumn = (key: string) => {
        setVisibleFieldKeys((prev) => {
            const next = prev.includes(key)
                ? prev.filter((k) => k !== key)
                : [...prev, key];
            localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    };

    const emptyCustomFields = useMemo(() => {
        const values: Record<string, string | boolean | number> = {};
        leadFields.forEach((f) => {
            values[f.key] = f.type === 'boolean' ? false : '';
        });
        return values;
    }, [leadFields]);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        lead_status_id: '' as string | number,
        lead_source_id: '' as string | number,
        temperature: 'warm',
        next_follow_up_at: '',
        notes: '',
        assigned_user_id: '' as string | number,
        custom_fields: emptyCustomFields,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('leads.store'), {
            onSuccess: () => {
                reset();
                setData('custom_fields', emptyCustomFields);
                setShowForm(false);
            },
        });
    };

    const applyFilters = (next?: Partial<Filters>) => {
        const payload = { ...filterState, ...next };
        setFilterState(payload);
        router.get(route('leads.index'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        const empty: Filters = {
            search: '',
            status: '',
            temperature: '',
            source: '',
            assignee: '',
            follow_up: '',
        };
        setFilterState(empty);
        router.get(route('leads.index'), empty, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const applyQuickStat = (kind: 'total' | 'hot' | 'due_today') => {
        const next: Filters = {
            search: filterState.search,
            status: '',
            temperature: kind === 'hot' ? 'hot' : '',
            source: '',
            assignee: '',
            follow_up: kind === 'due_today' ? 'today' : '',
        };
        applyFilters(next);
    };

    const hasActiveFilters = Object.values(filters).some((v) => v !== '' && v != null);
    const activeStat =
        filters.follow_up === 'today'
            ? 'due_today'
            : filters.temperature === 'hot'
              ? 'hot'
              : !hasActiveFilters
                ? 'total'
                : null;

    const fieldClass =
        'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

    const tempClass: Record<string, string> = {
        cold: 'bg-sky-100 text-sky-800',
        warm: 'bg-amber-100 text-amber-800',
        hot: 'bg-rose-100 text-rose-800',
    };

    const formatCustomValue = (
        field: CustomFieldDef,
        value: string | boolean | number | null | undefined,
    ) => {
        if (field.type === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        if (value == null || value === '') {
            return '—';
        }
        return String(value);
    };

    const colSpan = 6 + visibleFields.length;

    return (
        <CrmLayout title="Leads">
            <Head title="Leads" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {flash.success}
                </div>
            )}

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                    <h2 className="text-xl font-bold">Leads</h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <StatLink
                            label="Total"
                            value={stats.total}
                            active={activeStat === 'total'}
                            onClick={() => applyQuickStat('total')}
                        />
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <StatLink
                            label="Hot"
                            value={stats.hot}
                            active={activeStat === 'hot'}
                            onClick={() => applyQuickStat('hot')}
                        />
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <StatLink
                            label="Follow-ups today"
                            value={stats.due_today}
                            active={activeStat === 'due_today'}
                            onClick={() => applyQuickStat('due_today')}
                        />
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowColumns(!showColumns)}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                        >
                            Fields
                        </button>
                        {showColumns && (
                            <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    List columns
                                </p>
                                {leadFields.length === 0 ? (
                                    <p className="text-xs text-slate-500">
                                        No custom fields yet. Add them in Settings → Lead
                                        fields.
                                    </p>
                                ) : (
                                    <ul className="max-h-64 space-y-2 overflow-y-auto">
                                        {leadFields.map((field) => (
                                            <li key={field.id}>
                                                <label className="flex cursor-pointer items-start gap-2 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={visibleFieldKeys.includes(
                                                            field.key,
                                                        )}
                                                        onChange={() =>
                                                            toggleColumn(field.key)
                                                        }
                                                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                    <span>
                                                        <span className="font-medium text-slate-800 dark:text-slate-100">
                                                            {field.name}
                                                        </span>
                                                        <span className="mt-0.5 block text-[11px] uppercase tracking-wide text-slate-400">
                                                            {field.type}
                                                            {field.show_in_list
                                                                ? ' · default on'
                                                                : ''}
                                                        </span>
                                                    </span>
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowForm(!showForm)}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                        {showForm ? 'Close' : '+ Add lead'}
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="grid gap-3 lg:grid-cols-6">
                        <div className="lg:col-span-2">
                            <InputLabel htmlFor="lead_search" value="Search" />
                            <TextInput
                                id="lead_search"
                                value={filterState.search}
                                className={fieldClass}
                                placeholder="Name, email, or phone"
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
                                onChange={(e) =>
                                    applyFilters({ status: e.target.value })
                                }
                            >
                                <option value="">All statuses</option>
                                {statuses.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="filter_temp" value="Temperature" />
                            <select
                                id="filter_temp"
                                className={fieldClass}
                                value={filterState.temperature}
                                onChange={(e) =>
                                    applyFilters({
                                        temperature: e.target.value,
                                        follow_up: '',
                                    })
                                }
                            >
                                <option value="">All</option>
                                <option value="cold">Cold</option>
                                <option value="warm">Warm</option>
                                <option value="hot">Hot</option>
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="filter_source" value="Source" />
                            <select
                                id="filter_source"
                                className={fieldClass}
                                value={filterState.source}
                                onChange={(e) =>
                                    applyFilters({ source: e.target.value })
                                }
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
                                onChange={(e) =>
                                    applyFilters({ assignee: e.target.value })
                                }
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
                    </div>
                </div>
            )}

            {showForm && (
                <form
                    onSubmit={submit}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                    <h3 className="font-semibold">New lead</h3>
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
                            <InputLabel htmlFor="phone" value="Mobile *" />
                            <TextInput
                                id="phone"
                                value={data.phone}
                                className={fieldClass}
                                onChange={(e) => setData('phone', e.target.value)}
                                required
                                placeholder="Mobile number"
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
                            <InputLabel htmlFor="lead_status_id" value="Status" />
                            <select
                                id="lead_status_id"
                                className={fieldClass}
                                value={data.lead_status_id}
                                onChange={(e) =>
                                    setData('lead_status_id', e.target.value)
                                }
                            >
                                <option value="">Default status</option>
                                {statuses.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="temperature" value="Temperature" />
                            <select
                                id="temperature"
                                className={fieldClass}
                                value={data.temperature}
                                onChange={(e) =>
                                    setData('temperature', e.target.value)
                                }
                            >
                                <option value="cold">Cold</option>
                                <option value="warm">Warm</option>
                                <option value="hot">Hot</option>
                            </select>
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
                                        : 'Assign to me'}
                                </option>
                                {team.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.assigned_user_id} className="mt-1" />
                        </div>

                        <CustomFieldInputs
                            fields={leadFields}
                            values={data.custom_fields}
                            fieldClass={fieldClass}
                            onChange={(key, value) =>
                                setData('custom_fields', {
                                    ...data.custom_fields,
                                    [key]: value,
                                })
                            }
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
                    >
                        Save lead
                    </button>
                </form>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3">Lead</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Temp</th>
                                <th className="px-4 py-3">Source</th>
                                <th className="px-4 py-3">Assignee</th>
                                {visibleFields.map((field) => (
                                    <th key={field.key} className="px-4 py-3">
                                        <div>{field.name}</div>
                                        <div className="font-normal normal-case tracking-normal text-[10px] text-slate-400">
                                            {field.type}
                                        </div>
                                    </th>
                                ))}
                                <th className="px-4 py-3">Next follow-up</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {leads.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={colSpan}
                                        className="px-4 py-10 text-center text-slate-500"
                                    >
                                        {hasActiveFilters
                                            ? 'No leads match your search/filters.'
                                            : 'No leads yet. Convert an enquiry or add a lead.'}
                                    </td>
                                </tr>
                            ) : (
                                leads.data.map((l) => (
                                    <tr key={l.id}>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={route('leads.show', l.id)}
                                                className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                                            >
                                                {l.name}
                                            </Link>
                                            <div className="text-xs text-slate-500">
                                                {l.phone || l.email || '—'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {l.status ? (
                                                <span
                                                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                                                    style={{
                                                        backgroundColor: `${l.status.color}22`,
                                                        color: l.status.color,
                                                    }}
                                                >
                                                    {l.status.name}
                                                </span>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${tempClass[l.temperature] ?? ''}`}
                                            >
                                                {l.temperature}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{l.source || '—'}</td>
                                        <td className="px-4 py-3">{l.assignee || '—'}</td>
                                        {visibleFields.map((field) => (
                                            <td
                                                key={field.key}
                                                className="px-4 py-3 text-slate-600 dark:text-slate-300"
                                            >
                                                {formatCustomValue(
                                                    field,
                                                    l.custom_fields?.[field.key],
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 text-slate-500">
                                            {l.next_follow_up_at
                                                ? new Date(
                                                      l.next_follow_up_at,
                                                  ).toLocaleDateString()
                                                : '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {leads.links.length > 3 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs dark:border-slate-800">
                        <span className="text-slate-500">
                            {leads.from && leads.to
                                ? `Showing ${leads.from}–${leads.to} of ${leads.total}`
                                : `${leads.total} leads`}
                        </span>
                        <div className="flex flex-wrap gap-1">
                            {leads.links.map((link, i) => (
                                <button
                                    key={`${link.label}-${i}`}
                                    type="button"
                                    disabled={!link.url || link.active}
                                    onClick={() =>
                                        link.url &&
                                        router.get(link.url, {}, { preserveScroll: true })
                                    }
                                    className={`rounded-md px-2.5 py-1 ${
                                        link.active
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-100 text-slate-600 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </CrmLayout>
    );
}

function StatLink({
    label,
    value,
    active,
    onClick,
}: {
    label: string;
    value: number;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-baseline gap-1.5 rounded-md px-1 py-0.5 transition ${
                active
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
        >
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {label}
            </span>
            <span className={`text-base font-bold tabular-nums ${active ? 'underline decoration-emerald-400 underline-offset-4' : ''}`}>
                {value}
            </span>
        </button>
    );
}
