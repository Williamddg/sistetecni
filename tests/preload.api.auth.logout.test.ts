import { ipcRenderer } from 'electron';
import { api } from '../app/electron/preload/api';

describe('preload api auth logout surface', () => {
  beforeEach(() => {
    (ipcRenderer.invoke as jest.Mock).mockClear();
  });

  test('api.auth.logout invokes auth:logout channel', async () => {
    await api.auth.logout();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('auth:logout');
  });
});
