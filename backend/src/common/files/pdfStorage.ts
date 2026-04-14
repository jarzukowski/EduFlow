import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import { AppError } from '../errors/AppError';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'pdf');
const PDF_KEY_REGEX = /^[a-f0-9]{48}\.pdf$/i;

const ensureUploadDir = async (): Promise<void> => {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
};

const assertPdfFile = (file: Express.Multer.File): void => {
    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfName = file.originalname.toLowerCase().endsWith('.pdf');

    if (!isPdfMime && !isPdfName) {
        throw new AppError('BAD_REQUEST', 400, 'Only PDF files are allowed');
    }

    if (!file.buffer || file.buffer.length === 0) {
        throw new AppError('BAD_REQUEST', 400, 'Empty PDF file');
    }
};

export const saveLessonPdf = async (file: Express.Multer.File): Promise<string> => {
    await ensureUploadDir();
    assertPdfFile(file);

    const randomName = crypto.randomBytes(24).toString('hex');
    const filename = `${randomName}.pdf`;
    const finalPath = path.join(UPLOAD_DIR, filename);
    const tmpName = `${randomName}.${crypto.randomBytes(8).toString('hex')}.tmp`;
    const tmpPath = path.join(UPLOAD_DIR, tmpName);

    try {
        await fs.writeFile(tmpPath, file.buffer);
        await fs.rename(tmpPath, finalPath);
    } catch (error: unknown) {
        try { await fs.unlink(tmpPath); } catch {}
        throw error;
    }

    return filename;
};

export const getLessonPdfPath = (pdfKey: string): string => {
    if (!PDF_KEY_REGEX.test(pdfKey)) {
        throw new AppError('BAD_REQUEST', 400, 'Invalid pdfKey');
    }

    return path.join(UPLOAD_DIR, pdfKey);
};
