const readMySqlConfigMock = jest.fn();
const writeMySqlConfigMock = jest.fn();
const checkDbInstalledMock = jest.fn();
const testMySqlConnectionMock = jest.fn();

jest.mock('../app/electron/db/mysqlConfig', () => ({
  readMySqlConfig: () => readMySqlConfigMock(),
  writeMySqlConfig: (...args: any[]) => writeMySqlConfigMock(...args),
}));

jest.mock('../app/electron/db/dbInstaller', () => ({
  checkDbInstalled: (...args: any[]) => checkDbInstalledMock(...args),
}));

jest.mock('../app/electron/db/mysql', () => ({
  testMySqlConnection: (...args: any[]) => testMySqlConnectionMock(...args),
}));

import { autoDetectAndConfigureMySQL } from '../app/electron/db/mysql.autodetect';

describe('mysql autodetect cross-platform behavior', () => {
  const originalPlatform = process.platform;

  const setPlatform = (value: NodeJS.Platform) => {
    Object.defineProperty(process, 'platform', { value, configurable: true });
  };

  beforeEach(() => {
    readMySqlConfigMock.mockReset();
    writeMySqlConfigMock.mockReset();
    checkDbInstalledMock.mockReset();
    testMySqlConnectionMock.mockReset();
    testMySqlConnectionMock.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    setPlatform(originalPlatform);
  });

  test('returns manual on non-Windows when there is no existing MySQL config', async () => {
    setPlatform('linux');
    readMySqlConfigMock.mockReturnValue(null);

    const result = await autoDetectAndConfigureMySQL();

    expect(result).toEqual({ status: 'manual' });
    expect(writeMySqlConfigMock).not.toHaveBeenCalled();
    expect(checkDbInstalledMock).not.toHaveBeenCalled();
  });

  test('returns ready when existing config is present (all platforms)', async () => {
    setPlatform('darwin');
    readMySqlConfigMock.mockReturnValue({ host: '127.0.0.1', user: 'root', database: 'pos' });
    checkDbInstalledMock.mockResolvedValue({ installed: true, state: 'complete' });

    const result = await autoDetectAndConfigureMySQL();

    expect(result).toEqual({ status: 'ready' });
  });

  test('returns manual when existing config is present but mysql connection fails', async () => {
    setPlatform('linux');
    readMySqlConfigMock.mockReturnValue({ host: '127.0.0.1', user: 'root', database: 'pos' });
    testMySqlConnectionMock.mockResolvedValue({ ok: false, message: 'ECONNREFUSED' });

    const result = await autoDetectAndConfigureMySQL();

    expect(result).toEqual({ status: 'manual' });
    expect(checkDbInstalledMock).not.toHaveBeenCalled();
  });

  test('returns server_auto when existing config is connectable but schema is partial', async () => {
    setPlatform('win32');
    readMySqlConfigMock.mockReturnValue({
      host: '127.0.0.1',
      user: 'root',
      database: 'pos',
      port: 3306,
      password: '',
    });
    checkDbInstalledMock.mockResolvedValue({
      installed: false,
      state: 'partial',
      missingTables: ['sales'],
    });

    const result = await autoDetectAndConfigureMySQL();

    expect(result).toEqual({
      status: 'server_auto',
      config: {
        host: '127.0.0.1',
        user: 'root',
        database: 'pos',
        port: 3306,
        password: '',
      },
      dbInstalled: false,
    });
  });
});
