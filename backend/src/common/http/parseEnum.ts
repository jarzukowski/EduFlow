import type { ParsedQs } from 'qs';

export const parseEnumOptional = <T extends string>(
    query: ParsedQs,
    key: string,
    allowed: readonly T[],
): T | undefined => {
    const raw = query[key];
    if (typeof raw !== 'string') return undefined;

    return allowed.includes(raw as T) ? (raw as T) : undefined;
};