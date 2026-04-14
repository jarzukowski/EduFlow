export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: {
    accessToken: string;
  };
}

export interface RegisterDto {
  email: string;
  username: string;
  password: string;
}

export interface RegisterResponse {
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}

export interface RefreshResponse {
  tokens: {
    accessToken: string;
  };
}
