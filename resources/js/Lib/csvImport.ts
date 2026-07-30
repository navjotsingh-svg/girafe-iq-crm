export function normalizeCsvHeader(header: string): string {
    return header
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_]+/g, '_')
        .replace(/^_|_$/g, '');
}

/** Minimal CSV line parser (handles quoted fields). */
export function parseCsvLine(line: string): string[] {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const next = line[i + 1];

        if (char === '"' && inQuotes && next === '"') {
            current += '"';
            i++;
            continue;
        }

        if (char === '"') {
            inQuotes = !inQuotes;
            continue;
        }

        if (char === ',' && !inQuotes) {
            cells.push(current.trim());
            current = '';
            continue;
        }

        current += char;
    }

    cells.push(current.trim());

    return cells;
}

export type CsvPreview = {
    headers: { label: string; key: string }[];
    rows: string[][];
};

export async function previewCsvFile(file: File, maxRows = 3): Promise<CsvPreview> {
    const slice = file.slice(0, 64_000);
    const text = await slice.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');

    if (lines.length === 0) {
        return { headers: [], rows: [] };
    }

    const headerCells = parseCsvLine(lines[0]);
    const headers = headerCells
        .map((label) => ({ label: label.trim(), key: normalizeCsvHeader(label) }))
        .filter((h) => h.key !== '');

    const rows: string[][] = [];
    for (let i = 1; i < lines.length && rows.length < maxRows; i++) {
        const cells = parseCsvLine(lines[i]);
        if (cells.every((c) => c.trim() === '')) {
            continue;
        }
        rows.push(cells);
    }

    return { headers, rows };
}

export type CsvImportFieldDef = {
    key: string;
    label: string;
    required?: boolean;
    aliases?: string[];
};

export function guessFieldMapping(
    headers: { label: string; key: string }[],
    fields: CsvImportFieldDef[],
): Record<string, string> {
    const mapping: Record<string, string> = {};
    const used = new Set<string>();

    for (const field of fields) {
        const aliases = field.aliases ?? [field.key];
        const match = headers.find(
            (h) => !used.has(h.key) && aliases.includes(h.key),
        );
        if (match) {
            mapping[field.key] = match.key;
            used.add(match.key);
        }
    }

    return mapping;
}

export const LEAD_IMPORT_FIELDS: CsvImportFieldDef[] = [
    {
        key: 'name',
        label: 'Name',
        required: true,
        aliases: ['name', 'full_name', 'fullname', 'lead_name', 'customer_name', 'contact_name'],
    },
    {
        key: 'phone',
        label: 'Mobile / phone',
        required: true,
        aliases: [
            'phone',
            'mobile',
            'phone_number',
            'mobile_number',
            'contact_number',
            'tel',
            'telephone',
            'cell',
        ],
    },
    {
        key: 'email',
        label: 'Email',
        aliases: ['email', 'email_address', 'e_mail', 'mail'],
    },
    {
        key: 'status',
        label: 'Lead status',
        aliases: ['status', 'lead_status', 'stage'],
    },
    {
        key: 'source',
        label: 'Source',
        aliases: ['source', 'lead_source', 'campaign', 'utm_source'],
    },
    {
        key: 'temperature',
        label: 'Temperature',
        aliases: ['temperature', 'temp', 'lead_temperature', 'priority'],
    },
    {
        key: 'notes',
        label: 'Notes',
        aliases: ['notes', 'note', 'message', 'comments', 'remark', 'remarks'],
    },
    {
        key: 'next_follow_up_at',
        label: 'Next follow-up',
        aliases: ['next_follow_up_at', 'follow_up', 'followup', 'follow_up_date', 'next_followup'],
    },
    {
        key: 'assigned_user',
        label: 'Assigned user',
        aliases: ['assigned_user', 'assignee', 'assigned_to', 'owner', 'sales_person'],
    },
    {
        key: 'external_id',
        label: 'External ID',
        aliases: ['external_id', 'id', 'lead_id', 'reference'],
    },
];

export const ENQUIRY_IMPORT_FIELDS: CsvImportFieldDef[] = [
    {
        key: 'name',
        label: 'Name',
        required: true,
        aliases: ['name', 'full_name', 'fullname', 'customer_name', 'contact_name'],
    },
    {
        key: 'phone',
        label: 'Mobile / phone',
        aliases: [
            'phone',
            'mobile',
            'phone_number',
            'mobile_number',
            'contact_number',
            'tel',
            'telephone',
        ],
    },
    {
        key: 'email',
        label: 'Email',
        aliases: ['email', 'email_address', 'e_mail', 'mail'],
    },
    {
        key: 'source',
        label: 'Source',
        aliases: ['source', 'lead_source', 'campaign'],
    },
    {
        key: 'channel',
        label: 'Channel',
        aliases: ['channel', 'medium', 'utm_medium'],
    },
    {
        key: 'message',
        label: 'Message / notes',
        aliases: ['message', 'notes', 'note', 'comments', 'inquiry'],
    },
    {
        key: 'assigned_user',
        label: 'Assigned user',
        aliases: ['assigned_user', 'assignee', 'assigned_to', 'owner'],
    },
    {
        key: 'external_id',
        label: 'External ID',
        aliases: ['external_id', 'id', 'reference'],
    },
];
