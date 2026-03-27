import { v4 as uuid } from 'uuid';
import { getDb } from '../db';

export const getLastCashClosure = (): unknown =>
  getDb().prepare('SELECT * FROM cash_closures WHERE closed_at IS NOT NULL ORDER BY closed_at DESC LIMIT 1').get();

export const getOpenSuggestion = (): unknown => {
  const last = getLastCashClosure() as any;
  if (!last) return { suggestedOpeningCash: null, lastClosedAt: null };
  return {
    suggestedOpeningCash: last.counted_cash ?? null,
    lastClosedAt: last.closed_at ?? null,
  };
};

export const openCash = (data: { userId: string; openingCash: number; openingNotes?: string }): string => {
  const id = uuid();
  getDb().prepare('INSERT INTO cash_closures (id,opened_at,opened_by,opening_cash,opening_notes) VALUES (?,?,?,?,?)').run(
    id,
    new Date().toISOString(),
    data.userId,
    data.openingCash,
    data.openingNotes ?? '',
  );
  return id;
};

export const getOpenCash = (): unknown =>
  getDb().prepare('SELECT * FROM cash_closures WHERE closed_at IS NULL ORDER BY opened_at DESC LIMIT 1').get();

export const getCashStatus = (): unknown => {
  const db = getDb();
  const open = db.prepare('SELECT * FROM cash_closures WHERE closed_at IS NULL ORDER BY opened_at DESC LIMIT 1').get() as any;
  if (!open) return null;

  const now = new Date().toISOString();
  const cashSales = (db
    .prepare('SELECT COALESCE(SUM(total),0) as total FROM sales WHERE date BETWEEN ? AND ? AND payment_method = ?')
    .get(open.opened_at, now, 'EFECTIVO') as any).total;
  const expenses = (db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE date BETWEEN ? AND ?').get(open.opened_at, now) as any).total;
  const expectedCash = open.opening_cash + cashSales - expenses;

  return {
    openedAt: open.opened_at,
    openingCash: open.opening_cash,
    cashSales,
    expenses,
    expectedCash,
  };
};

export const closeCash = (data: { id: string; countedCash: number; userId: string; notes: string }): unknown => {
  const db = getDb();
  const cash = db.prepare('SELECT * FROM cash_closures WHERE id = ?').get(data.id) as any;
  const closedAt = new Date().toISOString();
  const sales = (db
    .prepare(
      'SELECT COALESCE(SUM(total),0) as total, COALESCE(SUM(CASE WHEN payment_method = ? THEN total ELSE 0 END),0) as cashSales FROM sales WHERE date BETWEEN ? AND ?',
    )
    .get('EFECTIVO', cash.opened_at, closedAt) as any);
  const expenses = (db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE date BETWEEN ? AND ?').get(cash.opened_at, closedAt) as any).total;
  const expectedCash = cash.opening_cash + sales.cashSales - expenses;
  const diff = data.countedCash - expectedCash;
  db.prepare(
    'UPDATE cash_closures SET closed_at=?,closed_by=?,counted_cash=?,expected_cash=?,total_sales=?,total_expenses=?,difference=?,notes=? WHERE id=?',
  ).run(closedAt, data.userId, data.countedCash, expectedCash, sales.total, expenses, diff, data.notes, data.id);
  return { closedAt, expectedCash, totalSales: sales.total, totalExpenses: expenses, diff };
};
