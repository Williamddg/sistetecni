import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { testMySqlConnection } from './mysql';

export type EffectiveDbMode = 'sqlite' | 'mysql';

export type DatabaseModeResolution =
  | 'sqlite_local'
  | 'mysql_primary'
  | 'mysql_unavailable_fallback_sqlite';

type AppConfig = {
  dbMode?: 'sqlite' | 'mysql' | 'SQLITE' | 'MYSQL';
  mysql?: {
    host?: string;
    user?: string;
    password?: string;
    database?: string;
    port?: number;
  };
};

const MODE_TTL_MS = 3000;

let cachedResolution: DatabaseModeResolution = 'sqlite_local';
let lastModeCheckAt = 0;

const getConfigPath = (): string => path.join(app.getPath('userData'), 'config.json');

const readAppConfig = (): AppConfig | null => {
  try {
    const p = getConfigPath();
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as AppConfig;
  } catch {
    return null;
  }
};

const wantsMySql = (dbMode: AppConfig['dbMode'] | undefined): boolean => {
  return String(dbMode ?? 'sqlite').toLowerCase() === 'mysql';
};

const hasCompleteMySqlConfig = (cfg: AppConfig['mysql'] | undefined): cfg is NonNullable<AppConfig['mysql']> => {
  return !!(
    cfg &&
    String(cfg.host ?? '').trim() &&
    String(cfg.user ?? '').trim() &&
    String(cfg.password ?? '').trim() &&
    String(cfg.database ?? '').trim()
  );
};

export const resolveDatabaseMode = async (): Promise<DatabaseModeResolution> => {
  const now = Date.now();
  if (now - lastModeCheckAt < MODE_TTL_MS) return cachedResolution;

  lastModeCheckAt = now;
  const cfg = readAppConfig();

  if (!wantsMySql(cfg?.dbMode)) {
    cachedResolution = 'sqlite_local';
    return cachedResolution;
  }

  if (!hasCompleteMySqlConfig(cfg?.mysql)) {
    cachedResolution = 'mysql_unavailable_fallback_sqlite';
    return cachedResolution;
  }

  const tested = await testMySqlConnection({
    host: cfg.mysql.host as string,
    user: cfg.mysql.user as string,
    password: cfg.mysql.password as string,
    database: cfg.mysql.database as string,
    port: Number(cfg.mysql.port ?? 3306),
  });

  cachedResolution = tested.ok ? 'mysql_primary' : 'mysql_unavailable_fallback_sqlite';
  return cachedResolution;
};

export const resolveEffectiveDbMode = async (): Promise<EffectiveDbMode> => {
  const resolution = await resolveDatabaseMode();
  return resolution === 'mysql_primary' ? 'mysql' : 'sqlite';
};

export const isMySqlEnabledResolved = async (): Promise<boolean> => {
  return (await resolveEffectiveDbMode()) === 'mysql';
};

export const resetDatabaseModeResolverCache = (): void => {
  cachedResolution = 'sqlite_local';
  lastModeCheckAt = 0;
};
