import {
  mapConnectionFailureToGuidance,
  mapInstallerStatusToGuidance,
} from '../app/renderer/src/services/setupRecovery';

describe('setup recovery guidance mapping', () => {
  test('maps timeout/host unreachable errors to actionable network guidance', () => {
    const out = mapConnectionFailureToGuidance('connect ETIMEDOUT 192.168.1.10:3306');
    expect(out.title).toContain('No se pudo alcanzar el servidor');
    expect(out.action).toContain('host/IP');
  });

  test('maps invalid credentials and unknown database to specific guidance', () => {
    const invalidCreds = mapConnectionFailureToGuidance('ER_ACCESS_DENIED_ERROR: Access denied');
    expect(invalidCreds.title).toContain('Credenciales MySQL inválidas');

    const unknownDb = mapConnectionFailureToGuidance('ER_BAD_DB_ERROR: Unknown database');
    expect(unknownDb.title).toContain('base de datos no existe');
  });

  test('maps partial/config_invalid installer states preserving missing table context', () => {
    const partial = mapInstallerStatusToGuidance({
      state: 'partial',
      reason: 'Esquema MySQL parcial',
      missingTables: ['sale_items', 'expenses'],
    });
    expect(partial?.title).toContain('parcial');
    expect(partial?.action).toContain('sale_items');

    const invalid = mapInstallerStatusToGuidance({
      state: 'config_invalid',
      reason: 'Sin configuración MySQL',
    });
    expect(invalid?.title).toContain('incompleta');
  });
});
