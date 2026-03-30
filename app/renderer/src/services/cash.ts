import { ipc } from './ipcClient';
import { getAuthContext } from './session';

type AnyRecord = Record<string, unknown>;
const asRecord = (v: unknown): AnyRecord => (v && typeof v === 'object' && !Array.isArray(v) ? (v as AnyRecord) : {});
const str = (v: unknown): string => String(v ?? '');
const num = (v: unknown): number => Number(v ?? 0);

export type CashOpenSession = {
  id?: string;
  session_id?: string;
  sessionId?: string;
  opened_at?: string;
  openedAt?: string;
  opening_cash?: number;
  openingCash?: number;
};

export type CashStatus = {
  expectedCash?: number;
  openingCash?: number;
  openedAt?: string;
};

export type OpenSuggestion = {
  suggestedOpeningCash?: number;
  lastClosedAt?: string;
};

export type CashCloseResult = {
  openedAt?: string;
  closedAt?: string;
  openingCash?: number;
  cashSales?: number;
  totalExpenses?: number;
  expectedCash?: number;
  countedCash?: number;
  diff?: number;
  backupPath?: string | null;
};

export type OpenCashInput = {
  userId?: string;
  openingCash: number;
  openingNotes?: string;
};

export type CloseCashInput = {
  id: string;
  countedCash: number;
  userId?: string;
  notes?: string;
};

const toCashOpenSession = (value: unknown): CashOpenSession | null => {
  const row = asRecord(value);
  if (Object.keys(row).length === 0) return null;
  return {
    id: str(row.id || '').trim() || undefined,
    session_id: str(row.session_id || '').trim() || undefined,
    sessionId: str(row.sessionId || '').trim() || undefined,
    opened_at: str(row.opened_at || '').trim() || undefined,
    openedAt: str(row.openedAt || '').trim() || undefined,
    opening_cash: row.opening_cash == null ? undefined : num(row.opening_cash),
    openingCash: row.openingCash == null ? undefined : num(row.openingCash),
  };
};

const toCashStatus = (value: unknown): CashStatus | null => {
  const row = asRecord(value);
  if (Object.keys(row).length === 0) return null;
  return {
    expectedCash: row.expectedCash == null ? undefined : num(row.expectedCash),
    openingCash: row.openingCash == null ? undefined : num(row.openingCash),
    openedAt: str(row.openedAt || '').trim() || undefined,
  };
};

const toOpenSuggestion = (value: unknown): OpenSuggestion | null => {
  const row = asRecord(value);
  if (Object.keys(row).length === 0) return null;
  return {
    suggestedOpeningCash: row.suggestedOpeningCash == null ? undefined : num(row.suggestedOpeningCash),
    lastClosedAt: str(row.lastClosedAt || '').trim() || undefined,
  };
};

export const getOpenCash = async (): Promise<CashOpenSession | null> =>
  toCashOpenSession(await ipc.cash.getOpen(getAuthContext()));

export const getCashStatus = async (): Promise<CashStatus | null> =>
  toCashStatus(await ipc.cash.getStatus(getAuthContext()));

export const getOpenSuggestion = async (): Promise<OpenSuggestion | null> =>
  toOpenSuggestion(await ipc.cash.getOpenSuggestion(getAuthContext()));

export const openCash = async (cash: OpenCashInput): Promise<unknown> =>
  ipc.cash.open({ ...getAuthContext(), cash });

export const closeCash = async (cash: CloseCashInput): Promise<CashCloseResult> => {
  const raw = await ipc.cash.close({ ...getAuthContext(), cash });
  const row = asRecord(raw);
  return {
    openedAt: str(row.openedAt || '').trim() || undefined,
    closedAt: str(row.closedAt || '').trim() || undefined,
    openingCash: row.openingCash == null ? undefined : num(row.openingCash),
    cashSales: row.cashSales == null ? undefined : num(row.cashSales),
    totalExpenses: row.totalExpenses == null ? undefined : num(row.totalExpenses),
    expectedCash: row.expectedCash == null ? undefined : num(row.expectedCash),
    countedCash: row.countedCash == null ? undefined : num(row.countedCash),
    diff: row.diff == null ? undefined : num(row.diff),
    backupPath: row.backupPath == null ? null : str(row.backupPath),
  };
};
