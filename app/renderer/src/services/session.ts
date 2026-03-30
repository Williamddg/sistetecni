import type { SessionUser } from '../types';

let currentUser: SessionUser | null = null;

export const setSessionUser = (user: SessionUser | null): void => {
  currentUser = user;
};

export const getSessionUser = (): SessionUser | null => currentUser;

export const getAuthContext = (): { userId: string; role: 'ADMIN' | 'SUPERVISOR' | 'SELLER' } => {
  if (!currentUser) throw new Error('No autorizado');
  return { userId: currentUser.id, role: currentUser.role };
};
