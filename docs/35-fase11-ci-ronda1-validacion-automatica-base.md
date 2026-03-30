# Fase 11 — CI / integración continua (Ronda 1): base estable de validación automática

## Diagnóstico inicial del repo para CI

Estado detectado antes de esta ronda:

- no existían workflows de CI en `.github/workflows`,
- el proyecto ya contaba con scripts útiles para validación:
  - `npm test`
  - `npm run build`
  - `npm run packaging:check`
  - `npm run packaging:validate:dir`
- hay validaciones de packaging con posibles dependencias externas/red (descargas de binarios/headers) y dependencias opcionales (`dmg-license`) que pueden introducir ruido en PR si se ejecutan siempre.

## Objetivo de Ronda 1

Crear una base de CI confiable y de bajo ruido para detectar regresiones reales en:

- instalación de dependencias,
- pruebas automatizadas,
- compilación/build,
- preflight estático de packaging.

## Workflows implementados

### 1) `Validate` (principal para PR/push)

Archivo: `.github/workflows/validate.yml`

Valida en `ubuntu-latest`:

1. `npm ci`
2. `npm test -- --runInBand`
3. `npm run build`
4. `npm run packaging:check` (preflight estático, requiere artefactos `dist/*`)

Triggers:

- `pull_request`
- `push` a `main`, `master`, `work`

### 2) `Packaging Preflight` (separado por responsabilidad)

Archivo: `.github/workflows/packaging-preflight.yml`

Jobs:

- `packaging-check`:
  - corre en PR **solo** cuando cambian archivos relacionados a packaging,
  - corre también manualmente (`workflow_dispatch`),
  - ejecuta `npm run packaging:check`.
- `packaging-validate-dir`:
  - corre **solo manualmente** (`workflow_dispatch`),
  - ejecuta `npm run packaging:validate:dir` para validación más profunda de targets sin meter ruido continuo en PR.

## Qué valida CI en esta ronda

- integridad de instalación (`npm ci`),
- suite de pruebas actual,
- compilación renderer + electron,
- consistencia estática de configuración de packaging y recursos mínimos.

## Qué queda fuera (intencionalmente)

- pipeline completo de release/publicación,
- signing/notarization,
- builds DMG/NSIS/AppImage finales automáticos en cada PR,
- checks que dependen fuertemente de red externa/credenciales en ejecución continua.

## Runners/SO usados

- `ubuntu-latest` para esta ronda base (menor costo/ruido y cobertura suficiente para validar regresiones funcionales de build/test en el estado actual del repo).

## Limitaciones conocidas

- validaciones profundas de packaging pueden fallar por restricciones externas (descargas de electron/node headers, dependencias opcionales de macOS, etc.);
- por eso `packaging:validate:dir` se deja como ejecución manual y no obligatoria en cada PR.

## Resultado de la ronda

- Se establece una base de CI útil y estable para detectar regresiones sin sobrecargar con ruido externo,
- Se separa validación general de validación de packaging para mantener claridad operativa y escalabilidad hacia futuras rondas.
