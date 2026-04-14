import type { SessionDTO } from '@/types/sessions.types';

const SESSION_USER_AGENT_MAX_LENGTH = 80;

const getSafeTimestamp = (value: string | null | undefined): number => {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const formatSessionDateTime = (
  isoString: string | null | undefined,
  locale = 'pl-PL',
): string => {
  if (!isoString) {
    return '-';
  }

  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatSessionUserAgent = (
  userAgent: string | null | undefined,
): string => {
  if (!userAgent) {
    return '-';
  }

  const trimmedUserAgent = userAgent.trim();

  if (trimmedUserAgent.length === 0) {
    return '-';
  }

  if (trimmedUserAgent.length <= SESSION_USER_AGENT_MAX_LENGTH) {
    return trimmedUserAgent;
  }

  return `${trimmedUserAgent.slice(0, SESSION_USER_AGENT_MAX_LENGTH)}…`;
};

export const isSessionActive = (
  session: SessionDTO,
  nowTimestamp = Date.now(),
): boolean => {
  if (session.revokedAt !== null) {
    return false;
  }

  return getSafeTimestamp(session.expiresAt) > nowTimestamp;
};

export const sortSessionsByCreatedAtDesc = (
  leftSession: SessionDTO,
  rightSession: SessionDTO,
): number => {
  return getSafeTimestamp(rightSession.createdAt) - getSafeTimestamp(leftSession.createdAt);
};

export const sortActiveSessions = (
  leftSession: SessionDTO,
  rightSession: SessionDTO,
): number => {
  if (leftSession.isCurrent && !rightSession.isCurrent) {
    return -1;
  }

  if (!leftSession.isCurrent && rightSession.isCurrent) {
    return 1;
  }

  return sortSessionsByCreatedAtDesc(leftSession, rightSession);
};
