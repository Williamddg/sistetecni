/**
 * installer.ipc.ts
 * ================
 * Handlers IPC para el wizard de instalación.
 */

import { ipcMain, BrowserWindow, type IpcMainInvokeEvent } from 'electron';
import {
  runInstaller,
  checkDbInstalled,
  type InstallProgress,
} from '../db/dbInstaller';
import { writeMySqlConfig, readMySqlConfig } from '../db/mysqlConfig';
import { testMySqlConnection } from '../db/mysql';
import type { MySqlConfig } from '../db/mysqlConfig';
import { getAuthContextForEvent } from './authContext';
import { requirePermissionFromEvent } from './rbac';

const assertInstallerRunAllowed = async (
  event: IpcMainInvokeEvent,
  mysql: MySqlConfig,
): Promise<void> => {
  const trusted = getAuthContextForEvent(event);
  if (trusted) {
    requirePermissionFromEvent(event, 'config:write');
    return;
  }

  const status = await checkDbInstalled(mysql);
  if (status.installed) throw new Error('FORBIDDEN');
};

export const registerInstallerIpc = (): void => {
  ipcMain.handle('installer:test-connection', async (_e, cfg: MySqlConfig) => {
    return await testMySqlConnection(cfg);
  });

  ipcMain.handle('installer:check', async () => {
    const cfg = readMySqlConfig();
    if (!cfg) return { installed: false, state: 'config_invalid', reason: 'Sin configuración MySQL' };
    return await checkDbInstalled(cfg);
  });

  ipcMain.handle(
    'installer:run',
    async (
      event,
      payload: {
        mysql: MySqlConfig;
        adminName: string;
        adminEmail: string;
        adminPassword: string;
        companyName?: string;
        isCashier?: boolean;
      },
    ) => {
      await assertInstallerRunAllowed(event, payload.mysql);
      const previousConfig = readMySqlConfig();
      writeMySqlConfig(payload.mysql);

      const win = BrowserWindow.fromWebContents(event.sender);

      const result = await runInstaller({
        ...payload,
        onProgress: (p: InstallProgress) => {
          win?.webContents.send('installer:progress', p);
        },
      });

      if (!result.ok && previousConfig) {
        writeMySqlConfig(previousConfig);
      }

      return result;
    },
  );

  console.log('[ipc] installer handlers registrados ✅');
};
