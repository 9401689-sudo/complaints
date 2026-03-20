import { promises as fs } from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { env } from '../../config/env';
import { redis } from '../redis/redis';

const execFileAsync = promisify(execFile);
const BACKUP_PREFIX = 'complaints-backup-';
const BACKUP_SUFFIX = '.sql';
const MAX_BACKUPS = 3;

export type BackupRecord = {
  fileName: string;
  createdAt: string;
  sizeBytes: number;
};

function getBackupFilePath(fileName: string): string {
  return path.join(env.BACKUP_DIR, fileName);
}

function getPgEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PGPASSWORD: env.POSTGRES_PASSWORD,
    PGSSLMODE: env.POSTGRES_SSL ? 'require' : 'disable'
  };
}

function buildTimestamp(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

async function ensureBackupDir(): Promise<void> {
  await fs.mkdir(env.BACKUP_DIR, { recursive: true });
}

async function getBackupFiles(): Promise<BackupRecord[]> {
  await ensureBackupDir();

  const entries = await fs.readdir(env.BACKUP_DIR, { withFileTypes: true });
  const backups = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.startsWith(BACKUP_PREFIX) && entry.name.endsWith(BACKUP_SUFFIX))
      .map(async (entry) => {
        const stats = await fs.stat(getBackupFilePath(entry.name));
        return {
          fileName: entry.name,
          createdAt: stats.mtime.toISOString(),
          sizeBytes: stats.size
        } satisfies BackupRecord;
      })
  );

  return backups.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

async function pruneBackups(): Promise<void> {
  const backups = await getBackupFiles();
  const extra = backups.slice(MAX_BACKUPS);

  await Promise.all(extra.map((backup) => fs.rm(getBackupFilePath(backup.fileName), { force: true })));
}

async function clearCaseFsmCache(): Promise<void> {
  const keys = await redis.keys('complaints:case:*:fsm');
  if (keys.length) {
    await redis.del(...keys);
  }
}

export class AdminBackupsService {
  async listBackups(): Promise<BackupRecord[]> {
    return getBackupFiles();
  }

  async createBackup(): Promise<BackupRecord> {
    await ensureBackupDir();

    const fileName = `${BACKUP_PREFIX}${buildTimestamp()}${BACKUP_SUFFIX}`;
    const outputPath = getBackupFilePath(fileName);

    await execFileAsync(
      'pg_dump',
      [
        '--host',
        env.POSTGRES_HOST,
        '--port',
        String(env.POSTGRES_PORT),
        '--username',
        env.POSTGRES_USER,
        '--dbname',
        env.POSTGRES_DB,
        '--schema',
        env.POSTGRES_SCHEMA,
        '--clean',
        '--if-exists',
        '--no-owner',
        '--no-privileges',
        '--format=plain',
        '--file',
        outputPath
      ],
      {
        env: getPgEnv()
      }
    );

    await pruneBackups();

    const stats = await fs.stat(outputPath);
    return {
      fileName,
      createdAt: stats.mtime.toISOString(),
      sizeBytes: stats.size
    };
  }

  async restoreBackup(fileName: string): Promise<BackupRecord> {
    if (!fileName.startsWith(BACKUP_PREFIX) || !fileName.endsWith(BACKUP_SUFFIX)) {
      throw new Error('backup not found');
    }

    const backupPath = getBackupFilePath(path.basename(fileName));
    let stats;
    try {
      stats = await fs.stat(backupPath);
    } catch {
      throw new Error('backup not found');
    }

    await execFileAsync(
      'psql',
      [
        '--host',
        env.POSTGRES_HOST,
        '--port',
        String(env.POSTGRES_PORT),
        '--username',
        env.POSTGRES_USER,
        '--dbname',
        env.POSTGRES_DB,
        '--set',
        'ON_ERROR_STOP=1',
        '--file',
        backupPath
      ],
      {
        env: getPgEnv()
      }
    );

    await clearCaseFsmCache();

    return {
      fileName: path.basename(fileName),
      createdAt: stats.mtime.toISOString(),
      sizeBytes: stats.size
    };
  }

  async deleteBackup(fileName: string): Promise<BackupRecord> {
    if (!fileName.startsWith(BACKUP_PREFIX) || !fileName.endsWith(BACKUP_SUFFIX)) {
      throw new Error('backup not found');
    }

    const backupPath = getBackupFilePath(path.basename(fileName));
    let stats;
    try {
      stats = await fs.stat(backupPath);
    } catch {
      throw new Error('backup not found');
    }

    await fs.rm(backupPath, { force: true });

    return {
      fileName: path.basename(fileName),
      createdAt: stats.mtime.toISOString(),
      sizeBytes: stats.size
    };
  }
}

export const adminBackupsService = new AdminBackupsService();
