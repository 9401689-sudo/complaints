# Incident History

## 2026-03 — Auth transport failure

- Symptom:
  - browser auth showed `failed to fetch`.
- Root cause:
  - reverse-proxy upstream mismatch for `/complaints_m/api/*`.
- Fix:
  - corrected proxy target to multi-user backend service/port.
- Prevention:
  - keep explicit proxy routing document and post-deploy health checks.
