import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { postgres } from '../db/postgres';

export type UserRole = 'user' | 'admin_view' | 'admin_full';

export type AuthUser = {
  id: string;
  nickname: string;
  role: UserRole;
  created_at: string;
};

type UserRow = AuthUser & {
  password_hash: string;
};

type SessionRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
};

const SESSION_TTL_DAYS = 30;
const USER_ROLES: UserRole[] = ['user', 'admin_view', 'admin_full'];

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const digest = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${digest}`;
}

function verifyPassword(password: string, passwordHash: string): boolean {
  const [salt, storedDigest] = String(passwordHash || '').split(':');

  if (!salt || !storedDigest) {
    return false;
  }

  const actualDigest = scryptSync(password, salt, 64);
  const expectedDigest = Buffer.from(storedDigest, 'hex');

  if (actualDigest.length !== expectedDigest.length) {
    return false;
  }

  return timingSafeEqual(actualDigest, expectedDigest);
}

function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function validateNickname(nickname: string): string {
  const normalized = String(nickname || '').trim();

  if (normalized.length < 3 || normalized.length > 40) {
    throw new Error('nickname must be 3-40 chars');
  }

  if (!/^[A-Za-zА-Яа-яЁё0-9_.-]+$/u.test(normalized)) {
    throw new Error('nickname contains invalid chars');
  }

  return normalized;
}

function validatePassword(password: string): string {
  const normalized = String(password || '');

  if (normalized.length < 6 || normalized.length > 200) {
    throw new Error('password must be 6-200 chars');
  }

  return normalized;
}

function validateRole(role: string): UserRole {
  if (!USER_ROLES.includes(role as UserRole)) {
    throw new Error('invalid role');
  }

  return role as UserRole;
}

export class AuthService {
  async register(body: { nickname?: string; password?: string }) {
    const nickname = validateNickname(body.nickname || '');
    const password = validatePassword(body.password || '');

    const existing = await postgres.query<{ id: string }>(
      `
      select id
      from users
      where lower(nickname) = lower($1)
      limit 1
      `,
      [nickname]
    );

    if (existing.rows[0]) {
      throw new Error('nickname already exists');
    }

    const passwordHash = hashPassword(password);

    const result = await postgres.query<AuthUser>(
      `
      insert into users (nickname, password_hash, role)
      values ($1, $2, 'user')
      returning id, nickname, role, created_at
      `,
      [nickname, passwordHash]
    );

    const user = result.rows[0];

    if (!user) {
      throw new Error('failed to create user');
    }

    const session = await this.createSession(user.id);

    return {
      user,
      token: session.token
    };
  }

  async login(body: { nickname?: string; password?: string }) {
    const nickname = validateNickname(body.nickname || '');
    const password = validatePassword(body.password || '');

    const result = await postgres.query<UserRow>(
      `
      select id, nickname, role, created_at, password_hash
      from users
      where lower(nickname) = lower($1)
      limit 1
      `,
      [nickname]
    );

    const user = result.rows[0];

    if (!user || !verifyPassword(password, user.password_hash)) {
      throw new Error('invalid credentials');
    }

    const session = await this.createSession(user.id);

    return {
      user: {
        id: user.id,
        nickname: user.nickname,
        role: user.role,
        created_at: user.created_at
      },
      token: session.token
    };
  }

  async getUserByToken(token: string): Promise<AuthUser | null> {
    const normalized = String(token || '').trim();

    if (!normalized) {
      return null;
    }

    const tokenHash = hashToken(normalized);

    const result = await postgres.query<AuthUser & { session_id: string }>(
      `
      select
        u.id,
        u.nickname,
        u.role,
        u.created_at,
        s.id as session_id
      from user_sessions s
      join users u on u.id = s.user_id
      where s.token_hash = $1
        and s.revoked_at is null
        and s.expires_at > now()
      limit 1
      `,
      [tokenHash]
    );

    const user = result.rows[0];

    if (!user) {
      return null;
    }

    await postgres.query(
      `
      update user_sessions
      set last_used_at = now()
      where id = $1
      `,
      [user.session_id]
    );

    return {
      id: user.id,
      nickname: user.nickname,
      role: user.role,
      created_at: user.created_at
    };
  }

  async logout(token: string): Promise<void> {
    const normalized = String(token || '').trim();

    if (!normalized) {
      return;
    }

    await postgres.query(
      `
      update user_sessions
      set revoked_at = now()
      where token_hash = $1
        and revoked_at is null
      `,
      [hashToken(normalized)]
    );
  }

  async listUsers(): Promise<AuthUser[]> {
    const result = await postgres.query<AuthUser>(
      `
      select id, nickname, role, created_at
      from users
      order by lower(nickname) asc
      `
    );

    return result.rows;
  }

  async setUserRole(userId: string, role: string): Promise<AuthUser> {
    const normalizedRole = validateRole(role);

    const result = await postgres.query<AuthUser>(
      `
      update users
      set role = $2,
          updated_at = now()
      where id = $1
      returning id, nickname, role, created_at
      `,
      [userId, normalizedRole]
    );

    const user = result.rows[0];

    if (!user) {
      throw new Error('user not found');
    }

    return user;
  }

  private async createSession(userId: string): Promise<{ token: string }> {
    const token = randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);

    await postgres.query(
      `
      insert into user_sessions (user_id, token_hash, expires_at)
      values ($1, $2, now() + ($3 || ' days')::interval)
      `,
      [userId, tokenHash, String(SESSION_TTL_DAYS)]
    );

    return { token };
  }
}

export const authService = new AuthService();

