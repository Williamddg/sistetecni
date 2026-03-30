# Checklist final de producción (Go / No-Go) — Fase 13

> Propósito: decidir despliegue con criterios claros y operar con expectativas realistas por entorno.

## 1) Estado de soporte (resumen ejecutivo)
- **Windows producción:** ✅ soporte oficial operativo.
- **macOS piloto/controlado:** ⚠️ soporte controlado/degradado.
- **Linux piloto/controlado:** ⚠️ soporte controlado/degradado.

No prometer todavía: firma/notarización/release engineering end-to-end automatizados ni paridad total de integraciones hardware fuera de Windows.

---

## 2) Criterios Go / No-Go por entorno

| Entorno | Go si... | No-Go si... |
|---|---|---|
| Windows producción | Flujo core estable + backup OK + (si MySQL) conectividad/sync bajo control | Fallo en login/ventas/persistencia o backup no confiable |
| macOS piloto | Arranque + flujo core + degradaciones conocidas aceptadas | Fallos core repetibles o dependencia de funcionalidad no soportada en ese SO |
| Linux piloto | Arranque + flujo core + degradaciones conocidas aceptadas | Fallos core repetibles o dependencia de funcionalidad no soportada en ese SO |

---

## 3) Validación previa al despliegue (pre)
**Responsable sugerido:** Soporte técnico + responsable de release local.

### 3.1 General (todos los entornos)
- [ ] Versión candidata identificada y trazable.
- [ ] Documentación operativa disponible para el equipo (hoja diaria + runbooks).
- [ ] Configuración de credenciales iniciales y política de cambio validada.

### 3.2 Técnica mínima
- [ ] Build válido del artefacto objetivo.
- [ ] `npm run packaging:check` sin errores bloqueantes.
- [ ] Si aplica diagnóstico profundo: `npm run packaging:validate:dir` (interpretando limitaciones de entorno).

### 3.3 Datos y operación
- [ ] Ruta de datos local validada.
- [ ] Backup manual ejecutable.
- [ ] Restore validado en entorno de prueba/controlado (mínimo una vez por release).

### 3.4 MySQL (solo si multicaja)
- [ ] Conectividad LAN/3306 validada.
- [ ] Credenciales/config MySQL validadas.
- [ ] Comportamiento esperado en fallback y resincronización entendido por soporte.

---

## 4) Validación posterior al despliegue (post)
**Responsable sugerido:** Soporte operativo del turno + referente funcional.

### 4.1 Smoke operativo (primera ventana)
- [ ] Login OK.
- [ ] Venta de prueba controlada OK.
- [ ] Registro de caja/movimiento básico OK.
- [ ] Emisión de comprobante/PDF OK.

### 4.2 Seguridad operativa
- [ ] Permisos de usuario/admin coherentes para acciones sensibles.
- [ ] Logout/login vuelve a contexto limpio de sesión.

### 4.3 Continuidad
- [ ] Backup del día generado y verificable.
- [ ] Si hubo fallback por MySQL: pendientes/sync monitoreados y sin error crítico persistente.

---

## 5) Verificación básica de operación diaria (puerta de salida)
Se considera operación aceptable cuando:
1. No hay fallas core bloqueantes (login, ventas, persistencia).
2. Backup diario está operativo.
3. Incidentes abiertos tienen clasificación y responsable.
4. El estado de sync/fallback (si aplica) está bajo observación con criterio de escalamiento.

---

## 6) Riesgos residuales priorizados

| Riesgo | Impacto | Prob. | Mitigación | Dueño sugerido |
|---|---|---|---|---|
| Caída/intermitencia MySQL en multicaja | Alto | Media | Runbook de continuidad con fallback + monitoreo de sync + ventana de revisión | Soporte + Infra local |
| Drift entre entorno real y prerequisitos de packaging profundo | Medio/Alto | Media | Preflight obligatorio + validación manual profunda en releases críticas | Release/DevOps |
| Expectativa de paridad total hardware en macOS/Linux | Medio | Media | Acordar alcance “piloto/controlado” y documentar degradaciones antes del despliegue | PM + Soporte |
| Backup no validado en restore real | Alto | Baja/Media | Prueba periódica de restore en entorno controlado y evidencia por release | Soporte operativo |
| Pendientes de resincronización prolongados | Alto | Baja/Media | Revisar estado sync, trigger manual/admin y escalar con evidencia temprana | Soporte técnico |
| Sobrepromesa de signing/notarización/release automation | Medio | Media | Declarar explícitamente límite actual en checklist de salida y comunicación a stakeholders | Líder técnico/PM |

---

## 7) Evidencia mínima a registrar (para decisión Go/No-Go)
- Identificador de versión evaluada.
- Fecha/hora de validación pre y post.
- Resultado de smoke operativo (OK/FAIL + nota breve).
- Evidencia de backup (ruta/archivo/timestamp).
- Si aplica MySQL: estado de conectividad y observación de sync/fallback.
- Decisión final: **GO** o **NO-GO**, con responsable que aprueba.

---

## 8) Referencias (no duplicar)
- Hoja diaria: `docs/operations/hoja-operacion-diaria.md`
- Modos y soporte real: `docs/operations/modos-operacion-y-soporte.md`
- Runbook por entorno/SO: `docs/operations/runbook-entorno-plataforma.md`
- Manual multicaja: `docs/operations/manual-instalacion-multicaja.md`
- Prerrequisitos externos de packaging: `docs/operations/prerequisitos-externos-packaging.md`
- CI/preflight: `docs/35-fase11-ci-ronda1-validacion-automatica-base.md`, `docs/36-fase11-ci-ronda2-optimizacion-matriz-minima-checks-pragmaticos.md`, `docs/37-fase11-ci-ronda3-observabilidad-dx-bajo-ruido.md`
