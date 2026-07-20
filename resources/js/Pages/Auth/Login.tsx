import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import AuthSplitLayout from '@/Layouts/AuthSplitLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

const fieldClass =
    'mt-1.5 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthSplitLayout
            title="Welcome back"
            subtitle="Sign in to your workspace and pick up where you left off — enquiries, leads, and follow-ups."
            showTrial={false}
            features={[
                'Enquiries, leads & pipeline in one place',
                'Follow-ups and tasks never slip',
                'Team performance you can measure',
            ]}
        >
            <Head title="Log in" />

            <div className="mb-6 hidden lg:block">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Log in
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Enter your work email and password
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

                <div>
                    <div className="flex items-center justify-between">
                        <InputLabel htmlFor="password" value="Password" />
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-xs font-semibold text-emerald-700 hover:text-emerald-600"
                            >
                                Forgot password?
                            </Link>
                        )}
                    </div>
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className={fieldClass}
                        autoComplete="current-password"
                        placeholder="Your password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <label className="flex items-center gap-2.5 pt-1">
                    <Checkbox
                        name="remember"
                        checked={data.remember}
                        onChange={(e) =>
                            setData('remember', (e.target.checked || false) as false)
                        }
                    />
                    <span className="text-sm text-slate-600">Remember me</span>
                </label>

                <button
                    type="submit"
                    disabled={processing}
                    className="mt-2 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                    {processing ? 'Signing in…' : 'Log in'}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
                New to Girafe IQ?{' '}
                <Link
                    href={route('register')}
                    className="font-semibold text-emerald-700 hover:text-emerald-600"
                >
                    Start free trial
                </Link>
            </p>
        </AuthSplitLayout>
    );
}
