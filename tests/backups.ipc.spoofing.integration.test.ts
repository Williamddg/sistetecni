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

describe('backups IPC spoofing protection with trusted main-process context', () => {
  beforeEach(() => {
    (ipcMain as any).__reset();
    resetAuthContextStore();
    registerBackupsIpc();

    createBackupSnapshotMock.mockReset();
    exportCurrentDatabaseToMock.mockReset();
    restoreCurrentDatabaseFromMock.mockReset();

    (dialog.showOpenDialog as any).mockReset();
  });

  test('backup:create-manual rejects spoofed ADMIN payload from SUPERVISOR sender', async () => {
    setAuthContextForSenderId(81, { userId: 'sup-1', role: 'SUPERVISOR' });

    const result = await (ipcMain as any).__invokeAs(81, 'backup:create-manual', {
      userId: 'attacker-user',
      role: 'ADMIN',
    });

    expect(result).toBeNull();
    expect(createBackupSnapshotMock).not.toHaveBeenCalled();
  });

  test('backups:export rejects spoofed userId payload even when trusted role has permission', async () => {
    setAuthContextForSenderId(82, { userId: 'sup-2', role: 'SUPERVISOR' });

    const result = await (ipcMain as any).__invokeAs(82, 'backups:export', {
      userId: 'different-user',
      role: 'SUPERVISOR',
    });

    expect(result).toBeNull();
    expect(dialog.showOpenDialog).not.toHaveBeenCalled();
    expect(exportCurrentDatabaseToMock).not.toHaveBeenCalled();
  });

  test('backups:restore keeps false contract when SELLER spoofs ADMIN in payload', async () => {
    setAuthContextForSenderId(83, { userId: 'seller-1', role: 'SELLER' });

    const result = await (ipcMain as any).__invokeAs(83, 'backups:restore', {
      userId: 'seller-1',
      role: 'ADMIN',
    });

    expect(result).toBe(false);
    expect(dialog.showOpenDialog).not.toHaveBeenCalled();
    expect(restoreCurrentDatabaseFromMock).not.toHaveBeenCalled();
  });
});
