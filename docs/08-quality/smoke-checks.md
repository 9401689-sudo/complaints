# Smoke Checks

## API transport baseline

- `GET /health`
- `GET /<base>/health`
- auth register/login cycle

## Runtime functional smoke (manual)

- guest can view public institutions/templates
- authenticated user can create case
- case workspace opens and saves:
  - meta
  - variables
  - text
- file preview/download endpoints return expected media
- admin:
  - list users
  - view deleted records
  - backup list/create

## Script references

- Deployment helper scripts:
  - `scripts/deploy-complaints-m.sh`
  - `scripts/deploy-complaints-m.ps1`
- Project includes additional historical smoke scripts in various trees; use only scripts mapped to current source-of-truth.
