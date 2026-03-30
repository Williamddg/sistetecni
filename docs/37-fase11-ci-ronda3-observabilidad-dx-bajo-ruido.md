# Fase 11 — CI (Ronda 3): observabilidad y DX de bajo ruido

## 1) Diagnóstico de mejora de observabilidad/DX

Con la base de Ronda 2, faltaba mejorar visibilidad operativa de CI para el equipo:

- resúmenes más claros por job en GitHub Actions,
- logs/artifacts útiles cuando fallan validaciones,
- documentación visible en README sobre qué valida CI y qué no.

## 2) Cambios de observabilidad/DX implementados

### `validate.yml`

- se agregaron logs por paso en Linux (`test`, `build`, `packaging:check`) usando `tee` a `.ci-logs/*.log`,
- se suben artifacts de logs en fallo (`validate-linux-logs`),
- se añadieron job summaries en Linux y Windows smoke indicando propósito y criticidad (bloqueante/no bloqueante).

### `packaging-preflight.yml`

- `packaging-check` ahora guarda logs de build/check y sube artifact en fallo (`packaging-check-logs`),
- `packaging-validate-dir` (manual) guarda logs y sube artifact siempre (`packaging-validate-dir-logs`), útil para diagnóstico de entorno/red,
- se añadieron job summaries para ambos jobs de packaging.

### README

- se añadió sección corta de CI con:
  - workflows vigentes,
  - jobs bloqueantes y no bloqueantes,
  - límites de alcance (sin release/signing/notarización en esta fase).

## 3) Artifacts/logs y cuándo se generan

- `validate-linux-logs`: solo cuando falla `validate-linux`.
- `packaging-check-logs`: solo cuando falla `packaging-check`.
- `packaging-validate-dir-logs`: siempre en `packaging-validate-dir` (manual).

## 4) Qué quedó fuera de alcance

- release automation completa,
- signing/notarización,
- convertir checks opcionales/dependientes de entorno externo en bloqueantes.

## 5) Lint advisory

- No se añadió lint advisory en esta ronda.
- Justificación: priorizar bajo ruido y señal estable; se deja para una ronda dedicada cuando el baseline de lint esté listo para no generar falsos positivos/redundancia operativa.

## 6) Resultado

- CI gana trazabilidad y DX sin complejidad excesiva: cuando falla hay logs útiles y resúmenes claros, manteniendo el enfoque pragmático y estable para PRs.
