import bcrypt from 'bcryptjs';
import { getDb, getDbMode } from '../db';
import { mysqlQueryOne } from '../mysql';
import type { Role } from './types';

export const authUser = async (
  email: string,
  password: string,
): Promise<{ id: string; name: string; role: Role; email: string } | null> => {
  const cleanEmail = String(email ?? '').trim().toLowerCase();
  if (!cleanEmail) return null;

  const mode = await getDbMode();

  if (mode === 'mysql') {
    const row = await mysqlQueryOne<{
      id: string;
      name: string;
      email: string;
      password_hash: string;
      role: Role;
    }>(
      `SELECT id, name, email, password_hash, role
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [cleanEmail],
    );

    if (!row) return null;
    if (!bcrypt.compareSync(password, row.password_hash)) return null;

    return { id: row.id, name: row.name, role: row.role, email: row.email };
  }

  const row = getDb().prepare('SELECT id,name,email,password_hash,role FROM users WHERE email = ?').get(cleanEmail) as
    | { id: string; name: string; email: string; password_hash: string; role: Role }
    | undefined;

  if (!row || !bcrypt.compareSync(password, row.password_hash)) return null;
  return { id: row.id, name: row.name, role: row.role, email: row.email };
};
