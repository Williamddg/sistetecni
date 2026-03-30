import type { IpcMainInvokeEvent } from 'electron';
import { requirePermission, type Permission, type Role } from '../../../shared/permissions';
import { getAuthContextForEvent } from './authContext';

type PayloadIdentity = {
  userId?: string;
  role?: Role;
};

const getIdentityFromPayload = (payload: unknown): PayloadIdentity => {
  const raw = (payload as Record<string, unknown> | null | undefined) ?? {};
  const role = raw.role;
  const userId = raw.userId;

  return {
    role: role === 'ADMIN' || role === 'SUPERVISOR' || role === 'SELLER' ? role : undefined,
    userId: typeof userId === 'string' ? userId : undefined,
  };
};

export const getTrustedAuthContext = (event: IpcMainInvokeEvent): { userId: string; role: Role } => {
  const ctx = getAuthContextForEvent(event);
  if (!ctx) throw new Error('FORBIDDEN');
  return { userId: ctx.userId, role: ctx.role };
};

export const requirePermissionFromPayload = (
  event: IpcMainInvokeEvent,
  payload: unknown,
  permission: Permission,
): Role => {
  const trusted = getAuthContextForEvent(event);
  if (!trusted) throw new Error('FORBIDDEN');

  const identity = getIdentityFromPayload(payload);
  if (identity.role && identity.role !== trusted.role) {
    throw new Error('FORBIDDEN');
  }

  if (identity.userId && identity.userId !== trusted.userId) {
    throw new Error('FORBIDDEN');
  }

  requirePermission(trusted.role, permission);
  return trusted.role;
};

export const requirePermissionFromEvent = (event: IpcMainInvokeEvent, permission: Permission): Role => {
  const trusted = getAuthContextForEvent(event);
  if (!trusted) throw new Error('FORBIDDEN');
  requirePermission(trusted.role, permission);
  return trusted.role;
};
