export type AppErrorCode =
    | 'EMAIL_TAKEN'
    | 'INVALID_CREDENTIALS'
    | 'INVALID_REFRESH_TOKEN'
    | 'USER_NOT_FOUND'
    | 'VALIDATION_ERROR'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'INTERNAL_SERVER_ERROR'
    | 'NOT_FOUND'
    | 'SESSION_NOT_FOUND'
    | 'USERNAME_TAKEN'
    | 'BAD_REQUEST'
    | 'CONFLICT'
    | 'TOO_MANY_REQUESTS';

export class AppError extends Error {
    public readonly code: AppErrorCode;
    public readonly statusCode: number;

    constructor(
        code: AppErrorCode,
        statusCode: number,
        message: string = code,
    ) {
        super(message);

        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;

        Object.setPrototypeOf(this, AppError.prototype);
    }
}