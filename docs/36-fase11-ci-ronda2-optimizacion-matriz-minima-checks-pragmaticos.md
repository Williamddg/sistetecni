# Fase 11 — CI (Ronda 2): optimización, matriz mínima útil y checks pragmáticos

## 1) Diagnóstico de mejoras posibles

Sobre la base de Ronda 1 se identificaron mejoras de bajo riesgo y alto valor:

- agregar control de concurrencia para evitar ejecuciones redundantes en pushes sucesivos,
- agregar una validación mínima en Windows para detectar pronto problemas cross-platform de build,
- optimizar instalación en CI (`npm ci`) para reducir tiempo/ruido sin cambiar semántica,
- mantener separación clara entre validación general y packaging preflight.

## 2) Cambios aplicados

### `validate.yml`

- Se dividió en dos jobs:
  1. `validate-linux` (bloqueante):
     - `npm ci --prefer-offline --no-audit`
     - `npm test -- --runInBand`
     - `npm run build`
     - `npm run packaging:check`
  2. `validate-windows-smoke` (**no bloqueante**, `continue-on-error: true`):
     - `npm ci --prefer-offline --no-audit`
     - `npm run build`
- Se añadió `concurrency` con cancelación en progreso para no gastar minutos en runs obsoletos.

### `packaging-preflight.yml`

- Se añadió `concurrency` con cancelación en progreso.
- Se optimizó instalación con `npm ci --prefer-offline --no-audit` en sus jobs.
- Se conserva el diseño:
  - `packaging-check` para PR relevantes y manual,
  - `packaging-validate-dir` manual-only.

## 3) Bloqueante vs no bloqueante

- Bloqueante:
  - `validate-linux`
  - `packaging-check` (cuando se dispara)
- No bloqueante:
  - `validate-windows-smoke` (observabilidad temprana sin fragilizar PRs)

## 4) Runners/SO cubiertos

- Linux: `ubuntu-latest` (validación principal)
- Windows: `windows-latest` (smoke build no bloqueante)

## 5) Qué sigue fuera de alcance

- release automation completa,
- signing/notarización,
- packaging profundo automático en cada PR,
- checks que dependen de credenciales/servicios externos como requisito bloqueante.

## 6) Resultado de la ronda

- CI más pragmática y útil: mantiene un gate principal estable en Linux, agrega señal cross-platform en Windows con bajo riesgo, y reduce costo de runs redundantes con concurrency.
