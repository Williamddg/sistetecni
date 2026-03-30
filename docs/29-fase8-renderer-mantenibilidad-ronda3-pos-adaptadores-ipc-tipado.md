# Fase 8 — Ronda 3 (POS): adaptadores de dominio + tipado incremental IPC cliente

## Diagnóstico del dominio POS revisado

Se observó que, pese a la mejora de Ronda 2, el dominio POS mantenía:

- adaptadores de dominio aún inline en la página,
- shapes implícitos para detalle/suspendidas/recientes,
- tipado parcial del acceso `ipc.cashdrawer` en cliente,
- casts residuales en servicios de dominio (`sales.returnSale`).

## Problemas priorizados

1. Mover adaptadores de dominio POS fuera de la UI para reutilización.
2. Tipar incrementalmente acceso cliente IPC por dominio sin cambiar contratos runtime.
3. Reducir casts/`any` residuales de mayor valor en POS y servicios asociados.

## Cambios aplicados en esta ronda

- Se creó `services/posAdapters.ts` con tipos y adaptadores de dominio POS para:
  - productos POS,
  - puertos/impresoras y resultado de apertura de cajón,
  - filas de ventas suspendidas/recientes,
  - detalle de venta y detalle de suspendida,
  - payload tipado de devolución.
- `POS.tsx` ahora consume adaptadores desde módulo dedicado (`toPosProducts`, `toPosProduct`, `toSuspendedRows`, `toRecentRows`, `toSaleDetail`, `toSuspendedSaleDetail`, `toDrawerPorts`, `toDrawerPrinters`) y elimina adaptadores inline.
- `ipcClient.ts` aplica tipado incremental en dominio `cashdrawer` (payload/resultados/listados tipados).
- `services/sales.ts` tipa `returnSale` con `ReturnSalePayload`.

## Pendientes para rondas posteriores

- Reducir `any` residual en manejo de errores (`catch`) y algunos payloads de impresión.
- Extender tipado por dominio en `ipcClient` más allá de `cashdrawer` (sales/reports/products).
- Extraer mapeos de impresión/devolución a adaptadores aún más específicos si crece complejidad.
