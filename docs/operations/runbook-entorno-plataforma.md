# Runbook operativo por entorno/plataforma

Guía breve para soporte técnico y despliegue. Prioriza pasos verificables y evita promesas fuera de alcance actual.

## 1) Producción Windows (ruta recomendada)

### Checklist de pre-arranque
1. Verificar versión de app instalada y acceso con usuario admin.
2. Confirmar disponibilidad de carpeta de datos en `%APPDATA%/Sistetecni POS/`.
3. Revisar si el local opera en:
   - SQLite local, o
   - MySQL multicaja.

### Si opera en SQLite local
1. Confirmar lectura/escritura de DB local.
2. Ejecutar backup manual y validar archivo generado.
3. Validar emisión de factura PDF.

### Si opera en MySQL multicaja
1. Probar conectividad `Test-NetConnection <IP-SERVIDOR> -Port 3306`.
2. Validar test de conexión MySQL desde app.
3. Si falla MySQL, operar bajo fallback local con monitoreo de sync.

### Monitoreo mínimo recomendado
- Estado de sincronización (cuando aplique).
- Conteo de pendientes de fallback.
- Errores recientes de sync.

---

## 2) Pilotos macOS/Linux (ruta controlada)

### Objetivo realista
Validar operación core POS, sin asumir paridad completa de integraciones Windows-first.

### Checklist mínimo
1. Arranque de app sin crash.
2. Login/ventas/productos/caja/reportes básicos.
3. Flujo SQLite local.
4. Si se usa MySQL: configuración manual + test de conectividad.
5. Verificar degradación controlada en funcionalidades no soportadas por SO.

### Criterios de salida
- Si falla una función marcada como degradada/no soportada, documentar y no escalar como incidente crítico del core.
- Si falla flujo core (login/venta/persistencia), tratar como incidente bloqueante.

---

## 3) Incidentes frecuentes y respuesta rápida

### Incidente: “MySQL no conecta”
1. Validar red/IP/puerto 3306.
2. Validar servicio MySQL activo.
3. Validar credenciales/configuración.
4. Habilitar continuidad operativa en fallback local y registrar incidente.

### Incidente: “No resincroniza pendientes”
1. Validar que modo actual sea MySQL primario.
2. Consultar estado de sync y errores recientes.
3. Ejecutar trigger manual/admin de sync.
4. Si persiste, escalar con evidencias (errores, hora, entorno).

### Incidente: “Packaging falla en CI/local”
1. Ejecutar `npm run packaging:check` para validar base de config.
2. Si falla target profundo, confirmar prerequisitos externos (red/headers/dependencias opcionales/firmas).
3. Clasificar como limitación de entorno si aplica; no como bug funcional del POS por defecto.

---

## 4) Referencias cruzadas
- Hoja diaria compacta: `docs/operations/hoja-operacion-diaria.md`
- Modos y soporte oficial/degradado: `docs/operations/modos-operacion-y-soporte.md`
- Manual multicaja (Windows): `docs/operations/manual-instalacion-multicaja.md`
- Runtime/degradación por SO: `docs/17-fase9-9.1-runtime-cross-platform-paths-fs-degradacion.md`
- Packaging y preflight: `docs/18-fase9-9.2-packaging-multiplataforma.md`, `docs/35-fase11-ci-ronda1-validacion-automatica-base.md`
