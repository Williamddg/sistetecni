import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import { getDb } from '../db';
import type { Role } from './types';

export function changeUserPassword(input: {
  id: string;
  currentPassword: string | null;
  newPassword: string;
}): void {
  const db = getDb();

  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(input.id) as any;
  if (!row) throw new Error('Usuario no existe');

  if (input.currentPassword != null) {
    const ok = bcrypt.compareSync(String(input.currentPassword), String(row.password_hash ?? ''));
    if (!ok) throw new Error('Contraseña actual incorrecta');
  }

  const newHash = bcrypt.hashSync(input.newPassword, 10);

  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(newHash, input.id);
}

export const listUsers = (): unknown[] =>
  getDb().prepare('SELECT id,name,email,role,created_at FROM users ORDER BY created_at DESC').all();

export const listUsersBasic = (): unknown[] =>
  getDb().prepare('SELECT id,name,email,role FROM users ORDER BY name ASC').all();

export const createUser = (payload: { name: string; email: string; password: string; role: Role }): string => {
  const email = String(payload.email ?? '').trim().toLowerCase();
  if (!email) throw new Error('Email requerido');

  const exists = getDb().prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;
  if (exists) throw new Error('El email ya existe');

  const id = uuid();
  const hash = bcrypt.hashSync(payload.password, 10);
  getDb().prepare('INSERT INTO users (id,name,email,password_hash,role,created_at) VALUES (?,?,?,?,?,?)').run(
    id,
    String(payload.name ?? '').trim(),
    email,
    hash,
    payload.role,
    new Date().toISOString(),
  );
  return id;
};

export const resetUserPassword = (payload: { id: string; newPassword: string }): void => {
  if (!payload?.id) throw new Error('Missing user id');
  const hash = bcrypt.hashSync(payload.newPassword, 10);
  const result = getDb().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, payload.id);
  if (!result.changes) throw new Error('User not updated');
};
