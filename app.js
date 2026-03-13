import { api } from "./api.js";

const state = {
  currentScreen: "dashboard",
  currentCaseId: null,
  currentCase: null,
  currentCaseFiles: [],
  institutions: [],
  templates: [],
  cases: [],
  casesSearch: "",
  variables: {},
  packageData: null,
  submitData: null,
  textContent: "",
  editingInstitutionId: null,
  editingTemplateId: null,
};

const FIXED_VARIABLES = [
  {
    key: "complaint_date",
    enabledKey: "complaint_date_enabled",
    label: "Дата",
    type: "date",
    token: "{{complaint_date}}"
  },
  {
    key: "address",
    enabledKey: "address_enabled",
    label: "Адрес",
    type: "text",
    token: "{{address}}"
  },
  {
    key: "license_plate",
    enabledKey: "license_plate_enabled",
    label: "Гос.номер",
    type: "text",
    token: "{{license_plate}}"
  }
];

const els = {
  screens: [...document.querySelectorAll("[data-screen-panel]")],
  navButtons: [...document.querySelectorAll(".nav-btn")],
  tabButtons: [...document.querySelectorAll(".tab-btn")],
  tabPanels: [...document.querySelectorAll("[data-tab-panel]")],

  btnRefreshCases: document.getElementById("btnRefreshCases"),
  btnCreateCase: document.getElementById("btnCreateCase"),
  casesList: document.getElementById("casesList"),

  btnRefreshInstitutions: document.getElementById("btnRefreshInstitutions"),
  btnToggleInstitutionForm: document.getElementById("btnToggleInstitutionForm"),
  btnCreateInstitution: document.getElementById("btnCreateInstitution"),
  btnCancelInstitution: document.getElementById("btnCancelInstitution"),
  btnCancelTemplate: document.getElementById("btnCancelTemplate"),
  institutionFormPanel: document.getElementById("institutionFormPanel"),
  institutionsList: document.getElementById("institutionsList"),
  institutionName: document.getElementById("institutionName"),
  institutionSubmitUrl: document.getElementById("institutionSubmitUrl"),
  institutionMaxAttachments: document.getElementById("institutionMaxAttachments"),
  institutionMaxTextLength: document.getElementById("institutionMaxTextLength"),
  institutionAcceptedFormats: document.getElementById("institutionAcceptedFormats"),
  institutionActive: document.getElementById("institutionActive"),

  btnRefreshTemplates: document.getElementById("btnRefreshTemplates"),
  btnToggleTemplateForm: document.getElementById("btnToggleTemplateForm"),
  btnCreateTemplate: document.getElementById("btnCreateTemplate"),
  templateFormPanel: document.getElementById("templateFormPanel"),
  templatesList: document.getElementById("templatesList"),
  templateName: document.getElementById("templateName"),
  templateInstitutionSelect: document.getElementById("templateInstitutionSelect"),
  templateBody: document.getElementById("templateBody"),
  templateVariablesSchema: document.getElementById("templateVariablesSchema"),
  templateDefaultValues: document.getElementById("templateDefaultValues"),
  templateActive: document.getElementById("templateActive"),

  btnBackToCases: document.getElementById("btnBackToCases"),
  btnReloadCase: document.getElementById("btnReloadCase"),
  workspaceTitle: document.getElementById("workspaceTitle"),
  workspaceSubtitle: document.getElementById("workspaceSubtitle"),

  workspaceFilesList: document.getElementById("workspaceFilesList"),
  btnSyncFiles: document.getElementById("btnSyncFiles"),
  btnSaveFilesSelection: document.getElementById("btnSaveFilesSelection"),

  caseInstitutionSelect: document.getElementById("caseInstitutionSelect"),
  caseTemplateSelect: document.getElementById("caseTemplateSelect"),
  btnSaveCaseConfig: document.getElementById("btnSaveCaseConfig"),
  btnLoadVariables: document.getElementById("btnLoadVariables"),
  btnSaveVariables: document.getElementById("btnSaveVariables"),
  variablesForm: document.getElementById("variablesForm"),
  variablesEmptyState: document.getElementById("variablesEmptyState"),

  caseTitle: document.getElementById("caseTitle"),
  caseDescription: document.getElementById("caseDescription"),
  btnSaveCaseMeta: document.getElementById("btnSaveCaseMeta"),

  btnSaveText: document.getElementById("btnSaveText"),
  caseTextEditor: document.getElementById("caseTextEditor"),
  textVariableToolbar: document.getElementById("textVariableToolbar"),

  btnBuildPackage: document.getElementById("btnBuildPackage"),
  packageViewer: document.getElementById("packageViewer"),
  btnCopySubmitText: document.getElementById("btnCopySubmitText"),
  btnCopySubmitUrl: document.getElementById("btnCopySubmitUrl"),
  btnDownloadSubmitFiles: document.getElementById("btnDownloadSubmitFiles"),
  submitText: document.getElementById("submitText"),
  submitInstitutionUrl: document.getElementById("submitInstitutionUrl"),
  submitInstitutionUrlPretty: document.getElementById("submitInstitutionUrlPretty"),
  submitFilesList: document.getElementById("submitFilesList"),

  imageModal: document.getElementById("imageModal"),
  imageModalBackdrop: document.getElementById("imageModalBackdrop"),
  btnCloseImageModal: document.getElementById("btnCloseImageModal"),
  imageModalBody: document.getElementById("imageModalBody"),
  imageModalControls: document.getElementById("imageModalControls"),
  imageModalSelectedCheckbox: document.getElementById("imageModalSelectedCheckbox"),

  caseTitle: document.getElementById("caseTitle"),
  caseDescription: document.getElementById("caseDescription"),
  caseNumberReadonly: document.getElementById("caseNumberReadonly"),
  btnSaveCaseMeta: document.getElementById("btnSaveCaseMeta"),
  btnSaveAsTemplate: document.getElementById("btnSaveAsTemplate"),

  btnShowRuntimeLog: document.getElementById("btnShowRuntimeLog"),
  runtimeLogModal: document.getElementById("runtimeLogModal"),
  runtimeLogBackdrop: document.getElementById("runtimeLogBackdrop"),
  btnCloseRuntimeLog: document.getElementById("btnCloseRuntimeLog"),
  casesSearchInput: document.getElementById("casesSearchInput"),

  runtimeLog: document.getElementById("runtimeLog")
};

els.templateVariableToolbar = document.getElementById("templateVariableToolbar");

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatComplaintDate(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
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

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date) + " г.";
}

function getRenderableVariableValue(field, variables) {
  const enabled = String(variables[field.enabledKey] ?? "true").toLowerCase() === "true";

  if (!enabled) {
    return "";
  }

  const rawValue = String(variables[field.key] ?? "");
  return field.key === "complaint_date" ? formatComplaintDate(rawValue) : rawValue;
}

function getDefaultTemplateValues() {
  return {
    complaint_date: "",
    address: "",
    license_plate: ""
  };
}

function getTemplateVariablesSchema() {
  return FIXED_VARIABLES.map(({ key, label, type }) => ({
    key,
    label,
    type,
    required: false
  }));
}

function normalizeVariableState(variables = {}) {
  const normalized = { ...variables };

  for (const field of FIXED_VARIABLES) {
    const rawEnabled = normalized[field.enabledKey];
    const enabled = rawEnabled === undefined ? true : String(rawEnabled).toLowerCase() === "true";
    normalized[field.enabledKey] = String(enabled);

    if (normalized[field.key] === undefined || normalized[field.key] === null || normalized[field.key] === "") {
      normalized[field.key] = field.key === "complaint_date" ? getTodayInputValue() : "";
    }
  }

  return normalized;
}

function openRuntimeLogModal() {
  els.runtimeLogModal.classList.remove("hidden");
}

function closeRuntimeLogModal() {
  els.runtimeLogModal.classList.add("hidden");
}

async function copyToClipboard(text, successMessage = "Скопировано") {
  await navigator.clipboard.writeText(String(text || ""));
  alert(successMessage);
}

function logRuntime(title, payload) {
  const message = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  els.runtimeLog.textContent = `[${new Date().toISOString()}] ${title}\n\n${message}`;
}

function setScreen(name) {
  state.currentScreen = name;
  els.screens.forEach((screen) => {
    screen.classList.toggle("hidden", screen.dataset.screenPanel !== name);
  });
  els.navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.screen === name);
  });
}

function setWorkspaceTab(name) {
  if (name === "submit" && !canOpenSubmitTab()) {
    return;
  }

  els.tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === name);
  });
  els.tabPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.tabPanel !== name);
  });
}

function canOpenSubmitTab() {
  return Boolean(state.submitData?.preparedAt);
}

function updateWorkspaceTabAvailability() {
  els.tabButtons.forEach((btn) => {
    if (btn.dataset.tab === "submit") {
      btn.disabled = !canOpenSubmitTab();
    } else {
      btn.disabled = false;
    }
  });
}

function resetInstitutionForm() {
  state.editingInstitutionId = null;
  els.institutionName.value = "";
  els.institutionSubmitUrl.value = "";
  els.institutionMaxAttachments.value = "5";
  els.institutionMaxTextLength.value = "4000";
  els.institutionAcceptedFormats.value = "image/jpeg,image/png";
  els.institutionActive.checked = true;
  els.btnCreateInstitution.textContent = "Сохранить организацию";
}

function resetTemplateForm() {
  state.editingTemplateId = null;
  els.templateName.value = "";
  els.templateInstitutionSelect.value = "";
  els.templateBody.value = "";
  els.templateActive.checked = true;
  els.btnCreateTemplate.textContent = "Сохранить шаблон";
}

function openInstitutionEdit(item) {
  state.editingInstitutionId = item.id;
  els.institutionName.value = item.name || "";
  els.institutionSubmitUrl.value = item.submit_url || "";
  els.institutionMaxAttachments.value = String(item.max_attachments ?? 5);
  els.institutionMaxTextLength.value = String(item.max_text_length ?? 4000);
  els.institutionAcceptedFormats.value = Array.isArray(item.accepted_formats)
    ? item.accepted_formats.join(",")
    : "image/jpeg,image/png";
  els.institutionActive.checked = Boolean(item.active);
  els.btnCreateInstitution.textContent = "Сохранить изменения";
  els.institutionFormPanel.classList.remove("hidden");
  setScreen("institutions");
}

function openTemplateEdit(item) {
  state.editingTemplateId = item.id;
  els.templateName.value = item.name || "";
  els.templateInstitutionSelect.value = item.institution_id || "";
  els.templateBody.value = item.body_template || "";
  els.templateActive.checked = Boolean(item.active);
  els.btnCreateTemplate.textContent = "Сохранить изменения";
  els.templateFormPanel.classList.remove("hidden");
  setScreen("templates");
}

function getPreviewUrl(caseId, fileId) {
  return `https://complaints-api.doorsvip.ru/complaints/api/cases/${caseId}/files/${fileId}/preview`;
}

function isImageMime(mimeType) {
  return ["image/jpeg", "image/png", "image/webp"].includes(mimeType || "");
}

function isVideoMime(mimeType) {
  return ["video/mp4", "video/webm", "video/quicktime"].includes(mimeType || "");
}

function isPdfMime(mimeType) {
  return mimeType === "application/pdf";
}

function renderVariableToolbar(container, targetTextarea, mode = "token") {
  if (!container || !targetTextarea) return;

  container.innerHTML = FIXED_VARIABLES.map((field) => (
    `<button class="variable-chip" type="button" data-variable-chip-key="${escapeHtml(field.key)}">${escapeHtml(field.label)}</button>`
  )).join("");

  container.querySelectorAll("[data-variable-chip-key]").forEach((button) => {
    button.addEventListener("click", () => {
      const field = FIXED_VARIABLES.find((item) => item.key === button.dataset.variableChipKey);
      if (!field) return;

      if (mode === "value") {
        const variables = normalizeVariableState(state.variables);
        insertAtCursor(targetTextarea, getRenderableVariableValue(field, variables));
        return;
      }

      insertAtCursor(targetTextarea, field.token);
    });
  });
}

function insertAtCursor(textarea, value) {
  if (!textarea) return;

  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  textarea.value = `${before}${value}${after}`;
  textarea.focus();
  const caret = start + value.length;
  textarea.setSelectionRange(caret, caret);
}

function openImageModal(src, mimeType = "image/jpeg", title = "", fileId = null) {
  if (isVideoMime(mimeType)) {
    els.imageModalBody.innerHTML = `<video class="modal-media" src="${escapeHtml(src)}" controls preload="metadata" playsinline></video>`;
  } else if (isPdfMime(mimeType)) {
    els.imageModalBody.innerHTML = `<iframe class="modal-media pdf-modal-frame" src="${escapeHtml(src)}#toolbar=0&navpanes=0"></iframe>`;
  } else {
    els.imageModalBody.innerHTML = `<img class="image-modal-img" src="${escapeHtml(src)}" alt="${escapeHtml(title || "preview")}" />`;
  }

  if (fileId) {
    const file = state.currentCaseFiles.find((item) => item.id === fileId);
    els.imageModalControls.classList.remove("hidden");
    els.imageModalSelectedCheckbox.checked = Boolean(file?.selected_for_submission);
    els.imageModalSelectedCheckbox.dataset.fileId = fileId;
  } else {
    els.imageModalControls.classList.add("hidden");
    els.imageModalSelectedCheckbox.checked = false;
    delete els.imageModalSelectedCheckbox.dataset.fileId;
  }

  els.imageModal.classList.remove("hidden");
}

function closeImageModal() {
  els.imageModal.classList.add("hidden");
  els.imageModalBody.innerHTML = "";
  els.imageModalControls.classList.add("hidden");
  els.imageModalSelectedCheckbox.checked = false;
  delete els.imageModalSelectedCheckbox.dataset.fileId;
}

function getPreviewMarkup(file, opts = {}) {
  const src = getPreviewUrl(state.currentCaseId, file.id);
  const mimeType = file.mime_type || file.mimeType || "";
  const title = file.file_name || file.fileName || "preview";
  const previewAttr = opts.attrName || "data-preview-file-id";
  const clickable = opts.clickable !== false;
  const wrapperAttr = clickable ? `${previewAttr}="${file.id}"` : "";

  if (isImageMime(mimeType)) {
    return `<button class="preview-button" type="button" ${wrapperAttr}><img class="image-thumb" src="${src}" alt="${escapeHtml(title)}" /></button>`;
  }

  if (isVideoMime(mimeType)) {
    return `
      <button class="preview-button" type="button" ${wrapperAttr}>
        <video class="media-thumb" src="${src}" muted preload="metadata" playsinline></video>
        <span class="thumb-badge">Видео</span>
      </button>
    `;
  }

  if (isPdfMime(mimeType)) {
    return `
      <button class="preview-button" type="button" ${wrapperAttr}>
        <iframe class="pdf-thumb" src="${src}#toolbar=0&navpanes=0&scrollbar=0" title="${escapeHtml(title)}"></iframe>
        <span class="thumb-badge">PDF</span>
      </button>
    `;
  }

  return `
    <button class="preview-button" type="button" ${wrapperAttr}>
      <span class="file-thumb media-tile">${escapeHtml((mimeType || "FILE").toUpperCase())}</span>
    </button>
  `;
}

function bindPreviewOpeners(root = document) {
  root.querySelectorAll("[data-preview-file-id]").forEach((node) => {
    node.addEventListener("click", () => {
      const file = state.currentCaseFiles.find((item) => item.id === node.dataset.previewFileId);
      if (!file) return;
      openImageModal(getPreviewUrl(state.currentCaseId, file.id), file.mime_type, file.file_name, file.id);
    });
  });
}

function syncModalSelectionState(fileId, selected) {
  const file = state.currentCaseFiles.find((item) => item.id === fileId);
  if (file) {
    file.selected_for_submission = selected;
  }
  const workspaceCheckbox = els.workspaceFilesList.querySelector(`[data-file-selected-id="${fileId}"]`);
  if (workspaceCheckbox) {
    workspaceCheckbox.checked = selected;
  }
}

function buildComputedTextPreview() {
  const template = getCurrentTemplate();
  if (!template?.body_template) {
    return "";
  }

  const variables = normalizeVariableState(state.variables);
  return template.body_template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
    const field = FIXED_VARIABLES.find((item) => item.key === key);
    if (field) {
      return getRenderableVariableValue(field, variables);
    }

    return String(variables[key] ?? "");
  });
}

function getCaseStatusBadges(item) {
  const badges = [];

  if (!item.institution_id) {
    badges.push({ text: "NO INSTITUTION", cls: "warn" });
  }

  if (!item.template_id) {
    badges.push({ text: "NO TEMPLATE", cls: "warn" });
  }

  if (item.template_id && !item.submission_number) {
    badges.push({ text: "CONFIGURED", cls: "info" });
  }

  if (item.submission_number) {
    badges.push({ text: "SUBMITTED", cls: "ready" });
  }

  return badges;
}

function renderCases() {
  const query = (state.casesSearch || "").trim().toLowerCase();

  const filteredCases = state.cases.filter((item) => {
    if (!query) return true;

    const haystack = [
      item.title || "",
      item.description || "",
      item.case_number || "",
      item.institution_name || "",
      item.template_name || ""
    ].join(" ").toLowerCase();

    return haystack.includes(query);
  });

  if (!filteredCases.length) {
    els.casesList.innerHTML = '<div class="notice">Ничего не найдено.</div>';
    return;
  }

  els.casesList.innerHTML = filteredCases.map((item) => {
    const badges = getCaseStatusBadges(item)
      .map((badge) => `<span class="status-badge ${badge.cls}">${escapeHtml(badge.text)}</span>`)
      .join("");

    return `
      <div class="table-row cases-row">
        <div>
          <div class="row-title">${escapeHtml(item.title || "Без названия")}</div>
          <div class="row-meta">${escapeHtml(item.description || "")}</div>
          <div class="status-badges">${badges}</div>
        </div>
        <div>
          <div class="row-meta">Case</div>
          <div>${escapeHtml(item.case_number)}</div>
        </div>
        <div>
          <div class="row-meta">Организация</div>
          <div>${escapeHtml(item.institution_name || "—")}</div>
        </div>
        <div>
          <div class="row-meta">Шаблон</div>
          <div>${escapeHtml(item.template_name || "—")}</div>
        </div>
        <div>
          <div class="row-meta">updated_at</div>
          <div>${escapeHtml(item.updated_at || "—")}</div>
        </div>
        <div class="actions">
          <button class="btn btn-primary" data-open-case-id="${item.id}">Открыть</button>
          <button class="btn btn-secondary" data-delete-case-id="${item.id}" data-delete-case-number="${item.case_number}">Удалить</button>
        </div>
      </div>
    `;
  }).join("");

  document.querySelectorAll("[data-open-case-id]").forEach((btn) => {
    btn.addEventListener("click", () => handle(() => openCase(btn.dataset.openCaseId)));
  });

  document.querySelectorAll("[data-delete-case-id]").forEach((btn) => {
    btn.addEventListener("click", () => handle(() => deleteCaseFromList(
      btn.dataset.deleteCaseId,
      btn.dataset.deleteCaseNumber
    )));
  });
}

function renderInstitutions() {
  if (!state.institutions.length) {
    els.institutionsList.innerHTML = '<div class="notice">Организаций пока нет.</div>';
  } else {
    els.institutionsList.innerHTML = state.institutions.map((item) => `
      <div class="table-row compact-4">
        <div>
          <div class="row-title">${escapeHtml(item.name)}</div>
          <div class="row-meta">${escapeHtml(item.id)}</div>
        </div>
        <div>${escapeHtml(item.submit_url)}</div>
        <div>${item.active ? "active" : "inactive"}</div>
        <div class="actions">
          <button class="btn btn-primary" data-edit-institution-id="${item.id}">Редактировать</button>
          <button class="btn btn-secondary" data-delete-institution-id="${item.id}" data-delete-institution-name="${escapeHtml(item.name)}">Удалить</button>
        </div>
      </div>
    `).join("");
  }

  document.querySelectorAll("[data-edit-institution-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = state.institutions.find((x) => x.id === btn.dataset.editInstitutionId);
      if (item) openInstitutionEdit(item);
    });
  });
  document.querySelectorAll("[data-delete-institution-id]").forEach((btn) => {
  btn.addEventListener("click", () => handle(() => deleteInstitutionFromList(
    btn.dataset.deleteInstitutionId,
    btn.dataset.deleteInstitutionName
  )));
});

  fillInstitutionSelects();
}

function renderTemplates() {
  if (!state.templates.length) {
    els.templatesList.innerHTML = '<div class="notice">Шаблонов пока нет.</div>';
  } else {
    els.templatesList.innerHTML = state.templates.map((item) => `
      <div class="table-row compact-4">
        <div>
          <div class="row-title">${escapeHtml(item.name)}</div>
          <div class="row-meta">${escapeHtml(item.id)}</div>
        </div>
        <div>${escapeHtml(item.institution_id || "—")}</div>
        <div>${item.active ? "active" : "inactive"}</div>
       <div class="actions">
         <button class="btn btn-primary" data-edit-template-id="${item.id}">Редактировать</button>
         <button class="btn btn-secondary" data-delete-template-id="${item.id}" data-delete-template-name="${escapeHtml(item.name)}">Удалить</button>
       </div>
      </div>
    `).join("");
  }

  document.querySelectorAll("[data-edit-template-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = state.templates.find((x) => x.id === btn.dataset.editTemplateId);
      if (item) openTemplateEdit(item);
    });
  });
  document.querySelectorAll("[data-delete-template-id]").forEach((btn) => {
  btn.addEventListener("click", () => handle(() => deleteTemplateFromList(
    btn.dataset.deleteTemplateId,
    btn.dataset.deleteTemplateName
  )));
});

  fillTemplateSelect();
}

function fillInstitutionSelects() {
  const options = ['<option value="">— не выбрано —</option>']
    .concat(state.institutions.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`))
    .join("");

  els.templateInstitutionSelect.innerHTML = options;
  els.caseInstitutionSelect.innerHTML = options;
}

function fillTemplateSelect() {
  const options = ['<option value="">— не выбрано —</option>']
    .concat(state.templates.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`))
    .join("");

  els.caseTemplateSelect.innerHTML = options;
}

function getCurrentTemplate() {
  const templateId = state.currentCase?.case?.template_id || "";
  return state.templates.find((item) => item.id === templateId) || null;
}

function renderVariablesForm() {
  const template = getCurrentTemplate();

  if (!state.currentCaseId) {
    els.variablesForm.innerHTML = "";
    els.variablesEmptyState.textContent = "Сначала откройте кейс.";
    els.variablesEmptyState.classList.remove("hidden");
    return;
  }

  if (!template) {
    els.variablesForm.innerHTML = "";
    els.variablesEmptyState.textContent = "Сначала выберите шаблон в карточке кейса.";
    els.variablesEmptyState.classList.remove("hidden");
    return;
  }

  const defaults = normalizeVariableState(template.default_values && typeof template.default_values === "object"
    ? template.default_values
    : {});
  const current = normalizeVariableState(state.variables);

  els.variablesEmptyState.classList.add("hidden");
  els.variablesEmptyState.textContent = "";
  els.variablesForm.innerHTML = FIXED_VARIABLES
    .map((field) => {
      const value = current[field.key] ?? defaults[field.key] ?? "";
      const enabled = String(current[field.enabledKey] ?? defaults[field.enabledKey] ?? "true").toLowerCase() === "true";
      const inputType = field.type === "date" ? "date" : "text";

      return `
        <div class="variable-item">
          <div class="variable-item-meta">
            <div class="row-title">${escapeHtml(field.label)}</div>
            <label class="variable-toggle">
              <input type="checkbox" data-variable-enabled-key="${escapeHtml(field.enabledKey)}" ${enabled ? "checked" : ""} />
              Использовать при рендере
            </label>
            <div class="row-meta">Токен для шаблона: ${escapeHtml(field.token)}</div>
          </div>
          <div class="field">
            <label for="var-${escapeHtml(field.key)}">Значение</label>
            <input id="var-${escapeHtml(field.key)}" type="${inputType}" data-variable-input-key="${escapeHtml(field.key)}" value="${escapeHtml(value)}" />
          </div>
        </div>
      `;
    })
    .join("");
}

async function saveCaseMeta() {
  if (!state.currentCaseId) return;

  return withButtonLoading(els.btnSaveCaseMeta, "Сохранение...", async () => {
    const payload = {
      title: els.caseTitle.value.trim(),
      description: els.caseDescription.value.trim()
    };

    const data = await api.updateCaseMeta(state.currentCaseId, payload);

    logRuntime("save case meta", data);

    alert("Карточка кейса сохранена");

    await reloadCurrentCase();
  });
}

function renderWorkspaceSummary() {
  const caseData = state.currentCase?.case || {};

  els.workspaceTitle.textContent = caseData.title
    ? `${caseData.title}`
    : (caseData.case_number ? `Кейс ${caseData.case_number}` : "Кейс");

  els.workspaceSubtitle.textContent = caseData.description || state.currentCaseId || "";

  els.caseInstitutionSelect.value = caseData.institution_id || "";
  els.caseTemplateSelect.value = caseData.template_id || "";

  els.caseTitle.value = caseData.title || "";
  els.caseDescription.value = caseData.description || "";
  els.caseNumberReadonly.value = caseData.case_number || "";
  updateWorkspaceTabAvailability();
  renderVariablesForm();
}

function renderWorkspaceFiles() {
  const allFiles = [...state.currentCaseFiles];

  if (!allFiles.length) {
    els.workspaceFilesList.innerHTML = '<div class="notice">Файлы ещё не синхронизированы. Нажми "Sync files", чтобы получить содержимое папки incoming.</div>';
    return;
  }

  const sorted = allFiles.sort((a, b) => {
    const selectedDiff = Number(Boolean(b.selected_for_submission)) - Number(Boolean(a.selected_for_submission));
    if (selectedDiff !== 0) {
      return selectedDiff;
    }

    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  els.workspaceFilesList.innerHTML = sorted.map((file, index) => {
    const thumb = getPreviewMarkup(file);
    const isSelected = Boolean(file.selected_for_submission);

    return `
      <div class="file-card ${isSelected ? "selected" : ""}">
        ${thumb}
        <div class="file-card-main">
          <div class="row-title">${escapeHtml(file.file_name || "unnamed")}</div>
          <div class="row-meta">${escapeHtml(file.mime_type || "unknown")} · ${file.size_bytes || 0} bytes</div>
          <div class="row-meta" data-file-status-id="${file.id}">${isSelected ? `В подаче · порядок ${file.sort_order ?? index}` : "Не выбран для подачи"}</div>
        </div>
        <div class="file-card-controls">
          <input class="file-order" type="number" min="0" value="${file.sort_order ?? index}" data-file-order-id="${file.id}" />
          <label class="file-select-toggle"><input type="checkbox" data-file-selected-id="${file.id}" ${isSelected ? "checked" : ""} /> В подачу</label>
        </div>
      </div>
    `;
  }).join("");

  bindPreviewOpeners(els.workspaceFilesList);
  els.workspaceFilesList.querySelectorAll("[data-file-selected-id]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const fileId = checkbox.dataset.fileSelectedId;
      const card = checkbox.closest(".file-card");
      const status = els.workspaceFilesList.querySelector(`[data-file-status-id="${fileId}"]`);
      const orderInput = els.workspaceFilesList.querySelector(`[data-file-order-id="${fileId}"]`);

      syncModalSelectionState(fileId, checkbox.checked);

      if (card) {
        card.classList.toggle("selected", checkbox.checked);
      }

      if (status) {
        status.textContent = checkbox.checked
          ? `В подаче · порядок ${orderInput?.value || 0}`
          : "Не выбран для подачи";
      }
    });
  });
}

function renderText() {
  els.caseTextEditor.value = state.textContent || "";
}

function renderPackage() {
  const packageData = state.packageData || {};
  const attachments = Array.isArray(packageData.attachments) ? packageData.attachments : [];
  const institution = state.institutions.find((item) => item.id === packageData?.case?.institutionId);
  const template = state.templates.find((item) => item.id === packageData?.case?.templateId);

  if (!packageData.case) {
    els.packageViewer.innerHTML = '<div class="notice">Пакет ещё не собран.</div>';
    return;
  }

  els.packageViewer.innerHTML = `
    <div class="package-section">
      <h4>Основная информация</h4>
      <div class="package-grid">
        <div class="package-item"><div class="summary-label">Кейс</div><div class="summary-value">${escapeHtml(packageData.case.caseNumber || "—")}</div></div>
        <div class="package-item"><div class="summary-label">Организация</div><div class="summary-value">${escapeHtml(institution?.name || "—")}</div></div>
        <div class="package-item"><div class="summary-label">Шаблон</div><div class="summary-value">${escapeHtml(template?.name || "—")}</div></div>
        <div class="package-item"><div class="summary-label">Выбрано файлов</div><div class="summary-value">${attachments.length}</div></div>
      </div>
    </div>
    <div class="package-section">
      <h4>Текст жалобы</h4>
      <div class="package-item">${escapeHtml(shorten(packageData?.text?.content || "", 700))}</div>
    </div>
    <div class="package-section">
      <h4>Вложения</h4>
      <div class="package-grid">
        ${attachments.map((item) => `
          <div class="package-item">
            <div class="row-title">${escapeHtml(item.fileName || "unnamed")}</div>
            <div class="row-meta">${escapeHtml(item.mimeType || "unknown")} · ${item.sizeBytes || 0} bytes</div>
            <div class="row-meta">${escapeHtml(item.filePath || "")}</div>
          </div>
        `).join("") || '<div class="notice">Вложений нет.</div>'}
      </div>
    </div>
  `;
}

function formatUrlPreview(value, max = 88) {
  const url = String(value || "").trim();
  if (!url) return "—";

  try {
    const parsed = new URL(url);
    const compact = `${parsed.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    return shorten(compact, max);
  } catch {
    return shorten(url, max);
  }
}

function renderSubmit() {
  const submit = state.submitData || {};
  const files = Array.isArray(submit.files) ? submit.files : [];

  els.submitText.value = submit.text || "";
  els.submitInstitutionUrl.value = submit.submitUrl || "";
  els.submitInstitutionUrlPretty.textContent = submit.submitUrl
    ? formatUrlPreview(submit.submitUrl, 120)
    : "";
  els.submitInstitutionUrlPretty.classList.toggle("hidden", !submit.submitUrl);

  if (!files.length) {
    els.submitFilesList.innerHTML = '<div class="notice">Файлы для submit ещё не подготовлены.</div>';
    return;
  }

  els.submitFilesList.innerHTML = files.map((file) => {
    const thumb = getPreviewMarkup({
      id: file.id,
      file_name: file.fileName,
      mime_type: file.mimeType
    });

    return `
      <div class="file-card">
        ${thumb}
        <div class="file-card-main">
          <div class="row-title">${escapeHtml(file.fileName || "unnamed")}</div>
          <div class="row-meta">${escapeHtml(file.mimeType || "unknown")} · ${file.sizeBytes || 0} bytes</div>
          <div class="row-meta">${escapeHtml(file.filePath || "")}</div>
          <div class="url-preview file-url-preview">${escapeHtml(formatUrlPreview(file.copyUrl, 100))}</div>
        </div>
        <div class="file-card-controls">
          <button class="btn btn-secondary" data-download-submit-file-id="${file.id}" data-download-submit-file-name="${escapeHtml(file.fileName || "file.bin")}">Скачать</button>
        </div>
      </div>
    `;
  }).join("");

  bindPreviewOpeners(els.submitFilesList);

  document.querySelectorAll("[data-download-submit-file-id]").forEach((button) => {
    button.addEventListener("click", () => {
      handle(() => downloadSubmitFile(button.dataset.downloadSubmitFileId, button.dataset.downloadSubmitFileName));
    });
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function shorten(value, max) {
  const str = String(value || "");
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

function sanitizeFilename(value, fallback = "download.bin") {
  const name = String(value || "").trim();
  const cleaned = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").replace(/\s+$/g, "");
  return cleaned || fallback;
}

async function downloadSubmitFiles() {
  if (!state.currentCaseId) return;

  const files = Array.isArray(state.submitData?.files) ? state.submitData.files : [];
  if (!files.length) {
    alert("Сначала подготовь отправку, чтобы появились файлы для скачивания.");
    return;
  }

  if (typeof window.showDirectoryPicker !== "function") {
    alert("Этот браузер не поддерживает выбор папки для массового скачивания. Лучше открыть сайт в актуальном Chrome или Edge.");
    return;
  }

  const directoryHandle = await window.showDirectoryPicker({
    id: `cmp-${String(state.currentCaseId).slice(0, 28)}`,
    mode: "readwrite"
  });

  for (const file of files) {
    const { blob, filename } = await api.downloadCaseFile(state.currentCaseId, file.id);
    const preferredFilename = filename && filename !== "download.bin" ? filename : file.fileName;
    const fileHandle = await directoryHandle.getFileHandle(
      sanitizeFilename(preferredFilename, "file.bin"),
      { create: true }
    );
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  alert(`Файлы сохранены в выбранную папку: ${files.length}`);
}

function triggerBrowserDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = sanitizeFilename(filename, "file.bin");
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadSubmitFile(fileId, fallbackName) {
  if (!state.currentCaseId) return;

  const { blob, filename } = await api.downloadCaseFile(state.currentCaseId, fileId);
  const preferredFilename = filename && filename !== "download.bin" ? filename : fallbackName;
  triggerBrowserDownload(blob, preferredFilename);
}

async function loadCases() {
  const data = await api.listCases();
  state.cases = data.cases || [];
  renderCases();
  logRuntime("list cases", data);
}

async function createCase() {
  return withButtonLoading(els.btnCreateCase, "Создание...", async () => {
    const data = await api.createCase();
    logRuntime("create case", data);

    await loadCases();

    const newCaseId = data?.case?.id || data?.id || null;
    const newCaseNumber = data?.case?.case_number || data?.caseNumber || "новый кейс";

    if (newCaseId) {
      alert(`Кейс создан: ${newCaseNumber}`);
      await openCase(newCaseId);
      setScreen("case-workspace");
      setWorkspaceTab("variables");
      return;
    }

    alert(`Кейс создан: ${newCaseNumber}`);
  });
}

async function loadInstitutions() {
  const data = await api.listInstitutions();
  state.institutions = data.institutions || [];
  renderInstitutions();
  logRuntime("list institutions", data);
}

async function createInstitution() {
  return withButtonLoading(els.btnCreateInstitution, "Сохранение...", async () => {
    const payload = {
      name: els.institutionName.value.trim(),
      submitUrl: els.institutionSubmitUrl.value.trim(),
      maxAttachments: Number(els.institutionMaxAttachments.value || 5),
      maxTextLength: Number(els.institutionMaxTextLength.value || 4000),
      acceptedFormats: els.institutionAcceptedFormats.value.split(",").map((x) => x.trim()).filter(Boolean),
      active: els.institutionActive.checked
    };

    let data;
    if (state.editingInstitutionId) {
      data = await api.updateInstitution(state.editingInstitutionId, payload);
      logRuntime("update institution", data);
      alert("Организация обновлена");
    } else {
      data = await api.createInstitution(payload);
      logRuntime("create institution", data);
      alert("Организация создана");
    }

    resetInstitutionForm();
    els.institutionFormPanel.classList.add("hidden");
    await loadInstitutions();
  });
}

async function loadTemplates() {
  const data = await api.listTemplates();
  state.templates = data.templates || [];
  renderTemplates();
  renderVariableToolbar(els.templateVariableToolbar, els.templateBody);
  logRuntime("list templates", data);
}

async function createTemplate() {
  return withButtonLoading(els.btnCreateTemplate, "Сохранение...", async () => {
    const payload = {
      name: els.templateName.value.trim(),
      institutionId: els.templateInstitutionSelect.value || null,
      bodyTemplate: els.templateBody.value,
      variablesSchema: getTemplateVariablesSchema(),
      defaultValues: getDefaultTemplateValues(),
      active: els.templateActive.checked
    };

    let data;
    if (state.editingTemplateId) {
      data = await api.updateTemplate(state.editingTemplateId, payload);
      logRuntime("update template", data);
      alert("Шаблон обновлён");
    } else {
      data = await api.createTemplate(payload);
      logRuntime("create template", data);
      alert("Шаблон создан");
    }

    resetTemplateForm();
    els.templateFormPanel.classList.add("hidden");
    await loadTemplates();
  });
}

async function openCase(caseId) {
  state.currentCaseId = caseId;
  const data = await api.getCase(caseId);
  state.currentCase = data;
  state.currentCaseFiles = data.files || [];
  state.variables = {};
  state.packageData = null;
  state.submitData = null;
  state.textContent = "";

  renderWorkspaceSummary();
  renderWorkspaceFiles();
  renderText();
  renderPackage();
  renderSubmit();

  setScreen("case-workspace");
  setWorkspaceTab("variables");
  logRuntime("open case", data);
}

async function reloadCurrentCase() {
  if (!state.currentCaseId) return;

  await Promise.all([
    loadInstitutions(),
    loadTemplates()
  ]);

  await openCase(state.currentCaseId);
}

async function syncFiles() {
  if (!state.currentCaseId) return;

  return withButtonLoading(els.btnSyncFiles, "Синхронизация...", async () => {
    const data = await api.syncFiles(state.currentCaseId);
    state.currentCase = { case: data.case, fsm: data.fsm };
    state.currentCaseFiles = data.files || [];
    state.submitData = null;
    renderWorkspaceSummary();
    renderWorkspaceFiles();
    logRuntime("sync files", data);
    alert(`Синхронизация завершена: ${state.currentCaseFiles.length} файлов`);
  });
}

function collectFileSelectionPayload() {
  return state.currentCaseFiles.map((file, index) => {
    const orderInput = els.workspaceFilesList.querySelector(`[data-file-order-id="${file.id}"]`);
    const selectedInput = els.workspaceFilesList.querySelector(`[data-file-selected-id="${file.id}"]`);
    return {
      fileId: file.id,
      selected: Boolean(selectedInput?.checked),
      sortOrder: Number(orderInput?.value ?? index)
    };
  });
}

async function saveFiles() {
  if (!state.currentCaseId) return;

  return withButtonLoading(els.btnSaveFilesSelection, "Сохранение...", async () => {
    const payload = collectFileSelectionPayload();
    const data = await api.updateFiles(state.currentCaseId, payload);
    state.currentCase = { case: data.case, fsm: data.fsm };
    state.currentCaseFiles = data.files || state.currentCaseFiles;
    state.submitData = null;
    renderWorkspaceSummary();
    renderWorkspaceFiles();
    logRuntime("save files", data);
    alert("Выбор файлов сохранён");
  });
}

async function saveCaseConfig() {
  if (!state.currentCaseId) return;

  return withButtonLoading(els.btnSaveCaseConfig, "Сохранение...", async () => {
    const previousTemplateId = state.currentCase?.case?.template_id || null;
    const payload = {
      institutionId: els.caseInstitutionSelect.value || null,
      templateId: els.caseTemplateSelect.value || null
    };

    const data = await api.updateCaseConfig(state.currentCaseId, payload);
    logRuntime("save case config", data);

    await reloadCurrentCase();
    alert("Конфигурация кейса сохранена");
    setWorkspaceTab("variables");
    await loadVariables().catch(() => {});

    const nextTemplateId = payload.templateId || null;
    if (nextTemplateId && nextTemplateId !== previousTemplateId) {
      state.textContent = buildComputedTextPreview();
    }
  });
}

async function loadVariables() {
  if (!state.currentCaseId) return;
  if (!state.currentCase?.case?.template_id) {
    state.variables = normalizeVariableState({});
    renderVariablesForm();
    return;
  }
  const data = await api.getVariables(state.currentCaseId);
  state.variables = normalizeVariableState(data.variables || {});
  renderVariablesForm();
  logRuntime("get variables", data);
}

async function saveVariables() {
  if (!state.currentCaseId) return;

  const payload = {};
  const normalized = normalizeVariableState(state.variables);

  FIXED_VARIABLES.forEach((field) => {
    const valueInput = els.variablesForm.querySelector(`[data-variable-input-key="${field.key}"]`);
    const enabledInput = els.variablesForm.querySelector(`[data-variable-enabled-key="${field.enabledKey}"]`);
    const enabled = Boolean(enabledInput?.checked);
    const rawValue = valueInput?.value || (field.key === "complaint_date" ? getTodayInputValue() : "");

    payload[field.enabledKey] = String(enabled);
    payload[field.key] = enabled ? rawValue : "";
    normalized[field.enabledKey] = String(enabled);
    normalized[field.key] = rawValue;
  });

  const data = await api.saveVariables(state.currentCaseId, payload);
  state.variables = normalizeVariableState(data.variables || normalized);
  state.submitData = null;
  renderVariablesForm();
  logRuntime("save variables", data);

  alert("Переменные сохранены");
  await reloadCurrentCase();
  setWorkspaceTab("text");
}

async function loadText() {
  if (!state.currentCaseId) return;

  if (state.currentCase?.case?.template_id && !Object.keys(state.variables || {}).length) {
    await loadVariables().catch(() => {});
  }

  try {
    const data = await api.getText(state.currentCaseId);
    state.textContent = data.content || buildComputedTextPreview();
    renderText();
    logRuntime("get text", data);
  } catch {
    state.textContent = buildComputedTextPreview();
    renderText();
  }
}

async function saveText() {
  if (!state.currentCaseId) return;
  const data = await api.saveText(state.currentCaseId, els.caseTextEditor.value);
  state.textContent = data.content || "";
  state.submitData = null;
  renderText();
  logRuntime("save text", data);
  await reloadCurrentCase();
}

async function buildPackage() {
  if (!state.currentCaseId) return;

  return withButtonLoading(els.btnBuildPackage, "Сборка...", async () => {
    const data = await api.buildPackage(state.currentCaseId);
    state.packageData = data.package || {};
    state.currentCase = { case: data.case, fsm: data.fsm };

    renderWorkspaceSummary();
    renderPackage();
    logRuntime("build package", data);

    alert("Пакет собран");
    await prepareSubmit();
    setWorkspaceTab("submit");
  });
}

async function prepareSubmit() {
  if (!state.currentCaseId) return;

  return withButtonLoading(null, "Подготовка...", async () => {
    const data = await api.prepareSubmit(state.currentCaseId);
    const preparedAt = new Date().toLocaleString("ru-RU");
    state.submitData = {
      text: data.text || "",
      submitUrl: data.submitUrl || "",
      files: data.files || [],
      preparedAt
    };
    state.currentCase = { case: data.case, fsm: data.fsm };
    state.currentCaseFiles = data.files?.map((file) => {
      const existing = state.currentCaseFiles.find((item) => item.id === file.id);
      return {
        ...(existing || {}),
        id: file.id,
        file_name: file.fileName,
        file_path: file.filePath,
        mime_type: file.mimeType,
        size_bytes: file.sizeBytes,
        sort_order: file.sortOrder,
        selected_for_submission: true
      };
    }) || state.currentCaseFiles;

    renderWorkspaceSummary();
    renderWorkspaceFiles();
    renderSubmit();
    logRuntime("prepare submit", data);
  });
}

async function deleteCaseFromList(caseId, caseNumber) {
  const confirmed = window.confirm(`Удалить кейс ${caseNumber}?`);
  if (!confirmed) return;

  const data = await api.deleteCase(caseId);
  logRuntime("delete case", data);

  if (state.currentCaseId === caseId) {
    state.currentCaseId = null;
    state.currentCase = null;
    state.currentCaseFiles = [];
    state.variables = {};
    state.packageData = null;
    state.submitData = null;
    state.textContent = "";
    setScreen("dashboard");
  }

  alert(`Кейс удалён: ${caseNumber}`);
  await loadCases();
}

async function saveCaseAsTemplate() {
  if (!state.currentCaseId) return;

  return withButtonLoading(els.btnSaveAsTemplate, "Сохранение...", async () => {
    const data = await api.saveCaseAsTemplate(state.currentCaseId);
    logRuntime("save case as template", data);

    alert(`Создан новый шаблон: ${data?.template?.name || "без названия"}`);

    await loadTemplates();
  });
}

async function deleteInstitutionFromList(institutionId, institutionName) {
  const confirmed = window.confirm(`Удалить организацию "${institutionName}"?`);
  if (!confirmed) return;

  const data = await api.deleteInstitution(institutionId);
  logRuntime("delete institution", data);

  alert(`Организация удалена: ${institutionName}`);
  await loadInstitutions();
}

async function withButtonLoading(button, loadingText, fn) {
  if (!button) {
    return fn();
  }

  if (button.disabled) {
    return;
  }

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = loadingText;

  try {
    return await fn();
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

function bindEvents() {
  els.navButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      setScreen(btn.dataset.screen);
      if (btn.dataset.screen === "dashboard") await loadCases();
      if (btn.dataset.screen === "institutions") await loadInstitutions();
      if (btn.dataset.screen === "templates") await loadTemplates();
    });
  });

  els.btnSaveAsTemplate.onclick = () => handle(saveCaseAsTemplate);

  els.btnSaveCaseMeta.addEventListener("click", () => handle(saveCaseMeta));
  els.btnCloseImageModal.addEventListener("click", closeImageModal);
  els.imageModalBackdrop.addEventListener("click", closeImageModal);
  els.imageModalSelectedCheckbox.addEventListener("change", () => {
    const fileId = els.imageModalSelectedCheckbox.dataset.fileId;
    if (!fileId) return;
    syncModalSelectionState(fileId, els.imageModalSelectedCheckbox.checked);
    renderWorkspaceFiles();
  });
  els.btnShowRuntimeLog.addEventListener("click", openRuntimeLogModal);
  els.btnCloseRuntimeLog.addEventListener("click", closeRuntimeLogModal);
  els.runtimeLogBackdrop.addEventListener("click", closeRuntimeLogModal);
if (els.casesSearchInput) {
  els.casesSearchInput.addEventListener("input", (event) => {
    state.casesSearch = event.target.value || "";
    renderCases();
  });
}
  els.tabButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      setWorkspaceTab(btn.dataset.tab);
      if (btn.dataset.tab === "variables") await loadVariables().catch(() => {});
      if (btn.dataset.tab === "text") await loadText().catch(() => {});
    });
  });

  els.btnCancelInstitution.addEventListener("click", () => {
    resetInstitutionForm();
    els.institutionFormPanel.classList.add("hidden");
  });

  els.btnCancelTemplate.addEventListener("click", () => {
    resetTemplateForm();
    els.templateFormPanel.classList.add("hidden");
  });

  els.btnRefreshCases.addEventListener("click", () => handle(loadCases));
  els.btnCreateCase.addEventListener("click", () => handle(createCase));

  els.btnRefreshInstitutions.addEventListener("click", () => handle(loadInstitutions));
  els.btnToggleInstitutionForm.addEventListener("click", () => {
    resetInstitutionForm();
    els.institutionFormPanel.classList.remove("hidden");
  });

  els.btnCreateInstitution.addEventListener("click", () => handle(createInstitution));

  els.btnRefreshTemplates.addEventListener("click", () => handle(loadTemplates));
  els.btnToggleTemplateForm.addEventListener("click", () => {
    resetTemplateForm();
    els.templateFormPanel.classList.remove("hidden");
  });
  
  els.btnCreateTemplate.addEventListener("click", () => handle(createTemplate));

  els.btnBackToCases.addEventListener("click", async () => {
    setScreen("dashboard");
    await handle(loadCases);
  });
  els.btnReloadCase.addEventListener("click", () => handle(reloadCurrentCase));

  els.btnSyncFiles.addEventListener("click", () => handle(syncFiles));
  els.btnSaveFilesSelection.addEventListener("click", () => handle(saveFiles));
  els.btnSaveCaseConfig.addEventListener("click", () => handle(saveCaseConfig));
  els.btnLoadVariables.addEventListener("click", () => handle(loadVariables));
  els.btnSaveVariables.addEventListener("click", () => handle(saveVariables));
  els.btnSaveText.addEventListener("click", () => handle(saveText));
  els.btnBuildPackage.addEventListener("click", () => handle(buildPackage));
  els.btnCopySubmitText.addEventListener("click", () => handle(() => copyToClipboard(els.submitText.value, "Текст жалобы скопирован")));
  els.btnCopySubmitUrl.addEventListener("click", () => handle(() => copyToClipboard(els.submitInstitutionUrl.value, "URL организации скопирован")));
  els.btnDownloadSubmitFiles.addEventListener("click", () => handle(downloadSubmitFiles));
}

async function deleteTemplateFromList(templateId, templateName) {
  const confirmed = window.confirm(`Удалить шаблон "${templateName}"?`);
  if (!confirmed) return;

  const data = await api.deleteTemplate(templateId);
  logRuntime("delete template", data);

  alert(`Шаблон удалён: ${templateName}`);
  await loadTemplates();
}

async function handle(fn) {
  try {
    await fn();
  } catch (error) {
    logRuntime("error", error?.payload || error?.message || String(error));
    alert(error?.message || "Unknown error");
  }
}

async function bootstrap() {
  renderVariableToolbar(els.templateVariableToolbar, els.templateBody, "token");
  renderVariableToolbar(els.textVariableToolbar, els.caseTextEditor, "value");
  bindEvents();
  await loadInstitutions();
  await loadTemplates();
  await loadCases();
  setScreen("dashboard");
  setWorkspaceTab("variables");
}

bootstrap().catch((error) => {
  logRuntime("bootstrap error", error?.message || String(error));
  alert(error?.message || "Bootstrap error");
});
