# Fase 4.x — Hardening incremental de seguridad/autorización IPC (Main Process)

## Diagnóstico encontrado

Antes de este hardening, gran parte de la autorización backend dependía de `requirePermissionFromPayload(payload, ...)`, lo que implicaba confianza directa en `role` y `userId` enviados por renderer.

Riesgo principal:

- Spoofing de rol/identidad desde payload manipulados en canales IPC sensibles.

## Estrategia aplicada (incremental, compatible)

1. **Contexto autenticado en Main Process por `webContents`**
   - Al hacer `auth:login`, el Main Process guarda `userId/role` confiables para ese emisor.
2. **RBAC basado en contexto confiable**
   - `requirePermissionFromPayload(event, payload, permission)` ahora exige sesión autenticada del emisor.
   - Si payload trae `role`/`userId`, deben coincidir con el contexto confiable (anti-spoofing).
3. **Guardas adicionales en handlers sensibles**
   - Se aplican permisos server-side en `config`, `mysql`, `sync admin`, `users`, `backups`.
4. **Installer endurecido sin romper setup inicial**
   - Si hay sesión autenticada, exige permisos administrativos.
   - Si no hay sesión, solo permite `installer:run` cuando la BD aún no está instalada (primera instalación).

## Handlers endurecidos en esta subtarea

- `config:set`
- `mysql:config:get`
- `mysql:config:set`
- `mysql:config:clear`
- `mysql:test`
- `mysql:init-schema`
- `backup:create-manual`
- `backups:export`
- `backups:restore`
- `users:*` (incluyendo protección de identidad en `users:change-password`)
- `sync:status:get`
- `sync:run-manual`
- `installer:run`

## Limitaciones restantes (transparentes)

- No hay canal de logout explícito para limpiar contexto por sesión (se puede agregar en siguiente ronda sin romper contratos actuales).
- El contexto vive en memoria del proceso principal (se reinicia al reiniciar la app).
- Este hardening se centra en IPC Main/Renderer; no reemplaza controles OS-level o políticas de distribución.

## Cobertura de pruebas en esta ronda

- Rechazo de no autenticados en handlers sensibles.
- Rechazo de spoofing de `role`/`userId` en payload.
- Verificación de permisos por rol para canales administrativos.
- Protección de identidad en `users:change-password`.
- Bloqueo de re-ejecución de installer sin autenticación cuando la instalación ya existe.
