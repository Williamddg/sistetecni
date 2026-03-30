# Prerrequisitos externos para packaging y distribución

Documento operativo para evitar falsas expectativas en build/distribución multiplataforma.

## 1) Qué valida hoy el proyecto
- `npm run packaging:check`:
  - valida configuración base de packaging y recursos mínimos.
- `npm run packaging:validate:dir`:
  - validación más profunda de targets (manual/restringida en CI).

Estas validaciones **no equivalen** a release productivo firmado/notarizado.

## 2) Dependencias externas típicas (fuera del código de negocio)

### Red y descargas
- Descarga de binarios Electron/headers nativos según entorno.
- Restricciones de proxy/firewall corporativo pueden romper builds.

### Dependencias nativas
- Módulos nativos (`better-sqlite3`, `serialport`) requieren rebuild compatible con plataforma/arquitectura.
- Inconsistencias de toolchain local pueden romper empaquetado.

### Requisitos de plataforma
- macOS: notarización/certificados si se busca distribución firmada real.
- Windows: firma de código para despliegue corporativo sin alertas.
- Linux: pruebas por distro objetivo (AppImage/DEB no garantizan uniformidad total).

### Dependencias opcionales
- Componentes opcionales como `dmg-license` pueden ser requeridos para ciertos flujos de DMG.

## 3) Qué se considera “soportado oficialmente hoy”
- Validación de configuración de packaging y preflight pragmático.
- Artefactos objetivo definidos para win/mac/linux x64.
- CI enfocada en regresión funcional + chequeos de packaging de bajo ruido.

## 4) Qué NO está cerrado en esta fase
- Pipeline completo de publicación automatizada con firma/notarización end-to-end.
- Garantía de éxito de empaquetado profundo en cualquier runner sin preparar entorno.
- Cobertura de release engineering avanzada (versionado/publicación/firmado automáticos).

## 5) Runbook corto para diagnóstico
1. Ejecutar `npm run build`.
2. Ejecutar `npm run packaging:check`.
3. Ejecutar `npm run packaging:validate:dir` si se requiere diagnóstico profundo.
4. Si falla, clasificar:
   - **Bug de config del repo**, o
   - **Limitación externa de entorno** (red/certificados/dependencias/toolchain).

## 6) Referencias
- `docs/18-fase9-9.2-packaging-multiplataforma.md`
- `docs/35-fase11-ci-ronda1-validacion-automatica-base.md`
- `docs/36-fase11-ci-ronda2-optimizacion-matriz-minima-checks-pragmaticos.md`
- `docs/37-fase11-ci-ronda3-observabilidad-dx-bajo-ruido.md`
