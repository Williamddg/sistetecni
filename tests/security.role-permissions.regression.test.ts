import { ipcMain, dialog } from 'electron';
import { resetAuthContextStore, setAuthContextForSenderId } from '../app/electron/ipc/authContext';
import { registerUsersIpc } from '../app/electron/ipc/users.ipc';
import { registerConfigIpc } from '../app/electron/ipc/config.ipc';
import { registerMySqlIpc } from '../app/electron/ipc/mysql.ipc';
import { registerBackupsIpc } from '../app/electron/ipc/backups.ipc';
import { registerSyncAdminIpc } from '../app/electron/ipc/syncAdmin.ipc';
import { registerProductsIpc } from '../app/electron/ipc/products.ipc';
import { registerSalesIpc } from '../app/electron/ipc/sales.ipc';
import { registerCashIpc } from '../app/electron/ipc/cash.ipc';

type Role = 'ADMIN' | 'SUPERVISOR' | 'SELLER';

const listUsersServiceMock = jest.fn(async () => [{ id: 'u1' }]);
const listUsersBasicServiceMock = jest.fn(async () => [{ id: 'u1' }]);
const createUserServiceMock = jest.fn(async () => 'new-user');
const resetUserPasswordServiceMock = jest.fn(async () => ({ ok: true }));
const changeUserPasswordServiceMock = jest.fn(async () => ({ ok: true }));

const listProductsServiceMock = jest.fn(async () => []);
const listPosProductsServiceMock = jest.fn(async () => []);
const getProductByBarcodeServiceMock = jest.fn(async () => null);
const saveProductServiceMock = jest.fn(async () => 'p1');
const updateProductServiceMock = jest.fn(async () => ({ ok: true }));
const archiveProductServiceMock = jest.fn(async () => true);

const salesCreateMock = jest.fn(async () => ({ ok: true, saleId: 's1', invoiceNumber: 'F-1' }));
const salesNoopMock = jest.fn(async () => ({ ok: true }));

const cashOpenMock = jest.fn(async () => 'c1');
const cashGetOpenMock = jest.fn(async () => null);
const cashGetStatusMock = jest.fn(async () => ({ open: false }));
const cashGetSuggestionMock = jest.fn(async () => ({ amount: 0 }));
const cashCloseMock = jest.fn(async () => ({ base: 0 }));

const testMySqlConnectionMock = jest.fn(async () => ({ ok: true }));
const initMySqlSchemaMock = jest.fn(async () => ({ ok: true }));
const mysqlConfigState: any = {};

const getFallbackSyncStatusMock = jest.fn(() => ({ inProgress: false, queue: { pending: 0 } }));
const runFallbackResyncManualMock = jest.fn(async () => ({ ok: true, result: { attempted: 0, synced: 0, failed: 0, skipped: 0 } }));

jest.mock('../app/electron/modules/users/users.service', () => ({
  listUsersService: (...args: any[]) => listUsersServiceMock(...args),
  listUsersBasicService: (...args: any[]) => listUsersBasicServiceMock(...args),
  createUserService: (...args: any[]) => createUserServiceMock(...args),
  resetUserPasswordService: (...args: any[]) => resetUserPasswordServiceMock(...args),
  changeUserPasswordService: (...args: any[]) => changeUserPasswordServiceMock(...args),
}));

jest.mock('../app/electron/modules/products/products.service', () => ({
  listProductsService: (...args: any[]) => listProductsServiceMock(...args),
  listPosProductsService: (...args: any[]) => listPosProductsServiceMock(...args),
  getProductByBarcodeService: (...args: any[]) => getProductByBarcodeServiceMock(...args),
  saveProductService: (...args: any[]) => saveProductServiceMock(...args),
  updateProductService: (...args: any[]) => updateProductServiceMock(...args),
  archiveProductService: (...args: any[]) => archiveProductServiceMock(...args),
}));

jest.mock('../app/electron/modules/sales/sales.service', () => ({
  createSaleWithAuditAndInvoice: (...args: any[]) => salesCreateMock(...args),
  printInvoiceFromPayload: (...args: any[]) => salesNoopMock(...args),
  suspendSaleByMode: (...args: any[]) => salesNoopMock(...args),
  listSuspendedSalesByMode: (...args: any[]) => salesNoopMock(...args),
  getSuspendedSaleByMode: (...args: any[]) => salesNoopMock(...args),
  deleteSuspendedSaleByMode: (...args: any[]) => salesNoopMock(...args),
  listRecentSalesByMode: (...args: any[]) => salesNoopMock(...args),
  getSaleDetailByMode: (...args: any[]) => salesNoopMock(...args),
  returnSaleByMode: (...args: any[]) => salesNoopMock(...args),
}));

jest.mock('../app/electron/modules/cash/cash.service', () => ({
  openCashService: (...args: any[]) => cashOpenMock(...args),
  getOpenCashService: (...args: any[]) => cashGetOpenMock(...args),
  getCashStatusService: (...args: any[]) => cashGetStatusMock(...args),
  getOpenSuggestionService: (...args: any[]) => cashGetSuggestionMock(...args),
  closeCashService: (...args: any[]) => cashCloseMock(...args),
}));

jest.mock('../app/electron/db/mysql', () => ({
  testMySqlConnection: (...args: any[]) => testMySqlConnectionMock(...args),
}));

jest.mock('../app/electron/db/mysql/initSchema.mysql', () => ({
  initMySqlSchema: (...args: any[]) => initMySqlSchemaMock(...args),
}));

jest.mock('../app/electron/db/mysqlConfig', () => ({
  getMySqlConfigPath: () => '/tmp/mysql-regression.json',
  readMySqlConfig: () => ({ ...mysqlConfigState }),
  writeMySqlConfig: (cfg: any) => {
    Object.keys(mysqlConfigState).forEach((k) => delete mysqlConfigState[k]);
    Object.assign(mysqlConfigState, cfg);
  },
}));

jest.mock('../app/electron/db/fallbackSync', () => ({
  getFallbackSyncStatus: () => getFallbackSyncStatusMock(),
  runFallbackResyncManual: (...args: any[]) => runFallbackResyncManualMock(...args),
}));

const senderForRole = (role: Role): number => ({ ADMIN: 901, SUPERVISOR: 902, SELLER: 903 }[role]);

const authPayload = (role: Role) => ({ userId: `user-${role.toLowerCase()}`, role });

const setSession = (role: Role): number => {
  const senderId = senderForRole(role);
  setAuthContextForSenderId(senderId, { userId: `user-${role.toLowerCase()}`, role });
  return senderId;
};

describe('role permissions critical IPC regression', () => {
  beforeEach(() => {
    (ipcMain as any).__reset();
    resetAuthContextStore();
    Object.keys(mysqlConfigState).forEach((k) => delete mysqlConfigState[k]);
    (dialog.showOpenDialog as jest.Mock).mockClear();

    registerUsersIpc();
    registerConfigIpc();
    registerMySqlIpc();
    registerBackupsIpc();
    registerSyncAdminIpc();
    registerProductsIpc();
    registerSalesIpc();
    registerCashIpc();
  });

  test('users:list and users:create enforce role matrix', async () => {
    const admin = setSession('ADMIN');
    const sup = setSession('SUPERVISOR');
    const seller = setSession('SELLER');

    await expect((ipcMain as any).__invokeAs(admin, 'users:list', authPayload('ADMIN'))).resolves.toEqual([{ id: 'u1' }]);
    await expect((ipcMain as any).__invokeAs(sup, 'users:list', authPayload('SUPERVISOR'))).rejects.toThrow('FORBIDDEN');
    await expect((ipcMain as any).__invokeAs(seller, 'users:list', authPayload('SELLER'))).rejects.toThrow('FORBIDDEN');

    await expect((ipcMain as any).__invokeAs(admin, 'users:create', { ...authPayload('ADMIN'), user: { name: 'x' } })).resolves.toEqual('new-user');
    await expect((ipcMain as any).__invokeAs(sup, 'users:create', { ...authPayload('SUPERVISOR'), user: { name: 'x' } })).rejects.toThrow('FORBIDDEN');
  });

  test('config:set and mysql:test are admin-only operational controls', async () => {
    const admin = setSession('ADMIN');
    const sup = setSession('SUPERVISOR');
    const seller = setSession('SELLER');

    await expect((ipcMain as any).__invokeAs(admin, 'config:set', { ...authPayload('ADMIN'), dbMode: 'sqlite' })).resolves.toEqual({ ok: true });
    await expect((ipcMain as any).__invokeAs(sup, 'config:set', { ...authPayload('SUPERVISOR'), dbMode: 'sqlite' })).rejects.toThrow('FORBIDDEN');
    await expect((ipcMain as any).__invokeAs(seller, 'config:set', { ...authPayload('SELLER'), dbMode: 'sqlite' })).rejects.toThrow('FORBIDDEN');

    await expect((ipcMain as any).__invokeAs(admin, 'mysql:test')).resolves.toEqual({ ok: true });
    await expect((ipcMain as any).__invokeAs(sup, 'mysql:test')).rejects.toThrow('FORBIDDEN');
  });

  test('backups:export allows ADMIN/SUPERVISOR and denies SELLER', async () => {
    const admin = setSession('ADMIN');
    const sup = setSession('SUPERVISOR');
    const seller = setSession('SELLER');

    await expect((ipcMain as any).__invokeAs(admin, 'backups:export', authPayload('ADMIN'))).resolves.toBeNull();
    await expect((ipcMain as any).__invokeAs(sup, 'backups:export', authPayload('SUPERVISOR'))).resolves.toBeNull();
    expect(dialog.showOpenDialog).toHaveBeenCalledTimes(2);

    (dialog.showOpenDialog as jest.Mock).mockClear();
    await expect((ipcMain as any).__invokeAs(seller, 'backups:export', authPayload('SELLER'))).resolves.toBeNull();
    expect(dialog.showOpenDialog).not.toHaveBeenCalled();
  });

  test('sync admin visibility is admin-only', async () => {
    const admin = setSession('ADMIN');
    const sup = setSession('SUPERVISOR');
    const seller = setSession('SELLER');

    await expect((ipcMain as any).__invokeAs(admin, 'sync:status:get')).resolves.toMatchObject({ ok: true });
    await expect((ipcMain as any).__invokeAs(sup, 'sync:status:get')).resolves.toEqual({ ok: false, error: 'FORBIDDEN' });
    await expect((ipcMain as any).__invokeAs(seller, 'sync:status:get')).resolves.toEqual({ ok: false, error: 'FORBIDDEN' });
  });

  test('operational channels keep expected role permissions (products/sales/cash)', async () => {
    const admin = setSession('ADMIN');
    const sup = setSession('SUPERVISOR');
    const seller = setSession('SELLER');

    await expect((ipcMain as any).__invokeAs(admin, 'products:list', authPayload('ADMIN'))).resolves.toEqual([]);
    await expect((ipcMain as any).__invokeAs(sup, 'products:list', authPayload('SUPERVISOR'))).resolves.toEqual([]);
    await expect((ipcMain as any).__invokeAs(seller, 'products:list', authPayload('SELLER'))).rejects.toThrow('FORBIDDEN');

    await expect((ipcMain as any).__invokeAs(admin, 'sales:create', authPayload('ADMIN'))).resolves.toMatchObject({ ok: true });
    await expect((ipcMain as any).__invokeAs(sup, 'sales:create', authPayload('SUPERVISOR'))).resolves.toMatchObject({ ok: true });
    await expect((ipcMain as any).__invokeAs(seller, 'sales:create', authPayload('SELLER'))).resolves.toMatchObject({ ok: true });

    await expect((ipcMain as any).__invokeAs(admin, 'cash:get-status', authPayload('ADMIN'))).resolves.toEqual({ open: false });
    await expect((ipcMain as any).__invokeAs(sup, 'cash:get-status', authPayload('SUPERVISOR'))).resolves.toEqual({ open: false });
    await expect((ipcMain as any).__invokeAs(seller, 'cash:get-status', authPayload('SELLER'))).rejects.toThrow('FORBIDDEN');
  });
});
