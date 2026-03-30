import { ipc } from './ipcClient';
import type { SessionUser } from '../types';

export const login = async (email: string, password: string): Promise<SessionUser> => {
  const u = await ipc.auth.login(email, password);
  return u as SessionUser;
};
