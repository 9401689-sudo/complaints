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
  casesInstitutionFilter: "",
  variables: {},
  submitData: null,
  resultFiles: [],
  textContent: "",
  editingInstitutionId: null,
  editingTemplateId: null,
  currentWorkspaceTab: "variables",
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

  btnCreateCase: document.getElementById("btnCreateCase"),
  createCaseProgress: document.getElementById("createCaseProgress"),
  createCaseProgressLabel: document.getElementById("createCaseProgressLabel"),
  casesList: document.getElementById("casesList"),
  casesInstitutionFilter: document.getElementById("casesInstitutionFilter"),
  btnResetCaseFilters: document.getElementById("btnResetCaseFilters"),

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

  btnToggleTemplateForm: document.getElementById("btnToggleTemplateForm"),
  btnCreateTemplate: document.getElementById("btnCreateTemplate"),
  templateFormPanel: document.getElementById("templateFormPanel"),
  templatesList: document.getElementById("templatesList"),
  templateName: document.getElementById("templateName"),
  templateBody: document.getElementById("templateBody"),
  templateVariablesSchema: document.getElementById("templateVariablesSchema"),
  templateDefaultValues: document.getElementById("templateDefaultValues"),

  btnBackToCases: document.getElementById("btnBackToCases"),
  workspaceTitle: document.getElementById("workspaceTitle"),
  workspaceSubtitle: document.getElementById("workspaceSubtitle"),

  workspaceFilesList: document.getElementById("workspaceFilesList"),
  filesSyncProgress: document.getElementById("filesSyncProgress"),
  filesSyncProgressLabel: document.getElementById("filesSyncProgressLabel"),
  btnSaveFilesSelection: document.getElementById("btnSaveFilesSelection"),

  caseInstitutionSelect: document.getElementById("caseInstitutionSelect"),
  caseTemplateSelect: document.getElementById("caseTemplateSelect"),
  btnSaveVariables: document.getElementById("btnSaveVariables"),
  variablesForm: document.getElementById("variablesForm"),
  variablesEmptyState: document.getElementById("variablesEmptyState"),

  caseTitle: document.getElementById("caseTitle"),
  caseDescription: document.getElementById("caseDescription"),
  caseDate: document.getElementById("caseDate"),
  btnSaveCaseMeta: document.getElementById("btnSaveCaseMeta"),

  btnSaveText: document.getElementById("btnSaveText"),
  caseTextEditor: document.getElementById("caseTextEditor"),
  textVariableToolbar: document.getElementById("textVariableToolbar"),

  btnDownloadSubmitText: document.getElementById("btnDownloadSubmitText"),
  btnCopySubmitText: document.getElementById("btnCopySubmitText"),
  btnCopySubmitUrl: document.getElementById("btnCopySubmitUrl"),
  btnDownloadSubmitFiles: document.getElementById("btnDownloadSubmitFiles"),
  submitRegistrationDate: document.getElementById("submitRegistrationDate"),
  submitRegistrationNumber: document.getElementById("submitRegistrationNumber"),
  submitProgress: document.getElementById("submitProgress"),
  submitProgressLabel: document.getElementById("submitProgressLabel"),
  submitText: document.getElementById("submitText"),
  submitInstitutionUrl: document.getElementById("submitInstitutionUrl"),
  submitInstitutionUrlPretty: document.getElementById("submitInstitutionUrlPretty"),
  submitFilesList: document.getElementById("submitFilesList"),
  resultFilesList: document.getElementById("resultFilesList"),

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

function formatDateForInput(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}.${month}.${year}`;
}

function normalizeDisplayDate(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}.${month}.${year}`;
  }

  return maskDateInputValue(raw);
}

function maskDateInputValue(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  const parts = [];

  if (digits.length > 0) {
    parts.push(digits.slice(0, 2));
  }
  if (digits.length > 2) {
    parts.push(digits.slice(2, 4));
  }
  if (digits.length > 4) {
    parts.push(digits.slice(4, 8));
  }

  return parts.join(".");
}

function applyDateMask(input) {
  if (!input) return;
  input.value = maskDateInputValue(input.value);
}

function parseStrictDisplayDate(value, fieldLabel) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  const match = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) {
    throw new Error(`${fieldLabel}: используйте формат дд.мм.гггг`);
  }

  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const currentYear = new Date().getFullYear();

  if (day < 1 || day > 31) {
    throw new Error(`${fieldLabel}: день должен быть в диапазоне 01-31`);
  }

  if (month < 1 || month > 12) {
    throw new Error(`${fieldLabel}: месяц должен быть в диапазоне 01-12`);
  }

  if (year < 2000 || year > currentYear) {
    throw new Error(`${fieldLabel}: год должен быть в диапазоне 2000-${currentYear}`);
  }

  const maxDay = new Date(year, month, 0).getDate();
  if (day > maxDay) {
    throw new Error(`${fieldLabel}: такой даты не существует`);
  }

  return `${dayText}.${monthText}.${yearText}`;
}

function formatComplaintDate(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  const displayMatch = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (displayMatch) {
    const [, day, month, year] = displayMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(date) + " г.";
    }
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

function collapseDuplicateDateSuffixes(text) {
  return String(text || "").replace(
    /(\d{1,2}\s+[А-Яа-яЁё]+\s+\d{4})\s*г\.\s*г\./g,
    "$1 г."
  );
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
      normalized[field.key] = field.key === "complaint_date" ? formatDateForInput(new Date()) : "";
    }

    if (field.key === "complaint_date") {
      normalized[field.key] = normalizeDisplayDate(normalized[field.key]);
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

function isMobileViewport() {
  const narrowScreen = window.matchMedia("(max-width: 820px)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  return narrowScreen || coarsePointer;
}

function updateDeviceMode() {
  document.body.classList.toggle("is-mobile", isMobileViewport());
}

function saveCaseFiltersToSession() {
  sessionStorage.setItem("complaints_cases_search", state.casesSearch || "");
  sessionStorage.setItem("complaints_cases_institution_filter", state.casesInstitutionFilter || "");
}

function loadCaseFiltersFromSession() {
  state.casesSearch = sessionStorage.getItem("complaints_cases_search") || "";
  state.casesInstitutionFilter = sessionStorage.getItem("complaints_cases_institution_filter") || "";
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
  state.currentWorkspaceTab = name;

  els.tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === name);
  });
  els.tabPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.tabPanel !== name);
  });
}

function canOpenSubmitTab() {
  return true;
}

function updateWorkspaceTabAvailability() {
  const hasResultFiles = state.resultFiles.length > 0;
  let switchedTab = false;

  if (!hasResultFiles && state.currentWorkspaceTab === "result") {
    state.currentWorkspaceTab = "submit";
    switchedTab = true;
  }

  els.tabButtons.forEach((btn) => {
    btn.disabled = false;
    if (btn.dataset.tab === "result") {
      btn.classList.toggle("hidden", !hasResultFiles);
    }
  });

  if (switchedTab) {
    setWorkspaceTab("submit");
  }
}

function resetInstitutionForm() {
  state.editingInstitutionId = null;
  els.institutionName.value = "";
  els.institutionSubmitUrl.value = "";
  els.institutionMaxAttachments.value = "5";
  els.institutionMaxTextLength.value = "4000";
  els.institutionAcceptedFormats.value = "image/jpeg,image/png";
  els.btnCreateInstitution.textContent = "Сохранить организацию";
}

function resetTemplateForm() {
  state.editingTemplateId = null;
  els.templateName.value = "";
  els.templateBody.value = "";
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
  els.btnCreateInstitution.textContent = "Сохранить изменения";
  els.institutionFormPanel.classList.remove("hidden");
  setScreen("institutions");
}

function openTemplateEdit(item) {
  state.editingTemplateId = item.id;
  els.templateName.value = item.name || "";
  els.templateBody.value = item.body_template || "";
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

  root.querySelectorAll("[data-result-preview-file-id]").forEach((node) => {
    node.addEventListener("click", () => {
      const file = state.resultFiles.find((item) => item.id === node.dataset.resultPreviewFileId);
      if (!file) return;
      openImageModal(getPreviewUrl(state.currentCaseId, file.id), file.mime_type, file.file_name, null);
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

  const variables = normalizeVariableState({
    ...(template.default_values && typeof template.default_values === "object"
      ? template.default_values
      : {}),
    ...(state.variables || {})
  });

  const rendered = template.body_template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
    const field = FIXED_VARIABLES.find((item) => item.key === key);
    if (field) {
      return getRenderableVariableValue(field, variables);
    }

    return String(variables[key] ?? "");
  });

  return collapseDuplicateDateSuffixes(rendered);
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
  const institutionFilter = state.casesInstitutionFilter || "";

  const filteredCases = state.cases.filter((item) => {
    if (institutionFilter && item.institution_id !== institutionFilter) {
      return false;
    }

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
          <div class="row-meta">Дата</div>
          <div>${escapeHtml(item.case_date || "—")}</div>
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
      <div class="table-row compact-3">
        <div>
          <div class="row-title">${escapeHtml(item.name)}</div>
          <div class="row-meta">${escapeHtml(item.id)}</div>
        </div>
        <div>${escapeHtml(item.submit_url)}</div>
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
  renderCaseFilters();
}

function renderTemplates() {
  if (!state.templates.length) {
    els.templatesList.innerHTML = '<div class="notice">Шаблонов пока нет.</div>';
  } else {
    els.templatesList.innerHTML = state.templates.map((item) => `
      <div class="table-row compact-3">
        <div>
          <div class="row-title">${escapeHtml(item.name)}</div>
          <div class="row-meta">${escapeHtml(item.id)}</div>
        </div>
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
      const inputType = "text";
      const extraAttrs = field.key === "complaint_date"
        ? 'placeholder="дд.мм.гггг" inputmode="numeric" maxlength="10"'
        : "";

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
            <input id="var-${escapeHtml(field.key)}" type="${inputType}" data-variable-input-key="${escapeHtml(field.key)}" value="${escapeHtml(value)}" ${extraAttrs} />
          </div>
        </div>
      `;
    })
    .join("");

  const complaintDateInput = els.variablesForm.querySelector('[data-variable-input-key="complaint_date"]');
  if (complaintDateInput) {
    complaintDateInput.addEventListener("input", () => applyDateMask(complaintDateInput));
    complaintDateInput.addEventListener("blur", () => {
      complaintDateInput.value = complaintDateInput.value.trim();
      applyDateMask(complaintDateInput);
      if (!complaintDateInput.value) {
        return;
      }
      try {
        complaintDateInput.value = parseStrictDisplayDate(complaintDateInput.value, "Дата");
      } catch {
        // Keep masked value visible; full validation error is shown on save.
      }
    });
  }
}

async function saveCaseMeta() {
  if (!state.currentCaseId) return;

  return withButtonLoading(els.btnSaveCaseMeta, "Сохранение...", async () => {
    const caseDate = parseStrictDisplayDate(els.caseDate.value, "Дата кейса");
    const previousTemplateId = state.currentCase?.case?.template_id || null;
    const metaPayload = {
      title: els.caseTitle.value.trim(),
      description: els.caseDescription.value.trim(),
      caseDate
    };
    const configPayload = {
      institutionId: els.caseInstitutionSelect.value || null,
      templateId: els.caseTemplateSelect.value || null
    };

    const configData = await api.updateCaseConfig(state.currentCaseId, configPayload);
    const metaData = await api.updateCaseMeta(state.currentCaseId, metaPayload);

    logRuntime("save case meta", metaData);
    logRuntime("save case config", configData);

    await reloadCurrentCase();

    const nextTemplateId = configPayload.templateId || null;
    if (nextTemplateId && nextTemplateId !== previousTemplateId) {
      state.textContent = buildComputedTextPreview();
      setWorkspaceTab("variables");
      await loadVariables().catch(() => {});
    }

  });
}

function renderCaseFilters() {
  const options = ['<option value="">Все организации</option>']
    .concat(state.institutions.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`))
    .join("");

  els.casesInstitutionFilter.innerHTML = options;
  els.casesInstitutionFilter.value = state.casesInstitutionFilter || "";
  els.casesSearchInput.value = state.casesSearch || "";
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
  els.caseDate.value = caseData.case_date || "";
  updateWorkspaceTabAvailability();
  renderVariablesForm();
}

function renderWorkspaceFiles() {
  const allFiles = [...state.currentCaseFiles];

  if (!allFiles.length) {
    els.workspaceFilesList.innerHTML = '<div class="notice">Файлы в incoming пока не найдены.</div>';
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
          <div class="row-meta" data-file-status-id="${file.id}" data-file-order-value="${file.sort_order ?? index}">${isSelected ? `В подаче · порядок ${file.sort_order ?? index}` : "Не выбран для подачи"}</div>
        </div>
        <div class="file-card-controls">
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
      const orderValue = Number(status?.dataset.fileOrderValue ?? 0);

      syncModalSelectionState(fileId, checkbox.checked);

      if (card) {
        card.classList.toggle("selected", checkbox.checked);
      }

      if (status) {
        status.textContent = checkbox.checked
          ? `В подаче · порядок ${orderValue}`
          : "Не выбран для подачи";
      }
    });
  });
}

function renderText() {
  els.caseTextEditor.value = state.textContent || "";
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
  const caseData = state.currentCase?.case || {};

  els.submitRegistrationDate.value = caseData.registration_date || "";
  els.submitRegistrationNumber.value = caseData.submission_number || "";
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

function setProgress(container, labelNode, visible, label) {
  if (!container || !labelNode) {
    return;
  }

  container.classList.toggle("hidden", !visible);
  labelNode.textContent = label;
}

function setSubmitProgress(visible, label = "Подготовка отправки...") {
  setProgress(els.submitProgress, els.submitProgressLabel, visible, label);
}

function setCreateCaseProgress(visible, label = "Создаём кейс...") {
  setProgress(els.createCaseProgress, els.createCaseProgressLabel, visible, label);
}

function setFilesSyncProgress(visible, label = "Синхронизируем файлы...") {
  setProgress(els.filesSyncProgress, els.filesSyncProgressLabel, visible, label);
}

function renderResultFiles() {
  if (!state.resultFiles.length) {
    els.resultFilesList.innerHTML = '<div class="notice">В папке result пока нет файлов.</div>';
    return;
  }

  els.resultFilesList.innerHTML = state.resultFiles.map((file) => `
    <div class="file-card">
      ${getPreviewMarkup(file, { attrName: "data-result-preview-file-id" })}
      <div class="file-card-main">
        <div class="row-title">${escapeHtml(file.file_name || "unnamed")}</div>
        <div class="row-meta">${escapeHtml(file.mime_type || "unknown")} · ${file.size_bytes || 0} bytes</div>
        <div class="row-meta">${escapeHtml(file.file_path || "")}</div>
      </div>
      <div class="file-card-controls">
        <button class="btn btn-secondary" data-download-result-file-id="${file.id}" data-download-result-file-name="${escapeHtml(file.file_name || "file.bin")}">Скачать</button>
      </div>
    </div>
  `).join("");

  bindPreviewOpeners(els.resultFilesList);
  els.resultFilesList.querySelectorAll("[data-download-result-file-id]").forEach((button) => {
    button.addEventListener("click", () => {
      handle(() => downloadSubmitFile(button.dataset.downloadResultFileId, button.dataset.downloadResultFileName));
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

async function persistSubmitMetaIfNeeded() {
  if (!state.currentCaseId) return;

  const caseData = state.currentCase?.case || {};
  const nextRegistrationDate = parseStrictDisplayDate(
    els.submitRegistrationDate?.value || "",
    "Дата регистрации"
  );
  const nextSubmissionNumber = (els.submitRegistrationNumber?.value || "").trim();

  if (
    (caseData.registration_date || "") === nextRegistrationDate &&
    (caseData.submission_number || "") === nextSubmissionNumber
  ) {
    return;
  }

  const data = await api.updateCaseMeta(state.currentCaseId, {
    registrationDate: nextRegistrationDate,
    submissionNumber: nextSubmissionNumber
  });

  state.currentCase = {
    ...(state.currentCase || {}),
    case: data.case
  };
  renderWorkspaceSummary();
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

function downloadSubmitText() {
  const content = String(els.submitText?.value || "").trim();

  if (!content) {
    alert("Текст жалобы пока пустой.");
    return;
  }

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const caseNumber = state.currentCase?.case?.case_number || "complaint";
  triggerBrowserDownload(blob, `${caseNumber}-complaint.txt`);
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
  renderCaseFilters();
  renderCases();
  logRuntime("list cases", data);
}

async function createCase() {
  return withButtonLoading(els.btnCreateCase, "Создание...", async () => {
    setCreateCaseProgress(true, "Создаём кейс и переносим файлы...");
    try {
      const data = await api.createCase();
      logRuntime("create case", data);

      await loadCases();

      const newCaseId = data?.case?.id || data?.id || null;

      if (newCaseId) {
        await openCase(newCaseId);
        setScreen("case-workspace");
        setWorkspaceTab("variables");
      }
    } finally {
      setCreateCaseProgress(false);
    }
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
    };

    let data;
    if (state.editingInstitutionId) {
      data = await api.updateInstitution(state.editingInstitutionId, payload);
      logRuntime("update institution", data);
    } else {
      data = await api.createInstitution(payload);
      logRuntime("create institution", data);
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
      bodyTemplate: els.templateBody.value,
      variablesSchema: getTemplateVariablesSchema(),
      defaultValues: getDefaultTemplateValues()
    };

    let data;
    if (state.editingTemplateId) {
      data = await api.updateTemplate(state.editingTemplateId, payload);
      logRuntime("update template", data);
    } else {
      data = await api.createTemplate(payload);
      logRuntime("create template", data);
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
  state.submitData = null;
  state.resultFiles = [];
  state.textContent = "";

  renderWorkspaceSummary();
  renderWorkspaceFiles();
  renderText();
  renderSubmit();
  renderResultFiles();
  await loadResultFiles().catch(() => {});

  setScreen("case-workspace");
  setWorkspaceTab("variables");
  await loadVariables().catch(() => {});
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

  return withButtonLoading(null, "Синхронизация...", async () => {
    setFilesSyncProgress(true, "Синхронизируем файлы из incoming...");
    try {
      const data = await api.syncFiles(state.currentCaseId);
      state.currentCase = { case: data.case, fsm: data.fsm };
      state.currentCaseFiles = data.files || [];
      state.submitData = null;
      renderWorkspaceSummary();
      renderWorkspaceFiles();
      logRuntime("sync files", data);
    } finally {
      setFilesSyncProgress(false);
    }
  });
}

function collectFileSelectionPayload() {
  return state.currentCaseFiles.map((file, index) => {
    const selectedInput = els.workspaceFilesList.querySelector(`[data-file-selected-id="${file.id}"]`);
    return {
      fileId: file.id,
      selected: Boolean(selectedInput?.checked),
      sortOrder: Number(file.sort_order ?? index)
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
    const fallbackValue = field.key === "complaint_date" ? formatDateForInput(new Date()) : "";
    const rawValue = valueInput?.value || fallbackValue;
    const normalizedValue = field.key === "complaint_date"
      ? parseStrictDisplayDate(rawValue, "Дата")
      : rawValue;

    payload[field.enabledKey] = String(enabled);
    payload[field.key] = enabled ? normalizedValue : "";
    normalized[field.enabledKey] = String(enabled);
    normalized[field.key] = normalizedValue;
  });

  const data = await api.saveVariables(state.currentCaseId, payload);
  state.variables = normalizeVariableState(data.variables || normalized);
  state.submitData = null;
  renderVariablesForm();
  logRuntime("save variables", data);

  await reloadCurrentCase();
  setWorkspaceTab("text");
}

async function loadText() {
  if (!state.currentCaseId) return;

  if (state.currentCase?.case?.template_id) {
    await loadVariables().catch(() => {});
  }

  try {
    const data = await api.getText(state.currentCaseId);
    state.textContent = typeof data.content === "string"
      ? data.content
      : buildComputedTextPreview();
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
  setWorkspaceTab("files");
  await syncFiles().catch(() => {});
}

async function loadResultFiles() {
  if (!state.currentCaseId) return;

  const data = await api.getResultFiles(state.currentCaseId);
  state.resultFiles = data.files || [];
  renderResultFiles();
  updateWorkspaceTabAvailability();
}

async function buildPackage() {
  if (!state.currentCaseId) return;

  return withButtonLoading(null, "Сборка...", async () => {
    setSubmitProgress(true, "Собираем пакет...");
    try {
      const data = await api.buildPackage(state.currentCaseId);
      state.currentCase = { case: data.case, fsm: data.fsm };
      renderWorkspaceSummary();
      logRuntime("build package", data);
      await prepareSubmit();
    } finally {
      setSubmitProgress(false);
    }
  });
}

async function openSubmitTab() {
  if (!state.currentCaseId) return;

  setWorkspaceTab("submit");
  setSubmitProgress(true, "Подготавливаем отправку...");
  try {
    await buildPackage();
  } finally {
    setSubmitProgress(false);
  }
}

async function prepareSubmit() {
  if (!state.currentCaseId) return;

  return withButtonLoading(null, "Подготовка...", async () => {
    setSubmitProgress(true, "Перемещаем файлы и готовим отправку...");
    try {
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
      await loadResultFiles().catch(() => {});
      logRuntime("prepare submit", data);
    } finally {
      setSubmitProgress(false);
    }
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
    state.submitData = null;
    state.resultFiles = [];
    state.textContent = "";
    setScreen("dashboard");
  }

  await loadCases();
}

async function saveCaseAsTemplate() {
  if (!state.currentCaseId) return;

  return withButtonLoading(els.btnSaveAsTemplate, "Сохранение...", async () => {
    const data = await api.saveCaseAsTemplate(state.currentCaseId);
    logRuntime("save case as template", data);

    await loadTemplates();
  });
}

async function deleteInstitutionFromList(institutionId, institutionName) {
  const confirmed = window.confirm(`Удалить организацию "${institutionName}"?`);
  if (!confirmed) return;

  const data = await api.deleteInstitution(institutionId);
  logRuntime("delete institution", data);

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
      if (state.currentScreen === "case-workspace" && state.currentWorkspaceTab === "submit") {
        await handle(persistSubmitMetaIfNeeded);
      }
      setScreen(btn.dataset.screen);
      if (btn.dataset.screen === "dashboard") await loadCases();
      if (btn.dataset.screen === "institutions") await loadInstitutions();
      if (btn.dataset.screen === "templates") await loadTemplates();
    });
  });

  els.btnSaveAsTemplate.onclick = () => handle(saveCaseAsTemplate);
  [els.caseDate, els.submitRegistrationDate].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => applyDateMask(input));
    input.addEventListener("blur", () => {
      input.value = input.value.trim();
      applyDateMask(input);
      if (!input.value) {
        return;
      }
      try {
        input.value = parseStrictDisplayDate(input.value, input === els.caseDate ? "Дата кейса" : "Дата регистрации");
      } catch {
        // Keep masked value visible; full validation error is shown on save.
      }
    });
  });

  els.btnSaveCaseMeta.addEventListener("click", () => handle(saveCaseMeta));
  els.btnCloseImageModal.addEventListener("click", closeImageModal);
  els.imageModalBackdrop.addEventListener("click", closeImageModal);
  els.imageModalSelectedCheckbox.addEventListener("change", () => {
    const fileId = els.imageModalSelectedCheckbox.dataset.fileId;
    if (!fileId) return;
    syncModalSelectionState(fileId, els.imageModalSelectedCheckbox.checked);
    renderWorkspaceFiles();
  });
  if (els.btnShowRuntimeLog) {
    els.btnShowRuntimeLog.addEventListener("click", openRuntimeLogModal);
  }
  els.btnCloseRuntimeLog.addEventListener("click", closeRuntimeLogModal);
  els.runtimeLogBackdrop.addEventListener("click", closeRuntimeLogModal);
if (els.casesSearchInput) {
  els.casesSearchInput.addEventListener("input", (event) => {
    state.casesSearch = event.target.value || "";
    saveCaseFiltersToSession();
    renderCases();
  });
}
  els.casesInstitutionFilter.addEventListener("change", (event) => {
    state.casesInstitutionFilter = event.target.value || "";
    saveCaseFiltersToSession();
    renderCases();
  });
  els.btnResetCaseFilters.addEventListener("click", () => {
    state.casesSearch = "";
    state.casesInstitutionFilter = "";
    saveCaseFiltersToSession();
    renderCaseFilters();
    renderCases();
  });
  els.tabButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (state.currentWorkspaceTab === "submit" && btn.dataset.tab !== "submit") {
        await handle(persistSubmitMetaIfNeeded);
      }
      if (btn.dataset.tab === "submit") {
        await handle(openSubmitTab);
        return;
      }

      setWorkspaceTab(btn.dataset.tab);
      if (btn.dataset.tab === "variables") await loadVariables().catch(() => {});
      if (btn.dataset.tab === "text") await loadText().catch(() => {});
      if (btn.dataset.tab === "files") await syncFiles().catch(() => {});
      if (btn.dataset.tab === "result") await loadResultFiles().catch(() => {});
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

  els.btnCreateCase.addEventListener("click", () => handle(createCase));

  els.btnToggleInstitutionForm.addEventListener("click", () => {
    resetInstitutionForm();
    els.institutionFormPanel.classList.remove("hidden");
  });

  els.btnCreateInstitution.addEventListener("click", () => handle(createInstitution));

  els.btnToggleTemplateForm.addEventListener("click", () => {
    resetTemplateForm();
    els.templateFormPanel.classList.remove("hidden");
  });
  
  els.btnCreateTemplate.addEventListener("click", () => handle(createTemplate));

  els.btnBackToCases.addEventListener("click", async () => {
    if (state.currentWorkspaceTab === "submit") {
      await handle(persistSubmitMetaIfNeeded);
    }
    setScreen("dashboard");
    await handle(loadCases);
  });
  els.btnSaveFilesSelection.addEventListener("click", () => handle(saveFiles));
  els.btnSaveVariables.addEventListener("click", () => handle(saveVariables));
  els.btnSaveText.addEventListener("click", () => handle(saveText));
  els.btnDownloadSubmitText.addEventListener("click", downloadSubmitText);
  els.btnCopySubmitText.addEventListener("click", () => handle(() => copyToClipboard(els.submitText.value, "Текст жалобы скопирован")));
  els.btnCopySubmitUrl.addEventListener("click", () => handle(async () => {
    const url = String(els.submitInstitutionUrl.value || "").trim();

    if (!url) {
      alert("URL организации пока пустой.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }));
  els.btnDownloadSubmitFiles.addEventListener("click", () => handle(downloadSubmitFiles));
}

async function deleteTemplateFromList(templateId, templateName) {
  const confirmed = window.confirm(`Удалить шаблон "${templateName}"?`);
  if (!confirmed) return;

  const data = await api.deleteTemplate(templateId);
  logRuntime("delete template", data);

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
  updateDeviceMode();
  window.addEventListener("resize", updateDeviceMode);
  loadCaseFiltersFromSession();
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
