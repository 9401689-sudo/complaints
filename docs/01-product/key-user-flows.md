# Key User Flows

## Flow: Guest browsing

1. Open app URL (`/complaints_m/`).
2. Guest sees informational mode and can browse public institutions/templates list.
3. Guest cannot create/edit entities; protected actions trigger auth prompt.

## Flow: Registration/Login

1. User opens auth modal (`Войти` / `Зарегистрироваться`).
2. Sends `POST /auth/register` or `POST /auth/login`.
3. Receives `{ user, token }`.
4. Frontend stores token and loads authorized app state (`me`, lists, filters).

## Flow: Case creation and workspace

1. User creates case (`POST /cases`).
2. Backend creates Nextcloud folders and adopts incoming files.
3. User edits case meta, chooses organization/template.
4. User fills variables and saves text.
5. User syncs/selects/uploads files.
6. User prepares submit package and works with result files/comments.

## Flow: Directory management (user/admin)

1. User creates private institution/template.
2. Entity is visible according to visibility + owner policy.
3. Admin full can publish selected private entities to public visibility.
4. Favorites can be toggled by authenticated users.

## Flow: Soft-delete and restore

1. User/admin deletes entity -> record marked deleted (soft-delete fields).
2. Deleted items appear in admin `Просмотр помеченных`.
3. Admin full can restore specific entity.
4. Admin full can run purge to physically remove deleted records and related folders.

## Flow: Backups (admin)

1. Admin view/full lists backups.
2. Admin full creates backup (`pg_dump`) with retention trim.
3. Admin full can restore or delete selected backup entry.
