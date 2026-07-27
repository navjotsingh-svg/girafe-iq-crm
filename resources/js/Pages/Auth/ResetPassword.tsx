import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import AuthSplitLayout from '@/Layouts/AuthSplitLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

const fieldClass =
    'mt-1.5 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500';

export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthSplitLayout
            title="Choose a new password"
            subtitle="You're almost back in. Set a strong password for your workspace and continue where you left off."
            showTrial={false}
            features={[
                'Secure your account with a new password',
                'Keep your CRM data private to your team',
                'Sign in and pick up leads right away',
            ]}
        >
            <Head title="Reset Password" />

            <div className="mb-6 hidden lg:block">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Set new password
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Enter and confirm your new password below
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel htmlFor="email" value="Work email" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className={fieldClass}
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="New password" />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className={fieldClass}
                        autoComplete="new-password"
                        isFocused
                        placeholder="Create a strong password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm password"
                    />
                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className={fieldClass}
                        autoComplete="new-password"
                        placeholder="Repeat your new password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                    />
                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="mt-2 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                    {processing ? 'Saving password…' : 'Reset password'}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
                Remembered your password?{' '}
                <Link
                    href={route('login')}
                    className="font-semibold text-emerald-700 hover:text-emerald-600"
                >
                    Back to login
                </Link>
            </p>
        </AuthSplitLayout>
    );
}
