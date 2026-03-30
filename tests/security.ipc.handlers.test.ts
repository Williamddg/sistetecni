import { ipcMain } from 'electron';
import { registerConfigIpc } from '../app/electron/ipc/config.ipc';
import { registerMySqlIpc } from '../app/electron/ipc/mysql.ipc';
import { registerSyncAdminIpc } from '../app/electron/ipc/syncAdmin.ipc';
import { registerUsersIpc } from '../app/electron/ipc/users.ipc';
import { registerInstallerIpc } from '../app/electron/ipc/installer.ipc';
import { resetAuthContextStore, setAuthContextForSenderId } from '../app/electron/ipc/authContext';

const getFallbackSyncStatusMock = jest.fn(() => ({ inProgress: false, queue: { pending: 0 } }));
const runFallbackResyncManualMock = jest.fn(async () => ({ ok: true, result: { attempted: 0, synced: 0, failed: 0, skipped: 0 } }));

const testMySqlConnectionMock = jest.fn(async () => ({ ok: true }));
const initMySqlSchemaMock = jest.fn(async () => ({ ok: true }));

const checkDbInstalledMock = jest.fn(async () => ({ installed: true }));
const runInstallerMock = jest.fn(async () => ({ ok: true }));

const listUsersServiceMock = jest.fn(async () => []);
const listUsersBasicServiceMock = jest.fn(async () => []);
const createUserServiceMock = jest.fn(async () => 'u1');
const resetUserPasswordServiceMock = jest.fn(async () => ({ ok: true }));
const changeUserPasswordServiceMock = jest.fn(async () => ({ ok: true }));

const mysqlConfigState: any = {};

jest.mock('../app/electron/db/fallbackSync', () => ({
  getFallbackSyncStatus: () => getFallbackSyncStatusMock(),
  runFallbackResyncManual: (...args: any[]) => runFallbackResyncManualMock(...args),
}));

jest.mock('../app/electron/db/mysql', () => ({
  testMySqlConnection: (...args: any[]) => testMySqlConnectionMock(...args),
}));

jest.mock('../app/electron/db/mysql/initSchema.mysql', () => ({
  initMySqlSchema: (...args: any[]) => initMySqlSchemaMock(...args),
}));

jest.mock('../app/electron/db/dbInstaller', () => ({
  checkDbInstalled: (...args: any[]) => checkDbInstalledMock(...args),
  runInstaller: (...args: any[]) => runInstallerMock(...args),
}));

jest.mock('../app/electron/db/mysqlConfig', () => ({
  getMySqlConfigPath: () => '/tmp/mysql-config-test.json',
  readMySqlConfig: () => ({ ...mysqlConfigState }),
  writeMySqlConfig: (cfg: any) => {
    Object.keys(mysqlConfigState).forEach((k) => delete mysqlConfigState[k]);
    Object.assign(mysqlConfigState, cfg);
  },
}));

jest.mock('../app/electron/modules/users/users.service', () => ({
  listUsersService: (...args: any[]) => listUsersServiceMock(...args),
  listUsersBasicService: (...args: any[]) => listUsersBasicServiceMock(...args),
  createUserService: (...args: any[]) => createUserServiceMock(...args),
  resetUserPasswordService: (...args: any[]) => resetUserPasswordServiceMock(...args),
  changeUserPasswordService: (...args: any[]) => changeUserPasswordServiceMock(...args),
}));

describe('IPC security hardening on sensitive handlers', () => {
  beforeEach(() => {
    (ipcMain as any).__reset();
    resetAuthContextStore();
    Object.keys(mysqlConfigState).forEach((k) => delete mysqlConfigState[k]);

    getFallbackSyncStatusMock.mockClear();
    runFallbackResyncManualMock.mockClear();
    testMySqlConnectionMock.mockClear();
    initMySqlSchemaMock.mockClear();
    checkDbInstalledMock.mockClear();
    runInstallerMock.mockClear();
    changeUserPasswordServiceMock.mockClear();

    registerConfigIpc();
    registerMySqlIpc();
    registerSyncAdminIpc();
    registerUsersIpc();
    registerInstallerIpc();
  });

  test('config:set rejects unauthenticated caller', async () => {
    await expect((ipcMain as any).__invokeAs(22, 'config:set', { dbMode: 'sqlite' })).rejects.toThrow('FORBIDDEN');
  });

  test('mysql:config:get rejects SELLER and allows ADMIN', async () => {
    setAuthContextForSenderId(30, { userId: 'u-seller', role: 'SELLER' });
    await expect((ipcMain as any).__invokeAs(30, 'mysql:config:get')).rejects.toThrow('FORBIDDEN');

    setAuthContextForSenderId(31, { userId: 'u-admin', role: 'ADMIN' });
    const result = await (ipcMain as any).__invokeAs(31, 'mysql:config:get');
    expect(result).toEqual({});
  });

  test('sync admin channels reject unauthorized role', async () => {
    setAuthContextForSenderId(40, { userId: 'u-supervisor', role: 'SUPERVISOR' });

    await expect((ipcMain as any).__invokeAs(40, 'sync:status:get')).resolves.toEqual({ ok: false, error: 'FORBIDDEN' });
    await expect((ipcMain as any).__invokeAs(40, 'sync:run-manual', { limit: 10 })).resolves.toEqual({ ok: false, reason: 'FORBIDDEN' });
  });

  test('installer:run blocks unauthenticated re-run when DB is already installed', async () => {
    checkDbInstalledMock.mockResolvedValue({ installed: true });

    await expect((ipcMain as any).__invokeAs(50, 'installer:run', {
      mysql: { host: 'localhost', port: 3306, user: 'root', password: 'x', database: 'db' },
      adminName: 'Admin',
      adminEmail: 'admin@test.com',
      adminPassword: '123456',
    })).rejects.toThrow('FORBIDDEN');

    expect(runInstallerMock).not.toHaveBeenCalled();
  });

  test('users:change-password uses trusted session identity over spoofed payload', async () => {
    setAuthContextForSenderId(60, { userId: 'trusted-user', role: 'ADMIN' });

    await (ipcMain as any).__invokeAs(60, 'users:change-password', {
      userId: 'spoofed-user',
      role: 'ADMIN',
      data: { id: 'trusted-user', password: 'NewPass123' },
    });

    expect(changeUserPasswordServiceMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'trusted-user', role: 'ADMIN' }),
    );
  });
});
