import crypto from 'node:crypto';
import { getDb } from './db';
import { resolveDatabaseMode, type DatabaseModeResolution } from './databaseModeResolver';

export type SensitiveOperation =
  | 'sales:create'
  | 'sales:return'
  | 'cash:open'
  | 'cash:close'
  | 'expenses:add'
  | 'audit:log'
  | 'backup:create';

type OperationPolicy = {
  requiresMySql: boolean;
  trackWhenFallback: boolean;
};

type ExecutionPlan = {
  operation: SensitiveOperation;
  mode: 'mysql' | 'sqlite';
  resolution: DatabaseModeResolution;
  fallbackApplied: boolean;
};

const OPERATION_POLICY: Record<SensitiveOperation, OperationPolicy> = {
  'sales:create': { requiresMySql: false, trackWhenFallback: true },
  'sales:return': { requiresMySql: true, trackWhenFallback: false },
  'cash:open': { requiresMySql: false, trackWhenFallback: true },
  'cash:close': { requiresMySql: false, trackWhenFallback: true },
  'expenses:add': { requiresMySql: false, trackWhenFallback: true },
  'audit:log': { requiresMySql: false, trackWhenFallback: true },
  'backup:create': { requiresMySql: false, trackWhenFallback: true },
};

const ensureFallbackOperationsTable = (): void => {
  getDb().prepare(`
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

  getDb().prepare(`CREATE INDEX IF NOT EXISTS idx_fallback_operations_synced_created_at ON fallback_operations (synced, created_at)`).run();
};

export const resolveSensitiveOperationPlan = async (operation: SensitiveOperation): Promise<ExecutionPlan> => {
  const policy = OPERATION_POLICY[operation];
  const resolution = await resolveDatabaseMode();
  const mode = resolution === 'mysql_primary' ? 'mysql' : 'sqlite';
  const fallbackApplied = resolution === 'mysql_unavailable_fallback_sqlite';

  if (policy.requiresMySql && mode !== 'mysql') {
    throw new Error('Operación no disponible sin MySQL activo.');
  }

  return {
    operation,
    mode,
    resolution,
    fallbackApplied,
  };
};

export const markFallbackOperation = (
  plan: ExecutionPlan,
  payload: unknown,
): void => {
  const policy = OPERATION_POLICY[plan.operation];
  if (!policy.trackWhenFallback || !plan.fallbackApplied || plan.mode !== 'sqlite') {
    return;
  }

  try {
    ensureFallbackOperationsTable();

    const row = {
      id: crypto.randomUUID(),
      operation: plan.operation,
      payload_json: JSON.stringify(payload ?? {}),
      resolution: plan.resolution,
      created_at: new Date().toISOString(),
    };

    getDb().prepare(
      `INSERT INTO fallback_operations (id, operation, payload_json, resolution, created_at, synced)
       VALUES (?, ?, ?, ?, ?, 0)`,
    ).run(row.id, row.operation, row.payload_json, row.resolution, row.created_at);
  } catch (error) {
    console.warn('[fallbackControl] markFallbackOperation failed:', error);
  }
};
