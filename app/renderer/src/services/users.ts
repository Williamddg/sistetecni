import { ipc } from './ipcClient';
import { getAuthContext } from './session';

type AnyRecord = Record<string, unknown>;
const asRecord = (v: unknown): AnyRecord => (v && typeof v === 'object' && !Array.isArray(v) ? (v as AnyRecord) : {});
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string => String(v ?? '');

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'SELLER';

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  created_at?: string;
};

const toUserRow = (value: unknown): UserRow | null => {
  const row = asRecord(value);
  const id = str(row.id).trim();
  if (!id) return null;
  return {
    id,
    name: str(row.name),
    email: str(row.email),
    role: str(row.role),
    created_at: str(row.created_at || '').trim() || undefined,
  };
};

export const listUsers = async (): Promise<UserRow[]> =>
  asArray(await ipc.users.list(getAuthContext()))
    .map(toUserRow)
    .filter((u): u is UserRow => Boolean(u));

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export const createUser = (user: CreateUserInput) => ipc.users.create({ ...getAuthContext(), user });

export type ResetUserPasswordInput = { id: string; newPassword: string };
export const resetUserPassword = (data: ResetUserPasswordInput) =>
  ipc.users.resetPassword({ ...getAuthContext(), data });

export const listUsersBasic = () => ipc.users.listBasic(getAuthContext());

export type ChangeOwnPasswordPayload = {
  userId: string;
  newPassword: string;
};

export const changeOwnPassword = ({ userId, newPassword }: ChangeOwnPasswordPayload) =>
  ipc.users.changePassword({
    ...getAuthContext(),
    userId: String(userId),
    data: {
      id: String(userId),
      newPassword: String(newPassword),
    },
  });
