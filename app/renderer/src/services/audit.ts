import { ipc } from './ipcClient';
import { getAuthContext } from './session';

type AnyRecord = Record<string, unknown>;
const asRecord = (v: unknown): AnyRecord => (v && typeof v === 'object' && !Array.isArray(v) ? (v as AnyRecord) : {});
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string => String(v ?? '');

export type AuditFilters = {
  from: string;
  to: string;
  actorId?: string;
  action?: string;
  limit?: number;
  offset?: number;
};

export type AuditRow = {
  id: string;
  created_at?: string;
  createdAt?: string;
  action?: string;
  entity_type?: string;
  entityType?: string;
  entity_id?: string;
  entityId?: string;
  actor_name?: string;
  actorName?: string;
  actor_email?: string;
  actorEmail?: string;
  actor_user_id?: string;
  actorId?: string;
  metadata?: unknown;
};

const toAuditRow = (value: unknown): AuditRow | null => {
  const row = asRecord(value);
  const id = str(row.id).trim() || `${str(row.action)}-${str(row.created_at)}-${str(row.entity_id)}`;
  if (!id.trim()) return null;
  return {
    id,
    created_at: str(row.created_at || '').trim() || undefined,
    createdAt: str(row.createdAt || '').trim() || undefined,
    action: str(row.action || '').trim() || undefined,
    entity_type: str(row.entity_type || '').trim() || undefined,
    entityType: str(row.entityType || '').trim() || undefined,
    entity_id: str(row.entity_id || '').trim() || undefined,
    entityId: str(row.entityId || '').trim() || undefined,
    actor_name: str(row.actor_name || '').trim() || undefined,
    actorName: str(row.actorName || '').trim() || undefined,
    actor_email: str(row.actor_email || '').trim() || undefined,
    actorEmail: str(row.actorEmail || '').trim() || undefined,
    actor_user_id: str(row.actor_user_id || '').trim() || undefined,
    actorId: str(row.actorId || '').trim() || undefined,
    metadata: row.metadata,
  };
};

export const listAudit = async (filters: AuditFilters): Promise<AuditRow[]> =>
  asArray(await ipc.audit.list({ ...getAuthContext(), ...filters }))
    .map(toAuditRow)
    .filter((r): r is AuditRow => Boolean(r));
