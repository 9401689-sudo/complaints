# Server Secrets Policy

## Important rules

- Raw `.env` files are never committed to this repository.
- Secrets are stored only in encrypted form (`.gpg`, `.age`, `.enc`).
- Plaintext secret files must stay local and be transferred securely outside git.

## GPG decryption example

```bash
gpg --output .env --decrypt prod.env.gpg
```

## Key management

- The encryption password/private key must not be stored in this repository.
- Keep decryption keys in a secure secret manager or offline protected storage.
