export const formatTimeAgo = (isoDate: string, locale: string = 'en-US'): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  let seconds = Math.round((date.getTime() - Date.now()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const divisions: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
    { amount: 4.34524, unit: 'week' },
    { amount: 12, unit: 'month' },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' },
  ];

  let duration = seconds;

  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(duration, division.unit);
    }
    duration = Math.round(duration / division.amount);
  }

  return rtf.format(duration, 'year');
};

