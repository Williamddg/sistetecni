import {
  closeCashRepo,
  getCashStatusRepo,
  getOpenCashRepo,
  getOpenSuggestionRepo,
  openCashRepo,
} from '../../db/cash.repo';
import { logAuditRepo } from '../../db/audit.repo';

export const openCashService = async (payload: any): Promise<string> => {
  const cashPayload = (payload as any)?.cash ?? payload;

  const id = await openCashRepo(cashPayload);

  const actorId = String((payload as any)?.userId ?? cashPayload?.userId ?? '');
  if (actorId) {
    try {
      await logAuditRepo({
        actorId,
        action: 'CASH_OPEN',
        entityType: 'CASH_SESSION',
        entityId: id,
        metadata: { openingCash: cashPayload?.openingCash, openingNotes: cashPayload?.openingNotes ?? '' },
      });
    } catch (err) {
      console.warn('[audit] CASH_OPEN failed:', err);
    }
  }

  return id;
};

export const getOpenCashService = async (): Promise<unknown> => {
  return await getOpenCashRepo();
};

export const getCashStatusService = async (): Promise<unknown> => {
  return await getCashStatusRepo();
};

export const getOpenSuggestionService = async (): Promise<unknown> => {
  return await getOpenSuggestionRepo();
};

export const closeCashService = async (payload: any): Promise<{ base: any }> => {
  const cashPayload = (payload as any)?.cash ?? payload;

  const result = await closeCashRepo(cashPayload);

  const base = typeof result === 'object' && result !== null ? result : {};
  const actorId = String((payload as any)?.userId ?? cashPayload?.userId ?? '');

  if (actorId) {
    try {
      await logAuditRepo({
        actorId,
        action: 'CASH_CLOSE',
        entityType: 'CASH_SESSION',
        entityId: String(cashPayload?.id ?? ''),
        metadata: base,
      });
    } catch (err) {
      console.warn('[audit] CASH_CLOSE failed:', err);
    }
  }

  return { base };
};
