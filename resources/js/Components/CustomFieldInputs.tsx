import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

export type CustomFieldDef = {
    id: number;
    name: string;
    key: string;
    type: string;
    options: string[] | null;
    is_required: boolean;
    show_in_list?: boolean;
};

type Props = {
    fields: CustomFieldDef[];
    values: Record<string, string | boolean | number>;
    onChange: (key: string, value: string | boolean | number) => void;
    fieldClass?: string;
};

export default function CustomFieldInputs({
    fields,
    values,
    onChange,
    fieldClass = 'mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800',
}: Props) {
    if (fields.length === 0) {
        return null;
    }

    return (
        <>
            {fields.map((field) => {
                const id = `cf_${field.key}`;
                const label = `${field.name}${field.is_required ? ' *' : ''}`;
                const value = values[field.key] ?? '';

                if (field.type === 'boolean') {
                    return (
                        <label
                            key={field.id}
                            className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                        >
                            <input
                                id={id}
                                type="checkbox"
                                checked={Boolean(value)}
                                onChange={(e) => onChange(field.key, e.target.checked)}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            {field.name}
                            {field.is_required ? ' *' : ''}
                        </label>
                    );
                }

                if (field.type === 'select') {
                    return (
                        <div key={field.id}>
                            <InputLabel htmlFor={id} value={label} />
                            <select
                                id={id}
                                className={fieldClass}
                                value={String(value)}
                                required={field.is_required}
                                onChange={(e) => onChange(field.key, e.target.value)}
                            >
                                <option value="">Select…</option>
                                {(field.options ?? []).map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                    );
                }

                if (field.type === 'textarea') {
                    return (
                        <div key={field.id} className="sm:col-span-2">
                            <InputLabel htmlFor={id} value={label} />
                            <textarea
                                id={id}
                                rows={3}
                                className={fieldClass}
                                value={String(value)}
                                required={field.is_required}
                                onChange={(e) => onChange(field.key, e.target.value)}
                            />
                        </div>
                    );
                }

                const inputType =
                    field.type === 'number'
                        ? 'number'
                        : field.type === 'date'
                          ? 'date'
                          : field.type === 'email'
                            ? 'email'
                            : field.type === 'phone'
                              ? 'tel'
                              : 'text';

                return (
                    <div key={field.id}>
                        <InputLabel htmlFor={id} value={label} />
                        <TextInput
                            id={id}
                            type={inputType}
                            className={fieldClass}
                            value={String(value)}
                            required={field.is_required}
                            onChange={(e) => onChange(field.key, e.target.value)}
                        />
                    </div>
                );
            })}
        </>
    );
}
