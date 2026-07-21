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
            <p className="mt-2">
                <Link
                    href={route('privacy-policy')}
                    className="text-slate-400 hover:text-emerald-400"
                >
                    Privacy Policy
                </Link>
            </p>
        </footer>
    );
}
