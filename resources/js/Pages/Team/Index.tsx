import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import CrmLayout from '@/Layouts/CrmLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

type Member = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
    role: string | null;
    leads_count: number;
    deals_won: number;
    tasks_pending: number;
};

type PendingInvite = {
    id: number;
    name: string;
    email: string;
    role: string;
    role_label: string;
    expires_at: string | null;
};

type RoleOption = { value: string; label: string };

export default function TeamIndex({
    members,
    pendingInvites = [],
    roles,
    stats,
    canManage,
}: {
    members: Member[];
    pendingInvites?: PendingInvite[];
    roles: RoleOption[];
    stats: { total: number; active: number; pending?: number };
    canManage: boolean;
}) {
    const flash = (
        usePage().props as {
            flash?: {
                success?: string;
                error?: string;
            };
        }
    ).flash;
    const [showForm, setShowForm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        role: 'sales_executive',
    });

    const fieldClass =
        'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('team.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const changeRole = (memberId: number, role: string) => {
        router.patch(route('team.update-role', memberId), { role }, { preserveScroll: true });
    };

    const toggleActive = (memberId: number) => {
        router.post(route('team.toggle-active', memberId), {}, { preserveScroll: true });
    };

    const cancelInvite = (inviteId: number) => {
        router.delete(route('team.invites.cancel', inviteId), { preserveScroll: true });
    };

    return (
        <CrmLayout title="Team">
            <Head title="Team" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    {flash.error}
                </div>
            )}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">Team</h2>
                    <p className="text-sm text-slate-500">
                        Invite staff by email with a role — they create their own password and join your company
                    </p>
                </div>
                {canManage && (
                    <button
                        type="button"
                        onClick={() => setShowForm(!showForm)}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                        {showForm ? 'Close' : '+ Invite member'}
                    </button>
                )}
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <StatCard label="Team members" value={stats.total} />
                <StatCard label="Active" value={stats.active} />
                <StatCard label="Pending invites" value={stats.pending ?? pendingInvites.length} />
            </div>

            {showForm && canManage && (
                <form
                    onSubmit={submit}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                    <h3 className="font-semibold">Invite team member</h3>
                    <p className="mt-1 text-xs text-slate-500">
                        We'll email them a link to set their password and join as staff under your account.
                    </p>
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
                            <InputLabel htmlFor="email" value="Email *" />
                            <TextInput
                                id="email"
                                type="email"
                                value={data.email}
                                className={fieldClass}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                            <InputError message={errors.email} className="mt-1" />
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
                            <InputLabel htmlFor="role" value="Role *" />
                            <select
                                id="role"
                                className={fieldClass}
                                value={data.role}
                                onChange={(e) => setData('role', e.target.value)}
                            >
                                {roles.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {r.label}
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
                        Send invite email
                    </button>
                </form>
            )}

            {canManage && pendingInvites.length > 0 && (
                <div className="mb-6 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
                    <div className="border-b border-amber-200 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-900 dark:text-amber-200">
                        Pending invitations
                    </div>
                    <ul className="divide-y divide-amber-100 dark:divide-amber-900/50">
                        {pendingInvites.map((invite) => (
                            <li
                                key={invite.id}
                                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                            >
                                <div>
                                    <div className="font-medium">{invite.name}</div>
                                    <div className="text-xs text-slate-500">
                                        {invite.email} · {invite.role_label}
                                        {invite.expires_at ? ` · expires ${invite.expires_at}` : ''}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => cancelInvite(invite.id)}
                                    className="text-xs font-semibold text-rose-600 hover:underline"
                                >
                                    Cancel
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3">Member</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Leads</th>
                            <th className="px-4 py-3">Won</th>
                            <th className="px-4 py-3">Tasks</th>
                            <th className="px-4 py-3">Status</th>
                            {canManage && <th className="px-4 py-3">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {members.map((m) => (
                            <tr key={m.id} className={!m.is_active ? 'opacity-60' : ''}>
                                <td className="px-4 py-3">
                                    <div className="font-medium">{m.name}</div>
                                    <div className="text-xs text-slate-500">{m.email}</div>
                                </td>
                                <td className="px-4 py-3">
                                    {canManage ? (
                                        <select
                                            className="rounded-lg border-slate-200 text-xs dark:border-slate-700 dark:bg-slate-800"
                                            value={m.role ?? 'sales_executive'}
                                            onChange={(e) => changeRole(m.id, e.target.value)}
                                        >
                                            {roles.map((r) => (
                                                <option key={r.value} value={r.value}>
                                                    {r.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className="capitalize">
                                            {(m.role ?? '—').replace(/_/g, ' ')}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">{m.leads_count}</td>
                                <td className="px-4 py-3">{m.deals_won}</td>
                                <td className="px-4 py-3">{m.tasks_pending}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                            m.is_active
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        {m.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                {canManage && (
                                    <td className="px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleActive(m.id)}
                                            className="text-xs font-semibold text-emerald-600 hover:underline"
                                        >
                                            {m.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
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
