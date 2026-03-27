import { getDb, getDbMode } from '../db/db';
import { ensureDailyBackup } from '../ipc/backups.ipc';
import { registerDomainIpcHandlers, registerEarlyIpcHandlers } from './ipc.bootstrap';
import { createMainWindow } from './window.bootstrap';
import { checkForAppUpdates, setupAutoUpdates } from './updater.bootstrap';

export const runAppBootstrap = async (): Promise<void> => {
  registerEarlyIpcHandlers();

  getDb();

  registerDomainIpcHandlers();

  setupAutoUpdates();

  await ensureDailyBackup();
  await createMainWindow();
  await checkForAppUpdates();

  setInterval(async () => {
    console.log('DB MODE:', await getDbMode());
  }, 3000);
};
