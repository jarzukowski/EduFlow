export type SessionDTO = {
  id: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
  revokedAt: string | null;
  ip: string | null;
  userAgent: string | null;
  isCurrent: boolean;
};

export type SessionsResponseDTO = {
  items: SessionDTO[];
};

export type RevokeSessionResponseDTO = {
  revokedId: string;
  wasCurrent: boolean;
};
