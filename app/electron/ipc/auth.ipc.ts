import { ipcMain } from 'electron';
import { authUser } from '../db/queries';

export const registerAuthIpc = (): void => {
  ipcMain.handle('auth:login', async (_e, email: string, password: string) => {
    const user = await authUser(email, password);

    if (!user) throw new Error('Credenciales inválidas');
    return user;
  });
};
