export const parsePositiveInt = (
    value: unknown,
    fallback: number,
): number => {
    if (typeof value !== 'string') return fallback;

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const clamp = (
    value: number,
    min: number,
    max: number,
): number => {
    return Math.min(Math.max(value, min), max);
};