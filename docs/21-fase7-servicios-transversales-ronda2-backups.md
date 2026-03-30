# Fase 7 — Servicios transversales (Ronda 2): Backups/Restore

## Diagnóstico del flujo actual (antes de esta subtarea)

El flujo de backups/restore estaba parcialmente centralizado y parcialmente duplicado:

- `ipc/backups.ipc.ts` definía lógica propia para:
  - nombre de backup (`backupName`),
  - resolución del directorio (`getBackupsDir`),
  - poda de backups (`pruneBackups`),
  - export/restore con `fs.copyFileSync`.
- `ipc/cash.ipc.ts` dependía de `createBackup` exportado desde `ipc/backups.ipc.ts` para cierre de caja.
- Ya existía `services/storagePaths.service.ts` para rutas bajo `userData`, pero el flujo de backups seguía con responsabilidades mezcladas entre IPC e infraestructura de archivos.

## Inconsistencias encontradas

1. **Duplicación de reglas de naming y retención** dentro de `ipc/backups.ipc.ts`.
2. **Responsabilidad mezclada**: handlers IPC con lógica de negocio + IO de filesystem.
3. **Manejo de errores no homogéneo** entre operaciones de backup, export y restore.
4. **Baja testabilidad del núcleo de IO** al estar acoplado directamente a handlers IPC.

## Alcance aplicado en esta ronda

Se unificó de forma incremental y segura la capa transversal de IO en `services/backups.service.ts`:

- generación de nombre de backup (`buildBackupFileName`),
- resolución de carpeta `backups` bajo `userData` (`getBackupsDir`),
- poda de retención (`pruneBackups`),
- operación snapshot (`createBackupSnapshot`),
- validación/creación diaria (`ensureDailyBackupSnapshot`),
- export (`exportCurrentDatabaseTo`),
- restore (`restoreCurrentDatabaseFrom`).

`ipc/backups.ipc.ts` ahora actúa como orquestador de permisos/auditoría/diálogos y delega IO al servicio.

## Qué sigue disperso (intencionalmente, por riesgo/al alcance)

Se mantiene fuera del servicio, por seguridad de alcance y para no romper contratos:

- validación RBAC basada en `event`/payload,
- auditoría (`logAuditRepo`) y `fallbackControl`,
- interacción de UI nativa (`dialog.showOpenDialog`),
- formas de retorno IPC (`null`/`false`) esperadas por renderer.

Con esto se evita rediseñar UX o contratos IPC en esta ronda.

## Validación objetivo de la ronda

- tests específicos del servicio de backups/restore,
- suite completa de tests en modo serial,
- build completo del proyecto.
