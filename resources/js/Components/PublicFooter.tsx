import { Link } from '@inertiajs/react';

export default function PublicFooter({
    appName,
    tagline,
}: {
    appName: string;
    tagline?: string;
}) {
    return (
        <footer className="mt-16 border-t border-slate-800 py-8 text-center text-sm text-slate-500">
            <p>
                &copy; {new Date().getFullYear()} {appName}
                {tagline ? `. ${tagline}` : ''}
            </p>
            <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                <Link
                    href={route('privacy-policy')}
                    className="text-slate-400 hover:text-emerald-400"
                >
                    Privacy Policy
                </Link>
                <span className="hidden text-slate-700 sm:inline" aria-hidden>
                    ·
                </span>
                <Link
                    href={route('terms')}
                    className="text-slate-400 hover:text-emerald-400"
                >
                    Terms and Conditions
                </Link>
                <span className="hidden text-slate-700 sm:inline" aria-hidden>
                    ·
                </span>
                <Link
                    href={route('data-deletion')}
                    className="text-slate-400 hover:text-emerald-400"
                >
                    User Data Deletion
                </Link>
            </p>
        </footer>
    );
}
