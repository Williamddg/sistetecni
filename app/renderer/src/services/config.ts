import { getRendererApi } from './rendererApi';

export type BusinessConfig = {
  name?: string;
  logoDataUrl?: string;
  nit?: string;
  phone?: string;
};

export type MySqlConfig = {
  host?: string;
  user?: string;
  password?: string;
  database?: string;
  port?: number;
};

export type BusinessProfileConfig = {
  businessName?: string;
  businessTagline?: string;
  logoDataUrl?: string;
  nit?: string;
  phone?: string;
};

export type AppConfig = {
  dbMode?: 'sqlite' | 'mysql';
  mysql?: MySqlConfig;
  business?: BusinessConfig;
  businessProfile?: BusinessProfileConfig;
};

export const getConfig = async (): Promise<AppConfig> => {
  const api = getRendererApi();
  return (await api.config.get()) as AppConfig;
};

export const setConfig = async (patch: Partial<AppConfig>) => {
  const api = getRendererApi();
  return await api.config.set(patch);
};
