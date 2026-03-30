import { dialog, ipcMain } from 'electron';
import { registerBackupsIpc } from '../app/electron/ipc/backups.ipc';
import { resetAuthContextStore, setAuthContextForSenderId } from '../app/electron/ipc/authContext';

const createBackupSnapshotMock = jest.fn<Promise<string>, [any]>();
const exportCurrentDatabaseToMock = jest.fn<string, [string]>();
const restoreCurrentDatabaseFromMock = jest.fn<void, [string]>();

jest.mock('../app/electron/services/backups.service', () => ({
  createBackupSnapshot: (...args: any[]) => createBackupSnapshotMock(...args),
  ensureDailyBackupSnapshot: jest.fn(async () => null),
  exportCurrentDatabaseTo: (...args: any[]) => exportCurrentDatabaseToMock(...args),
  restoreCurrentDatabaseFrom: (...args: any[]) => restoreCurrentDatabaseFromMock(...args),
}));

jest.mock('../app/electron/db/fallbackControl', () => ({
  resolveSensitiveOperationPlan: jest.fn(async () => ({ mode: 'direct' })),
  markFallbackOperation: jest.fn(),
}));

jest.mock('../app/electron/db/audit.repo', () => ({
  logAuditRepo: jest.fn(async () => undefined),
}));

describe('backups IPC RBAC denied integration contracts', () => {
  const sellerSenderId = 77;

  beforeEach(() => {
    (ipcMain as any).__reset();
    resetAuthContextStore();
    registerBackupsIpc();

    setAuthContextForSenderId(sellerSenderId, { userId: 'seller-1', role: 'SELLER' });

    createBackupSnapshotMock.mockReset();
    exportCurrentDatabaseToMock.mockReset();
    restoreCurrentDatabaseFromMock.mockReset();

    (dialog.showOpenDialog as any).mockReset();
  });

  test('backup:create-manual keeps null contract under RBAC denied (FORBIDDEN)', async () => {
    const result = await (ipcMain as any).__invokeAs(sellerSenderId, 'backup:create-manual', {
      userId: 'seller-1',
      role: 'SELLER',
    });

    expect(result).toBeNull();
    expect(createBackupSnapshotMock).not.toHaveBeenCalled();
  });

  test('backups:export keeps null contract under RBAC denied (FORBIDDEN)', async () => {
    const result = await (ipcMain as any).__invokeAs(sellerSenderId, 'backups:export', {
      userId: 'seller-1',
      role: 'SELLER',
    });

    expect(result).toBeNull();
    expect(dialog.showOpenDialog).not.toHaveBeenCalled();
    expect(exportCurrentDatabaseToMock).not.toHaveBeenCalled();
  });

  test('backups:restore keeps false contract under RBAC denied (FORBIDDEN)', async () => {
    const result = await (ipcMain as any).__invokeAs(sellerSenderId, 'backups:restore', {
      userId: 'seller-1',
      role: 'SELLER',
    });

    expect(result).toBe(false);
    expect(dialog.showOpenDialog).not.toHaveBeenCalled();
    expect(restoreCurrentDatabaseFromMock).not.toHaveBeenCalled();
  });
});
