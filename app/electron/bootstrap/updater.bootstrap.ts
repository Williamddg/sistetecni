import { dialog } from 'electron';
import { autoUpdater } from 'electron-updater';

export const setupAutoUpdates = (): void => {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('[UPDATER] Buscando actualizaciones...');
  });

  autoUpdater.on('update-available', async (info) => {
    console.log('[UPDATER] Actualización disponible:', info?.version);

    try {
      await dialog.showMessageBox({
        type: 'info',
        title: 'Actualización disponible',
        message: `Se encontró una nueva versión (${info?.version ?? 'nueva'}).`,
        detail: 'La actualización se descargará automáticamente en segundo plano.',
        buttons: ['Aceptar'],
      });
    } catch {}
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[UPDATER] No hay actualizaciones disponibles.');
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log(
      `[UPDATER] Descargando ${Math.round(progress.percent)}% - ${Math.round(
        progress.bytesPerSecond / 1024,
      )} KB/s`,
    );
  });

  autoUpdater.on('update-downloaded', async (info) => {
    console.log('[UPDATER] Actualización descargada:', info?.version);

    try {
      const result = await dialog.showMessageBox({
        type: 'info',
        title: 'Actualización lista',
        message: `La versión ${info?.version ?? ''} ya fue descargada.`,
        detail: 'La aplicación se cerrará para instalar la actualización.',
        buttons: ['Actualizar ahora', 'Después'],
        defaultId: 0,
        cancelId: 1,
      });

      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    } catch (error) {
      console.error('[UPDATER] Error mostrando diálogo final:', error);
    }
  });

  autoUpdater.on('error', (error) => {
    console.error('[UPDATER] Error:', error);
  });
};

export const checkForAppUpdates = async (): Promise<void> => {
  try {
    if (process.env.VITE_DEV_SERVER_URL) {
      console.log('[UPDATER] Modo desarrollo: se omite revisión de actualizaciones.');
      return;
    }

    await autoUpdater.checkForUpdatesAndNotify();
  } catch (error) {
    console.error('[UPDATER] No se pudo revisar actualizaciones:', error);
  }
};
