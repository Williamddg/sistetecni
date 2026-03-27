import { app, BrowserWindow } from 'electron';
import path from 'node:path';

export const createMainWindow = async (): Promise<BrowserWindow> => {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, '../preload.js'),
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;

  if (devUrl) {
    await win.loadURL(devUrl);
  } else {
    const indexPath = path.join(app.getAppPath(), 'dist', 'renderer', 'index.html');
    await win.loadFile(indexPath);
  }

  return win;
};
