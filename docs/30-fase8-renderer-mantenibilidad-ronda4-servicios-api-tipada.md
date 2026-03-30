# Fase 8 — Ronda 4: consolidación de servicios y acceso tipado API/preload por dominio

## 1) Diagnóstico de deuda residual (renderer/services/API access)

Se auditó el renderer con foco en servicios y acceso a API/preload. Se identificó deuda residual en:

- acceso directo a `window.api` en servicios/páginas, coexistiendo con wrappers (`ipc`, `rendererApi`),
- contratos de dominio repetidos (por ejemplo configuración DB/MySQL) en páginas y servicios,
- uso de `any` en shapes de respuestas de API para dominios aún no tipados,
- inconsistencia en el punto de entrada para llamadas por dominio (algunas vía `ipc`, otras vía `window.api`).

## 2) Problemas priorizados en esta ronda

1. Consolidar acceso a `config` bajo servicio dedicado en lugar de llamadas directas a `window.api.config`.
2. Consolidar llamada `reports.dailyClose` bajo acceso tipado del wrapper `rendererApi`.
3. Endurecer tipos base de `rendererApi` (evitar `any` en callback/event/data cuando el contrato no exige `any`).

## 3) Cambios aplicados

- `services/rendererApi.ts`
  - se amplió `RendererApi` con dominios `config`, `reports.dailyClose` y `mysql.initSchema` para reflejar acceso por dominio desde un punto tipado,
  - se reemplazó `any` por `unknown` en `autodetect.status().data` y callbacks de `on`.
- `services/config.ts`
  - ahora usa `getRendererApi()` en lugar de acceso directo a `window.api`,
  - se tipó `mysql` con `MySqlConfig` (antes `any`) para reducir deuda de contratos de configuración en renderer.
- `services/reports.ts`
  - `reportDailyClose` ahora usa `getRendererApi().reports.dailyClose(...)` en vez de `window.api` directo.
- `pages/BusinessSettings.tsx`
  - reemplazo de acceso directo a `window.api.config.get/set` por `getConfig`/`setConfig` del servicio de dominio.

## 4) Alcance y seguridad

- Sin cambios de UX ni de contratos runtime IPC/preload/main.
- Cambios acotados al renderer (servicios y consumo en una página), priorizando bajo riesgo e incrementalidad.

## 5) Pendientes para rondas posteriores

- Unificar más páginas con acceso directo a `window.api` (`Settings`, `ChangePassword`, `Activate`, etc.) bajo servicios de dominio.
- Seguir reduciendo `any` residuales en páginas legacy (`Cash`, `Expenses`, `Inventory`, `Users`, etc.).
- Evaluar tipado incremental por dominio en `ipcClient` más allá de `cashdrawer`, para alinear todos los entrypoints de API renderer.
- Revisar posibles duplicidades de tipos de configuración entre páginas (por ejemplo `Settings`) y `services/config.ts`.
