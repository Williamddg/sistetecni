import { readSetupTelemetry, recordSetupFailure } from '../app/renderer/src/services/setupTelemetry';

describe('setup telemetry local minimal snapshot', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    (global as any).localStorage = {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
    };
  });

  test('records failure count and last classified error', () => {
    const first = recordSetupFailure('server', 'test_connection', 'network_unreachable', 'ETIMEDOUT');
    expect(first.failureCount).toBe(1);
    expect(first.lastFailureClass).toBe('network_unreachable');

    const second = recordSetupFailure('server', 'install_run', 'generic_unknown', 'custom error');
    expect(second.failureCount).toBe(2);
    expect(second.lastFailureClass).toBe('generic_unknown');
    expect(second.lastFailureSource).toBe('install_run');

    const read = readSetupTelemetry('server');
    expect(read.failureCount).toBe(2);
    expect(read.lastFailureClass).toBe('generic_unknown');
  });
});
