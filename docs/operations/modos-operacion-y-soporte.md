# Modos de operación y soporte real (Fase 12 — Ronda 2)

Este documento fija **qué está soportado hoy**, qué está degradado y qué no debe prometerse todavía.

## 1) Modos de operación

### Modo A — SQLite local (offline-first)
**Qué es:** operación local de la caja con base SQLite en `appData`.

**Estado:** ✅ **Soporte operativo principal**.

**Uso típico:** tienda con una sola caja o operación autónoma sin dependencia de red.

**Notas clave:**
- Es el modo más estable para operación diaria.
- Backups/restores de archivo están orientados a esta base local.

---

### Modo B — MySQL principal (multicaja)
**Qué es:** operación de múltiples cajas usando MySQL en red local.

**Estado:** ✅ **Soportado con precondiciones de entorno**.

**Precondiciones mínimas:**
- MySQL instalado/configurado en servidor.
- Red LAN estable entre cajas.
- Firewall y puerto 3306 habilitados.
- Configuración correcta vía API/Setup.

**Runbook asociado:** `docs/operations/manual-instalacion-multicaja.md`.

---

### Modo C — Fallback local (cuando MySQL no está disponible)
**Qué es:** degradación controlada a SQLite cuando el modo esperado era MySQL pero la conectividad falla.

**Estado:** ⚠️ **Soportado en modo degradado**.

**Qué esperar:**
- Se permiten operaciones definidas por política de fallback.
- Algunas operaciones quedan bloqueadas explícitamente por seguridad/coherencia.
- Se registran operaciones para posterior resincronización.

**Referencia técnica:** `docs/13-fase3-3.3-fallback-control-flujo-operaciones-sensibles.md`.

---

### Modo D — Resincronización fallback → MySQL
**Qué es:** replay progresivo e idempotente de operaciones capturadas en fallback local.

**Estado:** ⚠️ **Soportado con alcance acotado**.

**Qué sí cubre:**
- Pipeline incremental con estado y reintentos.
- Observabilidad básica (`sync:status:get`, trigger manual/admin).

**Qué no prometer:**
- Reconciliación funcional avanzada de todos los casos de negocio.
- Cobertura ilimitada de payloads legacy incompletos.

**Referencias técnicas:**
- `docs/14-fase3-3.4-pipeline-resync-fallback.md`
- `docs/15-fase3-3.5-observabilidad-controles-operativos-sync.md`

---

## 2) Matriz de soporte por plataforma

| Área | Windows | macOS | Linux |
|---|---|---|---|
| Ejecución core POS | ✅ Oficial | ⚠️ Degradado/validación acotada | ⚠️ Degradado/validación acotada |
| SQLite local | ✅ Oficial | ✅ Funcional esperado | ✅ Funcional esperado |
| MySQL multicaja | ✅ Oficial (runbook actual) | ⚠️ Manual/entorno dependiente | ⚠️ Manual/entorno dependiente |
| Cash drawer por impresión RAW | ✅ Soportado | ❌ No soportado (degrada controlado) | ❌ No soportado (degrada controlado) |
| Autodetección estilo instalador NSIS | ✅ Soportado | ❌ No aplica (manual) | ❌ No aplica (manual) |
| Empaquetado objetivo | ✅ NSIS x64 | ⚠️ DMG x64 (precondiciones externas) | ⚠️ AppImage/DEB x64 (precondiciones externas) |

Base técnica de degradaciones/plataforma: `docs/17-fase9-9.1-runtime-cross-platform-paths-fs-degradacion.md`.

---

## 3) Qué NO debe prometerse todavía
- Release pipeline completo con signing/notarización automatizados end-to-end.
- Compatibilidad “sin condiciones” en cualquier entorno macOS/Linux sin validación previa.
- Paridad total de hardware específico (por ejemplo, ciertos flujos de cajón) fuera de Windows.
- Resincronización universal de todos los escenarios legacy complejos.
