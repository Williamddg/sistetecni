# Fase 8 — Ronda 7: Cash + Inventory (consolidación de servicios y tipado incremental)

## 1) Páginas revisadas

- `Cash`
- `Inventory`

## 2) Diagnóstico y problemas encontrados

- `Cash` mantenía acceso directo a `ipc.cash.*` + `getAuthContext` desde la página.
- `Cash` usaba `any` en estados clave (`open`, `status`, `suggestion`, `user`) y en errores.
- `Inventory` ya usaba `services/products`, pero mantenía `any` en listados/forms/edición y callbacks.
- Contratos de producto en renderer seguían implícitos (sin view-model tipado en servicio).

## 3) Cambios aplicados

- `services/cash.ts` (nuevo)
  - wrapper de dominio para `getOpenCash`, `getCashStatus`, `getOpenSuggestion`, `openCash`, `closeCash`;
  - tipado incremental de resultados/payloads (`CashOpenSession`, `CashStatus`, `OpenSuggestion`, `CashCloseResult`, `OpenCashInput`, `CloseCashInput`);
  - normalización defensiva de shapes sin cambiar contratos runtime.
- `pages/Cash.tsx`
  - reemplazo de acceso directo `ipc.cash.*` por servicio de dominio `services/cash`;
  - reducción de `any` en estado y errores (`unknown` + normalización de mensaje);
  - comportamiento de UI/flujo de apertura-cierre intacto.
- `services/products.ts`
  - tipado incremental y normalización de `listProducts` (`ProductRow[]`),
  - tipado de payload de alta/edición (`ProductUpsertInput`).
- `pages/Inventory.tsx`
  - consumo de tipos de dominio (`ProductRow`, `ProductUpsertInput`),
  - reducción de `any` en items/forms/edición y manejo de errores,
  - se mantiene la misma UX y validaciones funcionales.

## 4) Helpers reutilizables

- En esta ronda **no** se extrajeron helpers globales de formato.
- Motivo: el mayor valor/bajo riesgo estuvo en consolidar acceso API y tipado de dominio en `Cash`/`Inventory`; extraer formatos compartidos se deja para una ronda dedicada para minimizar riesgo de efectos colaterales.

## 5) Alcance y seguridad

- Sin rediseño visual.
- Sin cambios funcionales de POS.
- Sin cambios en contratos IPC/preload/main; solo consolidación y tipado incremental en renderer.

## 6) Pendientes para rondas posteriores

- Evaluar extracción de helpers compartidos de formato (fecha/monto) en páginas administrativas cuando se ataque otro bloque para evitar cambios transversales grandes en una sola ronda.
- Continuar reducción de `any` residual en páginas legacy no cubiertas.
- Profundizar tipado por dominio en `ipcClient` para converger superficies de acceso.
