# Fase 7 — Cierre consolidado de la línea de Backups

## 1) Estado consolidado

Esta nota consolida el cierre de la línea de backups dentro de Fase 7, integrando en una sola referencia:

- servicio transversal de backups,
- integración IPC,
- validación bajo RBAC denegado,
- validación antispoofing.

### Componentes cerrados en esta línea

- **Servicio transversal**: `app/electron/services/backups.service.ts`
  - naming de archivos,
  - carpeta de backups,
  - pruning/retención,
  - snapshot diario/manual,
  - export y restore.
- **Integración IPC**: `app/electron/ipc/backups.ipc.ts`
  - mantiene contratos de retorno para renderer,
  - delega IO al servicio,
  - conserva auditoría/fallback y validación de permisos en main process.
- **Cobertura de pruebas**:
  - servicio: `tests/backups.service.test.ts`
  - contratos IPC (éxito/error/cancelación): `tests/backups.ipc.integration.test.ts`
  - RBAC denegado: `tests/backups.ipc.rbac-denied.integration.test.ts`
  - spoofing denegado: `tests/backups.ipc.spoofing.integration.test.ts`

---

## 2) Checklist explícito de contratos por canal

> Convención de contrato observable (renderer):
> - path string = operación exitosa
> - `null` = operación no completada/denegada en canales que retornan path
> - `false` = operación no completada/denegada en canal booleano restore

### Canal `backup:create-manual`

- [x] **Contrato actual**: `Promise<string | null>` (path en éxito, `null` en error/denegación).
- [x] **Éxito**: retorna path de backup.
- [x] **Error**: retorna `null`.
- [x] **Cancelación**: no aplica (no usa diálogo de selección).
- [x] **FORBIDDEN (RBAC denegado)**: retorna `null`.
- [x] **Spoofing denegado** (`role`/`userId` adulterado): retorna `null` y no ejecuta IO.

### Canal `backups:export`

- [x] **Contrato actual**: `Promise<string | null>` (path en éxito, `null` en cancelación/error/denegación).
- [x] **Éxito**: retorna path exportado.
- [x] **Error**: retorna `null`.
- [x] **Cancelación**: retorna `null`.
- [x] **FORBIDDEN (RBAC denegado)**: retorna `null`.
- [x] **Spoofing denegado** (`role`/`userId` adulterado): retorna `null` y no ejecuta IO.

### Canal `backups:restore`

- [x] **Contrato actual**: `Promise<boolean>` (`true` en éxito, `false` en cancelación/error/denegación).
- [x] **Éxito**: retorna `true`.
- [x] **Error**: retorna `false`.
- [x] **Cancelación**: retorna `false`.
- [x] **FORBIDDEN (RBAC denegado)**: retorna `false`.
- [x] **Spoofing denegado** (`role`/`userId` adulterado): retorna `false` y no ejecuta IO.

---

## 3) Evidencia de trazabilidad

- Implementación del servicio: `app/electron/services/backups.service.ts`.
- Delegación IPC y contratos: `app/electron/ipc/backups.ipc.ts`.
- Evidencia de servicio: `tests/backups.service.test.ts`.
- Evidencia de integración IPC (éxito/error/cancelación): `tests/backups.ipc.integration.test.ts`.
- Evidencia RBAC denegado: `tests/backups.ipc.rbac-denied.integration.test.ts`.
- Evidencia spoofing denegado: `tests/backups.ipc.spoofing.integration.test.ts`.

---

## 4) Cierre alcanzado y límites fuera de ronda

### Bien cerrado en Fase 7 (línea backups)

- Núcleo de IO de backups consolidado y reusable.
- Contratos IPC estables y documentados por canal.
- Validación de seguridad aplicada al flujo observable (RBAC + antispoofing).
- Trazabilidad completa entre implementación y tests.

### Fuera de esta ronda

- Cambios de UX/renderer.
- Cambios de contratos públicos preload/backups.
- Nuevas features de backups.
- Refactors de otras fases (packaging/installer/sync fuera del alcance de cierre de backups).
