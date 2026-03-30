# Fase 7 — Servicios transversales consistentes (Ronda 1, incremental)

Fecha: 2026-03-29.

## Diagnóstico del estado actual

Servicios auditados en esta ronda:

- Auditoría (`audit.repo.ts`, `audit.ipc.ts`)
- Configuración (`config.ipc.ts`)
- Backups/restore (`backups.ipc.ts`)
- Invoice/print (`invoicePdf.ts`, `sales.service.ts`)
- Devices/cashdrawer (`cashdrawer.ipc.ts`)

Hallazgos transversales:

1. Patrón de rutas `app.getPath('userData') + mkdirSync` repetido en varios módulos (`config`, `backups`, `invoice`), sin punto único.
2. El acceso a paths locales estaba funcional, pero no centralizado para mantenimiento y hardening uniforme.
3. La capa de auditoría y fallback ya venía bastante unificada por repo (no priorizada para cambio en esta ronda por riesgo/beneficio).
4. Print/invoice y cashdrawer tienen complejidad operativa mayor; se documentan para rondas siguientes, no se tocan de forma amplia aquí.

## Inconsistencias priorizadas (alto valor / bajo riesgo)

Se priorizó una inconsistencia de bajo riesgo y alto valor de mantenimiento:

- **Centralizar resolución de paths de almacenamiento local en Main process**
  - evitando utilidades duplicadas por módulo,
  - reduciendo riesgo de drift en futuras mejoras.

## Cambios aplicados en esta ronda

1. Nuevo servicio transversal `storagePaths.service.ts` con helpers:
   - `getUserDataPath()`
   - `getUserDataFilePath(fileName)`
   - `ensureUserDataSubdir(dirName)`

2. Refactor incremental sin cambio funcional observable en:
   - `config.ipc.ts` (ruta de `config.json`)
   - `backups.ipc.ts` (carpeta `backups/`)
   - `invoicePdf.ts` (carpeta `invoices/`)

3. Test dedicado del servicio transversal de paths.

## Límites de la ronda

- No se unifica todavía toda la capa de backup/restore en un service único.
- No se rediseña flujo invoice/print.
- No se altera comportamiento de cashdrawer ni rutas de devices.
- No se cambian contratos IPC/renderer.

## Resultado

Se deja una base transversal común para acceso a almacenamiento local en `userData`, lista para extender en rondas posteriores sin introducir cambios de comportamiento del POS.
