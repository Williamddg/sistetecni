export type SetupFailureClass =
  | 'network_unreachable'
  | 'invalid_credentials'
  | 'unknown_database'
  | 'generic_unknown';

export type SetupFailureSource = 'test_connection' | 'install_run';

export type SetupTelemetrySnapshot = {
  failureCount: number;
  lastFailureAt: string | null;
  lastFailureClass: SetupFailureClass | null;
  lastFailureSource: SetupFailureSource | null;
  lastMode: 'cashier' | 'server';
  lastMessage: string | null;
};

const KEY = 'setup.telemetry.v1';

const defaultSnapshot = (mode: 'cashier' | 'server'): SetupTelemetrySnapshot => ({
  failureCount: 0,
  lastFailureAt: null,
  lastFailureClass: null,
  lastFailureSource: null,
  lastMode: mode,
  lastMessage: null,
});

export const readSetupTelemetry = (mode: 'cashier' | 'server'): SetupTelemetrySnapshot => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSnapshot(mode);
    const parsed = JSON.parse(raw) as Partial<SetupTelemetrySnapshot>;
    return {
      failureCount: Number(parsed.failureCount ?? 0),
      lastFailureAt: parsed.lastFailureAt ?? null,
      lastFailureClass: (parsed.lastFailureClass as SetupFailureClass) ?? null,
      lastFailureSource: (parsed.lastFailureSource as SetupFailureSource) ?? null,
      lastMode: (parsed.lastMode as 'cashier' | 'server') ?? mode,
      lastMessage: parsed.lastMessage ?? null,
    };
  } catch {
    return defaultSnapshot(mode);
  }
};

export const recordSetupFailure = (
  mode: 'cashier' | 'server',
  source: SetupFailureSource,
  failureClass: SetupFailureClass,
  message: string,
): SetupTelemetrySnapshot => {
  const current = readSetupTelemetry(mode);
  const next: SetupTelemetrySnapshot = {
    failureCount: current.failureCount + 1,
    lastFailureAt: new Date().toISOString(),
    lastFailureClass: failureClass,
    lastFailureSource: source,
    lastMode: mode,
    lastMessage: String(message ?? '').slice(0, 300),
  };

  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // best effort; no bloquear setup
  }

  return next;
};
