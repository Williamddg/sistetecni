export type InstallerState = 'config_invalid' | 'not_installed' | 'partial' | 'complete';

export type InstallerStatusLike = {
  state?: InstallerState;
  reason?: string;
  missingTables?: string[];
} | null;

export type SetupGuidance = {
  title: string;
  action: string;
};

const normalize = (v: unknown): string => String(v ?? '').toLowerCase();

export const mapConnectionFailureToGuidance = (input: unknown): SetupGuidance => {
  const msg = normalize(input);

  if (/(etimedout|timeout|ehostunreach|enotfound|econnrefused|can't connect|cannot connect)/.test(msg)) {
    return {
      title: 'No se pudo alcanzar el servidor MySQL.',
      action: 'Verifica host/IP, puerto, red y firewall; luego reintenta la conexión.',
    };
  }

  if (/(access denied|er_access_denied_error|authentication|auth failed)/.test(msg)) {
    return {
      title: 'Credenciales MySQL inválidas.',
      action: 'Corrige usuario/contraseña y vuelve a probar conexión.',
    };
  }

  if (/(unknown database|er_bad_db_error)/.test(msg)) {
    return {
      title: 'La base de datos no existe todavía.',
      action: 'Puedes continuar: el instalador intentará crearla automáticamente.',
    };
  }

  return {
    title: 'No se pudo validar la conexión MySQL.',
    action: 'Revisa los datos ingresados y vuelve a intentarlo.',
  };
};

export const mapInstallerStatusToGuidance = (status: InstallerStatusLike): SetupGuidance | null => {
  if (!status?.state) return null;

  if (status.state === 'partial') {
    const tables = status.missingTables?.length ? `Tablas faltantes: ${status.missingTables.join(', ')}.` : '';
    return {
      title: 'Instalación MySQL parcial detectada.',
      action: `${status.reason ?? 'Completa el setup para recuperar el esquema.'} ${tables}`.trim(),
    };
  }

  if (status.state === 'config_invalid') {
    return {
      title: 'Configuración MySQL incompleta o inválida.',
      action: `${status.reason ?? 'Ingresa host, usuario y base válidos.'}`.trim(),
    };
  }

  if (status.state === 'not_installed') {
    return {
      title: 'No se detectó instalación completa.',
      action: `${status.reason ?? 'Completa el asistente para crear esquema y usuario inicial.'}`.trim(),
    };
  }

  return null;
};
