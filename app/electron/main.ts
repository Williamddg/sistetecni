import 'dotenv/config';
import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

import {
  activateOnline,
  checkOnline,
  getMachineId,
  getSavedLicenseKey,
  licenseStatusLocal,
} from './license/license';
import { createMainWindow } from './bootstrap/window.bootstrap';
import { runAppBootstrap } from './bootstrap/app.bootstrap';

console.log('[MAIN] Electron arrancó desde:', __filename);

// -------------------- LICENCIAS --------------------

ipcMain.handle('license:status', async () => {
  const machineId = getMachineId();
  const local = licenseStatusLocal();

  return {
    ok: local.ok,
    reason: local.reason,
    machineId,
    plan: local.state.plan ?? null,
    expiresAt: local.state.expiresAt ?? null,
    lastCheckAt: local.state.lastCheckAt ?? null,
    graceDays: local.state.graceDays ?? 7,
    hasLicense: !!getSavedLicenseKey(),
  };
});

ipcMain.handle('license:activate', async (_e, { licenseKey }) => {
  return await activateOnline(String(licenseKey ?? '').trim());
});

ipcMain.handle('license:check-online', async () => {
  const key = getSavedLicenseKey();
  if (!key) return { ok: false, message: 'NO_LICENSE' };
  return await checkOnline();
});

// -------------------- UPDATER IPC --------------------

ipcMain.handle('app:check-updates', async () => {
  try {
    if (process.env.VITE_DEV_SERVER_URL) {
      return { ok: false, message: 'DEV_MODE' };
    }

    const result = await autoUpdater.checkForUpdates();
    return {
      ok: true,
      updateInfo: result?.updateInfo ?? null,
    };
  } catch (error: any) {
    return {
      ok: false,
      message: error?.message || 'UPDATE_CHECK_FAILED',
    };
  }
});

ipcMain.handle('app:install-update', async () => {
  try {
    autoUpdater.quitAndInstall();
    return { ok: true };
  } catch (error: any) {
    return {
      ok: false,
      message: error?.message || 'INSTALL_UPDATE_FAILED',
    };
  }
});

// -------------------- APP READY --------------------

app.whenReady().then(async () => {
  await runAppBootstrap();
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createMainWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
