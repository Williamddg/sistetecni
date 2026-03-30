# Hoja de operación diaria (Fase 13 — arranque)

> Objetivo: guía **compacta y accionable** para turno diario. No reemplaza runbooks; los referencia.

## Qué cubre esta hoja
- Apertura de turno.
- Operación básica segura.
- Cierre de turno.
- Backup diario.
- Validación rápida de fallback/sync (si aplica MySQL).
- Criterios mínimos de escalamiento.

## 1) Apertura (inicio de jornada)
1. Abrir app y validar login de usuario autorizado.
2. Confirmar modo esperado del local:
   - **SQLite local** (caja autónoma), o
   - **MySQL multicaja** (red local).
3. Verificar operación mínima:
   - consulta de productos,
   - apertura/caja,
   - emisión de ticket/factura de prueba interna (si política local lo permite).
4. Si el local opera con MySQL: validar conectividad antes de pico operativo.

Si falla apertura, usar criterios de escalamiento al final de esta hoja.

## 2) Operación básica (durante el día)
1. Mantener flujo normal de ventas/caja según perfil.
2. Si hay incidencia de conectividad MySQL:
   - continuar en fallback local cuando el sistema lo permita,
   - registrar hora y síntoma,
   - evitar acciones no soportadas en estado degradado.
3. Ante errores repetidos del mismo flujo core, no “forzar” reintentos indefinidos: escalar.

## 3) Cierre (fin de jornada)
1. Verificar que operaciones críticas del día estén registradas.
2. Ejecutar backup manual del día.
3. Confirmar que el archivo backup quedó generado en ruta esperada.
4. Documentar incidentes del turno (si hubo), con hora y contexto.

## 4) Control rápido de fallback/sync (solo modo MySQL)
1. Si hubo caída de MySQL durante el día, revisar estado de resincronización.
2. Validar que no queden errores recurrentes sin atención.
3. Si existen pendientes prolongados o errores repetidos, escalar con evidencia mínima.

## 5) Escalamiento básico (cuándo escalar)
Escalar a soporte técnico cuando ocurra cualquiera de estos casos:
- No se puede iniciar sesión o abrir operación core.
- No hay persistencia confiable (errores al guardar ventas/caja).
- MySQL no conecta de forma sostenida en local multicaja.
- Pendientes de sync no disminuyen tras ventana razonable y revisión básica.
- Backup no se puede generar o validar.

## Qué remite a runbooks más amplios
- Modos, soporte oficial/degradado y límites: `docs/operations/modos-operacion-y-soporte.md`
- Runbook por entorno/SO e incidentes: `docs/operations/runbook-entorno-plataforma.md`
- MySQL multicaja (instalación/config): `docs/operations/manual-instalacion-multicaja.md`
- Packaging y prerequisitos externos: `docs/operations/prerequisitos-externos-packaging.md`

## Checklist final de producción (referencia)
- Ver documento consolidado: `docs/operations/checklist-final-produccion.md`.
