import { ipcMain } from 'electron';
import { requirePermissionFromPayload } from './rbac';
import {
  listUsersService,
  listUsersBasicService,
  createUserService,
  resetUserPasswordService,
  changeUserPasswordService,
} from '../modules/users/users.service';

export const registerUsersIpc = (): void => {
  ipcMain.handle('users:list', async (_e, payload) => {
    requirePermissionFromPayload(payload, 'users:read');
    return await listUsersService();
  });

  ipcMain.handle('users:list-basic', async (_e, payload) => {
    requirePermissionFromPayload(payload, 'users:read');
    return await listUsersBasicService();
  });

  ipcMain.handle('users:create', async (_e, payload) => {
    requirePermissionFromPayload(payload, 'users:write');
    return await createUserService(payload);
  });

  ipcMain.handle('users:reset-password', async (_e, payload) => {
    requirePermissionFromPayload(payload, 'users:write');
    return await resetUserPasswordService(payload);
  });

  ipcMain.handle('users:change-password', async (_e, payload) => {
    const actorId = String((payload as any)?.userId ?? '');
    const data = (payload as any)?.data ?? payload;
    const targetId = String(data?.id ?? '');

    if (actorId !== targetId) requirePermissionFromPayload(payload, 'users:write');

    return await changeUserPasswordService(payload);
  });
};
