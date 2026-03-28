import { ipcMain } from 'electron';

jest.mock('serialport', () => {
  throw new Error('native module missing');
});

import { registerCashDrawerIpc } from '../app/electron/ipc/cashdrawer.ipc';

describe('cashdrawer cross-platform graceful degradation', () => {
  const originalPlatform = process.platform;

  const setPlatform = (value: NodeJS.Platform) => {
    Object.defineProperty(process, 'platform', {
      value,
      configurable: true,
    });
  };

  beforeEach(() => {
    (ipcMain as any).__reset();
    registerCashDrawerIpc();
  });

  afterEach(() => {
    setPlatform(originalPlatform);
  });

  test('printer mode rejects gracefully on non-Windows platforms', async () => {
    setPlatform('linux');

    await expect((ipcMain as any).__invoke('cashdrawer:open', { mode: 'printer', printerName: 'Any' }))
      .rejects.toThrow('UNSUPPORTED_PLATFORM');
  });

  test('list-ports reports serialport unavailability without crashing app startup', async () => {
    await expect((ipcMain as any).__invoke('cashdrawer:list-ports'))
      .rejects.toThrow('SERIALPORT_UNAVAILABLE');
  });
});
