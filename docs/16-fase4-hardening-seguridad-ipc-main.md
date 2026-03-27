# Fase 4.x — Hardening incremental de seguridad/autorización IPC (Main Process)

## Diagnóstico encontrado

Antes de este hardening, gran parte de la autorización backend dependía de `requirePermissionFromPayload(payload, ...)`, lo que implicaba confianza directa en `role` y `userId` enviados por renderer.

Riesgo principal:

- Spoofing de rol/identidad desde payload manipulados en canales IPC sensibles.

## Estrategia aplicada (incremental, compatible)

1. **Contexto autenticado en Main Process por `webContents`**
   - Al hacer `auth:login`, el Main Process guarda `userId/role` confiables para ese emisor.
   - Se agrega invalidación explícita aditiva por `auth:logout`.
   - Se agrega limpieza automática cuando el `webContents` del emisor se destruye.
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
- `auth:logout` (aditivo, para invalidación explícita de sesión backend)

## Limitaciones restantes (transparentes)

- El contexto vive en memoria del proceso principal (se reinicia al reiniciar la app).
- Este hardening se centra en IPC Main/Renderer; no reemplaza controles OS-level o políticas de distribución.

## Cobertura de pruebas en esta ronda

- Rechazo de no autenticados en handlers sensibles.
- Rechazo de spoofing de `role`/`userId` en payload.
- Verificación de permisos por rol para canales administrativos.
- Protección de identidad en `users:change-password`.
- Bloqueo de re-ejecución de installer sin autenticación cuando la instalación ya existe.
- Logout explícito + bloqueo posterior de IPC sensible.
- Limpieza automática de contexto al destruirse `webContents`.

## Garantías de aislamiento multi-ventana (por sender/webContents)

En la regresión multi-sender se valida explícitamente que:

- Dos ventanas simultáneas mantienen sesiones independientes (roles distintos no se mezclan).
- Una ventana autenticada no autoriza a otra ventana no autenticada.
- `auth:logout` en una ventana invalida solo su contexto local.
- `destroyed` de una ventana limpia solo su contexto, sin tocar otras sesiones activas.
- Re-login en un sender reemplaza únicamente su propio contexto y no contamina el de otros senders.

## Regresión de ruta crítica por rol (ADMIN / SUPERVISOR / SELLER)

Se añadió cobertura de regresión sobre un set mínimo de IPC sensibles para detectar drift de autorización:

- `users:list`, `users:create`
- `config:set`
- `mysql:test`
- `backups:export`
- `sync:status:get`
- `products:list`, `sales:create`, `cash:get-status`

Decisión ante ambigüedad:

- Se respetó la matriz actual de `shared/permissions.ts` sin alterarla.
- En particular, `SUPERVISOR` no tiene permisos de `users:*` ni `config:write`, y los tests fijan ese comportamiento esperado.

## Sub-suite de cierre: payload spoofing vs contexto confiable

Cobertura explícita de mismatch entre payload y sesión confiable en canales críticos:

- `users:create`: bloqueo de elevación de privilegios cuando `payload.role` intenta pasar de `SELLER` a `ADMIN`.
- `config:set`: bloqueo de `payload.userId` falso aunque el sender tenga rol `ADMIN`.
- `cash:get-status`: validación de que la decisión de permiso usa el contexto confiable del sender y no el `role` falsificado en payload.
