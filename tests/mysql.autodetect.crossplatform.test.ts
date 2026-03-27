const readMySqlConfigMock = jest.fn();
const writeMySqlConfigMock = jest.fn();
const checkDbInstalledMock = jest.fn();

jest.mock('../app/electron/db/mysqlConfig', () => ({
  readMySqlConfig: () => readMySqlConfigMock(),
  writeMySqlConfig: (...args: any[]) => writeMySqlConfigMock(...args),
}));

jest.mock('../app/electron/db/dbInstaller', () => ({
  checkDbInstalled: (...args: any[]) => checkDbInstalledMock(...args),
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

    const result = await autoDetectAndConfigureMySQL();

    expect(result).toEqual({ status: 'ready' });
  });
});
