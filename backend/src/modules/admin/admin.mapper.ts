import type { UserRole } from '../auth/auth.types';
import type { AdminCourseDTO, AdminUserDTO } from './admin.types';

type AdminUserRecord = {
    id: string;
    email: string;
    username: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    lastLoginAt: Date | null;
};

type AdminCourseRecord = {
    id: string;
    title: string;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
    owner: {
        email: string;
    };
};

export const mapUserToAdminUserDTO = (user: AdminUserRecord): AdminUserDTO => ({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    status: user.isActive ? 'ACTIVE' : 'BLOCKED',
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
});

export const mapCourseToAdminCourseDTO = (
    course: AdminCourseRecord,
): AdminCourseDTO => ({
    id: course.id,
    title: course.title,
    ownerId: course.ownerId,
    ownerEmail: course.owner.email,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
});
