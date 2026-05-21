# GitHub Backup Result

Date: 2026-05-21 15:17:02 +03:00

- Branch: `server-backup-2026-05-21`
- Remote URL: `git@github.com:9401689-sudo/complaints.git`
- Commit hash: `f22ec466b191cadab545d4126307974a92757f2b`
- Push status: failed (`Host key verification failed` / `Permission denied (publickey)`)

## Included in commit
- `_server_audit/*` (except this result file created after commit)
- `_server_snapshot/*`
- `deploy/nginx/*`, `deploy/systemd/*`, `deploy/cron/*`
- `deploy/db/*.gpg`
- `_server_secrets/*.gpg` and `_server_secrets/README.md`

## Not included as raw data
- Raw `.env` files in staged snapshot commit
- Raw DB dump `.sql` / `.sql.gz`
- Private keys (`*.pem`, `*.key`, `id_rsa*`)

## Encrypted secrets location
- `_server_secrets/`
- `deploy/db/`

## What is needed for restore on new VPS
1. Ensure GitHub SSH access works for this machine/account (valid private key + known_hosts path used by Git).
2. Push/fetch branch `server-backup-2026-05-21` after SSH fix.
3. Decrypt required `.gpg` files with GPG passphrase.
4. Restore `.env` files to deployment paths.
5. Apply configs from `deploy/nginx`, `deploy/systemd`, `deploy/cron`.
6. Start services with `docker compose` and restore DB from decrypted dump if needed.
