# Tabletop de salida — Fase 13 (simulación documental/operativa)

Fecha de simulación: 2026-03-30

Objetivo: validar usabilidad real del checklist final go/no-go antes de cierre operativo.

## Escenarios ejecutados

### Escenario A — Windows producción (multicaja MySQL)
- Contexto simulado: sucursal con operación normal, dependencia de MySQL servidor local.
- Recorrido aplicado:
  1. checklist pre-despliegue,
  2. criterios go/no-go por entorno,
  3. checklist post-despliegue,
  4. validación de backup + sync/fallback,
  5. decisión final GO/NO-GO.

### Escenario B — Linux piloto/controlado (SQLite + degradaciones conocidas)
- Contexto simulado: piloto técnico con alcance core y sin promesa de paridad hardware Windows-first.
- Recorrido aplicado:
  1. checklist pre-despliegue,
  2. criterios go/no-go para piloto,
  3. smoke post,
  4. verificación de degradaciones aceptadas,
  5. decisión final GO/NO-GO.

## Hallazgos de la simulación

1. **Faltaba explicitar evidencia mínima** para cerrar la decisión (versionado, timestamps, backup verificado).
2. **Faltaba rol sugerido por bloque** (pre/post) para evitar dudas de ownership en equipos pequeños.
3. En el escenario Windows multicaja, el punto de sync/fallback era correcto pero necesitaba remarcarse como evidencia mínima cuando aplica MySQL.
4. En el escenario Linux piloto, el criterio de “degradaciones aceptadas” resultó usable siempre que quede claro que no invalida GO si el core está estable.

## Ajustes menores aplicados tras tabletop

Se ajustó `docs/operations/checklist-final-produccion.md` con cambios de redacción/estructura:
- se añadieron responsables sugeridos para bloques pre/post,
- se añadió sección de evidencia mínima para decisión go/no-go,
- se mantuvo el alcance documental sin cambios funcionales.

## Nota final de cierre operativo
- **Usabilidad del checklist:** alta para decisión go/no-go en operación real.
- **Ajustes realizados:** menores y concretos (claridad de ownership + evidencia).
- **Recomendación futura (sin abrir nueva fase técnica):** usar este tabletop como plantilla breve en cada release relevante y almacenar la evidencia en un único registro operativo del equipo.
