import { ipcMain } from 'electron';
import { authUser } from '../db/queries';
import { setAuthContextForEvent } from './authContext';

export const registerAuthIpc = (): void => {
  ipcMain.handle('auth:login', async (event, email: string, password: string) => {
    const user = await authUser(email, password);

    if (!user) throw new Error('Credenciales inválidas');
    setAuthContextForEvent(event, user);
    return user;
  });
};
