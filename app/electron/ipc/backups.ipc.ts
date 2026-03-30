import { dialog, ipcMain } from 'electron';
import { logAuditRepo } from '../db/audit.repo';
import { markFallbackOperation, resolveSensitiveOperationPlan } from '../db/fallbackControl';
import {
  createBackupSnapshot,
  ensureDailyBackupSnapshot,
  exportCurrentDatabaseTo,
  restoreCurrentDatabaseFrom,
} from '../services/backups.service';
import { getTrustedAuthContext, requirePermissionFromPayload } from './rbac';

type BackupReason = 'manual' | 'daily' | 'cash_close';

export const createBackup = async (reason: BackupReason): Promise<string> => {
  try {
    return await createBackupSnapshot(reason);
  } catch (error) {
    console.error(`[backup:${reason}] failed`, error);
    throw error;
  }
};

export const ensureDailyBackup = async (): Promise<string | null> => {
  try {
    return await ensureDailyBackupSnapshot();
  } catch (error) {
    console.error('[backup:daily-check] failed', error);
    return null;
  }
};

export const registerBackupsIpc = (): void => {
  ipcMain.handle('backup:create-manual', async (event, payload) => {
    try {
      requirePermissionFromPayload(event, payload, 'backup:write');
      const trusted = getTrustedAuthContext(event);
      const plan = await resolveSensitiveOperationPlan('backup:create');
      const out = await createBackup('manual');
      const actorId = String(trusted.userId ?? '');
      if (actorId) {
        await logAuditRepo({
          actorId,
          action: 'BACKUP_CREATE',
          entityType: 'BACKUP',
          entityId: out,
          metadata: { reason: 'manual' },
        });
      }
      markFallbackOperation(plan, { backupPath: out, reason: 'manual' });
      return out;
    } catch (error) {
      console.error('[backup:create-manual] failed', error);
      return null;
    }
  });

  ipcMain.handle('backups:export', async (event, payload) => {
    try {
      requirePermissionFromPayload(event, payload, 'backup:write');
      const target = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
      if (target.canceled || !target.filePaths[0]) return null;
      return exportCurrentDatabaseTo(target.filePaths[0]);
    } catch (error) {
      console.error('[backup:export] failed', error);
      return null;
    }
  });

  ipcMain.handle('backups:restore', async (event, payload) => {
    try {
      requirePermissionFromPayload(event, payload, 'backup:write');
      const file = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'SQLite DB', extensions: ['db'] }] });
      if (file.canceled || !file.filePaths[0]) return false;
      restoreCurrentDatabaseFrom(file.filePaths[0]);
      return true;
    } catch (error) {
      console.error('[backup:restore] failed', error);
      return false;
    }
  });
};
