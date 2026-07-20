import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import AuthSplitLayout from '@/Layouts/AuthSplitLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

const fieldClass =
    'mt-1.5 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500';

export default function Register() {
    const { app } = usePage().props as {
        app?: { name?: string; tagline?: string; trial_days?: number };
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        company_name: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthSplitLayout
            title="Create your workspace"
            subtitle="Start with your account. Industry, team size, and lead sources come next in onboarding."
            step={{ current: 1, total: 7, label: 'Sign up' }}
            trialDays={app?.trial_days ?? 14}
        >
            <Head title="Start free trial" />

            <div className="mb-6 hidden lg:block">
                <h2 className="text-xl font-bold text-slate-900">
                    Sign up / Create account
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Name · Email / Phone · Company
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel htmlFor="name" value="Your name" />
                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className={fieldClass}
                        autoComplete="name"
                        isFocused
                        placeholder="Full name"
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="email" value="Work email" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className={fieldClass}
                            autoComplete="username"
                            placeholder="you@company.com"
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel htmlFor="phone" value="Phone" />
                        <TextInput
                            id="phone"
                            name="phone"
                            value={data.phone}
                            className={fieldClass}
                            autoComplete="tel"
                            placeholder="+91 98765 43210"
                            onChange={(e) => setData('phone', e.target.value)}
                        />
                        <InputError message={errors.phone} className="mt-2" />
                    </div>
                </div>

                <div>
                    <InputLabel htmlFor="company_name" value="Company" />
                    <TextInput
                        id="company_name"
                        name="company_name"
                        value={data.company_name}
                        className={fieldClass}
                        autoComplete="organization"
                        placeholder="Your company name"
                        onChange={(e) => setData('company_name', e.target.value)}
                        required
                    />
                    <InputError message={errors.company_name} className="mt-2" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="password" value="Password" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className={fieldClass}
                            autoComplete="new-password"
                            placeholder="Create password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel
                            htmlFor="password_confirmation"
                            value="Confirm"
                        />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className={fieldClass}
                            autoComplete="new-password"
                            placeholder="Repeat password"
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            required
                        />
                        <InputError
                            message={errors.password_confirmation}
                            className="mt-2"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="mt-2 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                    {processing ? 'Creating workspace…' : 'Start free trial'}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link
                    href={route('login')}
                    className="font-semibold text-emerald-700 hover:text-emerald-600"
                >
                    Log in
                </Link>
            </p>
        </AuthSplitLayout>
    );
}
