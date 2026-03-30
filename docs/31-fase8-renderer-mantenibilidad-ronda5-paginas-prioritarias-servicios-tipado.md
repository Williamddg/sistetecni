# Fase 8 — Ronda 5: unificación de accesos directos de páginas prioritarias + tipado incremental API

## 1) Páginas revisadas y diagnóstico

Se revisaron las páginas prioritarias solicitadas:

- `Settings`
- `ChangePassword`
- `Activate`

Hallazgos principales:

- accesos directos residuales a `window.api` en las 3 páginas,
- duplicidad de contratos de configuración (`AppConfig`) en `Settings` frente al servicio de dominio,
- uso de `any`/casts de error en `catch` y acceso API,
- falta de servicio de dominio explícito para licencia y cambio de contraseña propio.

## 2) Problemas priorizados

1. Consolidar `Settings` para usar servicios de dominio (`config`) y wrapper tipado (`rendererApi.mysql`).
2. Consolidar `ChangePassword` detrás de servicio de dominio de usuarios.
3. Consolidar `Activate` detrás de un servicio de licencia, removiendo acceso directo a `window`.
4. Aplicar tipado incremental en acceso API (`rendererApi` + payloads de servicio) sin tocar contratos runtime.

## 3) Cambios aplicados

- `pages/Settings.tsx`
  - reemplazo de `window.api.config.get/set` por `getConfig`/`setConfig` de `services/config`,
  - reemplazo de `window.api.mysql.initSchema` por `getRendererApi().mysql.initSchema()`,
  - eliminación de declaración global local de `window.api` y reducción de `any` en manejo de errores.
- `pages/ChangePassword.tsx`
  - reemplazo de `window.api.users.changePassword` por servicio `changeOwnPassword` en `services/users`,
  - tipado más seguro de errores con `unknown`.
- `pages/Activate.tsx`
  - reemplazo de acceso directo `(window as any).api` por servicio `services/license`,
  - se conserva validación de disponibilidad de API (`isLicenseApiAvailable`) y contrato de activación (`ok/message`) sin cambiar UX.
- `services/users.ts`
  - nuevo helper `changeOwnPassword` con payload de dominio tipado.
- `services/rendererApi.ts`
  - tipado incremental para dominios `users` y `license`.
- `services/license.ts`
  - nuevo servicio de dominio para activación de licencia y chequeo de disponibilidad de API.

## 4) Alcance y seguridad

- Sin rediseño de UI ni cambios visuales.
- Sin cambios de contrato IPC/preload/main: se consumen los mismos métodos runtime existentes.
- Sin cambios funcionales de POS.

## 5) Pendientes para próximas rondas

- Seguir migrando páginas legacy con `window.api` directo (`Settings` quedó consolidada en lo principal; revisar `initSchema` en un servicio de configuración más dedicado si se desea mayor pureza de dominio).
- Reducir `any` residual en páginas con deuda mayor (`Cash`, `Inventory`, `Users`, `Expenses`, `Audit`).
- Tipar incrementalmente más dominios en `ipcClient`/`rendererApi` para evitar duplicidades entre wrappers.
