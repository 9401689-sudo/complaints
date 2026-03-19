import { createHash } from 'crypto';
import { postgres } from '../db/postgres';
import { nextcloudClient } from '../nextcloud/nextcloud.client';
import { fsmService, FsmSnapshot } from '../fsm/fsm.service';
import { CaseRecord, CreateCaseResponse } from './cases.types';

type TemplateRow = {
  id: string;
  name: string;
  category?: string;
  institution_id: string | null;
  body_template: string;
  variables_schema: unknown;
  default_values: Record<string, unknown> | null;
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

type InstitutionRow = {
  id: string;
  name: string;
  submit_url: string;
};

type CaseFileRow = {
  id: string;
  case_id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  checksum: string | null;
  preview_url: string | null;
  selected_for_submission: boolean;
  sort_order: number | null;
  source_mtime: string | null;
  created_at: string;
};

type SubmitFilePayload = {
  id: string;
  fileName: string;
  filePath: string;
  mimeType: string | null;
  sizeBytes: number | null;
  previewUrl: string | null;
  copyUrl: string;
  sortOrder: number | null;
};

type ArtifactFolderFileRow = {
  id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  preview_url: string | null;
  sort_order: number | null;
};

export class CasesService {
  deriveCaseStatus(input: {
    submissionNumber: string | null;
    hasReply?: boolean;
  }): string {
    if (input.hasReply) {
      return 'has_reply';
    }

    if (input.submissionNumber) {
      return 'sent';
    }

    return 'created';
  }

  async syncCaseStatus(
    caseId: string,
    overrides?: Partial<Pick<CaseRecord, 'institution_id' | 'template_id' | 'submission_number'>> & { hasReply?: boolean | null }
  ): Promise<string> {
    const caseRow = await this.getCaseById(caseId);

    if (!caseRow) {
      throw new Error('case not found');
    }

    const nextStatus = this.deriveCaseStatus({
      submissionNumber: overrides?.submission_number !== undefined ? overrides.submission_number : caseRow.submission_number,
      hasReply: overrides?.hasReply !== undefined && overrides?.hasReply !== null
        ? overrides.hasReply
        : caseRow.case_status === 'has_reply'
    });

    await postgres.query(
      `
      update cases
      set
        case_status = $2,
        updated_at = now()
      where id = $1
      `,
      [caseId, nextStatus]
    );

    return nextStatus;
  }

  async createCase(body?: { parentCaseId?: string | null }): Promise<CreateCaseResponse> {
    const caseNumber = await this.generateCaseNumber();
    const folders = await nextcloudClient.createCaseFolders(caseNumber);
    const adoptedFiles = await nextcloudClient.moveRootFilesToIncoming(folders.incoming);
    const parentCaseId = body?.parentCaseId?.trim() || null;

    if (parentCaseId) {
      const parentCase = await this.getCaseById(parentCaseId);
      if (!parentCase) {
        throw new Error('parent case not found');
      }
    }

    const insertResult = await postgres.query<CaseRecord>(
      `
      insert into cases (
        case_number,
        case_status,
        parent_case_id,
        institution_id,
        template_id,
        nextcloud_case_folder,
        nextcloud_incoming_folder,
        nextcloud_artifacts_folder,
        nextcloud_result_folder,
        case_date
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, to_char(now(), 'DD.MM.YYYY'))
      returning *
      `,
      [
        caseNumber,
        'created',
        parentCaseId,
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
        responseReady: false,
        submissionNumber: caseRow.submission_number,
        lastErrorCode: null,
        lastErrorMessage: null
      }
    };

    await fsmService.saveSnapshot(caseRow.id, fsm);

    await this.logCaseAction(caseRow.id, 'case.created', {
      caseNumber: caseRow.case_number,
      parentCaseId: caseRow.parent_case_id,
      nextcloudCaseFolder: caseRow.nextcloud_case_folder,
      nextcloudIncomingFolder: caseRow.nextcloud_incoming_folder,
      nextcloudArtifactsFolder: caseRow.nextcloud_artifacts_folder,
      nextcloudResultFolder: caseRow.nextcloud_result_folder,
      adoptedIncomingFiles: adoptedFiles.map((file) => ({
        fileName: file.fileName,
        filePath: file.filePath
      }))
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

    await nextcloudClient.deletePath(existing.nextcloud_case_folder);

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

    if (!fsmService.isEditableState(snapshot.state)) {
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

      const fsm = await fsmService.syncWorkingState(caseId, {
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

    if (!fsmService.isEditableState(snapshot.state)) {
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

      const fsm = await fsmService.syncWorkingState(caseId, {
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
    const files = await this.getCaseFiles(caseId);
    const relatedCases = await this.getRelatedCases(caseId);

    return {
      ok: true,
      case: caseRow,
      fsm,
      files,
      relatedCases
    };
  }

  async prepareSubmit(caseId: string) {
    const caseRow = await this.getCaseById(caseId);

    if (!caseRow) {
      throw new Error('case not found');
    }

    const snapshot = await fsmService.getSnapshot(caseId);

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

    const movedFiles: Array<{ id: string; nextPath: string }> = [];

    for (const file of selectedFiles) {
      const targetPath = this.buildArtifactFilePath(caseRow.nextcloud_artifacts_folder, file.file_name);
      const actualSourcePath = await this.resolveSelectedFileSourcePath(caseRow, file.file_path, file.file_name, targetPath);

      if (actualSourcePath !== targetPath) {
        await nextcloudClient.moveFile(actualSourcePath, targetPath);
      }

      if (file.file_path !== targetPath) {
        movedFiles.push({
          id: file.id,
          nextPath: targetPath
        });
      }
    }

    if (movedFiles.length > 0) {
      await postgres.query('begin');

      try {
        for (const movedFile of movedFiles) {
          await postgres.query(
            `
            update case_files
            set file_path = $3
            where case_id = $1
              and id = $2
            `,
            [caseId, movedFile.id, movedFile.nextPath]
          );
        }

        await postgres.query('commit');
      } catch (error) {
        await postgres.query('rollback');
        throw error;
      }
    }

    const preparedFiles = await this.getPreparedArtifactFiles(caseId, caseRow.nextcloud_artifacts_folder);
    const textContent = await nextcloudClient.downloadTextFile(textArtifact.file_path);

    const files: SubmitFilePayload[] = preparedFiles.map((file) => ({
      id: file.id,
      fileName: file.file_name,
      filePath: file.file_path,
      mimeType: file.mime_type,
      sizeBytes: file.size_bytes === null ? null : Number(file.size_bytes),
      previewUrl: file.preview_url,
      copyUrl: nextcloudClient.getFileUrl(file.file_path),
      sortOrder: file.sort_order
    }));

    await this.logCaseAction(caseId, 'submit.prepared', {
      movedFilesCount: movedFiles.length,
      movedFileIds: movedFiles.map((file) => file.id),
      artifactsFolder: caseRow.nextcloud_artifacts_folder
    });

    return {
      case: caseRow,
      text: textContent,
      submitUrl: institution.submit_url,
      files,
      fsm: snapshot
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
        c.case_status,
        c.parent_case_id,
        c.institution_id,
        c.template_id,
        c.title,
        c.description,
        c.nextcloud_case_folder,
        c.nextcloud_incoming_folder,
        c.nextcloud_artifacts_folder,
        c.nextcloud_result_folder,
        c.case_date,
        c.registration_date,
        c.submission_number,
        c.submitted_at,
        c.created_at,
        c.updated_at,
        i.name as institution_name,
        t.name as template_name,
        (
          select count(*)::int
          from cases child
          where child.parent_case_id = c.id
        ) as linked_cases_count,
        exists(
          select 1
          from case_files cf
          where cf.case_id = c.id
            and cf.file_path like c.nextcloud_result_folder || '/%'
        ) as has_reply
      from cases c
      left join institutions i on i.id = c.institution_id
      left join templates t on t.id = c.template_id
      order by
        coalesce(to_date(nullif(c.case_date, ''), 'DD.MM.YYYY'), c.created_at::date) desc,
        c.created_at desc
      `
    );

    return result.rows;
  }

  async getRelatedCases(parentCaseId: string): Promise<CaseRecord[]> {
    const result = await postgres.query<CaseRecord>(
      `
      select
        c.id,
        c.case_number,
        c.case_status,
        c.parent_case_id,
        c.institution_id,
        c.template_id,
        c.title,
        c.description,
        c.nextcloud_case_folder,
        c.nextcloud_incoming_folder,
        c.nextcloud_artifacts_folder,
        c.nextcloud_result_folder,
        c.case_date,
        c.registration_date,
        c.submission_number,
        c.submitted_at,
        c.created_at,
        c.updated_at,
        i.name as institution_name,
        t.name as template_name,
        0 as linked_cases_count,
        exists(
          select 1
          from case_files cf
          where cf.case_id = c.id
            and cf.file_path like c.nextcloud_result_folder || '/%'
        ) as has_reply
      from cases c
      left join institutions i on i.id = c.institution_id
      left join templates t on t.id = c.template_id
      where c.parent_case_id = $1
      order by
        coalesce(to_date(nullif(c.case_date, ''), 'DD.MM.YYYY'), c.created_at::date) desc,
        c.created_at desc
      `,
      [parentCaseId]
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

    if (!fsmService.isEditableState(snapshot.state)) {
      throw new Error(`invalid fsm state: ${snapshot.state}`);
    }

    const artifactPath = `${caseRow.nextcloud_artifacts_folder}/complaint.txt`;
    const content = await nextcloudClient.downloadTextFile(artifactPath);
    const variables = await this.getCaseVariables(caseId);
    const templateContent = this.restoreTemplateVariables(content, variables);

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
        category,
        institution_id,
        body_template,
        variables_schema,
        default_values
      )
      values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
      returning
        id,
        name,
        category,
        institution_id,
        body_template,
        variables_schema,
        default_values,
        created_at,
        updated_at
      `,
        [
        templateName,
        'authority',
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
        })
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
      limit 1
      `,
      [templateId]
    );

    return result.rows[0] ?? null;
  }

  private async getInstitutionById(institutionId: string): Promise<InstitutionRow | null> {
    const result = await postgres.query<InstitutionRow>(
      `
      select id, name, submit_url
      from institutions
      where id = $1
      limit 1
      `,
      [institutionId]
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

  private buildArtifactFilePath(artifactsFolder: string, fileName: string): string {
    return `${artifactsFolder.replace(/\/+$/, '')}/${fileName}`;
  }

  private async getPreparedArtifactFiles(caseId: string, artifactsFolder: string): Promise<ArtifactFolderFileRow[]> {
    const normalizedArtifactsFolder = artifactsFolder.replace(/\/+$/, '');
    const artifactsFolderPrefix = `${normalizedArtifactsFolder}/%`;
    const hiddenArtifactPaths = [
      `${normalizedArtifactsFolder}/complaint.txt`,
      `${normalizedArtifactsFolder}/submission-package.json`
    ];

    const result = await postgres.query<ArtifactFolderFileRow>(
      `
      select
        id,
        file_path,
        file_name,
        mime_type,
        size_bytes,
        preview_url,
        sort_order
      from case_files
      where case_id = $1
        and file_path like $2
        and file_path <> all($3::text[])
      order by
        coalesce(sort_order, 0),
        created_at,
        file_name
      `,
      [caseId, artifactsFolderPrefix, hiddenArtifactPaths]
    );

    return result.rows;
  }

  private buildIncomingFilePath(incomingFolder: string, fileName: string): string {
    return `${incomingFolder.replace(/\/+$/, '')}/${fileName}`;
  }

  private buildResultFilePath(resultFolder: string, fileName: string): string {
    return `${resultFolder.replace(/\/+$/, '')}/${fileName}`;
  }

  private async resolveSelectedFileSourcePath(
    caseRow: CaseRecord,
    currentPath: string,
    fileName: string,
    artifactTargetPath: string
  ): Promise<string> {
    if (currentPath === artifactTargetPath) {
      return artifactTargetPath;
    }

    if (await nextcloudClient.pathExists(currentPath)) {
      return currentPath;
    }

    if (await nextcloudClient.pathExists(artifactTargetPath)) {
      return artifactTargetPath;
    }

    const incomingPath = this.buildIncomingFilePath(caseRow.nextcloud_incoming_folder, fileName);
    if (incomingPath !== currentPath && await nextcloudClient.pathExists(incomingPath)) {
      return incomingPath;
    }

    const resultPath = this.buildResultFilePath(caseRow.nextcloud_result_folder, fileName);
    if (await nextcloudClient.pathExists(resultPath)) {
      return resultPath;
    }

    return currentPath;
  }

  private async getCaseFiles(caseId: string): Promise<CaseFileRow[]> {
    const result = await postgres.query<CaseFileRow>(
      `
      select
        cf.id,
        cf.case_id,
        cf.file_path,
        cf.file_name,
        cf.mime_type,
        cf.size_bytes,
        cf.checksum,
        cf.preview_url,
        cf.selected_for_submission,
        cf.sort_order,
        cf.source_mtime,
        cf.created_at
      from case_files cf
      join cases c on c.id = cf.case_id
      where cf.case_id = $1
        and not (cf.file_path like c.nextcloud_result_folder || '/%')
      order by cf.selected_for_submission desc, cf.sort_order asc nulls last, cf.created_at asc
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

  private async getTextArtifact(caseId: string, artifactsFolder: string): Promise<ArtifactRow | null> {
    const existing = await this.getArtifactByType(caseId, 'generated_text');

    if (existing) {
      return existing;
    }

    const fallbackPath = `${artifactsFolder.replace(/\/+$/, '')}/complaint.txt`;

    try {
      await nextcloudClient.downloadTextFile(fallbackPath);
    } catch {
      return null;
    }

    await postgres.query(
      `
      insert into case_artifacts (case_id, artifact_type, file_path)
      values ($1, $2, $3)
      `,
      [caseId, 'generated_text', fallbackPath]
    );

    return {
      id: '',
      artifact_type: 'generated_text',
      file_path: fallbackPath,
      created_at: new Date().toISOString()
    };
  }

  private renderTemplate(template: string, variables: Record<string, unknown>): string {
    const rendered = template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
      const value = variables[key];

      if (value === undefined || value === null) {
        return '';
      }

      return this.formatTemplateVariableValue(key, value);
    });

    return this.collapseDuplicateDateSuffixes(rendered);
  }

  private restoreTemplateVariables(content: string, variables: Record<string, string>): string {
    const replacements: Array<{ key: string; value: string }> = [
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

  private formatTemplateVariableValue(key: string, value: unknown): string {
    const raw = String(value);
    return key === 'complaint_date' ? this.formatComplaintDate(raw) : raw;
  }

  private formatComplaintDate(value: string): string {
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

  private collapseDuplicateDateSuffixes(text: string): string {
    return String(text ?? '').replace(
      /(\d{1,2}\s+[А-Яа-яЁё]+\s+\d{4})\s*г\.\s*г\./g,
      '$1 г.'
    );
  }
  async updateCaseMeta(
    caseId: string,
    body: {
      title?: string | null;
      description?: string | null;
      caseDate?: string | null;
      registrationDate?: string | null;
      submissionNumber?: string | null;
      responseComment?: string | null;
    }
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
    const caseDate =
      body?.caseDate !== undefined
        ? (body.caseDate ?? '').trim()
        : existing.case_date;
    const registrationDate =
      body?.registrationDate !== undefined
        ? (body.registrationDate ?? '').trim()
        : existing.registration_date;
    const submissionNumber =
      body?.submissionNumber !== undefined
        ? (body.submissionNumber ?? '').trim()
        : existing.submission_number;
    const responseComment =
      body?.responseComment !== undefined
        ? (body.responseComment ?? '').trim()
        : existing.response_comment;

    const result = await postgres.query<CaseRecord>(
      `
      update cases
      set
        title = $2,
        description = $3,
        case_date = $4,
        registration_date = $5,
        submission_number = $6,
        response_comment = $7,
        case_status = $8,
        updated_at = now()
      where id = $1
      returning *
      `,
      [
        caseId,
        title || null,
        description || null,
        caseDate || existing.case_date,
        registrationDate || null,
        submissionNumber || null,
        responseComment || null,
        this.deriveCaseStatus({
          submissionNumber: submissionNumber || null,
          hasReply: existing.case_status === 'has_reply'
        })
      ]
    );

    await this.logCaseAction(caseId, 'case.meta.updated', {
      title: title || null,
      description: description || null,
      caseDate: caseDate || existing.case_date,
      registrationDate: registrationDate || null,
      submissionNumber: submissionNumber || null,
      responseComment: responseComment || null
    });

    return result.rows[0];
  }
}

export const casesService = new CasesService();
