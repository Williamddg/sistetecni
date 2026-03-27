import { v4 as uuid } from 'uuid';
import { getDb } from '../db';
import type { AuditEntityType, AuditLogAction } from './types';

const ensureAuditSchema = (): void => {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role in ('ADMIN','SUPERVISOR','SELLER')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (actor_user_id) REFERENCES users(id)
    );
  `);
};

export const logAudit = (input: {
  actorId: string;
  action: AuditLogAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  metadata?: unknown;
}): string => {
  ensureAuditSchema();
  const db = getDb();
  const actor = db.prepare('SELECT id FROM users WHERE id = ?').get(input.actorId) as { id: string } | undefined;
  if (!actor) return '';

  const id = uuid();
  db.prepare('INSERT INTO audit_logs (id,actor_user_id,action,entity_type,entity_id,metadata,created_at) VALUES (?,?,?,?,?,?,?)').run(
    id,
    input.actorId,
    input.action,
    input.entityType,
    input.entityId ?? null,
    input.metadata == null ? null : JSON.stringify(input.metadata),
    new Date().toISOString(),
  );
  return id;
};

export const listAuditLogs = (filters: {
  from: string;
  to: string;
  actorId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}): unknown[] => {
  const params: unknown[] = [filters.from, filters.to];
  const where: string[] = ['al.created_at BETWEEN ? AND ?'];
  if (filters.actorId) {
    where.push('al.actor_user_id = ?');
    params.push(filters.actorId);
  }
  if (filters.action) {
    where.push('al.action = ?');
    params.push(filters.action);
  }
  params.push(Math.max(1, Math.min(Number(filters.limit ?? 100), 500)));
  params.push(Math.max(0, Number(filters.offset ?? 0)));

  return getDb()
    .prepare(
      `SELECT al.id, al.created_at, al.actor_user_id, u.name as actor_name, u.email as actor_email,
              al.action, al.entity_type, al.entity_id, al.metadata
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.actor_user_id
       WHERE ${where.join(' AND ')}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...params);
};
