import CrmLayout from '@/Layouts/CrmLayout';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    const page = usePage().props as {
        auth?: {
            user?: {
                name?: string;
                email?: string;
                roles?: string[] | Record<string, string>;
            };
            company?: {
                name?: string;
            };
        };
    };
    const user = page.auth?.user;
    const company = page.auth?.company;
    const roles = Array.isArray(user?.roles) ? user.roles : Object.values(user?.roles ?? {});
    const primaryRole = roles[0]
        ? String(roles[0]).replaceAll('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase())
        : 'Team Member';

    return (
        <CrmLayout title="Profile">
            <Head title="Profile" />

            <div className="mx-auto max-w-6xl space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                                Account Settings
                            </p>
                            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                                Manage your profile
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Keep your contact info and security settings up to date.
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
                                <div className="text-xs uppercase tracking-wide text-slate-500">
                                    Name
                                </div>
                                <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                                    {user?.name ?? 'User'}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
                                <div className="text-xs uppercase tracking-wide text-slate-500">
                                    Role
                                </div>
                                <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                                    {primaryRole}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
                                <div className="text-xs uppercase tracking-wide text-slate-500">
                                    Workspace
                                </div>
                                <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                                    {company?.name ?? 'Workspace'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                    <div className="xl:col-span-2 space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                            />
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <UpdatePasswordForm />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/60 dark:bg-amber-950/20">
                            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                                Security Tips
                            </h3>
                            <ul className="mt-3 space-y-2 text-sm text-amber-800 dark:text-amber-200">
                                <li>Use a strong password with letters, numbers, and symbols.</li>
                                <li>Change your password if this account is shared or reused anywhere.</li>
                                <li>Keep your email updated so recovery and alerts reach you.</li>
                            </ul>
                        </div>

                        <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-900/60 dark:bg-slate-900">
                            <DeleteUserForm />
                        </div>
                    </div>
                </div>
            </div>
        </CrmLayout>
    );
}
