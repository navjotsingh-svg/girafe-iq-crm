import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type Invitation = {
    name: string;
    email: string;
    role: string;
    company: string | null;
    inviter: string | null;
    expires_at: string | null;
};

export default function AcceptInvite({
    token,
    invitation,
    status = 'ok',
    message = null,
}: {
    token: string;
    invitation: Invitation | null;
    status?: 'ok' | 'invalid' | 'expired' | 'unavailable';
    message?: string | null;
}) {
    const { data, setData, post, processing, errors } = useForm({
        name: invitation?.name ?? '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(`/invites/${token}`);
    };

    if (status !== 'ok' || !invitation) {
        return (
            <GuestLayout>
                <Head title="Invite unavailable" />
                <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-2xl text-rose-600">
                        !
                    </div>
                    <h1 className="mt-4 text-lg font-semibold text-slate-900">
                        {status === 'expired' ? 'Invite expired' : 'Invite not found'}
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        {message ??
                            'This invite link is invalid or no longer available. Ask your admin to send a new one.'}
                    </p>
                    <Link
                        href="/login"
                        className="mt-6 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                        Go to login
                    </Link>
                </div>
            </GuestLayout>
        );
    }

    return (
        <GuestLayout>
            <Head title="Accept invite" />

            <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                    Team invite
                </p>
                <h1 className="mt-1 text-xl font-bold text-slate-900">Join the team</h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {invitation.inviter ?? 'An admin'} invited you to{' '}
                    <span className="font-semibold text-slate-800">{invitation.company}</span> as{' '}
                    <span className="font-semibold text-slate-800">{invitation.role}</span>. Create
                    your password to get started.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        value={invitation.email}
                        className="mt-1 block w-full bg-slate-50"
                        disabled
                    />
                </div>

                <div>
                    <InputLabel htmlFor="name" value="Your name" />
                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Create password" />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="password_confirmation" value="Confirm password" />
                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        required
                    />
                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                <div className="pt-2">
                    <PrimaryButton className="w-full justify-center" disabled={processing}>
                        {processing ? 'Creating account…' : 'Create account & join'}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
