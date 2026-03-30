# Sistetecni POS (Electron)

Aplicación POS de escritorio orientada a operación offline/online en local físico, construida con **Electron + React + TypeScript**.

## Tabla de contenidos
- [Arquitectura rápida](#arquitectura-rápida)
- [Requisitos](#requisitos)
- [Inicio rápido](#inicio-rápido)
- [Comandos de desarrollo](#comandos-de-desarrollo)
- [Build y empaquetado](#build-y-empaquetado)
- [CI (GitHub Actions)](#ci-github-actions)
- [Operación (rutas y credenciales iniciales)](#operación-rutas-y-credenciales-iniciales)
- [Documentación técnica y operativa](#documentación-técnica-y-operativa)

## Arquitectura rápida
- **Main process (Electron):** control de ventanas, seguridad, IPC, persistencia y servicios.
- **Renderer (React + Vite):** UI modular del POS.
- **Persistencia local:** SQLite (por defecto).
- **Modo multicaja opcional:** MySQL en red local.

Detalle técnico consolidado: `docs/04-arquitectura.md`.

## Requisitos
- **Node.js:** `>=20.19.0`.
- **npm:** versión compatible con Node 20+.
- **Sistema operativo de desarrollo:** Windows/macOS/Linux.

## Inicio rápido
```bash
npm install
npm run dev
```

## Comandos de desarrollo
```bash
npm run dev              # Renderer + Electron en paralelo
npm run test             # Suite Jest
npm run lint             # ESLint
npm run build            # Build renderer + electron
```

Comandos útiles adicionales:
```bash
npm run packaging:check
npm run packaging:validate:dir
```

## Build y empaquetado
Build base:
```bash
npm run build
```

Empaquetado por plataforma:
```bash
npm run package:win
npm run package:mac
npm run package:linux
```

Alias de compatibilidad:
```bash
npm run package          # equivale a package:win
```

Artefactos de salida: carpeta `release/`.

## CI (GitHub Actions)
Workflows actuales:
- `Validate`
  - **Bloqueante (Linux):** instalación, tests, build y `packaging:check`.
  - **No bloqueante (Windows smoke):** build básico para señal temprana cross-platform.
- `Packaging Preflight`
  - `packaging-check`: PRs con cambios de packaging y ejecución manual.
  - `packaging-validate-dir`: validación manual más profunda de targets.

> Alcance actual: validación pragmática de regresiones. No incluye pipeline completo de release/signing/notarización.

## Operación (rutas y credenciales iniciales)
### Rutas de datos locales (Windows)
- Base de datos SQLite: `%APPDATA%/Sistetecni POS/data/sistetecni-pos.db`
- Facturas PDF: `%APPDATA%/Sistetecni POS/invoices/`
- Backups: `%APPDATA%/Sistetecni POS/backups/`

### Credenciales iniciales
- Usuario: `admin@sistetecni.com`
- Password inicial operativa: `Admin123*`

> Recomendación: cambiar contraseña en el primer ingreso y registrar credenciales en gestor seguro.

## Documentación técnica y operativa
- Índice general/guía de lectura: `docs/00-indice-documentacion.md`
- Arquitectura base: `docs/04-arquitectura.md`
- Hoja de operación diaria (Fase 13): `docs/operations/hoja-operacion-diaria.md`
- Modos y soporte oficial/degradado: `docs/operations/modos-operacion-y-soporte.md`
- Runbook por entorno/plataforma: `docs/operations/runbook-entorno-plataforma.md`
- Manual multicaja (operativo): `docs/operations/manual-instalacion-multicaja.md`
- Prerrequisitos externos de packaging/distribución: `docs/operations/prerequisitos-externos-packaging.md`
- Script SQL MySQL multicaja: `docs/sql/setup-sistetecni-pos.sql`
- Historial técnico por fases (migraciones, hardening, CI, mantenibilidad): `docs/` (`08` a `37`).

---

Si vas a operar en entorno productivo, empieza por:
1. `docs/00-indice-documentacion.md`
2. `docs/operations/hoja-operacion-diaria.md`
3. `docs/operations/modos-operacion-y-soporte.md`
4. `docs/operations/runbook-entorno-plataforma.md`
5. `docs/operations/manual-instalacion-multicaja.md` (solo si usarás MySQL multicaja)
6. `docs/05-plan-pruebas.md`
