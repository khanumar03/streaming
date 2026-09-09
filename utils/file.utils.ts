import fs from 'fs';
import path from 'path';

export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

export const ensureUploadDirExists = (): void => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};