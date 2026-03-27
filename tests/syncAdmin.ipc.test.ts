import { ipcMain } from 'electron';

const getFallbackSyncStatusMock = jest.fn();
const runFallbackResyncManualMock = jest.fn();

jest.mock('../app/electron/db/fallbackSync', () => ({
  getFallbackSyncStatus: () => getFallbackSyncStatusMock(),
  runFallbackResyncManual: (...args: any[]) => runFallbackResyncManualMock(...args),
}));

import { registerSyncAdminIpc } from '../app/electron/ipc/syncAdmin.ipc';

describe('sync admin IPC', () => {
  beforeEach(() => {
    (ipcMain as any).__reset();
    getFallbackSyncStatusMock.mockReset();
    runFallbackResyncManualMock.mockReset();
    registerSyncAdminIpc();
  });

  test('sync:status:get returns status payload', async () => {
    getFallbackSyncStatusMock.mockReturnValue({ inProgress: false, queue: { pending: 0 } });

    const res = await (ipcMain as any).__invoke('sync:status:get');

    expect(res).toEqual({ ok: true, data: { inProgress: false, queue: { pending: 0 } } });
  });

  test('sync:run-manual forwards limit and returns sync result', async () => {
    runFallbackResyncManualMock.mockResolvedValue({ ok: true, result: { attempted: 1, synced: 1, failed: 0, skipped: 0 } });

    const res = await (ipcMain as any).__invoke('sync:run-manual', { limit: 99 });

    expect(runFallbackResyncManualMock).toHaveBeenCalledWith({ limit: 99 });
    expect(res).toEqual({ ok: true, result: { attempted: 1, synced: 1, failed: 0, skipped: 0 } });
  });

  test('sync:run-manual uses default limit when payload is omitted', async () => {
    runFallbackResyncManualMock.mockResolvedValue({ ok: false, reason: 'MYSQL_NOT_PRIMARY' });

    await (ipcMain as any).__invoke('sync:run-manual');

    expect(runFallbackResyncManualMock).toHaveBeenCalledWith({ limit: 25 });
  });
});
