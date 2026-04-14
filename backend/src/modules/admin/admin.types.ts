import type { UserRole } from '../auth/auth.types';

export type AdminUserStatus = 'ACTIVE' | 'BLOCKED';

export type AdminStatsDTO = {
    totalUsers: number;
    totalCourses: number;
};

export type AdminUserDTO = {
    id: string;
    email: string;
    username: string;
    role: UserRole;
    status: AdminUserStatus;
    createdAt: string;
    lastLoginAt: string | null;
};

export type AdminCourseDTO = {
    id: string;
    title: string;
    ownerId: string;
    ownerEmail: string;
    createdAt: string;
    updatedAt: string;
};

export type PaginatedDTO<TItem> = {
    items: TItem[];
    total: number;
    page: number;
    limit: number;
};

export type ChangeUserRolePayload = {
    role: UserRole;
};

export type ChangeUserRoleResponseDTO = {
    user: AdminUserDTO;
};

export type ForceLogoutUserResponseDTO = {
    revokedCount: number;
};

export type AdminNotificationTarget = 'ALL' | 'ROLE' | 'USER';

export type SendAdminNotificationPayload =
    | {
    target: 'ALL';
    title: string;
    message: string;
    href?: string;
}
    | {
    target: 'ROLE';
    role: UserRole;
    title: string;
    message: string;
    href?: string;
}
    | {
    target: 'USER';
    userId: string;
    title: string;
    message: string;
    href?: string;
};

export type SendAdminNotificationResponseDTO = {
    createdCount: number;
};

export type UsersQuery = {
    page: number;
    limit: number;
    skip: number;
    search?: string;
    role?: UserRole;
    status?: AdminUserStatus;
    lastLoginFrom?: Date;
    lastLoginTo?: Date;
};

export type CoursesQuery = {
    page: number;
    limit: number;
    skip: number;
    search?: string;
};

export type AdminMessageTarget = 'ALL' | 'ROLE' | 'USER';
export type AdminMessageRole = 'STUDENT' | 'TEACHER';
export type AdminMessageRoleMode = 'ALL' | 'USER';

export type SendAdminMessagePayload =
    | {
    target: 'ALL';
    body: string;
}
    | {
    target: 'USER';
    userId: string;
    body: string;
}
    | {
    target: 'ROLE';
    role: AdminMessageRole;
    mode: 'ALL';
    body: string;
}
    | {
    target: 'ROLE';
    role: AdminMessageRole;
    mode: 'USER';
    userId: string;
    body: string;
};

export type SendAdminMessageResponseDTO = {
    sentCount: number;
    conversationId?: string;
};

export type AdminActor = {
    byAdminId: string;
    byAdminEmail: string;
};

export type AdminMessageActor = {
    byAdminId: string;
};
