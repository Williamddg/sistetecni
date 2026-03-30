import { ipcRenderer } from 'electron';
import { api } from '../app/electron/preload/api';

describe('preload api syncAdmin surface', () => {
  beforeEach(() => {
    (ipcRenderer.invoke as jest.Mock).mockClear();
  });

  test('api.syncAdmin.status invokes sync:status:get channel', async () => {
    await api.syncAdmin.status();

    expect(ipcRenderer.invoke).toHaveBeenCalledWith('sync:status:get');
  });

  test('api.syncAdmin.runManual invokes sync:run-manual channel with payload', async () => {
    await api.syncAdmin.runManual({ limit: 40 });

    expect(ipcRenderer.invoke).toHaveBeenCalledWith('sync:run-manual', { limit: 40 });
  });

  test('api.syncAdmin.runManual defaults to empty payload object', async () => {
    await api.syncAdmin.runManual();

    expect(ipcRenderer.invoke).toHaveBeenCalledWith('sync:run-manual', {});
  });
});
