import { pg } from './postgres';

export async function checkPostgresHealth(): Promise<{ ok: true; now: string }> {
  const result = await pg.query<{ now: string }>('select now()::text as now');
  return {
    ok: true,
    now: result.rows[0]?.now ?? ''
  };
}
