import { ipcMain } from 'electron';
import { registerAuthIpc } from '../app/electron/ipc/auth.ipc';
import { registerMySqlIpc } from '../app/electron/ipc/mysql.ipc';
import { resetAuthContextStore } from '../app/electron/ipc/authContext';

const authUserMock = jest.fn(async (email: string) => {
  if (email === 'admin@test.com') {
    return { id: 'admin-1', name: 'Admin', email, role: 'ADMIN' as const };
  }
  if (email === 'admin2@test.com') {
    return { id: 'admin-2', name: 'Admin 2', email, role: 'ADMIN' as const };
  }
  if (email === 'seller@test.com') {
    return { id: 'seller-1', name: 'Seller', email, role: 'SELLER' as const };
  }
  return null;
});

const mysqlConfigState: any = {};

jest.mock('../app/electron/db/queries', () => ({
  authUser: (...args: any[]) => authUserMock(...args),
}));

jest.mock('../app/electron/db/mysqlConfig', () => ({
  getMySqlConfigPath: () => '/tmp/mysql-config-lifecycle.json',
  readMySqlConfig: () => ({ ...mysqlConfigState }),
  writeMySqlConfig: (cfg: any) => {
    Object.keys(mysqlConfigState).forEach((k) => delete mysqlConfigState[k]);
    Object.assign(mysqlConfigState, cfg);
  },
}));

jest.mock('../app/electron/db/mysql', () => ({
  testMySqlConnection: jest.fn(async () => ({ ok: true })),
}));

jest.mock('../app/electron/db/mysql/initSchema.mysql', () => ({
  initMySqlSchema: jest.fn(async () => ({ ok: true })),
}));

describe('secure session lifecycle in main process', () => {
  beforeEach(() => {
    (ipcMain as any).__reset();
    resetAuthContextStore();
    authUserMock.mockClear();
    Object.keys(mysqlConfigState).forEach((k) => delete mysqlConfigState[k]);

    registerAuthIpc();
    registerMySqlIpc();
  });

  test('explicit auth:logout invalidates context and blocks sensitive IPC afterwards', async () => {
    await (ipcMain as any).__invokeAs(101, 'auth:login', 'admin@test.com', 'x');

    await expect((ipcMain as any).__invokeAs(101, 'mysql:config:get')).resolves.toEqual({});

    await expect((ipcMain as any).__invokeAs(101, 'auth:logout')).resolves.toEqual({ ok: true });
    await expect((ipcMain as any).__invokeAs(101, 'mysql:config:get')).rejects.toThrow('FORBIDDEN');
  });

  test('destroyed webContents clears context automatically', async () => {
    await (ipcMain as any).__invokeAs(202, 'auth:login', 'admin@test.com', 'x');

    await expect((ipcMain as any).__invokeAs(202, 'mysql:config:get')).resolves.toEqual({});

    (ipcMain as any).__destroySender(202);

    await expect((ipcMain as any).__invokeAs(202, 'mysql:config:get')).rejects.toThrow('FORBIDDEN');
  });

  test('re-login on same sender replaces session context and enforces new role', async () => {
    await (ipcMain as any).__invokeAs(303, 'auth:login', 'admin@test.com', 'x');
    await expect((ipcMain as any).__invokeAs(303, 'mysql:config:get')).resolves.toEqual({});

    await (ipcMain as any).__invokeAs(303, 'auth:login', 'seller@test.com', 'x');
    await expect((ipcMain as any).__invokeAs(303, 'mysql:config:get')).rejects.toThrow('FORBIDDEN');
  });

  test('two simultaneous senders keep isolated sessions with different roles', async () => {
    await (ipcMain as any).__invokeAs(401, 'auth:login', 'admin@test.com', 'x');
    await (ipcMain as any).__invokeAs(402, 'auth:login', 'seller@test.com', 'x');

    await expect((ipcMain as any).__invokeAs(401, 'mysql:config:get')).resolves.toEqual({});
    await expect((ipcMain as any).__invokeAs(402, 'mysql:config:get')).rejects.toThrow('FORBIDDEN');
  });

  test('authenticated sender does not grant access to unauthenticated sender', async () => {
    await (ipcMain as any).__invokeAs(501, 'auth:login', 'admin@test.com', 'x');

    await expect((ipcMain as any).__invokeAs(501, 'mysql:config:get')).resolves.toEqual({});
    await expect((ipcMain as any).__invokeAs(502, 'mysql:config:get')).rejects.toThrow('FORBIDDEN');
  });

  test('logout in one sender does not affect active session in another sender', async () => {
    await (ipcMain as any).__invokeAs(601, 'auth:login', 'admin@test.com', 'x');
    await (ipcMain as any).__invokeAs(602, 'auth:login', 'admin2@test.com', 'x');

    await (ipcMain as any).__invokeAs(601, 'auth:logout');

    await expect((ipcMain as any).__invokeAs(601, 'mysql:config:get')).rejects.toThrow('FORBIDDEN');
    await expect((ipcMain as any).__invokeAs(602, 'mysql:config:get')).resolves.toEqual({});
  });

  test('destroying one sender clears only that sender context', async () => {
    await (ipcMain as any).__invokeAs(701, 'auth:login', 'admin@test.com', 'x');
    await (ipcMain as any).__invokeAs(702, 'auth:login', 'admin2@test.com', 'x');

    (ipcMain as any).__destroySender(701);

    await expect((ipcMain as any).__invokeAs(701, 'mysql:config:get')).rejects.toThrow('FORBIDDEN');
    await expect((ipcMain as any).__invokeAs(702, 'mysql:config:get')).resolves.toEqual({});
  });

  test('re-login in one sender does not contaminate another sender session', async () => {
    await (ipcMain as any).__invokeAs(801, 'auth:login', 'admin@test.com', 'x');
    await (ipcMain as any).__invokeAs(802, 'auth:login', 'admin2@test.com', 'x');

    await (ipcMain as any).__invokeAs(801, 'auth:login', 'seller@test.com', 'x');

    await expect((ipcMain as any).__invokeAs(801, 'mysql:config:get')).rejects.toThrow('FORBIDDEN');
    await expect((ipcMain as any).__invokeAs(802, 'mysql:config:get')).resolves.toEqual({});
  });
});
