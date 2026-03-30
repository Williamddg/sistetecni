export type InstallerCheckState = 'config_invalid' | 'not_installed' | 'partial' | 'complete';

export type InstallerCheckStatus = {
  state: InstallerCheckState;
  reason?: string;
  missingTables?: string[];
} | null;

export type RendererApi = {
  installer: {
    check: () => Promise<InstallerCheckStatus>;
    testConnection: (cfg: unknown) => Promise<{ ok: boolean; message?: string }>;
    run: (payload: unknown) => Promise<{ ok: boolean; error?: string }>;
  };
  autodetect: {
    status: () => Promise<{ ok: boolean; data?: any }>;
  };
  on?: (channel: string, cb: (...args: any[]) => void) => (() => void) | void;
};

export const getRendererApi = (): RendererApi => {
  return (window.api ?? {}) as RendererApi;
};
