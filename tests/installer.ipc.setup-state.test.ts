import { ipcMain } from 'electron';
import { registerInstallerIpc } from '../app/electron/ipc/installer.ipc';

const runInstallerMock = jest.fn();
const checkDbInstalledMock = jest.fn();
const testMySqlConnectionMock = jest.fn();

const mysqlConfigState: any = {};

jest.mock('../app/electron/db/dbInstaller', () => ({
  runInstaller: (...args: any[]) => runInstallerMock(...args),
  checkDbInstalled: (...args: any[]) => checkDbInstalledMock(...args),
}));

jest.mock('../app/electron/db/mysql', () => ({
  testMySqlConnection: (...args: any[]) => testMySqlConnectionMock(...args),
}));

jest.mock('../app/electron/db/mysqlConfig', () => ({
  readMySqlConfig: () => (Object.keys(mysqlConfigState).length ? { ...mysqlConfigState } : null),
  writeMySqlConfig: (cfg: any) => {
    Object.keys(mysqlConfigState).forEach((k) => delete mysqlConfigState[k]);
    Object.assign(mysqlConfigState, cfg);
  },
}));

describe('installer IPC setup robustness', () => {
  beforeEach(() => {
    (ipcMain as any).__reset();
    Object.keys(mysqlConfigState).forEach((k) => delete mysqlConfigState[k]);
    runInstallerMock.mockReset();
    checkDbInstalledMock.mockReset();
    testMySqlConnectionMock.mockReset();

    registerInstallerIpc();
  });

  test('installer:check exposes detailed state for partial schema', async () => {
    Object.assign(mysqlConfigState, { host: '127.0.0.1', user: 'root', database: 'pos', port: 3306, password: '' });
    checkDbInstalledMock.mockResolvedValue({
      installed: false,
      state: 'partial',
      reason: 'Esquema MySQL parcial',
      missingTables: ['sale_items'],
    });

    const result = await (ipcMain as any).__invokeAs(700, 'installer:check');

    expect(result).toEqual({
      installed: false,
      state: 'partial',
      reason: 'Esquema MySQL parcial',
      missingTables: ['sale_items'],
    });
  });

  test('installer:check reports config_invalid when there is no persisted mysql config', async () => {
    const result = await (ipcMain as any).__invokeAs(702, 'installer:check');
    expect(result).toEqual({
      installed: false,
      state: 'config_invalid',
      reason: 'Sin configuración MySQL',
    });
  });

  test('installer:run allows unauthenticated recovery when schema is partial', async () => {
    checkDbInstalledMock.mockResolvedValue({
      installed: false,
      state: 'partial',
      reason: 'Esquema MySQL parcial',
      missingTables: ['sale_items'],
    });
    runInstallerMock.mockResolvedValue({ ok: true });

    const payload = {
      mysql: { host: 'server-a', user: 'root', database: 'pos_a', port: 3306, password: 'x' },
      adminName: 'Admin',
      adminEmail: 'admin@test.com',
      adminPassword: '123456',
      isCashier: false,
    };

    const result = await (ipcMain as any).__invokeAs(703, 'installer:run', payload);

    expect(result).toEqual({ ok: true });
    expect(runInstallerMock).toHaveBeenCalledWith(expect.objectContaining(payload));
  });

  test('config_invalid -> testConnection OK -> installer run OK recovery path', async () => {
    // Paso 1: sin config guardada
    const checkNoConfig = await (ipcMain as any).__invokeAs(704, 'installer:check');
    expect(checkNoConfig).toEqual({
      installed: false,
      state: 'config_invalid',
      reason: 'Sin configuración MySQL',
    });

    // Paso 2: usuario corrige datos y prueba conexión
    testMySqlConnectionMock.mockResolvedValue({ ok: true });
    const testResult = await (ipcMain as any).__invokeAs(704, 'installer:test-connection', {
      host: '127.0.0.1',
      user: 'root',
      database: 'pos',
      port: 3306,
      password: '',
    });
    expect(testResult).toEqual({ ok: true });

    // Paso 3: run permitido (no instalado) y finaliza ok
    checkDbInstalledMock.mockResolvedValue({ installed: false, state: 'not_installed' });
    runInstallerMock.mockResolvedValue({ ok: true });
    const runResult = await (ipcMain as any).__invokeAs(704, 'installer:run', {
      mysql: { host: '127.0.0.1', user: 'root', database: 'pos', port: 3306, password: '' },
      adminName: 'Admin',
      adminEmail: 'admin@test.com',
      adminPassword: '123456',
      isCashier: false,
    });
    expect(runResult).toEqual({ ok: true });
  });

  test('installer:run restores previous config when install fails', async () => {
    Object.assign(mysqlConfigState, {
      host: 'server-a',
      user: 'root',
      database: 'pos_a',
      port: 3306,
      password: 'old',
    });

    checkDbInstalledMock.mockResolvedValue({ installed: false, state: 'not_installed' });
    runInstallerMock.mockResolvedValue({ ok: false, error: 'CREATE TABLE failed' });

    const result = await (ipcMain as any).__invokeAs(701, 'installer:run', {
      mysql: { host: 'server-b', user: 'root', database: 'pos_b', port: 3306, password: 'new' },
      adminName: 'Admin',
      adminEmail: 'admin@test.com',
      adminPassword: '123456',
      isCashier: false,
    });

    expect(result).toEqual({ ok: false, error: 'CREATE TABLE failed' });
    expect(mysqlConfigState).toEqual({
      host: 'server-a',
      user: 'root',
      database: 'pos_a',
      port: 3306,
      password: 'old',
    });
  });
});
