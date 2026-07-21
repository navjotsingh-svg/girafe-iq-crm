import PublicFooter from '@/Components/PublicFooter';
import { Head, Link, usePage } from '@inertiajs/react';

type Section = {
    title: string;
    paragraphs: string[];
    bullets?: string[];
};

export default function PrivacyPolicy({
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
            title: '1. Introduction',
            paragraphs: [
                `This Privacy Policy explains how ${appName} ("we", "us", or "our") collects, uses, stores, and protects personal information when you use our CRM platform, website, and related services (collectively, the "Service").`,
                'By creating an account or using the Service, you agree to the practices described in this policy.',
            ],
        },
        {
            title: '2. Information we collect',
            paragraphs: [
                'We collect information you provide directly and information generated through your use of the Service.',
            ],
            bullets: [
                'Account details such as name, email address, phone number, company name, and password.',
                'CRM data you or your team enter, including enquiries, leads, contacts, customers, tasks, notes, and documents.',
                'Team and billing information needed to operate your workspace.',
                'Communications with us, including support requests and feedback.',
                'Technical data such as IP address, browser type, device information, and usage logs.',
            ],
        },
        {
            title: '3. Lead and integration data',
            paragraphs: [
                'If you connect third-party platforms (such as Meta/Facebook, Instagram, Google Ads, Zapier, or website forms), we process lead data submitted to those platforms on your behalf.',
                'Each company connects its own accounts. We store integration metadata and inbound lead payloads only as needed to deliver lead capture, routing, and CRM functionality.',
            ],
        },
        {
            title: '4. How we use information',
            paragraphs: ['We use personal information to:'],
            bullets: [
                'Provide, maintain, and improve the Service.',
                'Authenticate users and enforce access controls within your company workspace.',
                'Send transactional messages such as welcome emails, team invitations, and security notices.',
                'Monitor performance, troubleshoot issues, and protect against abuse or fraud.',
                'Comply with legal obligations and enforce our terms.',
            ],
        },
        {
            title: '5. How we share information',
            paragraphs: [
                'We do not sell your personal information. We may share information only in the following circumstances:',
            ],
            bullets: [
                'With service providers that help us host, deliver email, process payments, or operate infrastructure, under contractual confidentiality obligations.',
                'With integrated platforms you choose to connect, according to your configuration and their policies.',
                'When required by law, regulation, legal process, or to protect rights, safety, and security.',
                'In connection with a merger, acquisition, or sale of assets, with appropriate notice where required.',
            ],
        },
        {
            title: '6. Data retention',
            paragraphs: [
                'We retain account and CRM data for as long as your workspace is active or as needed to provide the Service.',
                'You may request deletion of your account subject to applicable law and legitimate business needs such as backups, billing records, or dispute resolution.',
            ],
        },
        {
            title: '7. Security',
            paragraphs: [
                'We implement administrative, technical, and organizational measures designed to protect personal information, including access controls, encryption where appropriate, and monitoring.',
                'No method of transmission or storage is completely secure. You are responsible for safeguarding your login credentials and configuring team permissions appropriately.',
            ],
        },
        {
            title: '8. Your rights',
            paragraphs: [
                'Depending on your location, you may have rights to access, correct, delete, restrict, or export personal information, and to object to certain processing.',
                'To exercise these rights, contact us using the details below. We may need to verify your identity before responding.',
            ],
        },
        {
            title: '9. Cookies and similar technologies',
            paragraphs: [
                'We use cookies and similar technologies to keep you signed in, remember preferences, and understand how the Service is used.',
                'You can control cookies through your browser settings, though some features may not function properly if cookies are disabled.',
            ],
        },
        {
            title: '10. International transfers',
            paragraphs: [
                'Your information may be processed in countries other than your own. Where required, we use appropriate safeguards for cross-border data transfers.',
            ],
        },
        {
            title: '11. Children',
            paragraphs: [
                'The Service is not intended for children under 16. We do not knowingly collect personal information from children.',
            ],
        },
        {
            title: '12. Changes to this policy',
            paragraphs: [
                'We may update this Privacy Policy from time to time. We will post the revised version on this page and update the "Last updated" date.',
                'Material changes may also be communicated by email or in-product notice where appropriate.',
            ],
        },
        {
            title: '13. Contact us',
            paragraphs: [
                `If you have questions about this Privacy Policy or our data practices, contact us at privacy@${appName.toLowerCase().replace(/\s+/g, '')}.com or through your account administrator.`,
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Head title="Privacy Policy" />

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
                            Privacy Policy
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
