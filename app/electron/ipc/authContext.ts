import type { IpcMainInvokeEvent } from 'electron';
import type { Role } from '../../../shared/permissions';

type AuthContext = {
  userId: string;
  role: Role;
  email?: string;
};

const contextsByWebContentsId = new Map<number, AuthContext>();

const getSenderId = (event: IpcMainInvokeEvent): number => {
  return Number((event as any)?.sender?.id ?? 0);
};

export const setAuthContextForEvent = (event: IpcMainInvokeEvent, user: { id: string; role: Role; email?: string }): void => {
  const senderId = getSenderId(event);
  if (!senderId) return;

  contextsByWebContentsId.set(senderId, {
    userId: String(user.id),
    role: user.role,
    email: user.email,
  });
};

export const getAuthContextForEvent = (event: IpcMainInvokeEvent): AuthContext | null => {
  const senderId = getSenderId(event);
  if (!senderId) return null;
  return contextsByWebContentsId.get(senderId) ?? null;
};

export const clearAuthContextForEvent = (event: IpcMainInvokeEvent): void => {
  const senderId = getSenderId(event);
  if (!senderId) return;
  contextsByWebContentsId.delete(senderId);
};

export const setAuthContextForSenderId = (senderId: number, ctx: AuthContext | null): void => {
  if (!senderId) return;
  if (!ctx) {
    contextsByWebContentsId.delete(senderId);
    return;
  }

  contextsByWebContentsId.set(senderId, {
    userId: String(ctx.userId),
    role: ctx.role,
    email: ctx.email,
  });
};

export const resetAuthContextStore = (): void => {
  contextsByWebContentsId.clear();
};
