import { isMySqlEnabledResolved, resolveEffectiveDbMode } from './databaseModeResolver';

export const isMySqlEnabled = async (): Promise<boolean> => {
  return await isMySqlEnabledResolved();
};

export const getDbMode = async (): Promise<'mysql' | 'sqlite'> => {
  return await resolveEffectiveDbMode();
};
