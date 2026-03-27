import { ipcMain } from 'electron';
import { requirePermissionFromPayload } from './rbac';
import {
  archiveProductService,
  getProductByBarcodeService,
  listPosProductsService,
  listProductsService,
  saveProductService,
  updateProductService,
} from '../modules/products/products.service';

export const registerProductsIpc = (): void => {
  ipcMain.removeHandler('products:by-barcode');
  ipcMain.handle('products:by-barcode', async (_e, payload) => {
    requirePermissionFromPayload(payload, 'pos:sell');
    return await getProductByBarcodeService(payload);
  });

  ipcMain.removeHandler('pos:products:list');
  ipcMain.handle('pos:products:list', async (_e, payload) => {
    requirePermissionFromPayload(payload, 'pos:sell');
    return await listPosProductsService(payload);
  });

  ipcMain.removeHandler('products:list');
  ipcMain.handle('products:list', async (_e, payload) => {
    requirePermissionFromPayload(payload, 'inventory:read');
    return await listProductsService(payload);
  });

  ipcMain.removeHandler('products:save');
  ipcMain.handle('products:save', async (_e, payload) => {
    requirePermissionFromPayload(payload, 'inventory:write');
    return await saveProductService(payload);
  });

  ipcMain.removeHandler('products:update');
  ipcMain.handle('products:update', async (_e, payload) => {
    requirePermissionFromPayload(payload, 'inventory:write');
    return await updateProductService(payload);
  });

  ipcMain.removeHandler('products:archive');
  ipcMain.handle('products:archive', async (_e, payload) => {
    requirePermissionFromPayload(payload, 'inventory:write');
    return await archiveProductService(payload);
  });
};
