import { randomBytes, scryptSync } from 'crypto';
import { postgres } from '../modules/db/postgres';
import { redis } from '../modules/redis/redis';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const digest = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${digest}`;
}

async function main() {
  const nickname = String(process.argv[2] || '').trim();
  const password = String(process.argv[3] || '');
  const role = String(process.argv[4] || 'admin_full').trim();

  if (!nickname || !password) {
    throw new Error('usage: node dist/scripts/create-admin-user.js <nickname> <password> [admin_view|admin_full]');
  }

  const result = await postgres.query(
    `
    insert into users (nickname, password_hash, role)
    values ($1, $2, $3)
    on conflict (nickname)
    do update set password_hash = excluded.password_hash, role = excluded.role, updated_at = now()
    returning id, nickname, role, created_at
    `,
    [nickname, hashPassword(password), role]
  );

  console.log(JSON.stringify(result.rows[0], null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled([postgres.end(), redis.quit()]);
  });
