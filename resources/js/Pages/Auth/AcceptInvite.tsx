import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
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
}: {
    token: string;
    invitation: Invitation;
}) {
    const { data, setData, post, processing, errors } = useForm({
        name: invitation.name,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('invites.accept', token));
    };

    return (
        <GuestLayout>
            <Head title="Accept invite" />

            <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-900">Join the team</h1>
                <p className="mt-1 text-sm text-slate-600">
                    {invitation.inviter ?? 'An admin'} invited you to{' '}
                    <span className="font-medium">{invitation.company}</span> as{' '}
                    <span className="font-medium">{invitation.role}</span>. Create your
                    password to get started.
                </p>
            </div>

            <form onSubmit={submit}>
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

                <div className="mt-4">
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

                <div className="mt-4">
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

                <div className="mt-4">
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

                <div className="mt-6 flex items-center justify-end">
                    <PrimaryButton disabled={processing}>Create account & join</PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
