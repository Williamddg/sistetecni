# Fase 6 — Installer/Setup/Autodetect robustos (primer arranque)

Fecha: 2026-03-28.

## Diagnóstico del estado actual

Componentes auditados:
- `ipc/installer.ipc.ts`
- `db/mysql.autodetect.ts`
- `db/dbInstaller.ts`
- `db/mysql/initSchema.mysql.ts`
- `ipc/mysql.ipc.ts`
- `renderer/SetupWizard.tsx` + `App.tsx`

Hallazgos clave:

1. `checkDbInstalled` consideraba “instalado” con criterio débil (`users` solamente).
2. Había caminos paralelos de inicialización de esquema (`runInstaller` creando sólo `users` vs `initMySqlSchema` creando esquema amplio), dejando riesgo de instalación parcial.
3. En modo cajero, el payload `isCashier` llegaba desde UI pero no se respetaba en `runInstaller`.
4. En `installer:run`, si la instalación fallaba, la config recién escrita podía quedar persistida y dejar estado ambiguo.
5. Autodetect marcaba `ready` ante config existente sin validar conectividad/esquema.

## Cambios aplicados (incrementales y seguros)

### 1) Estado de instalación más confiable

`checkDbInstalled` ahora clasifica estados:
- `config_invalid`
- `not_installed`
- `partial`
- `complete`

Y valida un set mínimo de tablas core:
`users`, `products`, `sales`, `sale_items`, `expenses`, `audit_logs`, `cash_closures`.

### 2) Unificación parcial segura de init schema

`runInstaller` ahora invoca `initMySqlSchema({ skipDefaultAdminSeed: true })` para usar el camino común de creación de esquema y evitar divergencia.

### 3) Respeto de modo cajero en installer

`runInstaller` soporta `isCashier` y en ese modo omite creación de admin local.

### 4) Rollback de config al fallar instalación

`installer:run` guarda config previa y, si `runInstaller` falla, restaura la configuración anterior para evitar “config existente pero inválida por fallo intermedio”.

### 5) Autodetect más robusto ante config existente

Con config existente, autodetect ahora:
1. prueba conexión,
2. verifica estado de instalación (`complete` vs `partial/not_installed`),
3. sólo devuelve `ready` si realmente está completo.

Si conecta pero está parcial, devuelve `server_auto` con `dbInstalled: false` para guiar al setup.

## Flujo real de primer arranque (actualizado)

1. App llama `autodetect:status`.
2. Sin config válida:
   - Windows: evalúa señales NSIS (`cashier` / `server_auto` / `manual`).
   - no-Windows: `manual`.
3. Con config existente:
   - si no conecta: `manual`.
   - si conecta y esquema completo: `ready`.
   - si conecta y esquema parcial: `server_auto` + `dbInstalled:false`.
4. Setup wizard usa `installer:run` y progreso IPC.
5. Si falla instalación, se revierte config previa.

## Limitaciones conocidas

- No se rediseña UX del wizard (fuera de alcance).
- No se cambia packaging/firma/notarización.
- La validación de esquema “completo” usa tablas core mínimas, no todas las auxiliares opcionales.

## Resultado de esta subtarea

Se reduce de forma material la ambigüedad de estados de instalación y se fortalece el primer arranque con cambios compatibles y de bajo riesgo.

---

## Ronda incremental: recuperación de estados parciales (sin rediseño UX)

### Estados soportados en setup (primer arranque)

- `config_invalid`: se muestra aviso para corregir host/usuario/DB antes de reintentar.
- `not_installed`: se informa que no hay instalación completa y se continúa wizard normal.
- `partial`: se muestra aviso explícito de recuperación (incluyendo tablas faltantes cuando están disponibles).
- `complete`: se evita entrar en setup y se continúa a flujo normal.

### Cambios de flujo aplicados

1. `App.tsx` consulta `installer:check` como apoyo al autodetect cuando corresponde y evita estado ambiguo si el check ya reporta `complete`.
2. `SetupWizard` recibe `initialStatus` y muestra un mensaje contextual no invasivo (sin rediseño visual mayor).
3. Se mantiene compatibilidad SQLite/MySQL: la ronda sólo reduce ambigüedad de arranque y recuperación, sin abrir una reimplementación amplia de coexistencia.

### Límites de esta ronda

- No se reescribe la UX del wizard.
- No se introduce un asistente nuevo de migración entre SQLite↔MySQL.
- No se cambia packaging ni fases externas.

## Ronda incremental: reintento guiado (errores comunes)

Errores comunes cubiertos en mapeo de guía:

1. Timeout / host inaccesible (`ETIMEDOUT`, `ECONNREFUSED`, `ENOTFOUND`, `EHOSTUNREACH`).
2. Credenciales inválidas (`ER_ACCESS_DENIED_ERROR`, `Access denied`).
3. Base inexistente (`ER_BAD_DB_ERROR`, `Unknown database`).
4. Estado `partial` (con tablas faltantes cuando existen en `installer:check`).
5. Estado `config_invalid`.

Mensajes/acciones:

- Se muestran recomendaciones accionables para red/host, credenciales y creación de DB.
- Tras fallo de test de conexión o instalación, el setup refresca `installer:check` para conservar el último contexto de recuperación y no dejar al usuario “a ciegas”.

Límites:

- Si el error no coincide con patrón confiable, se usa fallback genérico controlado.
- No hay rediseño visual mayor del wizard; sólo avisos contextuales adicionales.

## Ronda incremental final: telemetría local mínima + copy contextual

Telemetría mínima guardada localmente (`localStorage`, clave `setup.telemetry.v1`):

- `failureCount`
- `lastFailureAt`
- `lastFailureClass`
- `lastFailureSource`
- `lastMode` (`cashier`/`server`)
- `lastMessage` (truncado)

Uso en soporte local:

- Permite saber cuántos intentos fallidos recientes tuvo el equipo y cuál fue el último error clasificado.
- Se muestra en el setup como pista breve para soporte (“Intentos fallidos recientes…”), sin analytics remotos.

Copy/contexto adicional:

- En modo `cashier`, la guía enfatiza validar conectividad con servidor e intervención de administrador.
- En modo `server`, la guía enfatiza credenciales/permisos MySQL y creación de esquema.

Límite explícito:

- No se envía telemetría fuera del equipo.
- No se implementa observabilidad pesada; sólo ayuda operativa local para primer arranque/setup.
