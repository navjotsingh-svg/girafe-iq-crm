import { Head, Link } from '@inertiajs/react';

export default function Welcome({
    appName,
    tagline,
    canLogin,
    canRegister,
}: {
    appName: string;
    tagline: string;
    canLogin: boolean;
    canRegister: boolean;
}) {
    const steps = [
        'Sign up / Create account',
        'Choose industry',
        'Team size',
        'Lead sources',
        'Auto setup by Girafe IQ',
        'Add / Import leads',
        'Dashboard ready',
    ];

    const modules = [
        'Enquiries',
        'Leads',
        'Pipeline',
        'Customers',
        'Tasks',
        'Team',
        'Reports',
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Head title={appName} />

            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <header className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
                            {appName}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">{tagline}</p>
                    </div>
                    <nav className="flex items-center gap-2">
                        {canLogin && (
                            <Link
                                href={route('login')}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
                            >
                                Log in
                            </Link>
                        )}
                        {canRegister && (
                            <Link
                                href={route('register')}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                            >
                                Start free trial
                            </Link>
                        )}
                    </nav>
                </header>

                <section className="mt-16 text-center lg:mt-24">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                        Every enquiry captured.
                        <span className="mt-2 block text-emerald-400">
                            Every follow-up tracked. Every sale measured.
                        </span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
                        Industry-agnostic CRM with guided onboarding — from
                        signup to dashboard in 7 simple steps.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        {canRegister && (
                            <Link
                                href={route('register')}
                                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
                            >
                                Start free trial
                            </Link>
                        )}
                        {canLogin && (
                            <Link
                                href={route('login')}
                                className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 hover:border-slate-500"
                            >
                                Log in to workspace
                            </Link>
                        )}
                    </div>
                </section>

                <section className="mt-20 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                        <h2 className="text-lg font-semibold text-emerald-400">
                            Onboarding flow
                        </h2>
                        <ol className="mt-4 space-y-3">
                            {steps.map((step, i) => (
                                <li
                                    key={step}
                                    className="flex items-start gap-3 text-sm text-slate-300"
                                >
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-xs font-bold text-emerald-400">
                                        {i + 1}
                                    </span>
                                    {step}
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                            <h2 className="text-lg font-semibold text-emerald-400">
                                Core CRM
                            </h2>
                            <p className="mt-2 text-sm text-slate-400">
                                Enquiries → Leads → Pipeline → Customers → Team
                                performance
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {modules.map((m) => (
                                    <span
                                        key={m}
                                        className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
                                    >
                                        {m}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/30 p-6">
                            <h2 className="text-lg font-semibold">
                                Demo workspace
                            </h2>
                            <p className="mt-2 text-sm text-slate-400">
                                Already onboarded demo account:
                            </p>
                            <p className="mt-3 font-mono text-sm text-emerald-300">
                                admin@girafeiq.local / password
                            </p>
                        </div>
                    </div>
                </section>

                <footer className="mt-16 border-t border-slate-800 py-8 text-center text-sm text-slate-500">
                    &copy; {new Date().getFullYear()} {appName}. {tagline}
                </footer>
            </div>
        </div>
    );
}
