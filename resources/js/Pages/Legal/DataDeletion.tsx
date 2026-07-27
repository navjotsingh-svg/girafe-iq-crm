import PublicFooter from '@/Components/PublicFooter';
import { Head, Link, usePage } from '@inertiajs/react';

type Section = {
    title: string;
    paragraphs: string[];
    bullets?: string[];
};

export default function DataDeletion({
    lastUpdated,
}: {
    lastUpdated: string;
}) {
    const { app } = usePage().props as {
        app?: { name?: string; tagline?: string };
    };

    const appName = app?.name ?? 'Girafe IQ';
    const contactEmail = `privacy@${appName.toLowerCase().replace(/\s+/g, '')}.com`;

    const sections: Section[] = [
        {
            title: '1. Overview',
            paragraphs: [
                `This page explains how users and companies can request deletion of personal data associated with ${appName}.`,
                'We process deletion requests in line with our Privacy Policy and applicable data-protection laws.',
            ],
        },
        {
            title: '2. What can be deleted',
            paragraphs: ['Depending on your role and request, we may delete or de-identify:'],
            bullets: [
                'User account profile data (name, email, phone, and login access).',
                'Team membership and role assignments for that user.',
                'CRM records you own or that your company asks us to remove, such as leads, contacts, notes, and documents, where legally permitted.',
                'Integration tokens and connected-page metadata for platforms you disconnect or ask us to remove.',
            ],
        },
        {
            title: '3. How to request deletion',
            paragraphs: [
                'You can request user data deletion using any of the methods below.',
            ],
            bullets: [
                `Email ${contactEmail} from the email address linked to your account with the subject "Data deletion request".`,
                'Ask your company admin to remove your user from Team settings and confirm whether workspace CRM data should also be deleted.',
                'If you connected Meta (Facebook / Instagram) lead forms, you may also use Meta’s user data deletion tools; we will process related callbacks for your connected pages where applicable.',
            ],
        },
        {
            title: '4. Information to include',
            paragraphs: ['To help us verify and complete your request, include:'],
            bullets: [
                'Full name and registered email address.',
                'Company / workspace name (if applicable).',
                'Whether you want only your user account deleted, or also specific CRM records.',
                'Any platform user IDs you have from Meta or other integrations (optional, if known).',
            ],
        },
        {
            title: '5. Verification and timeline',
            paragraphs: [
                'We may ask for reasonable verification before deleting data to protect accounts from unauthorized requests.',
                'We aim to acknowledge deletion requests within 7 business days and complete eligible deletions within 30 days, unless a longer period is required by law or technical constraints (for example backups).',
            ],
        },
        {
            title: '6. What we may retain',
            paragraphs: [
                'Some information may be retained where we have a lawful reason to keep it, such as:',
            ],
            bullets: [
                'Billing, tax, or audit records for the period required by law.',
                'Security logs needed to investigate abuse or protect the Service.',
                'Data that another company user still needs to operate their workspace (unless that company also requests deletion).',
                'Backup copies that are rotated out on a scheduled basis after deletion from live systems.',
            ],
        },
        {
            title: '7. Company / workspace deletion',
            paragraphs: [
                'Workspace owners may request deletion of an entire company account and associated CRM data.',
                'After confirmation, we will disable access and delete or anonymize workspace data from production systems according to our retention schedule.',
            ],
        },
        {
            title: '8. Status of your request',
            paragraphs: [
                `After we process a verified request, we will confirm by email when deletion is complete or explain if part of the request cannot be fulfilled.`,
                `For questions, contact ${contactEmail}.`,
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Head title="User Data Deletion" />

            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                <header className="flex items-center justify-between gap-4 border-b border-slate-800 pb-6">
                    <div>
                        <Link href="/" className="inline-block">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
                                {appName}
                            </p>
                        </Link>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                            User Data Deletion
                        </h1>
                        <p className="mt-2 text-sm text-slate-400">
                            Last updated: {lastUpdated}
                        </p>
                    </div>
                    <Link
                        href={route('login')}
                        className="shrink-0 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-white"
                    >
                        Log in
                    </Link>
                </header>

                <article className="prose prose-invert mt-10 max-w-none prose-headings:text-emerald-400 prose-p:text-slate-300 prose-li:text-slate-300">
                    {sections.map((section) => (
                        <section key={section.title} className="mb-10">
                            <h2 className="text-lg font-semibold text-emerald-400">
                                {section.title}
                            </h2>
                            {section.paragraphs.map((paragraph) => (
                                <p
                                    key={paragraph.slice(0, 40)}
                                    className="mt-3 text-sm leading-relaxed text-slate-300"
                                >
                                    {paragraph}
                                </p>
                            ))}
                            {section.bullets && (
                                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
                                    {section.bullets.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    ))}
                </article>

                <PublicFooter appName={appName} />
            </div>
        </div>
    );
}
