# sistetecni-pos-electron

POS offline para local físico de Sistetecni.

## Instalación
```bash
npm install
```

## Desarrollo
```bash
npm run dev
```

## Build
```bash
npm run build
```

## Empaquetar Windows
```bash
npm run package
```

## CI (GitHub Actions)

Workflows actuales:

- `Validate`
  - **Bloqueante (Linux)**: instala dependencias, ejecuta tests, build y `packaging:check`.
  - **No bloqueante (Windows smoke)**: build básico para señal temprana cross-platform.
- `Packaging Preflight`
  - `packaging-check`: corre en PRs con cambios de packaging y en manual.
  - `packaging-validate-dir`: solo manual (`workflow_dispatch`) para validación más profunda.

Notas:

- Esta CI está enfocada en validación pragmática de regresiones (no release automation completa).
- Signing/notarización y pipeline de publicación quedan fuera de alcance por ahora.

## Ubicación de datos locales
- Base de datos SQLite: `%APPDATA%/Sistetecni POS/data/sistetecni-pos.db`
- Facturas PDF: `%APPDATA%/Sistetecni POS/invoices/`
- Backups: `%APPDATA%/Sistetecni POS/backups/`

## Credenciales iniciales
- `admin@sistetecni.com`
- `Admin123*`

> Cambiar contraseña desde Settings (pendiente UI completa de usuarios para siguientes iteraciones).

## Documentación operativa
- Manual multicaja (legacy operativo): `docs/operations/manual-instalacion-multicaja.txt`
- Script SQL de setup MySQL: `docs/sql/setup-sistetecni-pos.sql`
