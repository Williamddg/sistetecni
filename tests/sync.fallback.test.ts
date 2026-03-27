import { setupTestDb, teardownTestDb } from './helpers/testDb';

let mockResolution: 'mysql_primary' | 'sqlite_local' | 'mysql_unavailable_fallback_sqlite' = 'mysql_primary';
let resolverGate: Promise<'mysql_primary' | 'sqlite_local' | 'mysql_unavailable_fallback_sqlite'> | null = null;

const mysqlExecMock = jest.fn(async () => undefined);
const mysqlQueryOneMock = jest.fn(async () => null);
const createSaleMySqlMock = jest.fn(async () => ({ saleId: 'sale-1', invoiceNumber: 'A-0001' }));
const openCashMySqlMock = jest.fn(async () => 'cash-1');
const closeCashMySqlMock = jest.fn(async () => ({ ok: true }));
const addExpenseMySqlMock = jest.fn(async () => 'exp-1');
const logAuditMySqlMock = jest.fn(async () => undefined);

jest.mock('../app/electron/db/databaseModeResolver', () => ({
  resolveDatabaseMode: jest.fn(async () => {
    if (resolverGate) return await resolverGate;
    return mockResolution;
  }),
}));

jest.mock('../app/electron/db/mysql', () => ({
  mysqlExec: (...args: any[]) => mysqlExecMock(...args),
  mysqlQueryOne: (...args: any[]) => mysqlQueryOneMock(...args),
}));

jest.mock('../app/electron/db/mysql/sales.mysql', () => ({
  createSaleMySql: (...args: any[]) => createSaleMySqlMock(...args),
}));

jest.mock('../app/electron/db/mysql/cash.mysql', () => ({
  openCashMySql: (...args: any[]) => openCashMySqlMock(...args),
  closeCashMySql: (...args: any[]) => closeCashMySqlMock(...args),
}));

jest.mock('../app/electron/db/mysql/expenses.mysql', () => ({
  addExpenseMySql: (...args: any[]) => addExpenseMySqlMock(...args),
}));

jest.mock('../app/electron/db/mysql/audit.mysql', () => ({
  logAuditMySql: (...args: any[]) => logAuditMySqlMock(...args),
}));

import { getFallbackSyncStatus, runFallbackResyncCycle, runFallbackResyncManual } from '../app/electron/db/fallbackSync';

const ensureFallbackOperationsTableForTests = (db: ReturnType<typeof setupTestDb>): void => {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS fallback_operations (
      id TEXT PRIMARY KEY,
      operation TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      resolution TEXT NOT NULL,
      created_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      synced_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      sync_attempts INTEGER NOT NULL DEFAULT 0,
      last_attempt_at TEXT,
      last_error TEXT
    )
  `).run();
};

describe('fallback sync observability and controls', () => {
  let db: ReturnType<typeof setupTestDb>;

  beforeEach(() => {
    db = setupTestDb();
    mockResolution = 'mysql_primary';
    resolverGate = null;
    mysqlExecMock.mockClear();
    mysqlQueryOneMock.mockClear();
    createSaleMySqlMock.mockClear();
    openCashMySqlMock.mockClear();
    closeCashMySqlMock.mockClear();
    addExpenseMySqlMock.mockClear();
    logAuditMySqlMock.mockClear();
  });

  afterEach(() => {
    teardownTestDb(db);
  });

  test('manual run returns MYSQL_NOT_PRIMARY when resolver is not primary', async () => {
    mockResolution = 'mysql_unavailable_fallback_sqlite';

    const result = await runFallbackResyncManual({ limit: 10 });

    expect(result).toEqual({ ok: false, reason: 'MYSQL_NOT_PRIMARY' });
  });

  test('manual run returns SYNC_IN_PROGRESS when an auto cycle is already running', async () => {
    let releaseResolver: ((mode: 'mysql_primary') => void) | null = null;
    resolverGate = new Promise((resolve) => {
      releaseResolver = resolve;
    });

    const inFlight = runFallbackResyncCycle({ limit: 5 });

    const manualResult = await runFallbackResyncManual({ limit: 2 });
    expect(manualResult).toEqual({ ok: false, reason: 'SYNC_IN_PROGRESS' });

    releaseResolver?.('mysql_primary');
    await inFlight;
  });

  test('status exposes queue counts and recent failed errors', () => {
    ensureFallbackOperationsTableForTests(db);

    db.prepare(`
      INSERT INTO fallback_operations (id, operation, payload_json, resolution, created_at, synced, sync_status, sync_attempts, last_attempt_at, last_error)
      VALUES
      ('p1', 'sales:create', '{}', 'mysql_unavailable_fallback_sqlite', '2026-01-01T00:00:00.000Z', 0, 'pending', 0, NULL, NULL),
      ('f1', 'sales:create', '{}', 'mysql_unavailable_fallback_sqlite', '2026-01-01T00:00:01.000Z', 0, 'failed', 3, '2026-01-01T00:01:00.000Z', 'boom'),
      ('s1', 'sales:create', '{}', 'mysql_unavailable_fallback_sqlite', '2026-01-01T00:00:02.000Z', 1, 'synced', 1, '2026-01-01T00:02:00.000Z', NULL),
      ('u1', 'unknown:op', '{}', 'mysql_unavailable_fallback_sqlite', '2026-01-01T00:00:03.000Z', 1, 'unsupported', 1, '2026-01-01T00:03:00.000Z', NULL),
      ('d1', 'sales:create', '{}', 'mysql_unavailable_fallback_sqlite', '2026-01-01T00:00:04.000Z', 1, 'duplicate', 1, '2026-01-01T00:04:00.000Z', NULL)
    `).run();

    const status = getFallbackSyncStatus();

    expect(status.queue).toEqual({
      pending: 2,
      synced: 1,
      failed: 1,
      unsupported: 1,
      duplicate: 1,
    });

    expect(status.recentErrors.length).toBe(1);
    expect(status.recentErrors[0]).toMatchObject({
      id: 'f1',
      operation: 'sales:create',
      syncAttempts: 3,
      lastError: 'boom',
    });
  });

  test('sync cycle does not retry failed operations in backoff window or above max attempts', async () => {
    ensureFallbackOperationsTableForTests(db);

    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO fallback_operations (id, operation, payload_json, resolution, created_at, synced, sync_status, sync_attempts, last_attempt_at, last_error)
      VALUES
      ('r1', 'sales:create', '{"input": {"items": []}}', 'mysql_unavailable_fallback_sqlite', '2026-01-01T00:00:00.000Z', 0, 'failed', 1, ?, 'temp error'),
      ('r2', 'sales:create', '{"input": {"items": []}}', 'mysql_unavailable_fallback_sqlite', '2026-01-01T00:00:01.000Z', 0, 'failed', 10, '2026-01-01T00:00:02.000Z', 'hard fail')
    `).run(now);

    const result = await runFallbackResyncCycle({ limit: 50 });

    expect(result).toEqual({ attempted: 0, synced: 0, failed: 0, skipped: 0 });
    expect(createSaleMySqlMock).not.toHaveBeenCalled();
  });

  test('sync cycle returns zeroes when queue is empty', async () => {
    const result = await runFallbackResyncCycle({ limit: 25 });

    expect(result).toEqual({ attempted: 0, synced: 0, failed: 0, skipped: 0 });
    expect(mysqlExecMock).toHaveBeenCalled();
  });
});
