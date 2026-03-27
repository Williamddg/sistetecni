import { v4 as uuid } from 'uuid';
import { getDb } from '../db';

export const addExpense = (data: any): string => {
  const id = uuid();
  const now = new Date().toISOString();
  getDb().prepare('INSERT INTO expenses (id,date,concept,amount,notes,created_at) VALUES (?,?,?,?,?,?)').run(
    id,
    data.date,
    data.concept,
    data.amount,
    data.notes ?? '',
    now,
  );
  return id;
};

export const listExpenses = (from: string, to: string): unknown[] =>
  getDb().prepare('SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC').all(from, to);
