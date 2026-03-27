// SQLite
import { logAudit, listAuditLogs } from './queries';

// MySQL
import { logAuditMySql, listAuditLogsMySql } from './mysql/audit.mysql';

import type { AuditEntityType, AuditLogAction } from './audit.types';
import { markFallbackOperation, resolveSensitiveOperationPlan } from './fallbackControl';

export const logAuditRepo = async (input: {
  actorId: string;
  action: AuditLogAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  metadata?: unknown;
}): Promise<string> => {
  const plan = await resolveSensitiveOperationPlan('audit:log');

  if (plan.mode === 'mysql') return await logAuditMySql(input);

  const id = logAudit(input);
  markFallbackOperation(plan, {
    schemaVersion: 2,
    input: {
      ...input,
      id,
    },
    sqliteRef: { auditId: id },
  });

  return id;
};

export const listAuditLogsRepo = async (filters: {
  from: string;
  to: string;
  actorId?: string;
  action?: AuditLogAction;
  limit?: number;
  offset?: number;
}): Promise<any[]> => {
  const plan = await resolveSensitiveOperationPlan('audit:log');

  if (plan.mode === 'mysql') return await listAuditLogsMySql(filters);
  return listAuditLogs(filters) as any[];
};
