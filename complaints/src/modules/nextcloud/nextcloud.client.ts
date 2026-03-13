import { XMLParser } from 'fast-xml-parser';
import { env } from '../../config/env';
import { SyncedCaseFile } from '../files/files.types';

function requireNextcloudEnv(): void {
  if (
    !env.NEXTCLOUD_BASE_URL ||
    !env.NEXTCLOUD_USERNAME ||
    !env.NEXTCLOUD_PASSWORD ||
    !env.NEXTCLOUD_ROOT_PATH
  ) {
    throw new Error('Nextcloud env is not configured');
  }
}

function trimSlashes(input: string): string {
  return input.replace(/^\/+|\/+$/g, '');
}

function buildDavPath(relativePath: string): string {
  requireNextcloudEnv();

  const user = encodeURIComponent(env.NEXTCLOUD_USERNAME!);
  const normalized = trimSlashes(relativePath);

  return `${env.NEXTCLOUD_BASE_URL!}/remote.php/dav/files/${user}/${normalized}`;
}

function buildWebdavPublicUrl(relativePath: string): string {
  return buildDavPath(relativePath);
}

function getAuthHeader(): string {
  requireNextcloudEnv();

  const credentials = `${env.NEXTCLOUD_USERNAME!}:${env.NEXTCLOUD_PASSWORD!}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

async function mkcol(relativePath: string): Promise<void> {
  const response = await fetch(buildDavPath(relativePath), {
    method: 'MKCOL',
    headers: {
      Authorization: getAuthHeader()
    }
  });

  if (response.status === 201 || response.status === 405) {
    return;
  }

  const body = await response.text().catch(() => '');
  throw new Error(`Nextcloud MKCOL failed (${response.status}): ${body}`);
}

function normalizeToArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function basename(path: string): string {
  const normalized = path.replace(/\/+$/, '');
  const parts = normalized.split('/');
  return parts[parts.length - 1] ?? '';
}

export interface CaseFolders {
  caseRoot: string;
  incoming: string;
  artifacts: string;
  result: string;
}

export class NextcloudClient {
  async ensureBasePath(): Promise<void> {
    requireNextcloudEnv();

    const parts = trimSlashes(env.NEXTCLOUD_ROOT_PATH!).split('/');
    let current = '';

    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      await mkcol(current);
    }
  }

  async createCaseFolders(caseNumber: string): Promise<CaseFolders> {
    requireNextcloudEnv();

    await this.ensureBasePath();

    const caseRoot = `${trimSlashes(env.NEXTCLOUD_ROOT_PATH!)}/${caseNumber}`;
    const incoming = `${caseRoot}/incoming`;
    const artifacts = `${caseRoot}/artifacts`;
    const result = `${caseRoot}/result`;

    await mkcol(caseRoot);
    await mkcol(incoming);
    await mkcol(artifacts);
    await mkcol(result);

    return {
      caseRoot: `/${trimSlashes(caseRoot)}`,
      incoming: `/${trimSlashes(incoming)}`,
      artifacts: `/${trimSlashes(artifacts)}`,
      result: `/${trimSlashes(result)}`
    };
  }

  async listFiles(folderPath: string): Promise<SyncedCaseFile[]> {
    requireNextcloudEnv();

    const response = await fetch(buildDavPath(folderPath), {
      method: 'PROPFIND',
      headers: {
        Authorization: getAuthHeader(),
        Depth: '1',
        'Content-Type': 'application/xml'
      },
      body: `<?xml version="1.0"?>
<d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
  <d:prop>
    <d:getcontenttype />
    <d:getcontentlength />
    <d:getlastmodified />
    <d:resourcetype />
  </d:prop>
</d:propfind>`
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Nextcloud PROPFIND failed (${response.status}): ${body}`);
    }

    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      removeNSPrefix: true
    });

    const parsed = parser.parse(xml);
    const multistatus = parsed.multistatus;
    const responses = normalizeToArray(multistatus?.response);

    const files: SyncedCaseFile[] = [];

    for (const item of responses) {
      const href = item.href as string | undefined;
      const propstat = normalizeToArray(item.propstat)[0];
      const prop = propstat?.prop;

      if (!href || !prop) continue;

      const resourceType = prop.resourcetype;
      const isCollection =
        !!resourceType &&
        (resourceType.collection !== undefined ||
          (typeof resourceType === 'object' && 'collection' in resourceType));

      const decodedHref = decodeURIComponent(href);

      const folderNormalized = folderPath.replace(/\/+$/, '');
      const fileName = basename(decodedHref);

      if (decodedHref.endsWith(`${folderNormalized}/`) || decodedHref.endsWith(`${folderNormalized}`)) {
        continue;
      }

      if (isCollection) {
        continue;
      }

      const mimeType = typeof prop.getcontenttype === 'string' ? prop.getcontenttype : null;

      const sizeBytesRaw = prop.getcontentlength;
      const sizeBytes =
        sizeBytesRaw !== undefined && sizeBytesRaw !== null ? Number(sizeBytesRaw) : null;

      const sourceMtime =
        typeof prop.getlastmodified === 'string'
          ? new Date(prop.getlastmodified).toISOString()
          : null;

      files.push({
        filePath: `${folderNormalized}/${fileName}`,
        fileName,
        mimeType,
        sizeBytes: Number.isFinite(sizeBytes ?? NaN) ? sizeBytes : null,
        sourceMtime
      });
    }

    return files;
  }

  async uploadTextFile(filePath: string, content: string): Promise<void> {
    requireNextcloudEnv();

    const response = await fetch(buildDavPath(filePath), {
      method: 'PUT',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'text/plain; charset=utf-8'
      },
      body: content
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Nextcloud PUT failed (${response.status}): ${body}`);
    }
  }

  async downloadTextFile(filePath: string): Promise<string> {
    requireNextcloudEnv();

    const response = await fetch(buildDavPath(filePath), {
      method: 'GET',
      headers: {
        Authorization: getAuthHeader()
      }
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Nextcloud GET failed (${response.status}): ${body}`);
    }

    return response.text();
  }

  async downloadBinaryFile(filePath: string): Promise<Buffer> {
    requireNextcloudEnv();

    const response = await fetch(buildDavPath(filePath), {
      method: 'GET',
      headers: {
        Authorization: getAuthHeader()
      }
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Nextcloud GET failed (${response.status}): ${body}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async uploadJsonFile(filePath: string, payload: unknown): Promise<void> {
    requireNextcloudEnv();

    const response = await fetch(buildDavPath(filePath), {
      method: 'PUT',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload, null, 2)
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Nextcloud PUT failed (${response.status}): ${body}`);
    }
  }

  async downloadJsonFile<T>(filePath: string): Promise<T> {
    const text = await this.downloadTextFile(filePath);
    return JSON.parse(text) as T;
  }

  async moveFile(sourcePath: string, destinationPath: string): Promise<void> {
    requireNextcloudEnv();

    const response = await fetch(buildDavPath(sourcePath), {
      method: 'MOVE',
      headers: {
        Authorization: getAuthHeader(),
        Destination: buildDavPath(destinationPath),
        Overwrite: 'T'
      }
    });

    if (response.status === 201 || response.status === 204) {
      return;
    }

    const body = await response.text().catch(() => '');
    throw new Error(`Nextcloud MOVE failed (${response.status}): ${body}`);
  }

  async deletePath(path: string): Promise<void> {
    requireNextcloudEnv();

    const response = await fetch(buildDavPath(path), {
      method: 'DELETE',
      headers: {
        Authorization: getAuthHeader()
      }
    });

    if (response.status === 204 || response.status === 404) {
      return;
    }

    const body = await response.text().catch(() => '');
    throw new Error(`Nextcloud DELETE failed (${response.status}): ${body}`);
  }

  getFileUrl(filePath: string): string {
    return buildWebdavPublicUrl(filePath);
  }
}

export const nextcloudClient = new NextcloudClient();
