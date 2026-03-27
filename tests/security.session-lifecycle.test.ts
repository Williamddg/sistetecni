import { ipcMain } from 'electron';
import { registerAuthIpc } from '../app/electron/ipc/auth.ipc';
import { registerMySqlIpc } from '../app/electron/ipc/mysql.ipc';
import { resetAuthContextStore } from '../app/electron/ipc/authContext';

const authUserMock = jest.fn(async (email: string) => {
  if (email === 'admin@test.com') {
    return { id: 'admin-1', name: 'Admin', email, role: 'ADMIN' as const };
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
});
