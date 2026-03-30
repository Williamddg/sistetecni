export type InstallerCheckState = 'config_invalid' | 'not_installed' | 'partial' | 'complete';

export type InstallerCheckStatus = {
  state: InstallerCheckState;
  reason?: string;
  missingTables?: string[];
} | null;

export type RendererApi = {
  config: {
    get: () => Promise<unknown>;
    set: (patch: unknown) => Promise<unknown>;
  };
  reports: {
    dailyClose: (payload: unknown) => Promise<unknown>;
  };
  mysql: {
    initSchema: () => Promise<unknown>;
  };
  installer: {
    check: () => Promise<InstallerCheckStatus>;
    testConnection: (cfg: unknown) => Promise<{ ok: boolean; message?: string }>;
    run: (payload: unknown) => Promise<{ ok: boolean; error?: string }>;
  };
  autodetect: {
    status: () => Promise<{ ok: boolean; data?: unknown }>;
  };
  on?: (channel: string, cb: (...args: unknown[]) => void) => (() => void) | void;
};

export const getRendererApi = (): RendererApi => {
  return (window.api ?? {}) as RendererApi;
};
