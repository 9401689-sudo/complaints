# Infrastructure Snapshot Report

Date: 2026-05-21  
Source host: `root@109.196.165.84`

## Collected artifacts

### deploy/nginx/
- `deploy/nginx/nginx_collected.conf`
- `deploy/nginx/apache_collected.conf`

### deploy/systemd/
- `deploy/systemd/systemd_units_collected.txt`

### deploy/cron/
- `deploy/cron/cron_collected.txt`

### _server_snapshot/
- `_server_snapshot/docker_ps.txt`
- `_server_snapshot/docker_compose_ls.txt`
- `_server_snapshot/docker_volumes.txt`
- `_server_snapshot/ports.txt`
- `_server_snapshot/firewall.txt`

## Findings by requested section

1. nginx site config  
- Result: project-specific nginx site config was **not found** in `/etc/nginx` by keyword scan (`complaints`, `doorsvip`, `complaints-api`).
- Captured marker in file: `NO_NGINX_CONFIG_FOUND`.

2. apache config  
- Result: project-specific apache config was **not found** in `/etc/apache2` or `/etc/httpd` by keyword scan.
- Captured marker in file: `NO_APACHE_CONFIG_FOUND`.

3. systemd unit  
- Captured relevant unit files and unit environment output:
  - `docker-volume-local-persist.service`
  - `docker.service`
  - `nginx.service`
- No project-specific `complaints*.service` unit was discovered.
- Unit environment fields were captured where available (`Environment=` lines).

4. cron jobs  
- Captured:
  - root crontab output
  - `/etc/crontab`
  - `/etc/cron.d/*` file list and content
- No explicit complaints-specific cron entry was found in collected output.

5. docker compose ls  
- Captured to `_server_snapshot/docker_compose_ls.txt`.

6. docker ps -a  
- Captured to `_server_snapshot/docker_ps.txt`.

7. docker volume ls  
- Captured to `_server_snapshot/docker_volumes.txt`.

8. ufw status  
- Captured to `_server_snapshot/firewall.txt`.
- If `ufw` is not active/installed, output is recorded as-is in that file.

9. open ports  
- Captured active listeners via `ss -tulpen` (fallback `netstat`) to `_server_snapshot/ports.txt`.

10. systemd unit environment variables  
- Included in `deploy/systemd/systemd_units_collected.txt` under `### UNIT_ENV:` blocks.

## Secret handling

- No raw secret values were intentionally printed into this report.
- Collected config outputs were passed through simple masking for obvious secret key names in nginx/systemd/cron collection commands.
- This snapshot is intended for infra reconstruction; validate before sharing externally.
