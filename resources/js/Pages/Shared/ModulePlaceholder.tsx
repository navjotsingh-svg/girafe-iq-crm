import CrmLayout from '@/Layouts/CrmLayout';
import { Head } from '@inertiajs/react';

export default function ModulePlaceholder({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <CrmLayout title={title}>
            <Head title={title} />
            <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
        </CrmLayout>
    );
}
