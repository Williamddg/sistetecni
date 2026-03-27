import { isMySqlEnabledResolved } from '../../db/databaseModeResolver';

import type { AuditLogAction, AuditEntityType } from '../../db/queries';

import {
  createUserMySql,
  listUsersMySql,
  listUsersBasicMySql,
  resetUserPasswordMySql,
  changeUserPasswordMySql,
} from '../../db/mysql/users.mysql';

import { logAuditMySql } from '../../db/mysql/audit.mysql';

import {
  createUser as createUserSqlite,
  listUsers as listUsersSqlite,
  listUsersBasic as listUsersBasicSqlite,
  resetUserPassword as resetUserPasswordSqlite,
  logAudit as logAuditSqlite,
  changeUserPassword as changeUserPasswordSqlite,
} from '../../db/queries';

const shouldUseMySqlUsers = async (): Promise<boolean> => {
  return await isMySqlEnabledResolved();
};

// Compatibilidad temporal: nombre legado, pero resuelve modo efectivo real
export const hasMySqlConfig = shouldUseMySqlUsers;

export const listUsersService = async (): Promise<unknown[]> => {
  return (await shouldUseMySqlUsers()) ? await listUsersMySql() : listUsersSqlite();
};

export const listUsersBasicService = async (): Promise<unknown[]> => {
  return (await shouldUseMySqlUsers()) ? await listUsersBasicMySql() : listUsersBasicSqlite();
};

export const createUserService = async (payload: any): Promise<string> => {
  const user = (payload as any)?.user ?? payload;
  const actorId = String((payload as any)?.userId ?? '');
  const useMySql = await shouldUseMySqlUsers();

  const id = useMySql ? await createUserMySql(user) : createUserSqlite(user);

  if (actorId) {
    const auditPayload: {
      actorId: string;
      action: AuditLogAction;
      entityType: AuditEntityType;
      entityId: string;
      metadata: any;
    } = {
      actorId,
      action: 'USER_CREATE',
      entityType: 'USER',
      entityId: id,
      metadata: { email: user?.email, role: user?.role },
    };

    try {
      if (useMySql) await logAuditMySql(auditPayload);
      else logAuditSqlite(auditPayload);
    } catch {}
  }

  return id;
};

export const resetUserPasswordService = async (payload: any): Promise<{ ok: true }> => {
  const data = (payload as any)?.data ?? payload;
  const actorId = String((payload as any)?.userId ?? '');
  const useMySql = await shouldUseMySqlUsers();

  if (useMySql) await resetUserPasswordMySql(data);
  else resetUserPasswordSqlite(data);

  if (actorId) {
    const targetId = String(data?.id ?? '');

    const auditPayload: {
      actorId: string;
      action: AuditLogAction;
      entityType: AuditEntityType;
      entityId: string;
      metadata: any;
    } = {
      actorId,
      action: 'USER_RESET_PASSWORD',
      entityType: 'USER',
      entityId: targetId,
      metadata: { targetUserId: targetId },
    };

    try {
      if (useMySql) await logAuditMySql(auditPayload);
      else logAuditSqlite(auditPayload);
    } catch {}
  }

  return { ok: true };
};

export const changeUserPasswordService = async (payload: any): Promise<{ ok: true }> => {
  const actorId = String((payload as any)?.userId ?? '');
  const data = (payload as any)?.data ?? payload;

  const targetId = String(data?.id ?? '');
  const currentPassword = data?.currentPassword != null ? String(data.currentPassword) : null;
  const newPassword = String(data?.newPassword ?? '');

  if (!actorId) throw new Error('No autenticado');
  if (!targetId) throw new Error('Usuario objetivo inválido');
  if (!newPassword || newPassword.length < 6) {
    throw new Error('La contraseña debe tener mínimo 6 caracteres');
  }

  const useMySql = await shouldUseMySqlUsers();

  if (useMySql) {
    await changeUserPasswordMySql({ id: targetId, currentPassword, newPassword });
  } else {
    changeUserPasswordSqlite({ id: targetId, currentPassword, newPassword });
  }

  const auditPayload: {
    actorId: string;
    action: AuditLogAction;
    entityType: AuditEntityType;
    entityId: string;
    metadata: any;
  } = {
    actorId,
    action: 'USER_CHANGE_PASSWORD',
    entityType: 'USER',
    entityId: targetId,
    metadata: { targetUserId: targetId, self: actorId === targetId },
  };

  try {
    if (useMySql) await logAuditMySql(auditPayload);
    else logAuditSqlite(auditPayload);
  } catch {}

  return { ok: true };
};
