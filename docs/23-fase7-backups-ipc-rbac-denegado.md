# Fase 7 — Subtarea: backups IPC bajo RBAC denegado

## Canales cubiertos bajo autorización denegada

- `backup:create-manual`
- `backups:export`
- `backups:restore`

## Comportamiento contractual observado ante denegación

Con contexto autenticado `SELLER` (sin permiso `backup:write`), se mantiene el contrato observable por renderer:

- `backup:create-manual` retorna `null`
- `backups:export` retorna `null`
- `backups:restore` retorna `false`

Además se valida que no se ejecutan operaciones de IO cuando el acceso es denegado.

## Límites de esta ronda

- No se cambia API pública de backups ni preload.
- No se modifica renderer/UX.
- No se altera política RBAC: solo se valida su efecto contractual en estos canales.
