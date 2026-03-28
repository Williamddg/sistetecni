import { ipcMain, dialog } from 'electron';
import { runAppBootstrap } from '../app/electron/bootstrap/app.bootstrap';
import { registerAuthIpc } from '../app/electron/ipc/auth.ipc';
import { registerProductsIpc } from '../app/electron/ipc/products.ipc';
import { registerSalesIpc } from '../app/electron/ipc/sales.ipc';
import { registerCashIpc } from '../app/electron/ipc/cash.ipc';
import { registerBackupsIpc } from '../app/electron/ipc/backups.ipc';
import { resetAuthContextStore } from '../app/electron/ipc/authContext';

const getDbMock = jest.fn(() => ({ backup: jest.fn(async () => undefined) }));
const getDbModeMock = jest.fn(async () => 'sqlite' as const);
const runFallbackResyncCycleMock = jest.fn(async () => ({ attempted: 0, synced: 0, failed: 0, skipped: 0 }));
const createMainWindowMock = jest.fn(async () => ({}));
const checkForAppUpdatesMock = jest.fn(async () => undefined);
const setupAutoUpdatesMock = jest.fn(() => undefined);

const authUserMock = jest.fn(async (email: string) => {
  if (email === 'admin@test.com') {
    return { id: 'admin-1', name: 'Admin', role: 'ADMIN' as const };
  }
  if (email === 'sup@test.com') {
    return { id: 'sup-1', name: 'Supervisor', role: 'SUPERVISOR' as const };
  }
  return null;
});

const listProductsServiceMock = jest.fn(async () => [{ id: 'p1' }]);
const createSaleWithAuditAndInvoiceMock = jest.fn(async () => ({ saleId: 's1' }));
const getCashStatusServiceMock = jest.fn(async () => ({ open: true }));

jest.mock('../app/electron/db/db', () => ({
  getDb: () => getDbMock(),
  getDbMode: () => getDbModeMock(),
  getDbPath: () => '/tmp/sistetecni-pos.db',
}));

jest.mock('../app/electron/db/fallbackSync', () => ({
  runFallbackResyncCycle: (...args: any[]) => runFallbackResyncCycleMock(...args),
}));

jest.mock('../app/electron/bootstrap/window.bootstrap', () => ({
  createMainWindow: (...args: any[]) => createMainWindowMock(...args),
}));

jest.mock('../app/electron/bootstrap/ipc.bootstrap', () => ({
  registerEarlyIpcHandlers: jest.fn(),
  registerDomainIpcHandlers: jest.fn(),
}));

jest.mock('../app/electron/bootstrap/updater.bootstrap', () => ({
  checkForAppUpdates: (...args: any[]) => checkForAppUpdatesMock(...args),
  setupAutoUpdates: (...args: any[]) => setupAutoUpdatesMock(...args),
}));

jest.mock('../app/electron/db/queries', () => ({
  authUser: (...args: any[]) => authUserMock(...args),
}));

jest.mock('../app/electron/modules/products/products.service', () => ({
  getProductByBarcodeService: jest.fn(async () => null),
  listPosProductsService: jest.fn(async () => []),
  listProductsService: (...args: any[]) => listProductsServiceMock(...args),
  saveProductService: jest.fn(async () => ({ ok: true })),
  updateProductService: jest.fn(async () => ({ ok: true })),
  archiveProductService: jest.fn(async () => ({ ok: true })),
}));

jest.mock('../app/electron/modules/sales/sales.service', () => ({
  createSaleWithAuditAndInvoice: (...args: any[]) => createSaleWithAuditAndInvoiceMock(...args),
  printInvoiceFromPayload: jest.fn(async () => ({ ok: true })),
  suspendSaleByMode: jest.fn(async () => ({ ok: true })),
  listSuspendedSalesByMode: jest.fn(async () => []),
  getSuspendedSaleByMode: jest.fn(async () => null),
  deleteSuspendedSaleByMode: jest.fn(async () => ({ ok: true })),
  listRecentSalesByMode: jest.fn(async () => []),
  getSaleDetailByMode: jest.fn(async () => null),
  returnSaleByMode: jest.fn(async () => ({ ok: true })),
}));

jest.mock('../app/electron/modules/cash/cash.service', () => ({
  openCashService: jest.fn(async () => ({ id: 'c1' })),
  getOpenCashService: jest.fn(async () => ({ id: 'c1' })),
  getCashStatusService: (...args: any[]) => getCashStatusServiceMock(...args),
  getOpenSuggestionService: jest.fn(async () => ({ openingCash: 0 })),
  closeCashService: jest.fn(async () => ({ base: { closed: true } })),
}));

jest.mock('../app/electron/db/audit.repo', () => ({
  logAuditRepo: jest.fn(async () => undefined),
}));

jest.mock('../app/electron/db/fallbackControl', () => ({
  resolveSensitiveOperationPlan: jest.fn(async () => ({ mode: 'direct' })),
  markFallbackOperation: jest.fn(),
}));

describe('runtime core cross-platform smoke (startup + auth/products/sales/cash/backups)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (ipcMain as any).__reset();
    resetAuthContextStore();
    (dialog.showOpenDialog as any).mockResolvedValue({ canceled: true, filePaths: [] });

    getDbMock.mockClear();
    getDbModeMock.mockReset();
    getDbModeMock.mockResolvedValue('sqlite');
    runFallbackResyncCycleMock.mockClear();
    createMainWindowMock.mockClear();
    checkForAppUpdatesMock.mockClear();
    setupAutoUpdatesMock.mockClear();

    authUserMock.mockClear();
    listProductsServiceMock.mockClear();
    createSaleWithAuditAndInvoiceMock.mockClear();
    getCashStatusServiceMock.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('startup interval tolerates getDbMode failures with controlled log (no crash)', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    getDbModeMock.mockRejectedValueOnce(new Error('MODE_UNAVAILABLE'));

    await runAppBootstrap();

    jest.advanceTimersByTime(5000);
    await Promise.resolve();

    expect(errSpy).toHaveBeenCalledWith(
      '[bootstrap:fallback-sync] ciclo omitido por error controlado:',
      expect.any(Error),
    );
    expect(createMainWindowMock).toHaveBeenCalledTimes(1);
    expect(checkForAppUpdatesMock).toHaveBeenCalledTimes(1);

    errSpy.mockRestore();
  });

  test('core IPC flows remain operable on non-Windows sender context', async () => {
    registerAuthIpc();
    registerProductsIpc();
    registerSalesIpc();
    registerCashIpc();
    registerBackupsIpc();

    await (ipcMain as any).__invokeAs(900, 'auth:login', 'admin@test.com', 'x');

    const products = await (ipcMain as any).__invokeAs(900, 'products:list', { q: 'lenovo' });
    expect(products).toEqual([{ id: 'p1' }]);

    const sale = await (ipcMain as any).__invokeAs(900, 'sales:create', { items: [], total: 0 });
    expect(sale).toEqual({ saleId: 's1' });

    const cash = await (ipcMain as any).__invokeAs(900, 'cash:get-status', {});
    expect(cash).toEqual({ open: true });

    const exportResult = await (ipcMain as any).__invokeAs(900, 'backups:export', {});
    expect(exportResult).toBeNull();

    expect(listProductsServiceMock).toHaveBeenCalledTimes(1);
    expect(createSaleWithAuditAndInvoiceMock).toHaveBeenCalledTimes(1);
    expect(getCashStatusServiceMock).toHaveBeenCalledTimes(1);
  });
});
