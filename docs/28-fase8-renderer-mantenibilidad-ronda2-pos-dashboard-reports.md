# Fase 8 — Ronda 2 (POS, Dashboard, Reports): tipado incremental y adaptadores

## Páginas auditadas

- `pages/POS.tsx`
- `pages/Dashboard.tsx`
- `pages/Reports.tsx`

## Problemas encontrados

- Alta densidad de `any` en estados y mapeos de datos para gráficos/listados.
- Adaptadores implícitos de payload (rows/data/result/items) repetidos y mezclados dentro de la UI.
- View-models no tipados para filas de reportes y entidades usadas por POS (ventas suspendidas/recientes, cajón, detalle de venta).

## Cambios aplicados (bajo riesgo)

- Se introdujo `services/reportAdapters.ts` como capa reusable para normalizar payloads y tipar:
  - series de ventas por día,
  - top productos,
  - resumen de reportes,
  - resumen de dashboard,
  - estado de caja.
- `Dashboard.tsx` migra a tipos explícitos (`TodayDashboardSummary`, `CashStatusSummary`, `SalesByDayPoint`) y elimina adaptadores locales repetidos.
- `Reports.tsx` migra a tipos explícitos (`ReportSummary`, `SalesByDayPoint`, `TopProductPoint`) y consume adaptadores centralizados.
- `POS.tsx` incorpora tipos explícitos de mayor valor para estados/listados críticos (productos POS, puertos/impresoras de cajón, ventas suspendidas/recientes, detalle de venta) y helpers de normalización simples para arrays.

## Pendientes para rondas posteriores

- Reducir `any` restante en `POS.tsx` (errores catch y payloads complejos de impresión/devolución).
- Extraer adaptadores de detalle de venta/suspendidas a servicio dedicado de dominio POS.
- Tipar `ipcClient` por dominio para minimizar casts en páginas.
