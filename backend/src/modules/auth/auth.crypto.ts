import crypto from 'crypto';

export const sha256 = (value: string): string =>
    crypto.createHash('sha256').update(value, 'utf8').digest('hex');


export const generateOpaqueToken = (bytes: number = 64): string =>
    crypto.randomBytes(bytes).toString('hex');
