# Inventario conservador de imports/exports/módulos dudosos (Fase 1 — Subtarea 1.4)

Fecha: 2026-03-27
Alcance: limpieza mínima de imports claramente no usados, sin tocar lógica de negocio.

## Verificación global de referencias (evidencia)

Comandos usados:
- `rg -n "BussinessSettings|BusinessSettings" app shared tests docs`
- `rg -n "manual-instalacion-multicaja|setup-sistetecni-pos.sql" -g '!node_modules/**'`
- revisión completa de `app/electron/ipc/sales.ipc.ts` para imports no usados.

## 1) Imports no usados (confirmados y limpiados)

### Archivo: `app/electron/ipc/sales.ipc.ts`
- Eliminados por no uso en el cuerpo del módulo:
  - `shell` desde `electron`
  - `fs` desde `node:fs`
  - `path` desde `node:path`
  - `os` desde `node:os`
- Ajuste menor: se consolidó `returnSaleMySql` en el mismo bloque de import de `../db/mysql/sales.mysql`.
- Justificación de seguridad: cambios de sintaxis/imports solamente, sin alterar handlers ni flujo de negocio.

## 2) Exports/módulos dudosos (conservar por ahora)

### `app/renderer/src/pages/BusinessSettings.tsx`
- Estado: export existente sin referencias activas detectadas.
- Decisión: **conservar** por posible uso futuro en UI/flujo de configuración.
- Motivo: sin certeza absoluta de desuso operativo fuera del código (p.ej. ramas paralelas/manual interno).

## 3) Helpers dudosos

- No se eliminaron helpers en esta subtarea por falta de evidencia determinística de desuso global.

## Resultado de la limpieza

- Limpieza aplicada solo en imports confirmados no usados.
- Sin borrado de módulos completos.
- Build y baseline de pruebas ejecutados después del cambio.
