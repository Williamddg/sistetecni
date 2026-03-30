# Fase 7 — Subtarea: validación de integración IPC de backups

## Contratos IPC cubiertos

Se validan explícitamente los contratos de retorno observables por renderer en:

- `backup:create-manual`
  - éxito: retorna `string` (path de backup)
  - error: retorna `null`
- `backups:export`
  - éxito: retorna `string` (path exportado)
  - cancelación/no completado: retorna `null`
  - error: retorna `null`
- `backups:restore`
  - éxito: retorna `true`
  - cancelación/no completado: retorna `false`
  - error: retorna `false`

## Alcance de integración validado

Las pruebas verifican que `ipc/backups.ipc.ts` delega correctamente en `services/backups.service.ts` sin alterar:

- shape de retorno,
- convenciones `null`/`false` ante cancelación o error,
- contrato consumido por renderer.

## Límites fuera de esta ronda

Se mantienen fuera de alcance, por ser de otras capas/subtareas:

- UI/UX renderer de backups,
- cambios en API pública preload,
- rediseño de permisos RBAC,
- refactors adicionales fuera de backups IPC.
