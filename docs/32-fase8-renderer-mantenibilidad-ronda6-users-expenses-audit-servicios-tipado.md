# Fase 8 — Ronda 6: Users, Expenses y Audit a servicios de dominio + tipado incremental

## 1) Diagnóstico (Users/Expenses/Audit)

Se revisaron específicamente las páginas:

- `Users`
- `Expenses`
- `Audit`

Deuda residual detectada:

- `Expenses` y `Audit` aún consumían `ipc` + `getAuthContext` directo desde página,
- listados/payloads con `any[]` y formateadores con `any`,
- manejo de errores con `catch (e: any)` repetido,
- en `Users` ya existía servicio de dominio, pero con tipos de entrada/salida aún laxos.

## 2) Problemas priorizados

1. Eliminar acceso API directo residual en páginas (`Expenses`/`Audit`).
2. Tipar listados de usuarios/gastos/auditoría para reducir casts y ambigüedad de shape.
3. Tipar payloads de mayor valor (`createUser`, `resetUserPassword`, `addExpense`, filtros de auditoría).
4. Mantener UX y contratos runtime intactos (sin tocar IPC handlers ni preload).

## 3) Cambios aplicados

- `services/users.ts`
  - tipado de `UserRole`, `UserRow`, `CreateUserInput`, `ResetUserPasswordInput`,
  - normalización de salida de `listUsers` para entregar `UserRow[]` en renderer.
- `services/expenses.ts`
  - tipado de `ExpenseRow` y `AddExpenseInput`,
  - normalización de salida de `listExpenses` para entregar lista tipada,
  - consolidación de payload de alta de gasto en servicio.
- `services/audit.ts`
  - tipado de `AuditFilters` y `AuditRow`,
  - normalización de salida de `listAudit`.
- `pages/Users.tsx`
  - consumo de tipos de servicio (`UserRow`, `UserRole`),
  - reducción de `any` en lista y manejo de errores.
- `pages/Expenses.tsx`
  - reemplazo de acceso directo `ipc.expenses.*` por servicios de dominio (`addExpense`, `listExpenses`),
  - tipado incremental en `rows` y formateadores.
- `pages/Audit.tsx`
  - reemplazo de acceso directo `ipc.audit.list` por `services/audit.listAudit`,
  - tipado incremental de `rows` y formateadores.

## 4) Alcance y seguridad

- Sin rediseño visual.
- Sin cambios funcionales de POS.
- Sin cambios en contratos runtime IPC/preload/main (mismos métodos y shapes de invocación en backend).

## 5) Pendientes para ronda posterior

- Reducir `any` residual de alto volumen en páginas legacy restantes (`Cash`, `Inventory`, etc.).
- Evaluar extracción de helpers de formateo compartidos (fecha/monto/texto) para evitar duplicación entre páginas administrativas.
- Continuar tipado incremental de `ipcClient` por dominio para converger wrappers de acceso.
