# Final Safety Check

Date: 2026-05-21 15:15:09 +03:00

## 1) git status
```text
On branch multi-user
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   .vscode/extensions.json

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	_server_audit/
	_server_secrets/
	_server_snapshot/
	auth-scope-policy-utils.js
	case-status-badge-utils.js
	case-status-constants.js
	context-nav-model-utils.js
	date-text-utils.js
	deploy/
	directory-category-constants.js
	display-format-utils.js
	file-preview-display-utils.js
	filter-option-derivation-utils.js
	fixed-variables-config.js
	label-lookup-utils.js
	list-filter-query-utils.js
	mime-preview-lookup-utils.js
	preview-markup-template-utils.js
	preview-text-format-utils.js
	readonly-ui-decision-utils.js
	safe-modules-boundary.js
	scripts/smoke-check-app-boundary-imports.sh
	scripts/smoke-check-auth-scope-policy-utils.sh
	scripts/smoke-check-case-status-badge-utils.sh
	scripts/smoke-check-context-nav-model-utils.sh
	scripts/smoke-check-date-text-utils.sh
	scripts/smoke-check-display-format-utils.sh
	scripts/smoke-check-extracted-constants.sh
	scripts/smoke-check-file-preview-display-utils.sh
	scripts/smoke-check-filter-option-derivation-utils.sh
	scripts/smoke-check-fixed-variables-config.sh
	scripts/smoke-check-label-lookup-utils.sh
	scripts/smoke-check-list-filter-query-utils.sh
	scripts/smoke-check-mime-preview-lookup-utils.sh
	scripts/smoke-check-preview-markup-template-utils.sh
	scripts/smoke-check-preview-text-format-utils.sh
	scripts/smoke-check-readonly-ui-decision-utils.sh
	scripts/smoke-check-safe-boundary-completeness.sh
	scripts/smoke-check-submit-workspace-precondition-utils.sh
	scripts/smoke-check-template-workspace-derivation-utils.sh
	scripts/smoke-check-text-display-utils.sh
	scripts/smoke-check-variable-template-transform-utils.sh
	scripts/smoke-check-workspace-status-progress-text-utils.sh
	submit-workspace-precondition-utils.js
	template-workspace-derivation-utils.js
	text-display-utils.js
	variable-template-transform-utils.js
	workspace-status-progress-text-utils.js

no changes added to commit (use "git add" and/or "git commit -a")
```

## 2) git diff --stat
```text
(no unstaged diff stat output)
```

## 3) git diff --cached --stat
```text
(no staged changes)
```

## 4-5) Dangerous files scan and git tracking state
| Path | Tracked in git | Ignored by gitignore |
|---|---:|---:|
| .env | True | False |
| .env.save | True | False |
| sql\001_init_mvp.sql | True | False |

## 6) Keyword scan (path + variable name only; values redacted)
| File | Keyword | Variable/Name |
|---|---|---|
| _server_audit\code_migration_report.md | secret | _server_secrets |
| _server_audit\code_migration_report.md | secret | keyword_match |
| _server_audit\database_backup_report.md | password | keyword_match |
| _server_audit\database_backup_report.md | secret | keyword_match |
| _server_audit\infrastructure_report.md | secret | keyword_match |
| _server_audit\secrets_backup_report.md | password | keyword_match |
| _server_audit\secrets_backup_report.md | secret | _server_secrets |
| _server_audit\secrets_backup_report.md | secret | _tmp_raw_secrets |
| _server_audit\secrets_backup_report.md | secret | keyword_match |
| _server_audit\server_diff_summary.md | password | keyword_match |
| _server_audit\server_diff_summary.md | secret | _secret |
| _server_audit\server_diff_summary.md | secret | _server_secrets |
| _server_audit\server_diff_summary.md | secret | keyword_match |
| _server_audit\server_vs_local_brief.txt | secret | _server_secrets |
| _server_audit\server_vs_local.diff | password | keyword_match |
| _server_audit\server_vs_local.diff | password | NEXTCLOUD_PASSWORD |
| _server_audit\server_vs_local.diff | password | POSTGRES_PASSWORD |
| _server_audit\server_vs_local.diff | password | REDIS_PASSWORD |
| _server_audit\server_vs_local.diff | secret | _secret |
| _server_audit\server_vs_local.diff | secret | _secrets |
| _server_audit\server_vs_local.diff | secret | _server_secrets |
| _server_audit\server_vs_local.diff | secret | keyword_match |
| _server_audit\server_vs_local.diff | token | keyword_match |
| .env | password | NEXTCLOUD_PASSWORD |
| .env | password | POSTGRES_PASSWORD |
| .env | password | REDIS_PASSWORD |
| .env.save | password | NEXTCLOUD_PASSWORD |
| .env.save | password | REDIS_PASSWORD |
| api.js | token | AUTH_TOKEN_KEY |
| api.js | token | clearAuthToken |
| api.js | token | getAuthToken |
| api.js | token | keyword_match |
| api.js | token | setAuthToken |
| app.js | password | authLoginPassword |
| app.js | password | authRegisterPassword |
| app.js | token | clearAuthToken |
| app.js | token | getAuthToken |
| app.js | token | keyword_match |
| app.js | token | setAuthToken |
| AutoHotkey_2.0.21_setup.exe | token | publicKeyToken |
| docs\00-overview\decisions-summary.md | token | keyword_match |
| docs\01-product\key-user-flows.md | token | keyword_match |
| docs\01-product\product-scope.md | password | keyword_match |
| docs\02-architecture\architecture-overview.md | token | keyword_match |
| docs\02-architecture\backend-architecture.md | token | keyword_match |
| docs\02-architecture\frontend-architecture.md | token | complaints_auth_token |
| docs\02-architecture\integration-map.md | token | keyword_match |
| docs\02-architecture\state-and-fsm.md | token | keyword_match |
| docs\03-codebase-map\api-surface-map.md | token | keyword_match |
| docs\03-codebase-map\repository-structure.md | token | keyword_match |
| docs\04-data\schema-reference.md | password | keyword_match |
| docs\04-data\schema-reference.md | token | keyword_match |
| docs\05-api\api-contract.md | token | keyword_match |
| docs\05-api\auth-contract.md | password | keyword_match |
| docs\05-api\auth-contract.md | token | keyword_match |
| docs\05-api\curl-smoke-examples.md | password | keyword_match |
| docs\05-api\curl-smoke-examples.md | token | keyword_match |
| docs\05-api\error-model.md | token | keyword_match |
| docs\06-infrastructure\environments.md | password | NEXTCLOUD_PASSWORD |
| docs\06-infrastructure\environments.md | password | POSTGRES_PASSWORD |
| docs\06-infrastructure\environments.md | password | REDIS_PASSWORD |
| docs\06-infrastructure\environments.md | secret | keyword_match |
| docs\06-infrastructure\nextcloud-integration.md | password | NEXTCLOUD_PASSWORD |
| docs\07-operations\runbook-local-dev.md | password | keyword_match |
| docs\09-contributing\coding-standards.md | secret | keyword_match |
| fixed-variables-config.js | token | keyword_match |
| frontend-utils\constants.js | token | keyword_match |
| frontend-utils\preview-helpers.js | token | encodedToken |
| frontend-utils\preview-helpers.js | token | keyword_match |
| index.html | password | authLoginPassword |
| index.html | password | authRegisterPassword |
| sql\001_init_mvp.sql | password | keyword_match |
| sql\001_init_mvp.sql | token | idx_user_sessions_token_hash |
| sql\001_init_mvp.sql | token | keyword_match |
| src\config\env.ts | password | NEXTCLOUD_PASSWORD |
| src\config\env.ts | password | POSTGRES_PASSWORD |
| src\config\env.ts | password | REDIS_PASSWORD |
| src\index.ts | token | extractBearerToken |
| src\index.ts | token | getUserByToken |
| src\index.ts | token | keyword_match |
| src\modules\admin\admin-backups.service.ts | password | PGPASSWORD |
| src\modules\auth\auth.routes.ts | password | keyword_match |
| src\modules\auth\auth.routes.ts | token | extractBearerToken |
| src\modules\auth\auth.routes.ts | token | keyword_match |
| src\modules\auth\auth.service.ts | password | hashPassword |
| src\modules\auth\auth.service.ts | password | keyword_match |
| src\modules\auth\auth.service.ts | password | validatePassword |
| src\modules\auth\auth.service.ts | password | verifyPassword |
| src\modules\auth\auth.service.ts | token | getUserByToken |
| src\modules\auth\auth.service.ts | token | hashToken |
| src\modules\auth\auth.service.ts | token | keyword_match |
| src\modules\auth\auth.utils.ts | token | extractBearerToken |
| src\modules\auth\auth.utils.ts | token | queryToken |
| src\modules\db\postgres.ts | password | POSTGRES_PASSWORD |
| src\modules\nextcloud\nextcloud.client.ts | password | NEXTCLOUD_PASSWORD |
| src\modules\redis\redis.ts | password | REDIS_PASSWORD |
| src\scripts\create-admin-user.ts | password | hashPassword |
| src\scripts\create-admin-user.ts | password | keyword_match |

## Recommendation
- НЕЛЬЗЯ коммитить: найдены опасные raw-файлы, уже отслеживаемые git.
