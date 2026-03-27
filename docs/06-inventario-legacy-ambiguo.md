# Inventario de legacy ambiguo (Fase 1 — Subtarea 1.3)

Fecha: 2026-03-27
Objetivo: clasificar elementos ambiguos con enfoque conservador, sin tocar lógica de negocio.

## 1) Eliminar

En esta subtarea **no se elimina código ambiguo** adicional para minimizar riesgo funcional.

## 2) Mover / Reubicar / Renombrar

### `app/renderer/src/pages/BussinessSettings.tsx` → `app/renderer/src/pages/BusinessSettings.tsx`
- Motivo: normalización de nombre mal escrito (`Bussiness` → `Business`).
- Verificación: no hay imports/referencias activas al archivo con nombre anterior.
- Riesgo: bajo; no modifica contenido ni contratos públicos.

## 3) Conservar

### `docs/operations/manual-instalacion-multicaja.txt`
- Motivo: documento operativo legacy aún útil para despliegues multicaja en campo.
- Acción: conservar sin reescritura profunda en esta fase.

### `docs/sql/setup-sistetecni-pos.sql`
- Motivo: script operativo de soporte para setup manual MySQL.
- Acción: conservar.

### `database/schema.sql`, `database/seed.sql`
- Motivo: archivos base del proyecto; impacto potencial alto si se toca en limpieza.
- Acción: conservar.

### `docs/01-requerimientos.md` … `docs/05-plan-pruebas.md`
- Motivo: documentación de proyecto con valor histórico/técnico.
- Acción: conservar por ahora; normalización editorial se difiere a fase de documentación.

## Notas
- Esta subtarea prioriza orden y trazabilidad sobre limpieza agresiva.
- No se alteraron rutas de runtime, scripts de build ni tests.
