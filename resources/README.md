# Packaging resources

This directory is intentionally tracked for electron-builder `extraResources`.

## Optional Windows assets
- `mysql-8.0.msi`: optional offline installer payload used by Windows-first provisioning flows.

If the MSI is not provided, packaging still succeeds; runtime installer flows should fall back to manual guidance.
