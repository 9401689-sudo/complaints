"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextcloudClient = exports.NextcloudClient = void 0;
const fast_xml_parser_1 = require("fast-xml-parser");
const env_1 = require("../../config/env");
function requireNextcloudEnv() {
    if (!env_1.env.NEXTCLOUD_BASE_URL ||
        !env_1.env.NEXTCLOUD_USERNAME ||
        !env_1.env.NEXTCLOUD_PASSWORD ||
        !env_1.env.NEXTCLOUD_ROOT_PATH) {
        throw new Error('Nextcloud env is not configured');
    }
}
function trimSlashes(input) {
    return input.replace(/^\/+|\/+$/g, '');
}
function buildDavPath(relativePath) {
    requireNextcloudEnv();
    const user = encodeURIComponent(env_1.env.NEXTCLOUD_USERNAME);
    const normalized = trimSlashes(relativePath);
    return `${env_1.env.NEXTCLOUD_BASE_URL}/remote.php/dav/files/${user}/${normalized}`;
}
function getAuthHeader() {
    requireNextcloudEnv();
    const credentials = `${env_1.env.NEXTCLOUD_USERNAME}:${env_1.env.NEXTCLOUD_PASSWORD}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
}
async function mkcol(relativePath) {
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
function normalizeToArray(value) {
    if (!value)
        return [];
    return Array.isArray(value) ? value : [value];
}
function basename(path) {
    const normalized = path.replace(/\/+$/, '');
    const parts = normalized.split('/');
    return parts[parts.length - 1] ?? '';
}
class NextcloudClient {
    async ensureBasePath() {
        requireNextcloudEnv();
        const parts = trimSlashes(env_1.env.NEXTCLOUD_ROOT_PATH).split('/');
        let current = '';
        for (const part of parts) {
            current = current ? `${current}/${part}` : part;
            await mkcol(current);
        }
    }
    async createCaseFolders(caseNumber) {
        requireNextcloudEnv();
        await this.ensureBasePath();
        const caseRoot = `${trimSlashes(env_1.env.NEXTCLOUD_ROOT_PATH)}/${caseNumber}`;
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
    async listFiles(folderPath) {
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
        const parser = new fast_xml_parser_1.XMLParser({
            ignoreAttributes: false,
            removeNSPrefix: true
        });
        const parsed = parser.parse(xml);
        const multistatus = parsed.multistatus;
        const responses = normalizeToArray(multistatus?.response);
        const files = [];
        for (const item of responses) {
            const href = item.href;
            const propstat = normalizeToArray(item.propstat)[0];
            const prop = propstat?.prop;
            if (!href || !prop)
                continue;
            const resourceType = prop.resourcetype;
            const isCollection = !!resourceType &&
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
            const sizeBytes = sizeBytesRaw !== undefined && sizeBytesRaw !== null ? Number(sizeBytesRaw) : null;
            const sourceMtime = typeof prop.getlastmodified === 'string'
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
    async uploadTextFile(filePath, content) {
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
    async downloadTextFile(filePath) {
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
    async downloadBinaryFile(filePath) {
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
    async uploadJsonFile(filePath, payload) {
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
    async downloadJsonFile(filePath) {
        const text = await this.downloadTextFile(filePath);
        return JSON.parse(text);
    }
}
exports.NextcloudClient = NextcloudClient;
exports.nextcloudClient = new NextcloudClient();
