# Fase 8 — Renderer más mantenible (Ronda 1, incremental)

## Diagnóstico del estado actual

Se encontró un renderer funcional pero con deuda de mantenibilidad en estos puntos:

- `App.tsx` concentraba lógica de arranque/installer/sesión + render condicional de múltiples estados.
- Uso repetido de `(window as any).api` en capas de UI (`App.tsx`, `SetupWizard.tsx`), lo que dispersa contratos y reduce legibilidad.
- Tipado laxo (`any`) en piezas estructurales del flujo de sesión/routing (`App.tsx`, `routes.tsx`, `Login.tsx`, `ChangePassword.tsx`).
- Duplicación de tipos de usuario entre servicios y páginas.

## Problemas priorizados (bajo riesgo / alto valor)

1. Reducir `any` en flujo crítico de sesión y routing.
2. Centralizar acceso a API preload para evitar repetición de casts `window as any`.
3. Mejorar legibilidad de `App.tsx` sin alterar comportamiento.

## Cambios aplicados en esta ronda

- Se tipó el flujo de sesión en renderer con `SessionUser` e `InstallerAutoConfig`.
- Se creó `services/rendererApi.ts` para acceso centralizado a API preload en casos de arranque/setup.
- `App.tsx` migra a tipos explícitos y extrae la pantalla de arranque a `ui/AppBootScreen.tsx` (sin cambios visuales/funcionales).
- `SetupWizard.tsx` usa `getRendererApi()` en vez de repetir `(window as any).api` en múltiples puntos.
- `routes.tsx`, `Login.tsx`, `ChangePassword.tsx`, `services/auth.ts`, `services/session.ts` ahora usan tipo compartido de sesión.

## Qué quedó para rondas posteriores

- Tipado progresivo de páginas con mayor densidad de `any` (`POS`, `Dashboard`, `Reports`, `Inventory`, `Cash`).
- Normalización de helpers dispersos por página (formato fecha/monto y adaptadores de payload).
- Fortalecer tipado de `ipcClient` por dominio para reducir casts en consumo.
