import { ipcMain } from 'electron';
import { requirePermissionFromPayload } from './rbac';
import {
  createSaleWithAuditAndInvoice,
  printInvoiceFromPayload,
  suspendSaleByMode,
  listSuspendedSalesByMode,
  getSuspendedSaleByMode,
  deleteSuspendedSaleByMode,
  listRecentSalesByMode,
  getSaleDetailByMode,
  returnSaleByMode,
} from '../modules/sales/sales.service';

export const registerSalesIpc = (): void => {
  console.log('[SALES IPC] registerSalesIpc OK');

  ipcMain.handle('sales:create', async (_e, payload) => {
    requirePermissionFromPayload(payload, 'pos:sell');
    return await createSaleWithAuditAndInvoice(payload);
  });

  ipcMain.handle('sales:print-invoice', async (_e, payload) => {
    requirePermissionFromPayload(payload, 'pos:sell');
    return await printInvoiceFromPayload(payload);
  });

  ipcMain.handle('sales:suspend', async (_e, payload) => {
    requirePermissionFromPayload(payload, 'pos:sell');
    return await suspendSaleByMode(payload);
  });

  ipcMain.handle('sales:suspended-list', async (_e, payload) => {
    requirePermissionFromPayload(payload, 'pos:sell');
    return await listSuspendedSalesByMode();
  });

  ipcMain.handle('sales:suspended-get', async (_e, payload) => {
    requirePermissionFromPayload(payload, 'pos:sell');
    return await getSuspendedSaleByMode(payload);
  });

  ipcMain.handle('sales:suspended-delete', async (_e, payload) => {
    requirePermissionFromPayload(payload, 'pos:sell');
    return await deleteSuspendedSaleByMode(payload);
  });

  ipcMain.handle('sales:recent', async (_e, payload) => {
    requirePermissionFromPayload(payload, 'pos:sell');
    return await listRecentSalesByMode(payload);
  });

  ipcMain.handle('sales:detail', async (_e, payload) => {
    requirePermissionFromPayload(payload, 'pos:sell');
    return await getSaleDetailByMode(payload);
  });

  ipcMain.handle('sales:return', async (_e, payload) => {
    requirePermissionFromPayload(payload, 'pos:sell');
    return await returnSaleByMode(payload);
  });
};
