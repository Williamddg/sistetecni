# Índice de documentación (operativa y técnica)

Este índice organiza la documentación para uso diario (operación) y para mantenimiento técnico (equipo dev).

## 1) Arranque recomendado para operación
1. `README.md` (comandos y rutas).
2. `docs/05-plan-pruebas.md` (checklist funcional/regresión).
3. `docs/operations/manual-instalacion-multicaja.md` (solo si se usará modo multicaja con MySQL).

## 2) Núcleo funcional y arquitectura
- `docs/01-requerimientos.md`
- `docs/02-casos-de-uso.md`
- `docs/03-modelo-datos.md`
- `docs/04-arquitectura.md`

## 3) Operación
- `docs/operations/manual-instalacion-multicaja.md` (manual vigente, limpio y verificable)
- `docs/sql/setup-sistetecni-pos.sql` (bootstrap de esquema/usuario para MySQL)

## 4) Historial técnico por fases (evolutivo)
- Fase 1 a 4: `docs/08-*.md` a `docs/16-*.md`
- Fase 6 a 9: `docs/17-*.md` a `docs/34-*.md`
- Fase 11 (CI): `docs/35-*.md` a `docs/37-*.md`

> Estas fases son útiles para trazabilidad de decisiones y contexto de refactors.

## 5) Documentación legacy o de limpieza
- `docs/06-inventario-legacy-ambiguo.md`
- `docs/07-inventario-imports-obsoletos.md`
- `docs/operations/manual-instalacion-multicaja.txt` (se conserva por historial; preferir versión `.md`)
