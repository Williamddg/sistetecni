import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

export const getUserDataPath = (): string => app.getPath('userData');

export const getUserDataFilePath = (fileName: string): string => {
  return path.join(getUserDataPath(), fileName);
};

export const ensureUserDataSubdir = (dirName: string): string => {
  const dir = path.join(getUserDataPath(), dirName);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
