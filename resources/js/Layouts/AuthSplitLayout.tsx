import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

type AuthSplitLayoutProps = PropsWithChildren<{
    title: string;
    subtitle: string;
    step?: { current: number; total: number; label: string };
    trialDays?: number;
    showTrial?: boolean;
    features?: string[];
}>;

const DEFAULT_FEATURES = [
    'Industry-tailored pipeline & fields',
    'Lead sources & team roles auto-configured',
    'Dashboard ready in under 2 minutes',
];

export default function AuthSplitLayout({
    children,
    title,
    subtitle,
    step,
    trialDays = 14,
    showTrial = true,
    features = DEFAULT_FEATURES,
}: AuthSplitLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-2">
            <div className="relative hidden overflow-hidden bg-slate-950 px-10 py-12 lg:flex lg:flex-col lg:justify-between">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
                    <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
                    <div
                        className="absolute inset-0 opacity-[0.07]"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)',
                            backgroundSize: '28px 28px',
                        }}
                    />
                </div>

                <div className="relative">
                    <Link href="/" className="inline-block">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
                            Girafe IQ
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                            CRM for every industry
                        </p>
                    </Link>
                </div>

                <div className="relative">
                    {step && (
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                            Step {step.current} of {step.total} · {step.label}
                        </p>
                    )}
                    <h1 className="mt-3 max-w-lg text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
                        {title}
                    </h1>
                    <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400">
                        {subtitle}
                    </p>

                    {showTrial && (
                        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-800/60 bg-emerald-950/50 px-4 py-2 text-sm text-emerald-200">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            {trialDays}-day free trial · No credit card
                        </div>
                    )}

                    <ul className="mt-10 space-y-3.5 text-sm text-slate-400">
                        {features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2.5">
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs text-emerald-400">
                                    ✓
                                </span>
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative text-xs text-slate-600">
                    Every enquiry captured. Every follow-up tracked. Every sale
                    measured.
                </p>
            </div>

            <div className="relative flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-10 sm:px-8 lg:px-12">
                <div
                    className="pointer-events-none absolute inset-0 opacity-40 lg:hidden"
                    style={{
                        background:
                            'radial-gradient(ellipse at top, rgba(16,185,129,0.12), transparent 55%)',
                    }}
                />
                <div className="relative mx-auto w-full max-w-md">
                    <div className="mb-8 lg:hidden">
                        <Link href="/">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                Girafe IQ
                            </p>
                        </Link>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                            {title}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
                        {children}
                    </div>

                    <p className="mt-6 text-center text-xs text-slate-400">
                        <Link
                            href={route('privacy-policy')}
                            className="hover:text-emerald-700"
                        >
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
