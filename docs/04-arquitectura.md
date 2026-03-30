# Arquitectura

## Stack
- **Desktop shell:** Electron.
- **UI:** React + Vite + TypeScript (renderer process).
- **Backend local:** servicios en proceso main (Node.js).
- **Persistencia primaria:** SQLite (`better-sqlite3`).
- **Modo alternativo de red:** MySQL (`mysql2`) para multicaja.

## Modelo de procesos
- `main` (Electron):
  - Inicialización de app y ventanas.
  - Registro de handlers IPC.
  - Acceso a sistema de archivos y base de datos.
  - Integraciones sensibles (backups, serial, generación PDF).
- `preload`:
  - Expone API controlada (`window.api.*`) al renderer.
  - Mantiene aislamiento entre UI y capacidades Node.
- `renderer`:
  - Vistas POS y flujos de usuario.
  - Consume servicios vía API tipada del preload.

## Seguridad base
- `contextIsolation=true`.
- `nodeIntegration=false`.
- Comunicación renderer-main únicamente por IPC controlado.
- Lógica sensible centralizada en main.

## Persistencia y archivos
- SQLite local en `appData` para operación offline.
- Facturas PDF en carpeta `invoices` dentro de datos de usuario.
- Backups en carpeta `backups` dentro de datos de usuario.

## Build y distribución
- Build en dos etapas:
  1. `renderer` (Vite).
  2. `electron` (TypeScript -> JS).
- Empaquetado con `electron-builder` para:
  - Windows (NSIS x64)
  - macOS (DMG x64)
  - Linux (AppImage + DEB x64)
