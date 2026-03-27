import { ipcMain } from 'electron';
import { getTrustedAuthContext, requirePermissionFromPayload } from './rbac';
import {
  listUsersService,
  listUsersBasicService,
  createUserService,
  resetUserPasswordService,
  changeUserPasswordService,
} from '../modules/users/users.service';

export const registerUsersIpc = (): void => {
  ipcMain.handle('users:list', async (event, payload) => {
    requirePermissionFromPayload(event, payload, 'users:read');
    return await listUsersService();
  });

  ipcMain.handle('users:list-basic', async (event, payload) => {
    requirePermissionFromPayload(event, payload, 'users:read');
    return await listUsersBasicService();
  });

  ipcMain.handle('users:create', async (event, payload) => {
    requirePermissionFromPayload(event, payload, 'users:write');
    return await createUserService(payload);
  });

  ipcMain.handle('users:reset-password', async (event, payload) => {
    requirePermissionFromPayload(event, payload, 'users:write');
    return await resetUserPasswordService(payload);
  });

  ipcMain.handle('users:change-password', async (event, payload) => {
    const trusted = getTrustedAuthContext(event);
    const actorId = trusted.userId;
    const data = (payload as any)?.data ?? payload;
    const targetId = String(data?.id ?? '');

    if (actorId !== targetId) requirePermissionFromPayload(event, payload, 'users:write');

    return await changeUserPasswordService({
      ...(payload as any),
      userId: trusted.userId,
      role: trusted.role,
      data,
    });
  });
};
