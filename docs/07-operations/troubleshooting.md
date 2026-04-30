# Troubleshooting

## `failed to fetch` in browser auth

Likely causes:

- reverse proxy target mismatch for `/complaints_m/api/*`
- backend container down
- wrong API prefix/path

Checks:

- `curl https://complaints-api.doorsvip.ru/complaints_m/api/health`
- inspect proxy upstream target and port
- verify `docker compose ps` and backend logs

## `502 Bad Gateway`

Likely causes:

- upstream points to old container name/port
- backend failed startup due to env/build errors

Checks:

- `docker logs --tail=200 complaints-backend-m`
- local health on `127.0.0.1:3018`

## `Permission denied (publickey)` for git push

Likely causes:

- missing SSH key in agent
- public key not added to GitHub account
- wrong remote URL/protocol

Checks:

- `ssh -T git@github.com`
- `git remote -v`
- `ssh-add ~/.ssh/<key>`

## Nextcloud operation errors (`PROPFIND/PUT/MOVE/DELETE failed`)

Likely causes:

- invalid Nextcloud credentials/path
- permission restrictions on remote path

Checks:

- verify `NEXTCLOUD_*` env values
- test case folder existence and listing via service logs
