import { AppError } from '../../common/errors/AppError';
import type { LoginDto, RegisterDto } from './auth.types';

type AuthBodyShape = {
    email?: unknown;
    password?: unknown;
    username?: unknown;
    deviceId?: unknown;
};

const throwValidationError = (message: string): never => {
    throw new AppError('VALIDATION_ERROR', 400, message);
};

const ensureBodyIsObject = (body: unknown): AuthBodyShape => {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throwValidationError('Invalid request body');
    }

    return body as AuthBodyShape;
};

const getRequiredString = (
    value: unknown,
    missingMessage: string,
    invalidTypeMessage: string,
): string => {
    if (value == null) {
        throwValidationError(missingMessage);
    }

    if (typeof value !== 'string') {
        throwValidationError(invalidTypeMessage);
    }

    return value as string;
};

const getOptionalString = (value: unknown, invalidTypeMessage: string): string | undefined => {
    if (value == null) {
        return undefined;
    }

    if (typeof value !== 'string') {
        throwValidationError(invalidTypeMessage);
    }

    return value as string;
};

const isValidEmail = (email: string): boolean => {
    if (email.length < 5 || email.length > 254) {
        return false;
    }

    return /^\S+@\S+\.\S+$/.test(email);
};

const isValidPassword = (password: string): boolean => {
    if (password.length < 8 || password.length > 100) {
        return false;
    }

    const hasLetter = /[A-Za-z]/.test(password);
    const hasDigit = /\d/.test(password);

    return hasLetter && hasDigit;
};

const isValidUsername = (username: string): boolean => {
    if (username.length < 3 || username.length > 24) {
        return false;
    }

    return /^[a-zA-Z0-9._-]+$/.test(username);
};

const validateEmailPasswordAndOptionalDeviceId = (
    body: AuthBodyShape,
    validatePasswordStrength = false,
): { email: string; password: string; deviceId?: string } => {
    const { email, password, deviceId } = body;
    const validatedEmail = getRequiredString(
        email,
        'Email and password are required',
        'Email and password must be strings',
    );
    const validatedPassword = getRequiredString(
        password,
        'Email and password are required',
        'Email and password must be strings',
    );
    const trimmedEmail = validatedEmail.trim();

    if (!trimmedEmail || !validatedPassword) {
        throwValidationError('Email and password are required');
    }

    if (!isValidEmail(trimmedEmail)) {
        throwValidationError('Invalid email format');
    }

    if (validatePasswordStrength && !isValidPassword(validatedPassword)) {
        throwValidationError(
            'Password must be at least 8 characters long and contain letters and digits',
        );
    }

    let validatedDeviceId: string | undefined;
    const optionalDeviceId = getOptionalString(deviceId, 'deviceId must be a string');

    if (optionalDeviceId !== undefined) {
        const trimmedDeviceId = optionalDeviceId.trim();

        if (trimmedDeviceId.length < 8 || trimmedDeviceId.length > 128) {
            throwValidationError('deviceId length is invalid');
        }

        validatedDeviceId = trimmedDeviceId;
    }

    return {
        email: trimmedEmail,
        password: validatedPassword,
        deviceId: validatedDeviceId,
    };
};

export const validateRegisterBody = (body: unknown): RegisterDto => {
    const parsedBody = ensureBodyIsObject(body);
    const { email, username, password } = parsedBody;
    const validatedEmail = getRequiredString(
        email,
        'Email, username and password are required',
        'Email, username and password must be strings',
    );
    const validatedUsername = getRequiredString(
        username,
        'Email, username and password are required',
        'Email, username and password must be strings',
    );
    const validatedPassword = getRequiredString(
        password,
        'Email, username and password are required',
        'Email, username and password must be strings',
    );
    const trimmedEmail = validatedEmail.trim();
    const trimmedUsername = validatedUsername.trim();

    if (!trimmedEmail || !trimmedUsername || !validatedPassword) {
        throwValidationError('Email, username and password are required');
    }

    if (!isValidEmail(trimmedEmail)) {
        throwValidationError('Invalid email format');
    }

    if (!isValidUsername(trimmedUsername)) {
        throwValidationError(
            'Username must be 3-24 chars and contain only letters, digits, . _ -',
        );
    }

    if (!isValidPassword(validatedPassword)) {
        throwValidationError(
            'Password must be at least 8 characters long and contain letters and digits',
        );
    }

    return {
        email: trimmedEmail,
        username: trimmedUsername,
        password: validatedPassword,
    };
};

export const validateLoginBody = (body: unknown): LoginDto => {
    const parsedBody = ensureBodyIsObject(body);

    return validateEmailPasswordAndOptionalDeviceId(parsedBody, false);
};
