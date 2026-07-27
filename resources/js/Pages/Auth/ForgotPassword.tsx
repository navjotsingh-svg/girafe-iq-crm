import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import AuthSplitLayout from '@/Layouts/AuthSplitLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

const fieldClass =
    'mt-1.5 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <AuthSplitLayout
            title="Reset your password"
            subtitle="Enter your work email and we'll send you a secure reset link so you can get back into your workspace."
            showTrial={false}
            features={[
                'Reset access without contacting support',
                'Keep your enquiries, leads, and tasks secure',
                'Return to your workspace in minutes',
            ]}
        >
            <Head title="Forgot Password" />

            <div className="mb-6 hidden lg:block">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Forgot password?
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    We&apos;ll email you a password reset link
                </p>
            </div>

            {status && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    {status}
                </div>
            )}

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
                        isFocused
                        placeholder="you@company.com"
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="mt-2 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                    {processing ? 'Sending reset link…' : 'Email password reset link'}
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
