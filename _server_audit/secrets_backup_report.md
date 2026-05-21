# Secrets Backup Report

## Scope

Backup performed from server project:
- `/var/www/complaints-backend/complaints_m`

Raw files were temporarily copied to:
- `_tmp_raw_secrets/` (local, temporary, deleted after encryption)

Encrypted files were stored to:
- `_server_secrets/`

## Secret files found (and processed)

Detected and backed up:
- `.env`
- `.env.save`
- `.env.server.bak`
- `docker-compose.yml` (included as docker env-related config backup artifact)

Not found on server:
- `.env.production`
- `.env.local`

## Encrypted copies created

- `_server_secrets/Complaints_m__.env.env.gpg`
- `_server_secrets/Complaints_m__.env.save.env.gpg`
- `_server_secrets/Complaints_m__.env.server.bak.env.gpg`
- `_server_secrets/Complaints_m__docker-compose.yml.env.gpg`

Encryption method:
- `gpg` symmetric encryption (`gpg --batch --yes --pinentry-mode loopback --symmetric --cipher-algo AES256`)

## Raw secret handling confirmation

- Raw temp directory `_tmp_raw_secrets/` was deleted after successful encryption.
- Check result: `_tmp_raw_secrets/` does not exist.
- `git status --short -- _server_secrets _tmp_raw_secrets .env .env.*` shows no raw copied secrets staged/tracked from `_tmp_raw_secrets/`.
- In git status for this scope, only `_server_secrets/` appears as untracked (expected encrypted artifacts + README).

## Notes

- Secret **values** were not printed in terminal and are not included in this report.
- Additional keyword scan identified many code/config files mentioning words like `token/secret/password`; these are mostly source files and should be reviewed separately if a stricter secret policy is required.
