import { getRendererApi } from './rendererApi';

export type LicenseActivationResult = {
  ok: boolean;
  message?: string;
};

export const isLicenseApiAvailable = (): boolean => {
  const api = getRendererApi();
  return typeof api?.license?.activate === 'function';
};

export const activateLicense = async (licenseKey: string): Promise<LicenseActivationResult> => {
  const api = getRendererApi();

  if (typeof api?.license?.activate !== 'function') {
    return { ok: false, message: 'API de licencia no disponible (preload).' };
  }

  const raw = await api.license.activate(licenseKey);
  const row = (raw as Record<string, unknown> | null | undefined) ?? {};

  return {
    ok: Boolean(row.ok),
    message: typeof row.message === 'string' ? row.message : undefined,
  };
};
