import { ipc } from './ipcClient';
import { getAuthContext } from './session';

type AnyRecord = Record<string, unknown>;
const asRecord = (v: unknown): AnyRecord => (v && typeof v === 'object' && !Array.isArray(v) ? (v as AnyRecord) : {});
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string => String(v ?? '');
const num = (v: unknown): number => Number(v ?? 0);

export type ExpenseRow = {
  id: string;
  date?: string;
  created_at?: string;
  concept: string;
  amount: number;
  notes?: string;
};

const toExpenseRow = (value: unknown): ExpenseRow | null => {
  const row = asRecord(value);
  const id = str(row.id).trim();
  if (!id) return null;
  return {
    id,
    date: str(row.date || '').trim() || undefined,
    created_at: str(row.created_at || '').trim() || undefined,
    concept: str(row.concept || ''),
    amount: num(row.amount),
    notes: str(row.notes || '').trim() || undefined,
  };
};

export type AddExpenseInput = {
  date: string;
  concept: string;
  amount: number;
  notes?: string;
  userId?: string;
};

export const addExpense = (expense: AddExpenseInput) =>
  ipc.expenses.add({ ...getAuthContext(), expense });

export const listExpenses = async (from: string, to: string): Promise<ExpenseRow[]> =>
  asArray(await ipc.expenses.list({ ...getAuthContext(), from, to }))
    .map(toExpenseRow)
    .filter((e): e is ExpenseRow => Boolean(e));
