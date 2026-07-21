import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import CrmLayout from '@/Layouts/CrmLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

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

function useCanInviteStaff(canManageProp?: boolean): boolean {
    const page = usePage().props as {
        auth?: {
            user?: {
                roles?: string[] | Record<string, string>;
                can_manage_team?: boolean;
            };
        };
    };

    if (canManageProp === true || page.auth?.user?.can_manage_team === true) {
        return true;
    }

    const raw = page.auth?.user?.roles ?? [];
    const roles = Array.isArray(raw) ? raw : Object.values(raw);

    return roles.some((r) =>
        ['company_admin', 'super_admin', 'manager', 'sales_manager'].includes(String(r)),
    );
}

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
    canManage?: boolean;
}) {
    const flash = (
        usePage().props as {
            flash?: {
                success?: string;
                error?: string;
            };
        }
    ).flash;

    const canInvite = useCanInviteStaff(canManage);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        phone: '',
        role: roles[0]?.value ?? 'sales_executive',
    });

    const fieldClass =
        'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

    const roleOptions =
        roles.length > 0
            ? roles
            : [
                  { value: 'sales_executive', label: 'Sales Executive' },
                  { value: 'manager', label: 'Manager' },
                  { value: 'company_admin', label: 'Company Admin' },
              ];

    const closeInviteModal = () => {
        setShowInviteModal(false);
        reset();
        clearErrors();
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/team', {
            preserveScroll: true,
            onSuccess: () => closeInviteModal(),
        });
    };

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            setShowInviteModal(true);
        }
    }, [errors]);

    const changeRole = (memberId: number, role: string) => {
        router.patch(`/team/${memberId}/role`, { role }, { preserveScroll: true });
    };

    const toggleActive = (memberId: number) => {
        router.post(`/team/${memberId}/toggle-active`, {}, { preserveScroll: true });
    };

    const cancelInvite = (inviteId: number) => {
        router.delete(`/team/invites/${inviteId}`, { preserveScroll: true });
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
                        Invite staff by email with a role — they create their own password and join
                        your company.
                    </p>
                </div>
                {canInvite && (
                    <button
                        type="button"
                        onClick={() => setShowInviteModal(true)}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                        + Invite member
                    </button>
                )}
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <StatCard label="Team members" value={stats.total} />
                <StatCard label="Active" value={stats.active} />
                <StatCard
                    label="Pending invites"
                    value={stats.pending ?? pendingInvites.length}
                />
            </div>

            <Modal show={showInviteModal} onClose={closeInviteModal} maxWidth="lg">
                <form onSubmit={submit} className="relative overflow-hidden">
                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 px-6 pb-8 pt-6 text-white">
                        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                        <div className="pointer-events-none absolute bottom-0 left-1/3 h-24 w-48 rounded-full bg-teal-300/20 blur-2xl" />
                        <div
                            className="pointer-events-none absolute inset-0 opacity-20"
                            style={{
                                backgroundImage:
                                    'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.45) 1px, transparent 0)',
                                backgroundSize: '18px 18px',
                            }}
                        />

                        <div className="relative flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        className="h-6 w-6"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.118a7.5 7.5 0 0 1 15 0"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M18 8.25v3.75m0 0v3.75m0-3.75h3.75M18 12h-3.75"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/80">
                                        Team invite
                                    </p>
                                    <h3 className="mt-1 text-xl font-bold tracking-tight">
                                        Invite a staff member
                                    </h3>
                                    <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-emerald-50/85">
                                        They get an email link to set their own password and join
                                        your company with the role you choose.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeInviteModal}
                                className="rounded-xl bg-white/10 p-2 text-white/90 transition hover:bg-white/20"
                                aria-label="Close"
                            >
                                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-5 px-6 py-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="invite-name" value="Full name" />
                                <TextInput
                                    id="invite-name"
                                    value={data.name}
                                    className={fieldClass}
                                    placeholder="e.g. Priya Sharma"
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    isFocused
                                />
                                <InputError message={errors.name} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="invite-email" value="Work email" />
                                <TextInput
                                    id="invite-email"
                                    type="email"
                                    value={data.email}
                                    className={fieldClass}
                                    placeholder="name@company.com"
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                                <InputError message={errors.email} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="invite-phone" value="Phone (optional)" />
                                <TextInput
                                    id="invite-phone"
                                    value={data.phone}
                                    className={fieldClass}
                                    placeholder="+91 …"
                                    onChange={(e) => setData('phone', e.target.value)}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="invite-role" value="Role" />
                                <select
                                    id="invite-role"
                                    className={fieldClass}
                                    value={data.role}
                                    onChange={(e) => setData('role', e.target.value)}
                                >
                                    {roleOptions.map((r) => (
                                        <option key={r.value} value={r.value}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.role} className="mt-1" />
                            </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100">
                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                                ✉
                            </span>
                            <p className="leading-relaxed">
                                Invite link expires in <strong>7 days</strong>. They’ll create their
                                own password — you don’t need to share one.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/50">
                        <button
                            type="button"
                            onClick={closeInviteModal}
                            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500 disabled:opacity-50"
                        >
                            {processing ? (
                                'Sending…'
                            ) : (
                                <>
                                    Send invite
                                    <svg
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                    >
                                        <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.288Z" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {canInvite && pendingInvites.length > 0 && (
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
                            {canInvite && <th className="px-4 py-3">Actions</th>}
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
                                    {canInvite ? (
                                        <select
                                            className="rounded-lg border-slate-200 text-xs dark:border-slate-700 dark:bg-slate-800"
                                            value={m.role ?? 'sales_executive'}
                                            onChange={(e) => changeRole(m.id, e.target.value)}
                                        >
                                            {roleOptions.map((r) => (
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
                                {canInvite && (
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
