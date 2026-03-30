import { dialog, ipcMain } from 'electron';
import { registerBackupsIpc } from '../app/electron/ipc/backups.ipc';

const createBackupSnapshotMock = jest.fn<Promise<string>, [any]>();
const ensureDailyBackupSnapshotMock = jest.fn<Promise<string | null>, []>();
const exportCurrentDatabaseToMock = jest.fn<string, [string]>();
const restoreCurrentDatabaseFromMock = jest.fn<void, [string]>();

const requirePermissionFromPayloadMock = jest.fn<void, [unknown, unknown, string]>();
const getTrustedAuthContextMock = jest.fn(() => ({ userId: 'admin-1', role: 'ADMIN' }));

const resolveSensitiveOperationPlanMock = jest.fn(async () => ({ mode: 'direct' }));
const markFallbackOperationMock = jest.fn<void, [unknown, unknown]>();
const logAuditRepoMock = jest.fn(async () => undefined);

jest.mock('../app/electron/services/backups.service', () => ({
  createBackupSnapshot: (...args: any[]) => createBackupSnapshotMock(...args),
  ensureDailyBackupSnapshot: (...args: any[]) => ensureDailyBackupSnapshotMock(...args),
  exportCurrentDatabaseTo: (...args: any[]) => exportCurrentDatabaseToMock(...args),
  restoreCurrentDatabaseFrom: (...args: any[]) => restoreCurrentDatabaseFromMock(...args),
}));

jest.mock('../app/electron/ipc/rbac', () => ({
  requirePermissionFromPayload: (...args: any[]) => requirePermissionFromPayloadMock(...args),
  getTrustedAuthContext: (...args: any[]) => getTrustedAuthContextMock(...args),
}));

jest.mock('../app/electron/db/fallbackControl', () => ({
  resolveSensitiveOperationPlan: (...args: any[]) => resolveSensitiveOperationPlanMock(...args),
  markFallbackOperation: (...args: any[]) => markFallbackOperationMock(...args),
}));

jest.mock('../app/electron/db/audit.repo', () => ({
  logAuditRepo: (...args: any[]) => logAuditRepoMock(...args),
}));

describe('backups IPC integration contracts', () => {
  beforeEach(() => {
    (ipcMain as any).__reset();
    registerBackupsIpc();

    createBackupSnapshotMock.mockReset();
    ensureDailyBackupSnapshotMock.mockReset();
    exportCurrentDatabaseToMock.mockReset();
    restoreCurrentDatabaseFromMock.mockReset();

    requirePermissionFromPayloadMock.mockReset();
    getTrustedAuthContextMock.mockReset();
    getTrustedAuthContextMock.mockReturnValue({ userId: 'admin-1', role: 'ADMIN' });

    resolveSensitiveOperationPlanMock.mockReset();
    resolveSensitiveOperationPlanMock.mockResolvedValue({ mode: 'direct' });
    markFallbackOperationMock.mockReset();
    logAuditRepoMock.mockReset();

    (dialog.showOpenDialog as any).mockReset();
  });

  test('backup:create-manual returns backup path on success and keeps renderer-visible shape', async () => {
    createBackupSnapshotMock.mockResolvedValue('/tmp/backups/sistetecni-pos-2026-03-29-12-00.db');

    const result = await (ipcMain as any).__invoke('backup:create-manual', {});

    expect(requirePermissionFromPayloadMock).toHaveBeenCalledWith(expect.anything(), {}, 'backup:write');
    expect(createBackupSnapshotMock).toHaveBeenCalledWith('manual');
    expect(result).toBe('/tmp/backups/sistetecni-pos-2026-03-29-12-00.db');
  });

  test('backup:create-manual returns null on service error (contract preserved)', async () => {
    createBackupSnapshotMock.mockRejectedValue(new Error('disk full'));

    const result = await (ipcMain as any).__invoke('backup:create-manual', {});

    expect(result).toBeNull();
    expect(markFallbackOperationMock).not.toHaveBeenCalled();
  });

  test('backups:export returns null on dialog cancel (contract preserved)', async () => {
    (dialog.showOpenDialog as any).mockResolvedValue({ canceled: true, filePaths: [] });

    const result = await (ipcMain as any).__invoke('backups:export', {});

    expect(result).toBeNull();
    expect(exportCurrentDatabaseToMock).not.toHaveBeenCalled();
  });

  test('backups:export delegates to service and returns output path on success', async () => {
    (dialog.showOpenDialog as any).mockResolvedValue({ canceled: false, filePaths: ['/exports'] });
    exportCurrentDatabaseToMock.mockReturnValue('/exports/sistetecni-pos-2026-03-29-12-00.db');

    const result = await (ipcMain as any).__invoke('backups:export', {});

    expect(exportCurrentDatabaseToMock).toHaveBeenCalledWith('/exports');
    expect(result).toBe('/exports/sistetecni-pos-2026-03-29-12-00.db');
  });

  test('backups:export returns null when delegated service throws', async () => {
    (dialog.showOpenDialog as any).mockResolvedValue({ canceled: false, filePaths: ['/exports'] });
    exportCurrentDatabaseToMock.mockImplementation(() => {
      throw new Error('copy failed');
    });

    const result = await (ipcMain as any).__invoke('backups:export', {});

    expect(result).toBeNull();
  });

  test('backups:restore returns false on dialog cancel (contract preserved)', async () => {
    (dialog.showOpenDialog as any).mockResolvedValue({ canceled: true, filePaths: [] });

    const result = await (ipcMain as any).__invoke('backups:restore', {});

    expect(result).toBe(false);
    expect(restoreCurrentDatabaseFromMock).not.toHaveBeenCalled();
  });

  test('backups:restore delegates to service and returns true on success', async () => {
    (dialog.showOpenDialog as any).mockResolvedValue({ canceled: false, filePaths: ['/tmp/backup.db'] });

    const result = await (ipcMain as any).__invoke('backups:restore', {});

    expect(restoreCurrentDatabaseFromMock).toHaveBeenCalledWith('/tmp/backup.db');
    expect(result).toBe(true);
  });

  test('backups:restore returns false when delegated service throws', async () => {
    (dialog.showOpenDialog as any).mockResolvedValue({ canceled: false, filePaths: ['/tmp/backup.db'] });
    restoreCurrentDatabaseFromMock.mockImplementation(() => {
      throw new Error('restore failed');
    });

    const result = await (ipcMain as any).__invoke('backups:restore', {});

    expect(result).toBe(false);
  });
});
