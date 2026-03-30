import { BrowserWindow } from 'electron';

import { generateInvoicePdf } from '../../invoice/invoicePdf';
import { createSaleRepo } from '../../db/sales.repo';
import { logAuditRepo } from '../../db/audit.repo';
import { getDbMode } from '../../db/db';
import { resolveSensitiveOperationPlan } from '../../db/fallbackControl';

import {
  suspendSale,
  listSuspendedSales,
  getSuspendedSale,
  deleteSuspendedSale,
  listRecentSales,
  getSaleDetail,
} from '../../db/queries';

import {
  suspendSaleMySql,
  listSuspendedSalesMySql,
  getSuspendedSaleMySql,
  deleteSuspendedSaleMySql,
  listRecentSalesMySql,
  getSaleDetailMySql,
  returnSaleMySql,
} from '../../db/mysql/sales.mysql';

export const createSaleWithAuditAndInvoice = async (payload: any): Promise<any> => {
  const salePayload = (payload as any)?.sale ?? payload;
  const result = await createSaleRepo(salePayload);

  const actorId = String((payload as any)?.userId ?? salePayload?.userId ?? '');
  if (actorId) {
    try {
      await logAuditRepo({
        actorId,
        action: 'SALE_CREATE',
        entityType: 'SALE',
        entityId: result.saleId,
        metadata: {
          invoiceNumber: result.invoiceNumber,
          total: salePayload?.total,
          paymentMethod: salePayload?.paymentMethod,
        },
      });
    } catch (err) {
      console.warn('[audit] SALE_CREATE failed:', err);
    }
  }

  const pdf = await generateInvoicePdf({
    ...salePayload,
    invoiceNumber: result.invoiceNumber,
  });

  return { ...result, pdf };
};

export const printInvoiceFromPayload = async (payload: any): Promise<{ ok: true }> => {
  const html = typeof payload === 'string' ? payload : String((payload as any)?.html ?? '');

  const win = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: false,
    },
  });

  try {
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    await new Promise((resolve) => setTimeout(resolve, 350));

    const printers = await win.webContents.getPrintersAsync().catch(() => []);
    if (!Array.isArray(printers) || printers.length === 0) {
      throw new Error('NO_PRINTERS_AVAILABLE');
    }

    await new Promise<void>((resolve, reject) => {
      win.webContents.print(
        {
          silent: false,
          printBackground: true,
          margins: {
            marginType: 'none',
          },
          pageSize: {
            width: 80000,
            height: 200000,
          },
        } as any,
        (success, failureReason) => {
          if (!success) {
            reject(new Error(failureReason || 'No se pudo imprimir la factura.'));
            return;
          }
          resolve();
        },
      );
    });

    return { ok: true };
  } finally {
    if (!win.isDestroyed()) {
      win.close();
    }
  }
};

export const suspendSaleByMode = async (payload: any): Promise<{ ok: true; id: string }> => {
  const sale = (payload as any)?.sale ?? payload;
  const mode = await getDbMode();

  console.log('[sales:suspend] mode =', mode);

  if (mode === 'mysql') {
    const id = await suspendSaleMySql(sale);
    return { ok: true, id };
  }

  const id = suspendSale(sale);
  return { ok: true, id };
};

export const listSuspendedSalesByMode = async (): Promise<any> => {
  const mode = await getDbMode();
  console.log('[sales:suspended-list] mode =', mode);

  if (mode === 'mysql') {
    return await listSuspendedSalesMySql();
  }

  return listSuspendedSales();
};

export const getSuspendedSaleByMode = async (payload: any): Promise<any> => {
  const id = String((payload as any)?.id ?? '');
  const mode = await getDbMode();

  console.log('[sales:suspended-get] mode =', mode);

  if (mode === 'mysql') {
    return await getSuspendedSaleMySql(id);
  }

  return getSuspendedSale(id);
};

export const deleteSuspendedSaleByMode = async (payload: any): Promise<{ ok: true }> => {
  const id = String((payload as any)?.id ?? '');
  const mode = await getDbMode();

  console.log('[sales:suspended-delete] mode =', mode);

  if (mode === 'mysql') {
    await deleteSuspendedSaleMySql(id);
    return { ok: true };
  }

  deleteSuspendedSale(id);
  return { ok: true };
};

export const listRecentSalesByMode = async (payload: any): Promise<any> => {
  const limit = Number((payload as any)?.limit ?? 30);
  const mode = await getDbMode();

  console.log('[sales:recent] mode =', mode);

  if (mode === 'mysql') {
    return await listRecentSalesMySql(limit);
  }

  return listRecentSales(limit);
};

export const getSaleDetailByMode = async (payload: any): Promise<any> => {
  const id = String((payload as any)?.id ?? '');
  const mode = await getDbMode();

  console.log('[sales:detail] mode =', mode);

  if (mode === 'mysql') {
    return await getSaleDetailMySql(id);
  }

  return getSaleDetail(id);
};

export const returnSaleByMode = async (payload: any): Promise<any> => {
  const plan = await resolveSensitiveOperationPlan('sales:return');

  if (plan.mode === 'mysql') {
    return await returnSaleMySql(payload);
  }

  throw new Error('Return sale only implemented for MySQL.');
};
