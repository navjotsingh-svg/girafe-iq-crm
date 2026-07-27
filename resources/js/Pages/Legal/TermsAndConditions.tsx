import PublicFooter from '@/Components/PublicFooter';
import { Head, Link, usePage } from '@inertiajs/react';

type Section = {
    title: string;
    paragraphs: string[];
    bullets?: string[];
};

export default function TermsAndConditions({
    lastUpdated,
}: {
    lastUpdated: string;
}) {
    const { app } = usePage().props as {
        app?: { name?: string; tagline?: string };
    };

    const appName = app?.name ?? 'Girafe IQ';

    const sections: Section[] = [
        {
            title: '1. Agreement to terms',
            paragraphs: [
                `These Terms and Conditions ("Terms") govern your access to and use of ${appName} ("we", "us", or "our"), including our CRM platform, website, and related services (collectively, the "Service").`,
                'By creating an account, inviting team members, or using the Service, you agree to these Terms. If you do not agree, do not use the Service.',
            ],
        },
        {
            title: '2. Who may use the Service',
            paragraphs: [
                'You must be at least 16 years old and able to form a binding contract to use the Service.',
                'If you register on behalf of a company, you represent that you have authority to bind that company to these Terms. The company is responsible for all activity under its workspace.',
            ],
        },
        {
            title: '3. Accounts and workspaces',
            paragraphs: [
                'You are responsible for maintaining the confidentiality of login credentials and for all actions taken through your account.',
                'Workspace owners and admins control team access, roles, and integrations. You must ensure invited users are authorized to access company CRM data.',
            ],
        },
        {
            title: '4. Your content and CRM data',
            paragraphs: [
                'You retain ownership of the enquiries, leads, contacts, documents, and other data you submit to the Service ("Customer Data").',
                'You grant us a limited license to host, process, and display Customer Data solely to provide and improve the Service as configured by your workspace.',
                'You are responsible for the legality, accuracy, and rights associated with Customer Data, including lead data collected via forms, ads, or third-party integrations.',
            ],
        },
        {
            title: '5. Acceptable use',
            paragraphs: ['You agree not to:'],
            bullets: [
                'Use the Service for unlawful, harmful, or fraudulent purposes.',
                'Attempt to gain unauthorized access to other workspaces, systems, or data.',
                'Upload malware, scrape the Service in an abusive way, or disrupt platform availability.',
                'Send spam or unsolicited messages using Email, WhatsApp, or campaign features in violation of applicable laws.',
                'Misrepresent your identity or your relationship to any person or organization.',
            ],
        },
        {
            title: '6. Integrations and third-party services',
            paragraphs: [
                'The Service may connect to third-party platforms such as Meta, Google, email providers, or Zapier. Those services are governed by their own terms and privacy policies.',
                'You are responsible for configuring integrations correctly and for complying with platform policies (including advertising and messaging rules).',
            ],
        },
        {
            title: '7. Trials, plans, and billing',
            paragraphs: [
                'Free trials or paid plans may be offered as described at signup or in your account. Fees, renewals, and taxes (if applicable) will be communicated before you are charged.',
                'Unless otherwise stated, fees are non-refundable except where required by law.',
            ],
        },
        {
            title: '8. Intellectual property',
            paragraphs: [
                `The Service, including software, design, branding, and documentation, is owned by ${appName} or its licensors and is protected by intellectual property laws.`,
                'Except for Customer Data, you receive only a limited, non-exclusive, non-transferable right to use the Service during your subscription.',
            ],
        },
        {
            title: '9. Confidentiality',
            paragraphs: [
                'Each party may access confidential information of the other. Both parties agree to use such information only for purposes related to the Service and to protect it with reasonable care.',
            ],
        },
        {
            title: '10. Disclaimers',
            paragraphs: [
                'The Service is provided on an "as is" and "as available" basis. We do not warrant uninterrupted or error-free operation.',
                'We are not responsible for decisions made using CRM data, outcomes of sales processes, or failures of third-party platforms you connect.',
            ],
        },
        {
            title: '11. Limitation of liability',
            paragraphs: [
                'To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages, or for loss of profits, revenue, data, or goodwill.',
                'Our total liability arising out of or related to the Service will not exceed the amounts you paid us for the Service in the twelve (12) months before the claim, or a reasonable equivalent for free plans.',
            ],
        },
        {
            title: '12. Suspension and termination',
            paragraphs: [
                'We may suspend or terminate access if you breach these Terms, create risk for the platform, or fail to pay applicable fees.',
                'You may stop using the Service at any time. Upon termination, your right to access the Service ends, subject to any data export or deletion rights described in our Privacy Policy and User Data Deletion page.',
            ],
        },
        {
            title: '13. Changes to these Terms',
            paragraphs: [
                'We may update these Terms from time to time. The revised version will be posted on this page with an updated "Last updated" date.',
                'Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.',
            ],
        },
        {
            title: '14. Contact',
            paragraphs: [
                `Questions about these Terms can be sent to legal@${appName.toLowerCase().replace(/\s+/g, '')}.com or through your account administrator.`,
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Head title="Terms and Conditions" />

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
                            Terms and Conditions
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
