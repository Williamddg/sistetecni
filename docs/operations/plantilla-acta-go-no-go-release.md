# Plantilla única — Acta GO/NO-GO por release

> Uso: registrar formalmente decisión de salida por release de forma breve y auditable.

## 1) Datos del release
- **Versión / tag:**
- **Fecha:**
- **Hora (UTC/local):**
- **Entorno objetivo:** (Windows producción / macOS piloto / Linux piloto)
- **Tipo de salida:** (regular / hotfix / controlada)

## 2) Responsables
- **Aprobador técnico:**
- **Aprobador operativo:**
- **Soporte turno inicial:**
- **Release owner (si aplica):**

## 3) Evidencia mínima (checklist breve)
- [ ] Versión candidata identificada y trazable.
- [ ] Validación pre-despliegue completada.
- [ ] Smoke post-despliegue completado.
- [ ] Evidencia de backup (ruta/archivo/timestamp).
- [ ] Si aplica MySQL: conectividad + estado sync/fallback revisado.
- [ ] Riesgos residuales revisados y aceptados por responsables.

## 4) Decisión formal
- **Decisión:** ☐ GO  ☐ NO-GO  ☐ GO CONTROLADO
- **Alcance de la decisión:**
- **Ventana de seguimiento inicial (ej. primeras 24h):**

## 5) Riesgos residuales aceptados
| Riesgo | Impacto | Mitigación acordada | Dueño |
|---|---|---|---|
|  |  |  |  |
|  |  |  |  |

## 6) Observaciones y siguientes pasos
- **Observaciones clave:**
- **Acciones inmediatas (si GO/GO CONTROLADO):**
- **Acciones de bloqueo (si NO-GO):**
- **Fecha de re-evaluación (si aplica):**

## 7) Referencias (fuente de verdad)
- Checklist final: `docs/operations/checklist-final-produccion.md`
- Hoja diaria: `docs/operations/hoja-operacion-diaria.md`
- Runbook por entorno/plataforma: `docs/operations/runbook-entorno-plataforma.md`
- Tabletop Fase 13: `docs/operations/tabletop-simulacion-salida-fase13.md`
