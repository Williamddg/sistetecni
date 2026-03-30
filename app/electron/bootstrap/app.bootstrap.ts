import { getDb, getDbMode } from '../db/db';
import { runFallbackResyncCycle } from '../db/fallbackSync';
import { ensureDailyBackup } from '../ipc/backups.ipc';
import { registerDomainIpcHandlers, registerEarlyIpcHandlers } from './ipc.bootstrap';
import { createMainWindow } from './window.bootstrap';
import { checkForAppUpdates, setupAutoUpdates } from './updater.bootstrap';

export const runAppBootstrap = async (): Promise<void> => {
  registerEarlyIpcHandlers();

  try {
    getDb();
  } catch (error) {
    console.error('[bootstrap] Error inicializando SQLite local:', error);
    throw error;
  }

  registerDomainIpcHandlers();

  setupAutoUpdates();

  await ensureDailyBackup();
  await createMainWindow();
  await checkForAppUpdates();

  setInterval(async () => {
    try {
      const dbMode = await getDbMode();
      console.log('DB MODE:', dbMode);

      if (dbMode === 'mysql') {
        const syncResult = await runFallbackResyncCycle({ limit: 25 });
        if (syncResult.attempted > 0) {
          console.log('[fallback-sync]', syncResult);
        }
      }
    } catch (error) {
      console.error('[bootstrap:fallback-sync] ciclo omitido por error controlado:', error);
    }
  }, 5000);
};
