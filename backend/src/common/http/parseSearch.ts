import type { ParsedQs } from 'qs';

interface SearchOptions {
    minLength?: number;
    maxLength?: number;
}

export const parseSearch = (
    query: ParsedQs,
    key: string,
    options?: SearchOptions,
): string | undefined => {
    const minLength = options?.minLength ?? 2;
    const maxLength = options?.maxLength ?? 100;

    const raw = query[key];

    if (typeof raw !== 'string') return undefined;

    const trimmed = raw.trim();
    if (trimmed.length < minLength) return undefined;

    return trimmed.length > maxLength
        ? trimmed.slice(0, maxLength)
        : trimmed;
};