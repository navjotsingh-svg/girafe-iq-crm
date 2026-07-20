import InputError from '@/Components/InputError';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

type Industry = { key: string; name: string; tagline: string };
type Source = { slug: string; name: string };
type TeamSize = { value: string; label: string };
type ImportOption = { value: string; label: string; hint: string };
type CompanyProps = {
    name: string;
    industry_key: string | null;
    team_size: string | null;
    selected_sources: string[];
    setup_checklist: Record<string, boolean>;
    import_path: string | null;
};
type Summary = Record<string, number>;

const STEPS = [
    { n: 2, label: 'Industry' },
    { n: 3, label: 'Team' },
    { n: 4, label: 'Sources' },
    { n: 5, label: 'Auto setup' },
    { n: 6, label: 'Leads' },
    { n: 7, label: 'Ready' },
];

export default function Wizard({
    step,
    industries,
    sources,
    teamSizes,
    importOptions,
    company,
    summary,
    autoSetupItems,
}: {
    step: number;
    industries: Industry[];
    sources: Source[];
    teamSizes: TeamSize[];
    importOptions: ImportOption[];
    company: CompanyProps;
    summary: Summary;
    autoSetupItems: string[];
}) {
    const current = Math.max(2, Math.min(7, step));

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-emerald-50/40 px-4 py-10 dark:from-slate-950 dark:to-slate-900">
            <Head title="Onboarding" />
            <div className="mx-auto max-w-3xl">
                <div className="mb-8 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
                        Girafe IQ — CRM Flow
                    </p>
                    <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                        {company.name}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Every enquiry captured. Every follow-up tracked. Every
                        sale measured.
                    </p>
                </div>

                <Progress steps={STEPS} current={current} />

                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
                    {current === 2 && (
                        <IndustryStep
                            industries={industries}
                            initial={company.industry_key || 'real_estate'}
                        />
                    )}
                    {current === 3 && (
                        <TeamSizeStep
                            teamSizes={teamSizes}
                            initial={company.team_size || 'just_me'}
                        />
                    )}
                    {current === 4 && (
                        <SourcesStep
                            sources={sources}
                            initial={company.selected_sources || []}
                        />
                    )}
                    {current === 5 && (
                        <AutoSetupStep items={autoSetupItems} />
                    )}
                    {current === 6 && (
                        <ImportStep options={importOptions} />
                    )}
                    {current === 7 && (
                        <ReadyStep
                            company={company}
                            summary={summary}
                            autoSetupItems={autoSetupItems}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

function Progress({
    steps,
    current,
}: {
    steps: { n: number; label: string }[];
    current: number;
}) {
    return (
        <ol className="flex items-center justify-between gap-1">
            {steps.map((s, i) => {
                const done = current > s.n;
                const active = current === s.n;
                return (
                    <li
                        key={s.n}
                        className="flex flex-1 flex-col items-center gap-1"
                    >
                        <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                                done || active
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                            }`}
                        >
                            {i + 1}
                        </div>
                        <span
                            className={`hidden text-[10px] sm:block ${
                                active
                                    ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                                    : 'text-slate-400'
                            }`}
                        >
                            {s.label}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

function IndustryStep({
    industries,
    initial,
}: {
    industries: Industry[];
    initial: string;
}) {
    const { data, setData, post, processing, errors } = useForm({
        industry_key: initial,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('onboarding.industry'));
    };

    return (
        <form onSubmit={submit}>
            <StepHeader
                title="Choose industry"
                subtitle="Select the industry that best matches your business"
            />
            <div className="mt-6 max-h-[26rem] overflow-y-auto pr-1">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {industries.map((ind) => {
                    const selected = data.industry_key === ind.key;
                    return (
                        <button
                            key={ind.key}
                            type="button"
                            onClick={() => setData('industry_key', ind.key)}
                            className={`rounded-xl border p-4 text-left transition ${
                                selected
                                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/30 dark:bg-emerald-950/40'
                                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                            }`}
                        >
                            <div className="font-semibold text-slate-900 dark:text-white">
                                {ind.name}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500">
                                {ind.tagline}
                            </div>
                        </button>
                    );
                })}
                </div>
            </div>
            <InputError message={errors.industry_key} className="mt-3" />
            <Footer processing={processing} label="Continue" />
        </form>
    );
}

function TeamSizeStep({
    teamSizes,
    initial,
}: {
    teamSizes: TeamSize[];
    initial: string;
}) {
    const { data, setData, post, processing, errors } = useForm({
        team_size: initial,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('onboarding.team-size'));
    };

    return (
        <form onSubmit={submit}>
            <StepHeader
                title="Team size"
                subtitle="Just me · 2–5 people · 6–20 people · 20+ people"
            />
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {teamSizes.map((t) => {
                    const selected = data.team_size === t.value;
                    return (
                        <button
                            key={t.value}
                            type="button"
                            onClick={() => setData('team_size', t.value)}
                            className={`rounded-xl border px-3 py-5 text-center text-sm font-semibold transition ${
                                selected
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200'
                                    : 'border-slate-200 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:text-slate-200'
                            }`}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>
            <InputError message={errors.team_size} className="mt-3" />
            <Footer processing={processing} label="Continue" />
        </form>
    );
}

function SourcesStep({
    sources,
    initial,
}: {
    sources: Source[];
    initial: string[];
}) {
    const { data, setData, post, processing, errors } = useForm<{
        sources: string[];
    }>({
        sources: initial.length
            ? initial
            : ['website', 'referrals', 'whatsapp'],
    });

    const toggle = (slug: string) => {
        const next = data.sources.includes(slug)
            ? data.sources.filter((s) => s !== slug)
            : [...data.sources, slug];
        setData('sources', next);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('onboarding.sources'));
    };

    return (
        <form onSubmit={submit}>
            <StepHeader
                title="Choose lead sources"
                subtitle="Facebook Ads, Google Ads, Website, WhatsApp, Instagram, Referrals, Walk-ins, Excel / Other"
            />
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {sources.map((s) => {
                    const selected = data.sources.includes(s.slug);
                    return (
                        <button
                            key={s.slug}
                            type="button"
                            onClick={() => toggle(s.slug)}
                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                                selected
                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                                    : 'border-slate-200 dark:border-slate-700'
                            }`}
                        >
                            <span
                                className={`flex h-5 w-5 items-center justify-center rounded border text-[10px] font-bold ${
                                    selected
                                        ? 'border-emerald-600 bg-emerald-600 text-white'
                                        : 'border-slate-300 text-transparent'
                                }`}
                            >
                                ✓
                            </span>
                            {s.name}
                        </button>
                    );
                })}
            </div>
            <InputError message={errors.sources} className="mt-3" />
            <Footer
                processing={processing}
                label="Continue"
                disabled={data.sources.length === 0}
            />
        </form>
    );
}

function AutoSetupStep({ items }: { items: string[] }) {
    const [done, setDone] = useState<string[]>([]);
    const started = useRef(false);

    useEffect(() => {
        if (started.current) {
            return;
        }
        started.current = true;

        let i = 0;
        const timer = setInterval(() => {
            i += 1;
            setDone(items.slice(0, i));
            if (i >= items.length) {
                clearInterval(timer);
                router.post(route('onboarding.auto-setup'));
            }
        }, 350);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div>
            <StepHeader
                title="Auto setup by Girafe IQ"
                subtitle="We’re configuring your CRM from your industry and sources."
            />
            <ul className="mt-6 space-y-3">
                {items.map((item) => {
                    const ready = done.includes(item);
                    return (
                        <li
                            key={item}
                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                                ready
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100'
                                    : 'border-slate-200 text-slate-500 dark:border-slate-700'
                            }`}
                        >
                            <span
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                    ready
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-200 text-slate-400 dark:bg-slate-800'
                                }`}
                            >
                                {ready ? '✓' : '…'}
                            </span>
                            {item}
                        </li>
                    );
                })}
            </ul>
            <p className="mt-6 text-center text-sm text-slate-500">
                Setting up pipeline, fields, follow-ups, dashboard, reports &
                team roles…
            </p>
        </div>
    );
}

function ImportStep({ options }: { options: ImportOption[] }) {
    const choose = (path: string) => {
        router.post(route('onboarding.import'), { path });
    };

    return (
        <div>
            <StepHeader
                title="Add / Import leads"
                subtitle="Add First Enquiry · Import Leads · Connect Source · Explore Sample Data"
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {options.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => choose(opt.value)}
                        className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-slate-700 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/30"
                    >
                        <div className="font-semibold text-slate-900 dark:text-white">
                            {opt.label}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                            {opt.hint}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

function ReadyStep({
    company,
    summary,
    autoSetupItems,
}: {
    company: CompanyProps;
    summary: Summary;
    autoSetupItems: string[];
}) {
    const complete = () => router.post(route('onboarding.complete'));
    const checklist = company.setup_checklist || {};

    return (
        <div>
            <StepHeader
                title="Dashboard ready"
                subtitle="Setup checklist complete — start using Girafe IQ."
            />

            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                    Setup checklist
                </p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {autoSetupItems.map((item) => (
                        <li
                            key={item}
                            className="flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-200"
                        >
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                                ✓
                            </span>
                            {item}
                        </li>
                    ))}
                </ul>
                {Object.keys(checklist).length === 0 && null}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <Stat label="Stages" value={summary.pipeline_stages ?? 0} />
                <Stat label="Sources" value={summary.sources ?? 0} />
                <Stat label="Fields" value={summary.fields ?? 0} />
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    type="button"
                    onClick={complete}
                    className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                    Start Using Girafe IQ
                </button>
            </div>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {value}
            </div>
            <div className="text-xs text-slate-500">{label}</div>
        </div>
    );
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
    );
}

function Footer({
    processing,
    label,
    disabled = false,
}: {
    processing: boolean;
    label: string;
    disabled?: boolean;
}) {
    return (
        <div className="mt-8 flex justify-end">
            <button
                type="submit"
                disabled={processing || disabled}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
                {processing ? 'Saving…' : label}
            </button>
        </div>
    );
}
