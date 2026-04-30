# Error Model

## Envelope

- Typical error payload:
  - `{ ok: false, error: "<message>" }`

## Auth errors

- `401 unauthorized`
  - missing/invalid token
  - invalid credentials (login)
- `403 forbidden`
  - authenticated user lacks required role

## Domain and validation errors

- `400`
  - invalid request payload
  - missing required field
  - explicit domain precondition violation
- `404`
  - entity not found
  - artifact/file/path not found
- `409`
  - FSM or state transition conflicts

## Integration errors

- `5xx` for unhandled/internal errors.
- Nextcloud transport failures may surface as `502` in specific routes.
