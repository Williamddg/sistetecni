import type Database from 'better-sqlite3';
import { getDb } from './db';
import { resolveDatabaseMode } from './databaseModeResolver';
import { mysqlExec, mysqlQueryOne } from './mysql';
import { createSaleMySql } from './mysql/sales.mysql';
import { openCashMySql, closeCashMySql } from './mysql/cash.mysql';
import { addExpenseMySql } from './mysql/expenses.mysql';
import { logAuditMySql } from './mysql/audit.mysql';

type FallbackOperationType =
  | 'sales:create'
  | 'cash:open'
  | 'cash:close'
  | 'expenses:add'
  | 'audit:log';

type SyncStatus = 'pending' | 'synced' | 'failed' | 'unsupported' | 'duplicate';

type FallbackOperationRow = {
  id: string;
  operation: string;
  payload_json: string;
  resolution: string;
  created_at: string;
  synced: number;
  synced_at?: string | null;
  sync_status?: string | null;
  sync_attempts?: number | null;
  last_attempt_at?: string | null;
  last_error?: string | null;
};

type SyncCycleOptions = {
  limit?: number;
};

type SyncCycleResult = {
  attempted: number;
  synced: number;
  failed: number;
  skipped: number;
  stoppedAtOperationId?: string;
};

const SUPPORTED_OPERATIONS = new Set<FallbackOperationType>([
  'sales:create',
  'cash:open',
  'cash:close',
  'expenses:add',
  'audit:log',
]);

let syncInProgress = false;

const nowIso = (): string => new Date().toISOString();

const ensureFallbackOperationsSyncColumns = (db: Database.Database): void => {
  const rows = db.prepare('PRAGMA table_info(fallback_operations)').all() as Array<{ name: string }>;
  const has = (name: string) => rows.some((r) => r.name === name);

  if (!has('synced_at')) db.prepare('ALTER TABLE fallback_operations ADD COLUMN synced_at TEXT').run();
  if (!has('sync_status')) db.prepare("ALTER TABLE fallback_operations ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'pending'").run();
  if (!has('sync_attempts')) db.prepare('ALTER TABLE fallback_operations ADD COLUMN sync_attempts INTEGER NOT NULL DEFAULT 0').run();
  if (!has('last_attempt_at')) db.prepare('ALTER TABLE fallback_operations ADD COLUMN last_attempt_at TEXT').run();
  if (!has('last_error')) db.prepare('ALTER TABLE fallback_operations ADD COLUMN last_error TEXT').run();
};

const ensureFallbackOperationsTable = (): void => {
  const db = getDb();
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

  db.prepare(`CREATE INDEX IF NOT EXISTS idx_fallback_operations_synced_created_at ON fallback_operations (synced, created_at)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_fallback_operations_sync_status ON fallback_operations (sync_status, created_at)`).run();
  ensureFallbackOperationsSyncColumns(db);
};

const ensureMySqlSyncTable = async (): Promise<void> => {
  await mysqlExec(`
    CREATE TABLE IF NOT EXISTS fallback_sync_operations (
      op_id VARCHAR(64) PRIMARY KEY,
      operation VARCHAR(64) NOT NULL,
      status VARCHAR(20) NOT NULL,
      applied_at DATETIME NOT NULL,
      error_message TEXT NULL
    )
  `);
};

const selectPendingOperations = (limit: number): FallbackOperationRow[] => {
  const db = getDb();
  return db
    .prepare(`
      SELECT id, operation, payload_json, resolution, created_at, synced, synced_at, sync_status, sync_attempts, last_attempt_at, last_error
      FROM fallback_operations
      WHERE synced = 0
      ORDER BY created_at ASC, id ASC
      LIMIT ?
    `)
    .all(limit) as FallbackOperationRow[];
};

const markSynced = (id: string, status: Extract<SyncStatus, 'synced' | 'duplicate' | 'unsupported'>): void => {
  getDb().prepare(`
    UPDATE fallback_operations
    SET synced = 1,
        sync_status = ?,
        synced_at = ?,
        last_attempt_at = ?,
        sync_attempts = COALESCE(sync_attempts, 0) + 1,
        last_error = NULL
    WHERE id = ?
  `).run(status, nowIso(), nowIso(), id);
};

const markFailedAttempt = (id: string, error: unknown): void => {
  const message = String((error as any)?.message ?? error ?? 'unknown_error').slice(0, 1000);
  getDb().prepare(`
    UPDATE fallback_operations
    SET sync_status = 'failed',
        sync_attempts = COALESCE(sync_attempts, 0) + 1,
        last_attempt_at = ?,
        last_error = ?
    WHERE id = ?
  `).run(nowIso(), message, id);
};

const markAttempted = (id: string): void => {
  getDb().prepare(`
    UPDATE fallback_operations
    SET last_attempt_at = ?
    WHERE id = ?
  `).run(nowIso(), id);
};

const parsePayload = (row: FallbackOperationRow): any => {
  try {
    return JSON.parse(row.payload_json ?? '{}');
  } catch {
    return null;
  }
};

const normalizeSyncInput = (operation: FallbackOperationType, payload: any): any => {
  if (!payload || typeof payload !== 'object') return null;

  // v2 payloads are expected to include `input`.
  if (payload.input && typeof payload.input === 'object') {
    return payload.input;
  }

  // Compatibility with early fallback payloads captured before sync design.
  if (operation === 'expenses:add') {
    if (payload.concept != null && payload.amount != null) {
      return {
        concept: payload.concept,
        amount: payload.amount,
        date: payload.date ?? new Date().toISOString(),
        notes: payload.notes ?? null,
      };
    }
  }

  if (operation === 'audit:log') {
    if (payload.action && payload.entityType) {
      return {
        actorId: payload.actorId ?? payload.userId ?? '',
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId ?? null,
        metadata: payload.metadata ?? null,
      };
    }
  }

  return null;
};

const isDuplicateKeyError = (error: unknown): boolean => {
  const code = String((error as any)?.code ?? '');
  return code === 'ER_DUP_ENTRY' || /duplicate/i.test(String((error as any)?.message ?? ''));
};

const markOperationAppliedInMySql = async (row: FallbackOperationRow): Promise<void> => {
  await mysqlExec(
    `INSERT INTO fallback_sync_operations (op_id, operation, status, applied_at, error_message)
     VALUES (?, ?, 'applied', NOW(), NULL)
     ON DUPLICATE KEY UPDATE status = 'applied', applied_at = NOW(), error_message = NULL`,
    [row.id, row.operation],
  );
};

const wasOperationAlreadyApplied = async (operationId: string): Promise<boolean> => {
  const existing = await mysqlQueryOne<{ op_id: string }>(
    'SELECT op_id FROM fallback_sync_operations WHERE op_id = ? LIMIT 1',
    [operationId],
  );
  return !!existing?.op_id;
};

const applyOperation = async (row: FallbackOperationRow): Promise<SyncStatus> => {
  const op = row.operation as FallbackOperationType;
  if (!SUPPORTED_OPERATIONS.has(op)) return 'unsupported';

  const alreadyApplied = await wasOperationAlreadyApplied(row.id);
  if (alreadyApplied) return 'duplicate';

  const parsedPayload = parsePayload(row);
  const input = normalizeSyncInput(op, parsedPayload);

  if (!input) {
    return 'unsupported';
  }

  try {
    if (op === 'sales:create') {
      await createSaleMySql(input);
    } else if (op === 'cash:open') {
      await openCashMySql(input);
    } else if (op === 'cash:close') {
      await closeCashMySql(input);
    } else if (op === 'expenses:add') {
      await addExpenseMySql(input);
    } else if (op === 'audit:log') {
      await logAuditMySql(input);
    }
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }
  }

  await markOperationAppliedInMySql(row);
  return 'synced';
};

export const runFallbackResyncCycle = async (options: SyncCycleOptions = {}): Promise<SyncCycleResult> => {
  if (syncInProgress) {
    return { attempted: 0, synced: 0, failed: 0, skipped: 0 };
  }

  syncInProgress = true;
  try {
    const resolution = await resolveDatabaseMode();
    if (resolution !== 'mysql_primary') {
      return { attempted: 0, synced: 0, failed: 0, skipped: 0 };
    }

    ensureFallbackOperationsTable();
    await ensureMySqlSyncTable();

    const limit = Math.max(1, Math.min(options.limit ?? 50, 200));
    const pending = selectPendingOperations(limit);

    const result: SyncCycleResult = {
      attempted: 0,
      synced: 0,
      failed: 0,
      skipped: 0,
    };

    for (const row of pending) {
      result.attempted += 1;
      markAttempted(row.id);

      try {
        const status = await applyOperation(row);

        if (status === 'unsupported') {
          markSynced(row.id, 'unsupported');
          result.skipped += 1;
          continue;
        }

        if (status === 'duplicate') {
          markSynced(row.id, 'duplicate');
          result.skipped += 1;
          continue;
        }

        markSynced(row.id, 'synced');
        result.synced += 1;
      } catch (error) {
        markFailedAttempt(row.id, error);
        result.failed += 1;
        result.stoppedAtOperationId = row.id;
        break;
      }
    }

    return result;
  } finally {
    syncInProgress = false;
  }
};
