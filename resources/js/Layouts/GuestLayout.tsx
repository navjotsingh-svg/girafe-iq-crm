import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({
    children,
    wide = false,
}: PropsWithChildren<{ wide?: boolean }>) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-slate-100 pt-6 sm:justify-center sm:pt-0 dark:bg-slate-950">
            <div>
                <Link href="/">
                    <ApplicationLogo className="h-20 w-20 fill-current text-emerald-700" />
                </Link>
            </div>

            <div
                className={`mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-md sm:rounded-lg dark:bg-slate-900 dark:shadow-none dark:ring-1 dark:ring-slate-800 ${
                    wide ? 'sm:max-w-2xl' : 'sm:max-w-md'
                }`}
            >
                {children}
            </div>
        </div>
    );
}
