const createConnectionMock = jest.fn();

jest.mock('mysql2/promise', () => ({
  __esModule: true,
  default: {
    createConnection: (...args: any[]) => createConnectionMock(...args),
  },
}));

jest.mock('../app/electron/db/mysql/initSchema.mysql', () => ({
  initMySqlSchema: jest.fn(async () => ({ ok: true })),
}));

import { checkDbInstalled } from '../app/electron/db/dbInstaller';

describe('dbInstaller installation state classification', () => {
  beforeEach(() => {
    createConnectionMock.mockReset();
  });

  test('returns config_invalid when mysql config is incomplete', async () => {
    const result = await checkDbInstalled({ host: '', port: 3306, user: '', password: '', database: '' } as any);

    expect(result.installed).toBe(false);
    expect(result.state).toBe('config_invalid');
    expect(result.missingTables?.length).toBeGreaterThan(0);
    expect(createConnectionMock).not.toHaveBeenCalled();
  });

  test('returns partial when some required tables are missing', async () => {
    const queryMock = jest.fn(async () => [[
      { tableName: 'users' },
      { tableName: 'products' },
      { tableName: 'sales' },
    ]]);
    const endMock = jest.fn(async () => undefined);
    createConnectionMock.mockResolvedValue({ query: queryMock, end: endMock });

    const result = await checkDbInstalled({ host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'pos' });

    expect(result.installed).toBe(false);
    expect(result.state).toBe('partial');
    expect(result.missingTables).toEqual(expect.arrayContaining(['sale_items', 'expenses', 'audit_logs', 'cash_closures']));
  });

  test('returns complete when required schema is present', async () => {
    const queryMock = jest.fn(async () => [[
      { tableName: 'users' },
      { tableName: 'products' },
      { tableName: 'sales' },
      { tableName: 'sale_items' },
      { tableName: 'expenses' },
      { tableName: 'audit_logs' },
      { tableName: 'cash_closures' },
    ]]);
    const endMock = jest.fn(async () => undefined);
    createConnectionMock.mockResolvedValue({ query: queryMock, end: endMock });

    const result = await checkDbInstalled({ host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'pos' });

    expect(result).toMatchObject({ installed: true, state: 'complete' });
    expect(result.missingTables).toEqual([]);
  });
});
