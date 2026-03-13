"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.casesService = exports.CasesService = void 0;
const crypto_1 = require("crypto");
const postgres_1 = require("../db/postgres");
const nextcloud_client_1 = require("../nextcloud/nextcloud.client");
const fsm_service_1 = require("../fsm/fsm.service");
class CasesService {
    async createCase() {
        const caseNumber = await this.generateCaseNumber();
        const folders = await nextcloud_client_1.nextcloudClient.createCaseFolders(caseNumber);
        const insertResult = await postgres_1.postgres.query(`
      insert into cases (
        case_number,
        institution_id,
        template_id,
        nextcloud_case_folder,
        nextcloud_incoming_folder,
        nextcloud_artifacts_folder,
        nextcloud_result_folder
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      returning *
      `, [
            caseNumber,
            null,
            null,
            folders.caseRoot,
            folders.incoming,
            folders.artifacts,
            folders.result
        ]);
        const caseRow = insertResult.rows[0];
        if (!caseRow) {
            throw new Error('failed to create case');
        }
        const fsm = {
            state: 'awaiting_files',
            context: {
                caseId: caseRow.id,
                caseNumber: caseRow.case_number,
                filesTotal: 0,
                filesSelected: 0,
                selectedFileIds: [],
                institutionId: caseRow.institution_id,
                templateId: caseRow.template_id,
                templateVersion: null,
                textReady: false,
                textChecksum: null,
                packageReady: false,
                packageChecksum: null,
                submissionNumber: caseRow.submission_number,
                lastErrorCode: null,
                lastErrorMessage: null
            }
        };
        await fsm_service_1.fsmService.saveSnapshot(caseRow.id, fsm);
        await this.logCaseAction(caseRow.id, 'case.created', {
            caseNumber: caseRow.case_number,
            nextcloudCaseFolder: caseRow.nextcloud_case_folder,
            nextcloudIncomingFolder: caseRow.nextcloud_incoming_folder,
            nextcloudArtifactsFolder: caseRow.nextcloud_artifacts_folder,
            nextcloudResultFolder: caseRow.nextcloud_result_folder
        });
        return {
            case: caseRow,
            fsm
        };
    }
    async deleteCase(caseId) {
        const existing = await this.getCaseById(caseId);
        if (!existing) {
            throw new Error('case not found');
        }
        await nextcloud_client_1.nextcloudClient.deletePath(existing.nextcloud_case_folder);
        await postgres_1.postgres.query(`
      delete from cases
      where id = $1
      `, [caseId]);
        return {
            id: existing.id,
            case_number: existing.case_number
        };
    }
    async generateText(caseId) {
        const caseRow = await this.getCaseById(caseId);
        if (!caseRow) {
            throw new Error('case not found');
        }
        const snapshot = await fsm_service_1.fsmService.getSnapshot(caseId);
        if (!snapshot) {
            throw new Error('fsm not found');
        }
        if (!fsm_service_1.fsmService.isEditableState(snapshot.state)) {
            throw new Error(`invalid fsm state: ${snapshot.state}`);
        }
        if (!caseRow.template_id) {
            throw new Error('template is not selected');
        }
        const template = await this.getTemplateById(caseRow.template_id);
        if (!template) {
            throw new Error('template not found');
        }
        const variables = await this.getCaseVariables(caseId);
        const mergedVariables = {
            ...(template.default_values ?? {}),
            ...variables
        };
        const renderedText = this.renderTemplate(template.body_template, mergedVariables).trim();
        if (!renderedText) {
            throw new Error('generated text is empty');
        }
        const artifactPath = `${caseRow.nextcloud_artifacts_folder}/complaint.txt`;
        const textChecksum = (0, crypto_1.createHash)('sha256').update(renderedText, 'utf8').digest('hex');
        await nextcloud_client_1.nextcloudClient.uploadTextFile(artifactPath, renderedText);
        await postgres_1.postgres.query('begin');
        try {
            await postgres_1.postgres.query(`
        delete from case_artifacts
        where case_id = $1
          and artifact_type = 'generated_text'
        `, [caseId]);
            await postgres_1.postgres.query(`
        insert into case_artifacts (case_id, artifact_type, file_path)
        values ($1, $2, $3)
        `, [caseId, 'generated_text', artifactPath]);
            const fsm = await fsm_service_1.fsmService.syncWorkingState(caseId, {
                textReady: true,
                textChecksum,
                packageReady: false,
                packageChecksum: null,
                lastErrorCode: null,
                lastErrorMessage: null
            });
            await this.logCaseAction(caseId, 'text.generated', {
                templateId: template.id,
                artifactPath,
                textChecksum,
                variables: mergedVariables
            });
            await postgres_1.postgres.query('commit');
            return {
                case: caseRow,
                text: renderedText,
                artifactPath,
                checksum: textChecksum,
                fsm
            };
        }
        catch (error) {
            await postgres_1.postgres.query('rollback');
            throw error;
        }
    }
    async buildPackage(caseId) {
        const caseRow = await this.getCaseById(caseId);
        if (!caseRow) {
            throw new Error('case not found');
        }
        const snapshot = await fsm_service_1.fsmService.getSnapshot(caseId);
        if (!snapshot) {
            throw new Error('fsm not found');
        }
        if (!fsm_service_1.fsmService.isEditableState(snapshot.state)) {
            throw new Error(`invalid fsm state: ${snapshot.state}`);
        }
        const textArtifact = await this.getTextArtifact(caseId, caseRow.nextcloud_artifacts_folder);
        if (!textArtifact) {
            throw new Error('generated text artifact not found');
        }
        const selectedFiles = await this.getSelectedFiles(caseId);
        if (selectedFiles.length === 0) {
            throw new Error('no files selected');
        }
        const generatedText = await nextcloud_client_1.nextcloudClient.downloadTextFile(textArtifact.file_path);
        const packagePayload = {
            case: {
                id: caseRow.id,
                caseNumber: caseRow.case_number,
                institutionId: caseRow.institution_id,
                templateId: caseRow.template_id,
                submissionNumber: caseRow.submission_number
            },
            text: {
                artifactPath: textArtifact.file_path,
                content: generatedText
            },
            attachments: selectedFiles.map((file) => ({
                id: file.id,
                filePath: file.file_path,
                fileName: file.file_name,
                mimeType: file.mime_type,
                sizeBytes: file.size_bytes === null ? null : Number(file.size_bytes),
                checksum: file.checksum,
                previewUrl: file.preview_url,
                sortOrder: file.sort_order
            })),
            meta: {
                generatedAt: new Date().toISOString(),
                filesSelected: selectedFiles.length
            }
        };
        const packageJson = JSON.stringify(packagePayload, null, 2);
        const packagePath = `${caseRow.nextcloud_artifacts_folder}/submission-package.json`;
        const packageChecksum = (0, crypto_1.createHash)('sha256').update(packageJson, 'utf8').digest('hex');
        await nextcloud_client_1.nextcloudClient.uploadTextFile(packagePath, packageJson);
        await postgres_1.postgres.query('begin');
        try {
            await postgres_1.postgres.query(`
        delete from case_artifacts
        where case_id = $1
          and artifact_type = 'submission_package'
        `, [caseId]);
            await postgres_1.postgres.query(`
        insert into case_artifacts (case_id, artifact_type, file_path)
        values ($1, $2, $3)
        `, [caseId, 'submission_package', packagePath]);
            const fsm = await fsm_service_1.fsmService.syncWorkingState(caseId, {
                packageReady: true,
                packageChecksum,
                lastErrorCode: null,
                lastErrorMessage: null
            });
            await this.logCaseAction(caseId, 'package.built', {
                packagePath,
                packageChecksum,
                selectedFilesCount: selectedFiles.length
            });
            await postgres_1.postgres.query('commit');
            return {
                case: caseRow,
                artifactPath: packagePath,
                checksum: packageChecksum,
                packagePayload,
                fsm
            };
        }
        catch (error) {
            await postgres_1.postgres.query('rollback');
            throw error;
        }
    }
    async getCase(caseId) {
        const caseRow = await this.getCaseById(caseId);
        if (!caseRow) {
            throw new Error('case not found');
        }
        const fsm = await fsm_service_1.fsmService.getSnapshot(caseId);
        const files = await this.getCaseFiles(caseId);
        return {
            ok: true,
            case: caseRow,
            fsm,
            files
        };
    }
    async prepareSubmit(caseId) {
        const caseRow = await this.getCaseById(caseId);
        if (!caseRow) {
            throw new Error('case not found');
        }
        const snapshot = await fsm_service_1.fsmService.getSnapshot(caseId);
        if (!snapshot) {
            throw new Error('fsm not found');
        }
        if (snapshot.state !== 'package_ready') {
            throw new Error(`invalid fsm state: ${snapshot.state}`);
        }
        const institution = caseRow.institution_id
            ? await this.getInstitutionById(caseRow.institution_id)
            : null;
        if (!institution) {
            throw new Error('institution not found');
        }
        const textArtifact = await this.getTextArtifact(caseId, caseRow.nextcloud_artifacts_folder);
        if (!textArtifact) {
            throw new Error('generated text artifact not found');
        }
        const selectedFiles = await this.getSelectedFiles(caseId);
        if (selectedFiles.length === 0) {
            throw new Error('no files selected');
        }
        const movedFiles = [];
        for (const file of selectedFiles) {
            const targetPath = this.buildResultFilePath(caseRow.nextcloud_result_folder, file.file_name);
            if (file.file_path !== targetPath) {
                await nextcloud_client_1.nextcloudClient.moveFile(file.file_path, targetPath);
                movedFiles.push({
                    id: file.id,
                    nextPath: targetPath
                });
            }
        }
        if (movedFiles.length > 0) {
            await postgres_1.postgres.query('begin');
            try {
                for (const movedFile of movedFiles) {
                    await postgres_1.postgres.query(`
            update case_files
            set file_path = $3
            where case_id = $1
              and id = $2
            `, [caseId, movedFile.id, movedFile.nextPath]);
                }
                await postgres_1.postgres.query('commit');
            }
            catch (error) {
                await postgres_1.postgres.query('rollback');
                throw error;
            }
        }
        const refreshedFiles = await this.getSelectedFiles(caseId);
        const textContent = await nextcloud_client_1.nextcloudClient.downloadTextFile(textArtifact.file_path);
        const files = refreshedFiles.map((file) => ({
            id: file.id,
            fileName: file.file_name,
            filePath: file.file_path,
            mimeType: file.mime_type,
            sizeBytes: file.size_bytes === null ? null : Number(file.size_bytes),
            previewUrl: file.preview_url,
            copyUrl: nextcloud_client_1.nextcloudClient.getFileUrl(file.file_path),
            sortOrder: file.sort_order
        }));
        await this.logCaseAction(caseId, 'submit.prepared', {
            movedFilesCount: movedFiles.length,
            movedFileIds: movedFiles.map((file) => file.id),
            resultFolder: caseRow.nextcloud_result_folder
        });
        return {
            case: caseRow,
            text: textContent,
            submitUrl: institution.submit_url,
            files,
            fsm: snapshot
        };
    }
    async getCaseById(caseId) {
        const result = await postgres_1.postgres.query(`
      select *
      from cases
      where id = $1
      limit 1
      `, [caseId]);
        return result.rows[0] ?? null;
    }
    async listCases() {
        const result = await postgres_1.postgres.query(`
      select
        c.id,
        c.case_number,
        c.institution_id,
        c.template_id,
        c.title,
        c.description,
        c.nextcloud_case_folder,
        c.nextcloud_incoming_folder,
        c.nextcloud_artifacts_folder,
        c.nextcloud_result_folder,
        c.submission_number,
        c.submitted_at,
        c.created_at,
        c.updated_at,
        i.name as institution_name,
        t.name as template_name
      from cases c
      left join institutions i on i.id = c.institution_id
      left join templates t on t.id = c.template_id
      order by c.created_at desc
      `);
        return result.rows;
    }
    async saveCaseTextAsTemplate(caseId) {
        const caseRow = await this.getCaseById(caseId);
        if (!caseRow) {
            throw new Error('case not found');
        }
        const snapshot = await fsm_service_1.fsmService.getSnapshot(caseId);
        if (!snapshot) {
            throw new Error('fsm not found');
        }
        if (!fsm_service_1.fsmService.isEditableState(snapshot.state)) {
            throw new Error(`invalid fsm state: ${snapshot.state}`);
        }
        const artifactPath = `${caseRow.nextcloud_artifacts_folder}/complaint.txt`;
        const content = await nextcloud_client_1.nextcloudClient.downloadTextFile(artifactPath);
        const variables = await this.getCaseVariables(caseId);
        const templateContent = this.restoreTemplateVariables(content, variables);
        if (!content.trim()) {
            throw new Error('case text is empty');
        }
        const templateName = caseRow.title
            ? `Шаблон из ${caseRow.case_number} — ${caseRow.title}`
            : `Шаблон из ${caseRow.case_number}`;
        const result = await postgres_1.postgres.query(`
      insert into templates (
        name,
        institution_id,
        body_template,
        variables_schema,
        default_values,
        active
      )
      values ($1, $2, $3, $4::jsonb, $5::jsonb, $6)
      returning
        id,
        name,
        institution_id,
        body_template,
        variables_schema,
        default_values,
        active,
        created_at,
        updated_at
      `, [
            templateName,
            caseRow.institution_id,
            templateContent,
            JSON.stringify([
                { key: 'complaint_date', label: 'Дата', type: 'date', required: false },
                { key: 'address', label: 'Адрес', type: 'text', required: false },
                { key: 'license_plate', label: 'Гос.номер', type: 'text', required: false }
            ]),
            JSON.stringify({
                complaint_date: '',
                address: '',
                license_plate: ''
            }),
            true
        ]);
        const template = result.rows[0];
        await this.logCaseAction(caseId, 'template.created.from_case', {
            templateId: template.id,
            templateName: template.name
        });
        return template;
    }
    async logCaseAction(caseId, action, payload) {
        await postgres_1.postgres.query(`
      insert into case_logs (case_id, action, payload_json)
      values ($1, $2, $3::jsonb)
      `, [caseId, action, JSON.stringify(payload ?? {})]);
    }
    async generateCaseNumber() {
        const result = await postgres_1.postgres.query(`
      select next_case_number() as case_number
      `);
        const caseNumber = result.rows[0]?.case_number;
        if (!caseNumber) {
            throw new Error('failed to generate case number');
        }
        return caseNumber;
    }
    async getTemplateById(templateId) {
        const result = await postgres_1.postgres.query(`
      select *
      from templates
      where id = $1
        and active = true
      limit 1
      `, [templateId]);
        return result.rows[0] ?? null;
    }
    async getInstitutionById(institutionId) {
        const result = await postgres_1.postgres.query(`
      select id, name, submit_url
      from institutions
      where id = $1
      limit 1
      `, [institutionId]);
        return result.rows[0] ?? null;
    }
    async getCaseVariables(caseId) {
        const result = await postgres_1.postgres.query(`
      select var_key, var_value
      from case_variables
      where case_id = $1
      `, [caseId]);
        const data = {};
        for (const row of result.rows) {
            data[row.var_key] = row.var_value ?? '';
        }
        return data;
    }
    async getSelectedFiles(caseId) {
        const result = await postgres_1.postgres.query(`
      select
        id,
        file_path,
        file_name,
        mime_type,
        size_bytes,
        checksum,
        preview_url,
        sort_order
      from case_files
      where case_id = $1
        and selected_for_submission = true
      order by sort_order asc, created_at asc
      `, [caseId]);
        return result.rows;
    }
    buildResultFilePath(resultFolder, fileName) {
        return `${resultFolder.replace(/\/+$/, '')}/${fileName}`;
    }
    async getCaseFiles(caseId) {
        const result = await postgres_1.postgres.query(`
      select
        id,
        case_id,
        file_path,
        file_name,
        mime_type,
        size_bytes,
        checksum,
        preview_url,
        selected_for_submission,
        sort_order,
        source_mtime,
        created_at
      from case_files
      where case_id = $1
      order by selected_for_submission desc, sort_order asc nulls last, created_at asc
      `, [caseId]);
        return result.rows;
    }
    async getArtifactByType(caseId, artifactType) {
        const result = await postgres_1.postgres.query(`
      select id, artifact_type, file_path, created_at
      from case_artifacts
      where case_id = $1
        and artifact_type = $2
      order by created_at desc
      limit 1
      `, [caseId, artifactType]);
        return result.rows[0] ?? null;
    }
    async getTextArtifact(caseId, artifactsFolder) {
        const existing = await this.getArtifactByType(caseId, 'generated_text');
        if (existing) {
            return existing;
        }
        const fallbackPath = `${artifactsFolder.replace(/\/+$/, '')}/complaint.txt`;
        try {
            await nextcloud_client_1.nextcloudClient.downloadTextFile(fallbackPath);
        }
        catch {
            return null;
        }
        await postgres_1.postgres.query(`
      insert into case_artifacts (case_id, artifact_type, file_path)
      values ($1, $2, $3)
      `, [caseId, 'generated_text', fallbackPath]);
        return {
            id: '',
            artifact_type: 'generated_text',
            file_path: fallbackPath,
            created_at: new Date().toISOString()
        };
    }
    renderTemplate(template, variables) {
        return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
            const value = variables[key];
            if (value === undefined || value === null) {
                return '';
            }
            return this.formatTemplateVariableValue(key, value);
        });
    }
    restoreTemplateVariables(content, variables) {
        const replacements = [
            { key: 'complaint_date', value: variables.complaint_date ?? '' },
            { key: 'address', value: variables.address ?? '' },
            { key: 'license_plate', value: variables.license_plate ?? '' }
        ]
            .filter((item) => item.value.trim().length > 0)
            .flatMap((item) => {
            if (item.key !== 'complaint_date') {
                return [item];
            }
            const formattedValue = this.formatComplaintDate(item.value);
            return [
                item,
                ...(formattedValue && formattedValue !== item.value
                    ? [{ key: item.key, value: formattedValue }]
                    : [])
            ];
        })
            .sort((a, b) => b.value.length - a.value.length);
        let result = content;
        for (const item of replacements) {
            const escaped = item.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            result = result.replace(new RegExp(escaped, 'g'), `{{${item.key}}}`);
        }
        return result;
    }
    formatTemplateVariableValue(key, value) {
        const raw = String(value);
        return key === 'complaint_date' ? this.formatComplaintDate(raw) : raw;
    }
    formatComplaintDate(value) {
        const raw = String(value ?? '').trim();
        if (!raw) {
            return '';
        }
        const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) {
            return raw;
        }
        const [, year, month, day] = match;
        const date = new Date(Number(year), Number(month) - 1, Number(day));
        if (Number.isNaN(date.getTime())) {
            return raw;
        }
        const formatted = new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
        return `${formatted} г.`;
    }
    async updateCaseMeta(caseId, body) {
        const existing = await this.getCaseById(caseId);
        if (!existing) {
            throw new Error('case not found');
        }
        const title = body?.title !== undefined ? (body.title ?? '').trim() : existing.title;
        const description = body?.description !== undefined
            ? (body.description ?? '').trim()
            : existing.description;
        const result = await postgres_1.postgres.query(`
      update cases
      set
        title = $2,
        description = $3,
        updated_at = now()
      where id = $1
      returning *
      `, [caseId, title || null, description || null]);
        await this.logCaseAction(caseId, 'case.meta.updated', {
            title: title || null,
            description: description || null
        });
        return result.rows[0];
    }
}
exports.CasesService = CasesService;
exports.casesService = new CasesService();
