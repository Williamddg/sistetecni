import { closeCash, getCashStatus, getOpenCash, getOpenSuggestion, openCash } from './queries'; // SQLite
import { closeCashMySql, getCashStatusMySql, getOpenCashMySql, getOpenSuggestionMySql, openCashMySql } from './mysql/cash.mysql';
import { markFallbackOperation, resolveSensitiveOperationPlan } from './fallbackControl';

export const openCashRepo = async (data: any): Promise<string> => {
  const plan = await resolveSensitiveOperationPlan('cash:open');

  if (plan.mode === 'mysql') return await openCashMySql(data);

  const id = openCash(data);
  markFallbackOperation(plan, {
    schemaVersion: 2,
    input: {
      ...(data as any),
      id,
    },
    sqliteRef: { cashSessionId: id },
  });
  return id;
};

export const getOpenCashRepo = async (): Promise<any> => {
  const plan = await resolveSensitiveOperationPlan('cash:open');
  if (plan.mode === 'mysql') return await getOpenCashMySql();
  return getOpenCash();
};

export const getCashStatusRepo = async (): Promise<any> => {
  const plan = await resolveSensitiveOperationPlan('cash:open');
  if (plan.mode === 'mysql') return await getCashStatusMySql();
  return getCashStatus();
};

export const getOpenSuggestionRepo = async (): Promise<any> => {
  const plan = await resolveSensitiveOperationPlan('cash:open');
  if (plan.mode === 'mysql') return await getOpenSuggestionMySql();
  return getOpenSuggestion();
};

export const closeCashRepo = async (data: any): Promise<any> => {
  const plan = await resolveSensitiveOperationPlan('cash:close');

  if (plan.mode === 'mysql') return await closeCashMySql(data);

  const result = closeCash(data);
  markFallbackOperation(plan, {
    schemaVersion: 2,
    input: {
      ...(data as any),
    },
    sqliteRef: {
      cashSessionId: (data as any)?.id,
      closeResult: result,
    },
  });
  return result;
};
