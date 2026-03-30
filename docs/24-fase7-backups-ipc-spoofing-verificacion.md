# Fase 7 — Verificación breve de spoofing en backups IPC

## Escenarios cubiertos

1. Sender confiable `SUPERVISOR` con payload adulterado `role: 'ADMIN'` en `backup:create-manual`.
2. Sender confiable `SUPERVISOR` con `userId` adulterado en `backups:export`.
3. Sender confiable `SELLER` con payload adulterado `role: 'ADMIN'` en `backups:restore`.

## Resultado contractual observado

- El payload adulterado **no eleva privilegios**.
- La decisión depende del contexto confiable del Main Process (auth context por sender).
- Se mantiene contrato observable por renderer ante denegación:
  - `backup:create-manual` => `null`
  - `backups:export` => `null`
  - `backups:restore` => `false`
- No se ejecuta IO cuando se detecta spoofing denegado.

## Límites de esta verificación

- No se cambia API pública ni UX de backups.
- No se alteran reglas RBAC; solo se valida el comportamiento antispoofing actual.
