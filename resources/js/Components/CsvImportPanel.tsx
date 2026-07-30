import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import {
    CsvImportFieldDef,
    guessFieldMapping,
    previewCsvFile,
} from '@/Lib/csvImport';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

const fieldClass =
    'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800';

type Props = {
    title: string;
    description: string;
    importRoute: string;
    sampleRoute: string;
    fields: CsvImportFieldDef[];
    extraFields?: CsvImportFieldDef[];
    onClose: () => void;
};

export default function CsvImportPanel({
    title,
    description,
    importRoute,
    sampleRoute,
    fields,
    extraFields = [],
    onClose,
}: Props) {
    const allFields = [...fields, ...extraFields];
    const requiredKeys = allFields.filter((f) => f.required).map((f) => f.key);

    const [csvHeaders, setCsvHeaders] = useState<{ label: string; key: string }[]>([]);
    const [previewRows, setPreviewRows] = useState<string[][]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [parseError, setParseError] = useState<string | null>(null);

    const form = useForm<{
        file: File | null;
        mapping: Record<string, string>;
    }>({
        file: null,
        mapping: {},
    });

    const handleFileChange = async (file: File | null) => {
        form.setData('file', file);
        setParseError(null);
        setCsvHeaders([]);
        setPreviewRows([]);
        setMapping({});

        if (!file) {
            return;
        }

        try {
            const preview = await previewCsvFile(file);
            if (preview.headers.length === 0) {
                setParseError('Could not read column headers from this file.');
                return;
            }
            setCsvHeaders(preview.headers);
            setPreviewRows(preview.rows);
            const guessed = guessFieldMapping(preview.headers, allFields);
            setMapping(guessed);
            form.setData('mapping', guessed);
        } catch {
            setParseError('Could not read this CSV file. Try saving as UTF-8 CSV from Excel.');
        }
    };

    const updateMapping = (fieldKey: string, csvKey: string) => {
        const next = { ...mapping };
        if (csvKey === '') {
            delete next[fieldKey];
        } else {
            next[fieldKey] = csvKey;
        }
        setMapping(next);
        form.setData('mapping', next);
    };

    const mappingReady = requiredKeys.every((key) => Boolean(mapping[key]));

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!form.data.file || !mappingReady) {
            return;
        }

        form.transform((data) => ({
            file: data.file,
            mapping: data.mapping,
        }));

        form.post(importRoute, {
            forceFormData: true,
            onSuccess: () => {
                form.reset();
                setCsvHeaders([]);
                setPreviewRows([]);
                setMapping({});
                onClose();
            },
        });
    };

    return (
        <form
            onSubmit={submit}
            className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{description}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-sm font-medium text-slate-500 hover:text-slate-800"
                >
                    Close
                </button>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="min-w-[220px] flex-1">
                    <InputLabel htmlFor="csv_import_file" value="CSV file" />
                    <input
                        id="csv_import_file"
                        type="file"
                        accept=".csv,text/csv"
                        className={fieldClass}
                        onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                        required
                    />
                    <InputError message={form.errors.file} />
                    {parseError && (
                        <p className="mt-1 text-sm text-rose-600">{parseError}</p>
                    )}
                </div>
                <a
                    href={sampleRoute}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-700"
                >
                    Sample CSV
                </a>
            </div>

            {csvHeaders.length > 0 && (
                <div className="mt-6 space-y-4">
                    <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            Map your columns
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Match each CRM field to a column from your file. Only required fields
                            must be mapped — everything else is optional.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {allFields.map((field) => (
                            <div key={field.key}>
                                <InputLabel
                                    value={`${field.label}${field.required ? ' *' : ''}`}
                                />
                                <select
                                    className={fieldClass}
                                    value={mapping[field.key] ?? ''}
                                    onChange={(e) => updateMapping(field.key, e.target.value)}
                                >
                                    <option value="">
                                        {field.required ? 'Select column…' : '— Skip —'}
                                    </option>
                                    {csvHeaders.map((header) => (
                                        <option key={header.key} value={header.key}>
                                            {header.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>

                    {previewRows.length > 0 && (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                            <table className="min-w-full text-xs">
                                <thead className="bg-slate-50 text-left uppercase text-slate-500 dark:bg-slate-800/50">
                                    <tr>
                                        {csvHeaders.map((h) => (
                                            <th key={h.key} className="px-3 py-2 whitespace-nowrap">
                                                {h.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {previewRows.map((row, i) => (
                                        <tr key={i}>
                                            {csvHeaders.map((h, colIndex) => (
                                                <td
                                                    key={h.key}
                                                    className="px-3 py-2 text-slate-600 dark:text-slate-300"
                                                >
                                                    {row[colIndex] || '—'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={form.processing || !form.data.file || !mappingReady}
                        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {form.processing ? 'Importing…' : 'Import rows'}
                    </button>

                    {!mappingReady && (
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            Map all required fields ({requiredKeys.join(', ')}) to continue.
                        </p>
                    )}
                </div>
            )}
        </form>
    );
}
