import { ipcMain } from 'electron';
import { setAuthContextForSenderId, resetAuthContextStore } from '../app/electron/ipc/authContext';
import { registerUsersIpc } from '../app/electron/ipc/users.ipc';
import { registerConfigIpc } from '../app/electron/ipc/config.ipc';
import { registerCashIpc } from '../app/electron/ipc/cash.ipc';

const createUserServiceMock = jest.fn(async () => 'new-user');
const getCashStatusServiceMock = jest.fn(async () => ({ open: false }));

jest.mock('../app/electron/modules/users/users.service', () => ({
  listUsersService: jest.fn(async () => []),
  listUsersBasicService: jest.fn(async () => []),
  createUserService: (...args: any[]) => createUserServiceMock(...args),
  resetUserPasswordService: jest.fn(async () => ({ ok: true })),
  changeUserPasswordService: jest.fn(async () => ({ ok: true })),
}));

jest.mock('../app/electron/modules/cash/cash.service', () => ({
  openCashService: jest.fn(async () => 'cash-1'),
  getOpenCashService: jest.fn(async () => null),
  getCashStatusService: (...args: any[]) => getCashStatusServiceMock(...args),
  getOpenSuggestionService: jest.fn(async () => ({ amount: 0 })),
  closeCashService: jest.fn(async () => ({ base: 0 })),
}));

describe('payload spoofing regression vs trusted sender context', () => {
  beforeEach(() => {
    (ipcMain as any).__reset();
    resetAuthContextStore();
    createUserServiceMock.mockClear();
    getCashStatusServiceMock.mockClear();

    registerUsersIpc();
    registerConfigIpc();
    registerCashIpc();
  });

  test('users:create blocks role escalation when payload.role is forged', async () => {
    setAuthContextForSenderId(1001, { userId: 'seller-ctx', role: 'SELLER' });

    await expect((ipcMain as any).__invokeAs(1001, 'users:create', {
      userId: 'seller-ctx',
      role: 'ADMIN',
      user: { name: 'Evil', email: 'evil@test.com', password: 'x', role: 'ADMIN' },
    })).rejects.toThrow('FORBIDDEN');

    expect(createUserServiceMock).not.toHaveBeenCalled();
  });

  test('config:set blocks payload identity mismatch even if trusted role is admin', async () => {
    setAuthContextForSenderId(1002, { userId: 'admin-ctx', role: 'ADMIN' });

    await expect((ipcMain as any).__invokeAs(1002, 'config:set', {
      userId: 'another-user',
      role: 'ADMIN',
      dbMode: 'sqlite',
    })).rejects.toThrow('FORBIDDEN');
  });

  test('cash:get-status uses trusted sender role, not spoofed payload role', async () => {
    setAuthContextForSenderId(1003, { userId: 'seller-ctx', role: 'SELLER' });

    await expect((ipcMain as any).__invokeAs(1003, 'cash:get-status', {
      userId: 'seller-ctx',
      role: 'ADMIN',
    })).rejects.toThrow('FORBIDDEN');

    setAuthContextForSenderId(1004, { userId: 'supervisor-ctx', role: 'SUPERVISOR' });
    await expect((ipcMain as any).__invokeAs(1004, 'cash:get-status', {
      userId: 'supervisor-ctx',
      role: 'SUPERVISOR',
    })).resolves.toEqual({ open: false });
  });
});
