import type { ParsedQs } from 'qs';

export interface DateRange {
    from?: Date;
    to?: Date;
}

const parseIsoDate = (value: unknown): Date | undefined => {
    if (typeof value !== 'string') return undefined;

    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) return undefined;

    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? undefined : date;
};

export const parseDateRange = (
    query: ParsedQs,
    fromKey: string,
    toKey: string,
): DateRange => {
    const from = parseIsoDate(query[fromKey]);
    const to = parseIsoDate(query[toKey]);

    return { from, to };
};