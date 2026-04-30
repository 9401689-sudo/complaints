# Nextcloud Integration

## Protocol and client

- WebDAV operations implemented in `src/modules/nextcloud/nextcloud.client.ts`.
- Methods used: `MKCOL`, `PROPFIND`, `PUT`, `GET`, `MOVE`, `DELETE`.

## Case folder model

- For each case:
  - `<root>/<CASE-NUMBER>/incoming`
  - `<root>/<CASE-NUMBER>/artifacts`
  - `<root>/<CASE-NUMBER>/result`

## Stored artifacts

- Generated complaint text (`complaint.txt`) in `artifacts`.
- Submission package JSON in `artifacts`.
- Selected upload files may be moved from `incoming` to `artifacts`.
- Result/reply files stored in `result`.

## Env dependencies

- `NEXTCLOUD_BASE_URL`
- `NEXTCLOUD_USERNAME`
- `NEXTCLOUD_PASSWORD`
- `NEXTCLOUD_ROOT_PATH`

## Operational risks

- Missing env => immediate integration errors.
- Invalid credentials/path => 4xx/5xx DAV failures.
- MOVE/PUT failures directly impact submit and upload flows.
