import { ipcMain } from 'electron';
import { createBackup } from './backups.ipc';
import { requirePermissionFromPayload } from './rbac';
import {
  closeCashService,
  getCashStatusService,
  getOpenCashService,
  getOpenSuggestionService,
  openCashService,
} from '../modules/cash/cash.service';

export const registerCashIpc = (): void => {
  ipcMain.handle('cash:open', async (event, payload) => {
    requirePermissionFromPayload(event, payload, 'cash:openclose');
    return await openCashService(payload);
  });

  ipcMain.handle('cash:get-open', async (event, payload) => {
    requirePermissionFromPayload(event, payload, 'cash:read');
    return await getOpenCashService();
  });

  ipcMain.handle('cash:get-status', async (event, payload) => {
    requirePermissionFromPayload(event, payload, 'cash:read');
    return await getCashStatusService();
  });

  ipcMain.handle('cash:get-open-suggestion', async (event, payload) => {
    requirePermissionFromPayload(event, payload, 'cash:read');
    return await getOpenSuggestionService();
  });

  ipcMain.handle('cash:close', async (event, payload) => {
    requirePermissionFromPayload(event, payload, 'cash:openclose');

    const { base } = await closeCashService(payload);

    // Se mantiene en IPC por bajo riesgo, para no cruzar módulos de servicio
    // con funciones de infraestructura ya expuestas desde ipc/backups.
    try {
      const backupPath = await createBackup('cash_close');
      return { ...base, backupPath };
    } catch {
      return { ...base, backupPath: null };
    }
  });
};
