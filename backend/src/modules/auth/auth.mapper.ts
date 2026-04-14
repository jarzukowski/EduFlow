import type { AuthResult, CurrentUser } from './auth.types';

type AuthHttpResponse = {
    user: {
        id: string;
        email: string;
        username: string;
        role: AuthResult['role'];
    };
    tokens: {
        accessToken: string;
    };
};

type UserHttpResponse = {
    user: {
        id: string;
        email: string;
        username: string;
        role: CurrentUser['role'];
    };
};

export const mapAuthResultToAuthResponse = (
    authResult: AuthResult,
): AuthHttpResponse => {
    return {
        user: {
            id: authResult.userId,
            email: authResult.email,
            username: authResult.username,
            role: authResult.role,
        },
        tokens: {
            accessToken: authResult.accessToken,
        },
    };
};

export const mapUserToUserResponse = (user: CurrentUser): UserHttpResponse => {
    return {
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
        },
    };
};
