import fs from 'node:fs';
import path from 'node:path';
import { getDb, getDbPath } from '../db/db';
import { ensureUserDataSubdir } from './storagePaths.service';

export type BackupReason = 'manual' | 'daily' | 'cash_close';

const BACKUP_PREFIX = 'sistetecni-pos';
const BACKUP_EXT = '.db';
const MAX_BACKUPS = 30;

const pad = (n: number) => String(n).padStart(2, '0');

export const buildBackupFileName = (date = new Date()): string => {
  return `${BACKUP_PREFIX}-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}-${pad(date.getMinutes())}${BACKUP_EXT}`;
};

export const getBackupsDir = (): string => ensureUserDataSubdir('backups');

const listBackupFilesSorted = (dir: string): Array<{ fullPath: string; mtimeMs: number }> => {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(BACKUP_EXT))
    .map((f) => {
      const fullPath = path.join(dir, f);
      return { fullPath, mtimeMs: fs.statSync(fullPath).mtimeMs };
    })
    .sort((a, b) => a.mtimeMs - b.mtimeMs);
};

export const pruneBackups = (dir: string, maxBackups = MAX_BACKUPS): void => {
  const backups = listBackupFilesSorted(dir);
  const toDelete = backups.length - Math.max(1, maxBackups);
  if (toDelete <= 0) return;

  for (let i = 0; i < toDelete; i += 1) {
    try {
      fs.unlinkSync(backups[i].fullPath);
    } catch {
      // best effort
    }
  }
};

const toError = (operation: string, error: unknown): Error => {
  const message = String((error as any)?.message ?? error ?? 'unknown_error');
  return new Error(`${operation}: ${message}`);
};

export const createBackupSnapshot = async (reason: BackupReason): Promise<string> => {
  try {
    const dir = getBackupsDir();
    const out = path.join(dir, buildBackupFileName());
    await getDb().backup(out);
    pruneBackups(dir);
    return out;
  } catch (error) {
    throw toError(`backup:${reason}`, error);
  }
};

export const ensureDailyBackupSnapshot = async (): Promise<string | null> => {
  try {
    const dir = getBackupsDir();
    const today = new Date().toISOString().slice(0, 10);
    const alreadyHasToday = fs.readdirSync(dir).some((f) => f.includes(today) && f.endsWith(BACKUP_EXT));
    if (alreadyHasToday) return null;
    return await createBackupSnapshot('daily');
  } catch (error) {
    throw toError('backup:daily-check', error);
  }
};

export const exportCurrentDatabaseTo = (targetDir: string): string => {
  try {
    const out = path.join(targetDir, buildBackupFileName());
    fs.copyFileSync(getDbPath(), out);
    return out;
  } catch (error) {
    throw toError('backup:export', error);
  }
};

export const restoreCurrentDatabaseFrom = (backupFile: string): void => {
  try {
    fs.copyFileSync(backupFile, getDbPath());
  } catch (error) {
    throw toError('backup:restore', error);
  }
};
