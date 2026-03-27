import { requirePermissionFromPayload } from '../app/electron/ipc/rbac';
import { resetAuthContextStore, setAuthContextForSenderId } from '../app/electron/ipc/authContext';

describe('RBAC trusted context hardening', () => {
  const event = { sender: { id: 10 } } as any;

  beforeEach(() => {
    resetAuthContextStore();
  });

  test('rejects when there is no authenticated context in main process', () => {
    expect(() => requirePermissionFromPayload(event, { userId: 'x', role: 'ADMIN' }, 'users:write')).toThrow('FORBIDDEN');
  });

  test('rejects payload role spoofing against trusted session role', () => {
    setAuthContextForSenderId(10, { userId: 'u-admin', role: 'ADMIN' });

    expect(() => requirePermissionFromPayload(event, { userId: 'u-admin', role: 'SELLER' }, 'users:write')).toThrow('FORBIDDEN');
  });

  test('rejects payload userId spoofing against trusted session userId', () => {
    setAuthContextForSenderId(10, { userId: 'u-admin', role: 'ADMIN' });

    expect(() => requirePermissionFromPayload(event, { userId: 'another-user', role: 'ADMIN' }, 'users:write')).toThrow('FORBIDDEN');
  });

  test('uses trusted session role for permission checks', () => {
    setAuthContextForSenderId(10, { userId: 'u-seller', role: 'SELLER' });

    expect(() => requirePermissionFromPayload(event, { userId: 'u-seller', role: 'SELLER' }, 'users:write')).toThrow('FORBIDDEN');
  });
});
