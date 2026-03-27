import { ipcMain } from 'electron';
import { getFallbackSyncStatus, runFallbackResyncManual } from '../db/fallbackSync';
import { requirePermissionFromEvent } from './rbac';

type ManualSyncPayload = {
  limit?: number;
};

export const registerSyncAdminIpc = (): void => {
  ipcMain.handle('sync:status:get', async (event) => {
    try {
      requirePermissionFromEvent(event, 'config:write');
      return { ok: true, data: getFallbackSyncStatus() };
    } catch (error: any) {
      return { ok: false, error: error?.message ?? 'SYNC_STATUS_FAILED' };
    }
  });

  ipcMain.handle('sync:run-manual', async (_event, payload: ManualSyncPayload = {}) => {
    try {
      requirePermissionFromEvent(_event, 'config:write');
      const limit = Number(payload.limit ?? 25);
      const result = await runFallbackResyncManual({ limit });
      return result;
    } catch (error: any) {
      return { ok: false, reason: error?.message ?? 'SYNC_MANUAL_FAILED' };
    }
  });
};
