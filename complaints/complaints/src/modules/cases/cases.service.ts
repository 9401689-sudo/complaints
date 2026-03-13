import { createHash } from 'crypto';
import { postgres } from '../db/postgres';
import { nextcloudClient } from '../nextcloud/nextcloud.client';
import { fsmService, FsmSnapshot } from '../fsm/fsm.service';
import { CaseRecord, CreateCaseResponse } from './cases.types';

type TemplateRow = {
  id: string;
  name: string;
  institution_id: string | null;
  body_template: string;
  variables_schema: unknown;
  default_values: Record<string, unknown> | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type CaseVariableRow = {
  var_key: string;
  var_value: string | null;
};

type SelectedFileRow = {
  id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: string | number | null;
  checksum: string | null;
  preview_url: string | null;
  sort_order: number;
};

type ArtifactRow = {
  id: string;
  artifact_type: string;
  file_path: string;
  created_at: string;
};

export class CasesService {
  async createCase(): Promise<CreateCaseResponse> {
    const caseNumber = await this.generateCaseNumber();
    const folders = await nextcloudClient.createCaseFolders(caseNumber);

    const insertResult = await postgres.query<CaseRecord>(
      `
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
      `,
      [
        caseNumber,
        null,
        null,
        folders.caseRoot,
        folders.incoming,
        folders.artifacts,
        folders.result
      ]
    );

    const caseRow = insertResult.rows[0];

    if (!caseRow) {
      throw new Error('failed to create case');
    }

    const fsm: FsmSnapshot = {
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

    await fsmService.saveSnapshot(caseRow.id, fsm);

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
  async deleteCase(caseId: string) {
    const existing = await this.getCaseById(caseId);

    if (!existing) {
      throw new Error('case not found');
    }

    await postgres.query(
      `
      delete from cases
      where id = $1
      `,
      [caseId]
    );

    return {
      id: existing.id,
      case_number: existing.case_number
    };
  }

  async generateText(caseId: string) {
    const caseRow = await this.getCaseById(caseId);

    if (!caseRow) {
      throw new Error('case not found');
    }

    const snapshot = await fsmService.getSnapshot(caseId);

    if (!snapshot) {
      throw new Error('fsm not found');
    }

    if (!['files_selected', 'text_ready', 'package_ready'].includes(snapshot.state)) {
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
    const textChecksum = createHash('sha256').update(renderedText, 'utf8').digest('hex');

    await nextcloudClient.uploadTextFile(artifactPath, renderedText);

    await postgres.query('begin');

    try {
      await postgres.query(
        `
        delete from case_artifacts
        where case_id = $1
          and artifact_type = 'generated_text'
        `,
        [caseId]
      );

      await postgres.query(
        `
        insert into case_artifacts (case_id, artifact_type, file_path)
        values ($1, $2, $3)
        `,
        [caseId, 'generated_text', artifactPath]
      );

      const fsm = await fsmService.transition(caseId, 'text_ready', {
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

      await postgres.query('commit');

      return {
        case: caseRow,
        text: renderedText,
        artifactPath,
        checksum: textChecksum,
        fsm
      };
    } catch (error) {
      await postgres.query('rollback');
      throw error;
    }
  }

  async buildPackage(caseId: string) {
    const caseRow = await this.getCaseById(caseId);

    if (!caseRow) {
      throw new Error('case not found');
    }

    const snapshot = await fsmService.getSnapshot(caseId);

    if (!snapshot) {
      throw new Error('fsm not found');
    }

    if (!['text_ready', 'package_ready'].includes(snapshot.state)) {
      throw new Error(`invalid fsm state: ${snapshot.state}`);
    }

    const textArtifact = await this.getArtifactByType(caseId, 'generated_text');

    if (!textArtifact) {
      throw new Error('generated text artifact not found');
    }

    const selectedFiles = await this.getSelectedFiles(caseId);

    if (selectedFiles.length === 0) {
      throw new Error('no files selected');
    }

    const generatedText = await nextcloudClient.downloadTextFile(textArtifact.file_path);

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
    const packageChecksum = createHash('sha256').update(packageJson, 'utf8').digest('hex');

    await nextcloudClient.uploadTextFile(packagePath, packageJson);

    await postgres.query('begin');

    try {
      await postgres.query(
        `
        delete from case_artifacts
        where case_id = $1
          and artifact_type = 'submission_package'
        `,
        [caseId]
      );

      await postgres.query(
        `
        insert into case_artifacts (case_id, artifact_type, file_path)
        values ($1, $2, $3)
        `,
        [caseId, 'submission_package', packagePath]
      );

      const fsm = await fsmService.transition(caseId, 'package_ready', {
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

      await postgres.query('commit');

      return {
        case: caseRow,
        artifactPath: packagePath,
        checksum: packageChecksum,
        packagePayload,
        fsm
      };
    } catch (error) {
      await postgres.query('rollback');
      throw error;
    }
  }

  async getCase(caseId: string) {
    const caseRow = await this.getCaseById(caseId);

    if (!caseRow) {
      throw new Error('case not found');
    }

    const fsm = await fsmService.getSnapshot(caseId);

    return {
      ok: true,
      case: caseRow,
      fsm
    };
  }

  async getCaseById(caseId: string): Promise<CaseRecord | null> {
    const result = await postgres.query<CaseRecord>(
      `
      select *
      from cases
      where id = $1
      limit 1
      `,
      [caseId]
    );

    return result.rows[0] ?? null;
  }

  async listCases() {
    const result = await postgres.query(
      `
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
      `
    );

    return result.rows;
  }

  async saveCaseTextAsTemplate(caseId: string) {
    const caseRow = await this.getCaseById(caseId);

    if (!caseRow) {
      throw new Error('case not found');
    }

    const snapshot = await fsmService.getSnapshot(caseId);

    if (!snapshot) {
      throw new Error('fsm not found');
    }

    if (!['text_ready', 'package_ready', 'files_selected'].includes(snapshot.state)) {
      throw new Error(`invalid fsm state: ${snapshot.state}`);
    }

    const artifactPath = `${caseRow.nextcloud_artifacts_folder}/complaint.txt`;
    const content = await nextcloudClient.downloadTextFile(artifactPath);

    if (!content.trim()) {
      throw new Error('case text is empty');
    }

    const templateName = caseRow.title
      ? `Шаблон из ${caseRow.case_number} — ${caseRow.title}`
      : `Шаблон из ${caseRow.case_number}`;

    const result = await postgres.query<TemplateRow>(
      `
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
      `,
      [
        templateName,
        caseRow.institution_id,
        content,
        JSON.stringify([]),
        JSON.stringify({}),
        true
      ]
    );

    const template = result.rows[0];

    await this.logCaseAction(caseId, 'template.created.from_case', {
      templateId: template.id,
      templateName: template.name
    });

    return template;
  }

  async logCaseAction(caseId: string, action: string, payload: unknown): Promise<void> {
    await postgres.query(
      `
      insert into case_logs (case_id, action, payload_json)
      values ($1, $2, $3::jsonb)
      `,
      [caseId, action, JSON.stringify(payload ?? {})]
    );
  }

  private async generateCaseNumber(): Promise<string> {
    const result = await postgres.query<{ case_number: string }>(
      `
      select next_case_number() as case_number
      `
    );

    const caseNumber = result.rows[0]?.case_number;

    if (!caseNumber) {
      throw new Error('failed to generate case number');
    }

    return caseNumber;
  }

  private async getTemplateById(templateId: string): Promise<TemplateRow | null> {
    const result = await postgres.query<TemplateRow>(
      `
      select *
      from templates
      where id = $1
        and active = true
      limit 1
      `,
      [templateId]
    );

    return result.rows[0] ?? null;
  }

  private async getCaseVariables(caseId: string): Promise<Record<string, string>> {
    const result = await postgres.query<CaseVariableRow>(
      `
      select var_key, var_value
      from case_variables
      where case_id = $1
      `,
      [caseId]
    );

    const data: Record<string, string> = {};

    for (const row of result.rows) {
      data[row.var_key] = row.var_value ?? '';
    }

    return data;
  }

  private async getSelectedFiles(caseId: string): Promise<SelectedFileRow[]> {
    const result = await postgres.query<SelectedFileRow>(
      `
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
      `,
      [caseId]
    );

    return result.rows;
  }

  private async getArtifactByType(caseId: string, artifactType: string): Promise<ArtifactRow | null> {
    const result = await postgres.query<ArtifactRow>(
      `
      select id, artifact_type, file_path, created_at
      from case_artifacts
      where case_id = $1
        and artifact_type = $2
      order by created_at desc
      limit 1
      `,
      [caseId, artifactType]
    );

    return result.rows[0] ?? null;
  }

  private renderTemplate(template: string, variables: Record<string, unknown>): string {
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
      const value = variables[key];

      if (value === undefined || value === null) {
        return '';
      }

      return String(value);
    });
  }
  async updateCaseMeta(
    caseId: string,
    body: { title?: string | null; description?: string | null }
  ) {
    const existing = await this.getCaseById(caseId);

    if (!existing) {
      throw new Error('case not found');
    }

    const title =
      body?.title !== undefined ? (body.title ?? '').trim() : existing.title;

    const description =
      body?.description !== undefined
        ? (body.description ?? '').trim()
        : existing.description;

    const result = await postgres.query<CaseRecord>(
      `
      update cases
      set
        title = $2,
        description = $3,
        updated_at = now()
      where id = $1
      returning *
      `,
      [caseId, title || null, description || null]
    );

    await this.logCaseAction(caseId, 'case.meta.updated', {
      title: title || null,
      description: description || null
    });

    return result.rows[0];
  }
}

export const casesService = new CasesService();
