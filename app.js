import { api } from "./api.js";

const state = {
  authUser: null,
  authModalMode: "login",
  adminUsers: [],
  adminSection: "users",
  adminDeleted: {
    cases: [],
    institutions: [],
    templates: []
  },
  adminBackups: [],
  currentScreen: "dashboard",
  currentCaseId: null,
  currentCase: null,
  currentCaseFiles: [],
  institutions: [],
  templates: [],
  cases: [],
  casesSearch: "",
  casesInstitutionFilter: "",
  casesStatusFilter: "",
  casesUserFilter: "",
  casesUserFilterText: "",
  institutionsCategoryFilter: "",
  templatesCategoryFilter: "",
  institutionsScopeFilter: "",
  templatesScopeFilter: "",
  institutionsUserFilter: "",
  institutionsUserFilterText: "",
  templatesUserFilter: "",
  templatesUserFilterText: "",
  adminPrivateInstitutionsUserFilter: "",
  adminPrivateInstitutionsUserFilterText: "",
  adminPrivateTemplatesUserFilter: "",
  adminPrivateTemplatesUserFilterText: "",
  institutionsSearch: "",
  templatesSearch: "",
  variables: {},
  submitData: null,
  resultFiles: [],
  relatedCases: [],
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

const DIRECTORY_CATEGORIES = [
  { value: "", label: "Все категории" },
  { value: "authority", label: "Органы власти" },
  { value: "state_org", label: "Государственные организации" }
];

const DIRECTORY_CATEGORY_LABELS = {
  authority: "Органы власти",
  state_org: "Государственные организации"
};

const CASE_STATUS_FILTER_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "created_group", label: "Создано" },
  { value: "sent", label: "Отправлено" },
  { value: "has_reply", label: "Есть ответ" }
];

const CASE_STATUS_LABELS = {
  created: "СОЗДАНО",
  sent: "ОТПРАВЛЕНО",
  has_reply: "ЕСТЬ ОТВЕТ"
};

const CASE_STATUS_CLASSES = {
  created: "info",
  sent: "ready",
  has_reply: "ready"
};

const ROLE_LABELS = {
  user: "пользователь",
  admin_view: "только просмотр",
  admin_full: "полный доступ"
};

const els = {
  authModal: document.getElementById("authModal"),
  authModalBackdrop: document.getElementById("authModalBackdrop"),
  btnCloseAuthModal: document.getElementById("btnCloseAuthModal"),
  authLoginPanel: document.getElementById("authLoginPanel"),
  authRegisterPanel: document.getElementById("authRegisterPanel"),
  topbar: document.getElementById("topbar"),
  appShell: document.getElementById("appShell"),
  authLoginNickname: document.getElementById("authLoginNickname"),
  authLoginPassword: document.getElementById("authLoginPassword"),
  authRegisterNickname: document.getElementById("authRegisterNickname"),
  authRegisterPassword: document.getElementById("authRegisterPassword"),
  btnLogin: document.getElementById("btnLogin"),
  btnRegister: document.getElementById("btnRegister"),
  btnOpenAuthModal: document.getElementById("btnOpenAuthModal"),
  btnShowRegisterPanel: document.getElementById("btnShowRegisterPanel"),
  btnShowLoginPanel: document.getElementById("btnShowLoginPanel"),
  btnLogout: document.getElementById("btnLogout"),
  guestInfoPanel: document.getElementById("guestInfoPanel"),
  dashboardCasesZone: document.getElementById("dashboardCasesZone"),
  dashboardTitle: document.getElementById("dashboardTitle"),
  btnCreateCase: document.getElementById("btnCreateCase"),
  btnAboutScreen: document.querySelector('.nav-btn[data-screen="dashboard"]'),
  btnAdminScreen: document.getElementById("btnAdminScreen"),
  topbarGuest: document.getElementById("topbarGuest"),
  topbarUser: document.getElementById("topbarUser"),
  topbarUserName: document.getElementById("topbarUserName"),
  topbarUserRole: document.getElementById("topbarUserRole"),
  adminUsersList: document.getElementById("adminUsersList"),
  adminUsersPanel: document.getElementById("adminUsersPanel"),
  adminPrivateInstitutionsList: document.getElementById("adminPrivateInstitutionsList"),
  adminPrivateInstitutionsPanel: document.getElementById("adminPrivateInstitutionsPanel"),
  adminPrivateInstitutionUserFilter: document.getElementById("adminPrivateInstitutionUserFilter"),
  adminPrivateInstitutionUserFilterList: document.getElementById("adminPrivateInstitutionUserFilterList"),
  adminPrivateTemplatesList: document.getElementById("adminPrivateTemplatesList"),
  adminPrivateTemplatesPanel: document.getElementById("adminPrivateTemplatesPanel"),
  adminPrivateTemplateUserFilter: document.getElementById("adminPrivateTemplateUserFilter"),
  adminPrivateTemplateUserFilterList: document.getElementById("adminPrivateTemplateUserFilterList"),
  adminDeletedPanel: document.getElementById("adminDeletedPanel"),
  adminDeletedCasesList: document.getElementById("adminDeletedCasesList"),
  adminDeletedInstitutionsList: document.getElementById("adminDeletedInstitutionsList"),
  adminDeletedTemplatesList: document.getElementById("adminDeletedTemplatesList"),
  adminBackupsPanel: document.getElementById("adminBackupsPanel"),
  adminBackupsList: document.getElementById("adminBackupsList"),
  btnCreateBackup: document.getElementById("btnCreateBackup"),
  screens: [...document.querySelectorAll("[data-screen-panel]")],
  navButtons: [...document.querySelectorAll(".nav-btn")],
  tabButtons: [...document.querySelectorAll(".tab-btn")],
  tabPanels: [...document.querySelectorAll("[data-tab-panel]")],
  contextNav: document.getElementById("contextNav"),
  contextNavTitle: document.getElementById("contextNavTitle"),
  mainContent: document.querySelector(".main-content"),
  btnBrandHome: document.getElementById("btnBrandHome"),

  createCaseProgress: document.getElementById("createCaseProgress"),
  createCaseProgressLabel: document.getElementById("createCaseProgressLabel"),
  casesList: document.getElementById("casesList"),
  casesInstitutionFilter: document.getElementById("casesInstitutionFilter"),
  casesStatusFilter: document.getElementById("casesStatusFilter"),
  casesUserFilter: document.getElementById("casesUserFilter"),
  casesUserFilterField: document.getElementById("casesUserFilterField"),
  casesUserFilterList: document.getElementById("casesUserFilterList"),
  btnResetCaseFilters: document.getElementById("btnResetCaseFilters"),

  btnToggleInstitutionForm: document.getElementById("btnToggleInstitutionForm"),
  btnCreateInstitution: document.getElementById("btnCreateInstitution"),
  btnCancelInstitution: document.getElementById("btnCancelInstitution"),
  btnCancelTemplate: document.getElementById("btnCancelTemplate"),
  institutionFormPanel: document.getElementById("institutionFormPanel"),
  institutionsList: document.getElementById("institutionsList"),
  institutionName: document.getElementById("institutionName"),
  institutionCategory: document.getElementById("institutionCategory"),
  institutionVisibility: document.getElementById("institutionVisibility"),
  institutionUserFilter: document.getElementById("institutionUserFilter"),
  institutionUserFilterField: document.getElementById("institutionUserFilterField"),
  institutionUserFilterList: document.getElementById("institutionUserFilterList"),
  institutionsSearchInput: document.getElementById("institutionsSearchInput"),
  institutionSubmitUrl: document.getElementById("institutionSubmitUrl"),
  institutionMaxAttachments: document.getElementById("institutionMaxAttachments"),
  institutionMaxTextLength: document.getElementById("institutionMaxTextLength"),
  institutionAcceptedFormats: document.getElementById("institutionAcceptedFormats"),

  btnToggleTemplateForm: document.getElementById("btnToggleTemplateForm"),
  btnCreateTemplate: document.getElementById("btnCreateTemplate"),
  templateFormPanel: document.getElementById("templateFormPanel"),
  templatesList: document.getElementById("templatesList"),
  templateName: document.getElementById("templateName"),
  templateCategory: document.getElementById("templateCategory"),
  templateVisibility: document.getElementById("templateVisibility"),
  templateUserFilter: document.getElementById("templateUserFilter"),
  templateUserFilterField: document.getElementById("templateUserFilterField"),
  templateUserFilterList: document.getElementById("templateUserFilterList"),
  templatesSearchInput: document.getElementById("templatesSearchInput"),
  templateBody: document.getElementById("templateBody"),
  templateVariablesSchema: document.getElementById("templateVariablesSchema"),
  templateDefaultValues: document.getElementById("templateDefaultValues"),

  btnBackToCases: document.getElementById("btnBackToCases"),
  workspaceTitle: document.getElementById("workspaceTitle"),
  workspaceSubtitle: document.getElementById("workspaceSubtitle"),

  workspaceFilesList: document.getElementById("workspaceFilesList"),
  workspaceDropzone: document.getElementById("workspaceDropzone"),
  btnPickWorkspaceFiles: document.getElementById("btnPickWorkspaceFiles"),
  workspaceFilesInput: document.getElementById("workspaceFilesInput"),
  filesSyncProgress: document.getElementById("filesSyncProgress"),
  filesSyncProgressLabel: document.getElementById("filesSyncProgressLabel"),
  btnSaveFilesSelection: document.getElementById("btnSaveFilesSelection"),

  caseInstitutionSelect: document.getElementById("caseInstitutionSelect"),
  caseTemplateSelect: document.getElementById("caseTemplateSelect"),
  btnCreateLinkedCase: document.getElementById("btnCreateLinkedCase"),
  relatedCasesList: document.getElementById("relatedCasesList"),
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
  btnRebuildSubmitPackage: document.getElementById("btnRebuildSubmitPackage"),
  submitText: document.getElementById("submitText"),
  submitInstitutionUrl: document.getElementById("submitInstitutionUrl"),
  submitInstitutionUrlPretty: document.getElementById("submitInstitutionUrlPretty"),
  submitFilesList: document.getElementById("submitFilesList"),
  btnUploadResultFiles: document.getElementById("btnUploadResultFiles"),
  resultFilesInput: document.getElementById("resultFilesInput"),
  resultUploadProgress: document.getElementById("resultUploadProgress"),
  resultUploadProgressLabel: document.getElementById("resultUploadProgressLabel"),
  resultComment: document.getElementById("resultComment"),
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

  runtimeLog: document.getElementById("runtimeLog"),
  confirmModal: document.getElementById("confirmModal"),
  confirmModalBackdrop: document.getElementById("confirmModalBackdrop"),
  confirmModalMessage: document.getElementById("confirmModalMessage"),
  btnConfirmModalYes: document.getElementById("btnConfirmModalYes"),
  btnConfirmModalCancel: document.getElementById("btnConfirmModalCancel")
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

function roleLabel(role) {
  return ROLE_LABELS[role] || role || "Пользователь";
}

function isAdminRole(role) {
  return role === "admin_view" || role === "admin_full";
}

function getDirectoryScopeOptions(kind) {
  if (isAdminRole(state.authUser?.role)) {
    return kind === "institutions"
      ? [
          { value: "", label: "Все организации" },
          { value: "owned", label: "Организации пользователей" }
        ]
      : [
          { value: "", label: "Все шаблоны" },
          { value: "owned", label: "Шаблоны пользователей" }
      ];
  }

  if (!isAuthenticated()) {
    return kind === "institutions"
      ? [{ value: "", label: "Все организации" }]
      : [{ value: "", label: "Все шаблоны" }];
  }

  return kind === "institutions"
    ? [
        { value: "", label: "Все организации" },
        { value: "favorites", label: "Мои организации" }
      ]
    : [
        { value: "", label: "Все шаблоны" },
        { value: "favorites", label: "Мои шаблоны" }
      ];
}

function getAdminUserFilterValue(user) {
  return `${user.nickname} [${roleLabel(user.role)}]`;
}

function getAdminUserByFilterValue(value) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return null;
  }

  return state.adminUsers.find((user) => getAdminUserFilterValue(user) === normalized) || null;
}

function getAdminUserFilterInputValue(userId) {
  if (!userId) {
    return "";
  }

  const user = state.adminUsers.find((item) => item.id === userId);
  return user ? getAdminUserFilterValue(user) : "";
}

function getVisibilityLabel(visibility) {
  return visibility === "private" ? "Личное" : "Общее";
}

function canEditDirectoryItem(item) {
  return Boolean(item?.can_edit);
}

function canOpenDirectoryItem(item) {
  if (!isAuthenticated()) {
    return false;
  }
  return Boolean(item);
}

function canManageDirectories() {
  return state.authUser?.role === "admin_full";
}

function canManageUsers() {
  return state.authUser?.role === "admin_full";
}

function syncDirectoryVisibilityControls() {
  const allowPublic = canManageDirectories();

  if (els.institutionVisibility) {
    if (!allowPublic) {
      els.institutionVisibility.value = "private";
    }
    els.institutionVisibility.disabled = !allowPublic;
  }

  if (els.templateVisibility) {
    if (!allowPublic) {
      els.templateVisibility.value = "private";
    }
    els.templateVisibility.disabled = !allowPublic;
  }
}

function resetDirectoryFilters() {
  state.casesUserFilter = "";
  state.casesUserFilterText = "";
  state.institutionsCategoryFilter = "";
  state.templatesCategoryFilter = "";
  state.institutionsScopeFilter = "";
  state.templatesScopeFilter = "";
  state.institutionsUserFilter = "";
  state.institutionsUserFilterText = "";
  state.templatesUserFilter = "";
  state.templatesUserFilterText = "";
  state.adminPrivateInstitutionsUserFilter = "";
  state.adminPrivateInstitutionsUserFilterText = "";
  state.adminPrivateTemplatesUserFilter = "";
  state.adminPrivateTemplatesUserFilterText = "";
  state.institutionsSearch = "";
  state.templatesSearch = "";
}

function isAuthenticated() {
  return Boolean(state.authUser);
}

function setAuthModalMode(mode = "login") {
  state.authModalMode = mode === "register" ? "register" : "login";
  els.authLoginPanel?.classList.toggle("hidden", state.authModalMode !== "login");
  els.authRegisterPanel?.classList.toggle("hidden", state.authModalMode !== "register");
}

function openAuthModal(mode = "login") {
  setAuthModalMode(mode);
  els.authModal?.classList.remove("hidden");
}

function closeAuthModal() {
  els.authModal?.classList.add("hidden");
}

function requireAuthAction(message = "Это действие доступно только зарегистрированным пользователям.") {
  if (isAuthenticated()) {
    return true;
  }
  openAuthModal("login");
  alert(message);
  return false;
}

function applyReadonlyUiState() {
  const readOnly = !isAuthenticated();

  els.btnCreateCase?.classList.toggle("hidden", readOnly);
  els.btnToggleInstitutionForm?.classList.toggle("hidden", readOnly);
  els.btnToggleTemplateForm?.classList.toggle("hidden", readOnly);
  els.btnCreateLinkedCase?.classList.toggle("hidden", readOnly);
  els.btnSaveCaseMeta?.classList.toggle("hidden", readOnly);
  els.btnSaveFilesSelection?.classList.toggle("hidden", readOnly);
  els.btnPickWorkspaceFiles?.classList.toggle("hidden", readOnly);
  els.btnSaveVariables?.classList.toggle("hidden", readOnly);
  els.btnSaveText?.classList.toggle("hidden", readOnly);
  els.btnRebuildSubmitPackage?.classList.toggle("hidden", readOnly);
  els.btnUploadResultFiles?.classList.toggle("hidden", readOnly);
  if (els.resultComment) {
    els.resultComment.disabled = readOnly;
  }
  if (els.caseTitle) {
    els.caseTitle.disabled = readOnly;
  }
  if (els.caseDescription) {
    els.caseDescription.disabled = readOnly;
  }
  if (els.caseDate) {
    els.caseDate.disabled = readOnly;
  }
  if (els.caseInstitutionSelect) {
    els.caseInstitutionSelect.disabled = readOnly;
  }
  if (els.caseTemplateSelect) {
    els.caseTemplateSelect.disabled = readOnly;
  }
  if (els.caseTextEditor) {
    els.caseTextEditor.readOnly = readOnly;
  }
  if (els.workspaceDropzone) {
    els.workspaceDropzone.classList.toggle("hidden", readOnly);
  }
  els.variablesForm?.querySelectorAll("input, select, textarea, button").forEach((node) => {
    node.disabled = readOnly;
  });
}

function renderAuthState() {
  const user = state.authUser;
  const hasUser = Boolean(user);
  const isAdmin = isAdminRole(user?.role);

  els.topbarUser?.classList.toggle("hidden", !hasUser);
  els.topbarGuest?.classList.toggle("hidden", hasUser);
  if (els.btnAboutScreen) {
    els.btnAboutScreen.classList.remove("hidden");
    els.btnAboutScreen.textContent = hasUser ? "Обращения" : "О сервисе";
  }
  if (els.dashboardTitle) {
    els.dashboardTitle.textContent = hasUser ? "Обращения" : "О сервисе";
    els.dashboardTitle.classList.toggle("hidden", hasUser);
  }
  els.guestInfoPanel?.classList.toggle("hidden", hasUser);
  els.dashboardCasesZone?.classList.toggle("hidden", !hasUser);
  els.btnAdminScreen?.classList.toggle("hidden", !isAdmin);

  if (els.topbarUserName) {
    els.topbarUserName.textContent = user?.nickname || "";
  }
  if (els.topbarUserRole) {
    els.topbarUserRole.textContent = isAdmin ? roleLabel(user?.role) : "";
    els.topbarUserRole.classList.toggle("hidden", !isAdmin);
  }

  syncDirectoryVisibilityControls();
  applyReadonlyUiState();
}

function renderAdminUsers() {
  if (!els.adminUsersList) {
    return;
  }

  if (!state.adminUsers.length) {
    els.adminUsersList.innerHTML = '<div class="table-empty">Пользователи пока не найдены.</div>';
    return;
  }

  els.adminUsersList.innerHTML = state.adminUsers.map((user) => {
    const roleControl = canManageUsers()
      ? `
        <select data-user-role-id="${escapeHtml(user.id)}">
          <option value="user" ${user.role === "user" ? "selected" : ""}>Пользователь</option>
          <option value="admin_view" ${user.role === "admin_view" ? "selected" : ""}>Админ просмотр</option>
          <option value="admin_full" ${user.role === "admin_full" ? "selected" : ""}>Админ полный</option>
        </select>
      `
      : `<span class="status-badge info">${escapeHtml(roleLabel(user.role))}</span>`;
    const canDeleteUser = canManageUsers() && state.authUser?.id !== user.id;
    const deleteButton = canDeleteUser
      ? `<button class="btn btn-secondary icon-delete-btn" title="Удалить пользователя" aria-label="Удалить пользователя" data-delete-user-id="${escapeHtml(user.id)}" data-delete-user-nickname="${escapeHtml(user.nickname)}">🗑</button>`
      : "";

    return `
      <div class="table-row admin-user-row">
        <div>
          <div class="row-title">${escapeHtml(user.nickname)}</div>
          <div class="row-subtitle">Создан: ${escapeHtml(new Date(user.created_at).toLocaleString("ru-RU"))}</div>
        </div>
        <div class="row-actions">
          ${roleControl}
          ${deleteButton}
        </div>
      </div>
    `;
  }).join("");
}

function renderAdminPanels() {
  els.adminUsersPanel?.classList.toggle("hidden", state.adminSection !== "users");
  els.adminPrivateInstitutionsPanel?.classList.toggle("hidden", state.adminSection !== "private_institutions");
  els.adminPrivateTemplatesPanel?.classList.toggle("hidden", state.adminSection !== "private_templates");
  els.adminDeletedPanel?.classList.toggle("hidden", state.adminSection !== "deleted");
  els.adminBackupsPanel?.classList.toggle("hidden", state.adminSection !== "backups");
}

function renderAdminDirectories() {
  if (!isAdminRole(state.authUser?.role)) {
    return;
  }

  const privateInstitutionFilter = state.adminPrivateInstitutionsUserFilter;
  const privateTemplateFilter = state.adminPrivateTemplatesUserFilter;

  if (els.adminPrivateInstitutionsList) {
    const items = state.institutions
      .filter((item) => item.visibility === "private")
      .filter((item) => !privateInstitutionFilter || item.owner_user_id === privateInstitutionFilter)
      .sort((a, b) => `${a.owner_nickname || ""} ${a.name || ""}`.localeCompare(`${b.owner_nickname || ""} ${b.name || ""}`, "ru"));

    els.adminPrivateInstitutionsList.innerHTML = items.length
      ? items.map((item) => `
        <div class="table-row compact-3">
          <div>
            <div class="row-title">${escapeHtml(item.name)}</div>
            <div class="row-meta">${escapeHtml(getCategoryLabel(item.category || "authority"))}</div>
            <div class="row-meta">Автор: ${escapeHtml(item.owner_nickname || "—")}</div>
          </div>
          <div>${escapeHtml(item.submit_url || "—")}</div>
          <div class="actions">
            ${state.authUser?.role === "admin_full"
              ? `<button class="btn btn-secondary" type="button" data-publish-institution-id="${item.id}">Сделать общим</button>`
              : ""}
          </div>
        </div>
      `).join("")
      : '<div class="table-empty">Личных организаций сейчас нет.</div>';
  }

  if (els.adminPrivateTemplatesList) {
    const items = state.templates
      .filter((item) => item.visibility === "private")
      .filter((item) => !privateTemplateFilter || item.owner_user_id === privateTemplateFilter)
      .sort((a, b) => `${a.owner_nickname || ""} ${a.name || ""}`.localeCompare(`${b.owner_nickname || ""} ${b.name || ""}`, "ru"));

    els.adminPrivateTemplatesList.innerHTML = items.length
      ? items.map((item) => `
        <div class="table-row compact-3">
          <div>
            <div class="row-title">${escapeHtml(item.name)}</div>
            <div class="row-meta">${escapeHtml(getCategoryLabel(item.category || "authority"))}</div>
            <div class="row-meta">Автор: ${escapeHtml(item.owner_nickname || "—")}</div>
          </div>
          <div>${escapeHtml(item.body_template ? "Есть текст" : "Без текста")}</div>
          <div class="actions">
            ${state.authUser?.role === "admin_full"
              ? `<button class="btn btn-secondary" type="button" data-publish-template-id="${item.id}">Сделать общим</button>`
              : ""}
          </div>
        </div>
      `).join("")
      : '<div class="table-empty">Личных шаблонов сейчас нет.</div>';
  }

  document.querySelectorAll("[data-publish-institution-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      handle(() => publishInstitutionFromAdmin(btn.dataset.publishInstitutionId));
    });
  });

  document.querySelectorAll("[data-publish-template-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      handle(() => publishTemplateFromAdmin(btn.dataset.publishTemplateId));
    });
  });
}

function renderDeletedAdminItems() {
  if (!els.adminDeletedCasesList || !els.adminDeletedInstitutionsList || !els.adminDeletedTemplatesList) {
    return;
  }

  const deletedCases = state.adminDeleted.cases || [];
  const deletedInstitutions = state.adminDeleted.institutions || [];
  const deletedTemplates = state.adminDeleted.templates || [];

  els.adminDeletedCasesList.innerHTML = deletedCases.length
    ? deletedCases.map((item) => {
        const badges = getCaseStatusBadges(item)
          .map((badge) => `<span class="status-badge ${badge.cls}">${escapeHtml(badge.text)}</span>`)
          .join("");

        return `
          <div class="table-row cases-row cases-row-admin">
            <div>
              <div class="row-title">${escapeHtml(item.title || "Без названия")}</div>
              <div class="row-meta">${escapeHtml(item.description || "")}</div>
              <div class="status-badges">${badges}</div>
            </div>
            <div>
              <div class="row-meta">Номер</div>
              <div>${escapeHtml(item.case_number || "—")}</div>
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
              <div class="row-meta">Пользователь</div>
              <div>${escapeHtml(item.owner_nickname || "—")}</div>
            </div>
            <div>
              <div class="row-meta">Удалено</div>
              <div>${escapeHtml(item.deleted_at ? new Date(item.deleted_at).toLocaleString("ru-RU") : "—")}</div>
            </div>
            <div class="actions">
              ${state.authUser?.role === "admin_full"
                ? `<button class="btn btn-secondary" type="button" data-restore-deleted-case-id="${item.id}">Восстановить</button>`
                : ""}
            </div>
          </div>
        `;
      }).join("")
    : '<div class="table-empty">Помеченных обращений нет.</div>';

  els.adminDeletedInstitutionsList.innerHTML = deletedInstitutions.length
    ? deletedInstitutions.map((item) => `
      <div class="table-row compact-4">
        <div>
          <div class="row-title">${escapeHtml(item.name)}</div>
          <div class="row-meta">${escapeHtml(getCategoryLabel(item.category || "authority"))} · ${escapeHtml(getVisibilityLabel(item.visibility))}</div>
          <div class="row-meta">Автор: ${escapeHtml(item.owner_nickname || "—")}</div>
        </div>
        <div>${escapeHtml(item.submit_url || "—")}</div>
        <div>
          <div class="row-meta">Удалено</div>
          <div>${escapeHtml(item.deleted_at ? new Date(item.deleted_at).toLocaleString("ru-RU") : "—")}</div>
        </div>
        <div class="actions">
          ${state.authUser?.role === "admin_full"
            ? `<button class="btn btn-secondary" type="button" data-restore-deleted-institution-id="${item.id}">Восстановить</button>`
            : ""}
        </div>
      </div>
    `).join("")
    : '<div class="table-empty">Помеченных организаций нет.</div>';

  els.adminDeletedTemplatesList.innerHTML = deletedTemplates.length
    ? deletedTemplates.map((item) => `
      <div class="table-row compact-4">
        <div>
          <div class="row-title">${escapeHtml(item.name)}</div>
          <div class="row-meta">${escapeHtml(getCategoryLabel(item.category || "authority"))} · ${escapeHtml(getVisibilityLabel(item.visibility))}</div>
          <div class="row-meta">Автор: ${escapeHtml(item.owner_nickname || "—")}</div>
        </div>
        <div>${escapeHtml(item.body_template ? "Есть текст" : "Без текста")}</div>
        <div>
          <div class="row-meta">Удалено</div>
          <div>${escapeHtml(item.deleted_at ? new Date(item.deleted_at).toLocaleString("ru-RU") : "—")}</div>
        </div>
        <div class="actions">
          ${state.authUser?.role === "admin_full"
            ? `<button class="btn btn-secondary" type="button" data-restore-deleted-template-id="${item.id}">Восстановить</button>`
            : ""}
        </div>
      </div>
    `).join("")
    : '<div class="table-empty">Помеченных шаблонов нет.</div>';

  document.querySelectorAll("[data-restore-deleted-case-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      handle(() => restoreDeletedCaseFromAdmin(btn.dataset.restoreDeletedCaseId));
    });
  });
  document.querySelectorAll("[data-restore-deleted-institution-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      handle(() => restoreDeletedInstitutionFromAdmin(btn.dataset.restoreDeletedInstitutionId));
    });
  });
  document.querySelectorAll("[data-restore-deleted-template-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      handle(() => restoreDeletedTemplateFromAdmin(btn.dataset.restoreDeletedTemplateId));
    });
  });
}

function renderAdminBackups() {
  if (!els.adminBackupsList) {
    return;
  }

  els.btnCreateBackup?.classList.toggle("hidden", state.authUser?.role !== "admin_full");

  if (!state.adminBackups.length) {
    els.adminBackupsList.innerHTML = '<div class="table-empty">Резервных копий пока нет.</div>';
    return;
  }

  els.adminBackupsList.innerHTML = state.adminBackups.map((item) => `
    <div class="table-row compact-3">
      <div>
        <div class="row-title">${escapeHtml(item.fileName)}</div>
        <div class="row-meta">Создан: ${escapeHtml(new Date(item.createdAt).toLocaleString("ru-RU"))}</div>
      </div>
      <div>${escapeHtml(formatBytes(item.sizeBytes))}</div>
      <div class="actions">
        ${state.authUser?.role === "admin_full"
          ? `<button class="btn btn-secondary" type="button" data-restore-backup="${escapeHtml(item.fileName)}">Восстановить</button>`
          : ""}
      </div>
    </div>
  `).join("");

  document.querySelectorAll("[data-restore-backup]").forEach((btn) => {
    btn.addEventListener("click", () => {
      handle(() => restoreBackupFromAdmin(btn.dataset.restoreBackup));
    });
  });
}

async function loadAdminUsers() {
  if (!isAdminRole(state.authUser?.role)) {
    return;
  }

  const data = await api.listUsers();
  state.adminUsers = data.users || [];
  renderAdminUsers();
  renderAdminDirectories();
  renderAdminPanels();
  logRuntime("list users", data);
}

async function loadDeletedAdminItems() {
  if (!isAdminRole(state.authUser?.role)) {
    return;
  }

  const data = await api.listDeletedAdminItems();
  state.adminDeleted = {
    cases: data.cases || [],
    institutions: data.institutions || [],
    templates: data.templates || []
  };
  renderDeletedAdminItems();
  renderAdminPanels();
  logRuntime("list deleted admin items", data);
}

async function loadAdminBackups() {
  if (!isAdminRole(state.authUser?.role)) {
    return;
  }

  const data = await api.listBackups();
  state.adminBackups = data.backups || [];
  renderAdminBackups();
  renderAdminPanels();
  logRuntime("list backups", data);
}

async function ensureAdminUsersLoaded() {
  if (!isAdminRole(state.authUser?.role)) {
    return;
  }

  if (!state.adminUsers.length) {
    await loadAdminUsers();
  }
}

function renderDirectoryUserFilters() {
  const showAdminFilters = isAdminRole(state.authUser?.role);
  const options = state.adminUsers
    .map((user) => `<option value="${escapeHtml(getAdminUserFilterValue(user))}"></option>`)
    .join("");

  if (els.institutionUserFilterField) {
    const visible = showAdminFilters;
    els.institutionUserFilterField.classList.toggle("hidden", !visible);
  }
  if (els.templateUserFilterField) {
    const visible = showAdminFilters;
    els.templateUserFilterField.classList.toggle("hidden", !visible);
  }

  if (els.institutionUserFilter) {
    els.institutionUserFilter.value = state.institutionsUserFilterText || getAdminUserFilterInputValue(state.institutionsUserFilter);
  }

  if (els.institutionUserFilterList) {
    els.institutionUserFilterList.innerHTML = options;
  }

  if (els.templateUserFilter) {
    els.templateUserFilter.value = state.templatesUserFilterText || getAdminUserFilterInputValue(state.templatesUserFilter);
  }

  if (els.templateUserFilterList) {
    els.templateUserFilterList.innerHTML = options;
  }

  if (els.casesUserFilterField) {
    els.casesUserFilterField.classList.toggle("hidden", !showAdminFilters);
  }

  if (els.casesUserFilter) {
    els.casesUserFilter.value = state.casesUserFilterText || getAdminUserFilterInputValue(state.casesUserFilter);
  }

  if (els.casesUserFilterList) {
    els.casesUserFilterList.innerHTML = options;
  }

  if (els.adminPrivateInstitutionUserFilter) {
    els.adminPrivateInstitutionUserFilter.value =
      state.adminPrivateInstitutionsUserFilterText || getAdminUserFilterInputValue(state.adminPrivateInstitutionsUserFilter);
  }
  if (els.adminPrivateInstitutionUserFilterList) {
    els.adminPrivateInstitutionUserFilterList.innerHTML = options;
  }
  if (els.adminPrivateTemplateUserFilter) {
    els.adminPrivateTemplateUserFilter.value =
      state.adminPrivateTemplatesUserFilterText || getAdminUserFilterInputValue(state.adminPrivateTemplatesUserFilter);
  }
  if (els.adminPrivateTemplateUserFilterList) {
    els.adminPrivateTemplateUserFilterList.innerHTML = options;
  }
}

async function applyAuthorizedAppState() {
  resetDirectoryFilters();
  renderAuthState();
  closeAuthModal();
  resetInstitutionForm();
  resetTemplateForm();
  els.institutionFormPanel?.classList.add("hidden");
  els.templateFormPanel?.classList.add("hidden");
  await ensureAdminUsersLoaded();
  await loadInstitutions();
  await loadTemplates();
  await loadCases();
  setScreen("dashboard");
  setWorkspaceTab(null);
  scrollMainContentToTop();
}

async function completeAuth(payload) {
  if (!payload?.token || !payload?.user) {
    throw new Error("auth payload is incomplete");
  }

  api.setAuthToken(payload.token);
  state.authUser = payload.user;

  if (els.authLoginPassword) {
    els.authLoginPassword.value = "";
  }
  if (els.authRegisterPassword) {
    els.authRegisterPassword.value = "";
  }

  await applyAuthorizedAppState();
}

async function restoreAuthSession() {
  const token = api.getAuthToken();

  if (!token) {
    state.authUser = null;
    renderAuthState();
    resetInstitutionForm();
    resetTemplateForm();
    els.institutionFormPanel?.classList.add("hidden");
    els.templateFormPanel?.classList.add("hidden");
    await loadInstitutions();
    await loadTemplates();
    state.cases = [];
    setScreen("dashboard");
    setWorkspaceTab(null);
    scrollMainContentToTop();
    return false;
  }

  try {
    const data = await api.me();
    state.authUser = data.user;
    await applyAuthorizedAppState();
    return true;
  } catch {
    api.clearAuthToken();
    state.authUser = null;
    renderAuthState();
    resetInstitutionForm();
    resetTemplateForm();
    els.institutionFormPanel?.classList.add("hidden");
    els.templateFormPanel?.classList.add("hidden");
    await loadInstitutions();
    await loadTemplates();
    state.cases = [];
    setScreen("dashboard");
    setWorkspaceTab(null);
    scrollMainContentToTop();
    return false;
  }
}

async function loginUser() {
  const payload = await api.login({
    nickname: els.authLoginNickname?.value || "",
    password: els.authLoginPassword?.value || ""
  });

  await completeAuth(payload);
}

async function registerUser() {
  const payload = await api.register({
    nickname: els.authRegisterNickname?.value || "",
    password: els.authRegisterPassword?.value || ""
  });

  await completeAuth(payload);
}

async function logoutUser() {
  try {
    await api.logout();
  } catch {
    // ignore logout transport errors
  }

  api.clearAuthToken();
  state.authUser = null;
  state.currentCaseId = null;
  state.currentCase = null;
  state.currentCaseFiles = [];
  state.submitData = null;
  state.resultFiles = [];
  state.relatedCases = [];
  state.adminUsers = [];
  state.adminDeleted = { cases: [], institutions: [], templates: [] };
  state.adminBackups = [];
  state.adminSection = "users";
  resetDirectoryFilters();
  renderAuthState();
  resetInstitutionForm();
  resetTemplateForm();
  els.institutionFormPanel?.classList.add("hidden");
  els.templateFormPanel?.classList.add("hidden");
  closeAuthModal();
  await loadInstitutions();
  await loadTemplates();
  state.cases = [];
  setScreen("dashboard");
  setWorkspaceTab(null);
  scrollMainContentToTop();
}

async function purgeDeletedRecords() {
  if (!requireAuthAction()) return;
  const confirmed = await confirmDestructiveAction("Будут окончательно удалены все помеченные обращения, шаблоны и организации. Подтвердите.");
  if (!confirmed) return;

  const result = await api.purgeDeleted();
  logRuntime("purge deleted", result);

  await ensureAdminUsersLoaded();
  await loadInstitutions();
  await loadTemplates();
  await loadCases();
  await loadDeletedAdminItems();
}

async function publishInstitutionFromAdmin(institutionId) {
  if (!requireAuthAction()) return;
  const item = state.institutions.find((entry) => entry.id === institutionId);
  if (!item) return;

  await api.updateInstitution(institutionId, {
    name: item.name || "",
    category: item.category || "authority",
    visibility: "public",
    submitUrl: item.submit_url || "",
    maxAttachments: item.max_attachments,
    maxTextLength: item.max_text_length,
    acceptedFormats: item.accepted_formats || ["image/jpeg", "image/png"]
  });

  await loadInstitutions();
  renderAdminDirectories();
}

async function publishTemplateFromAdmin(templateId) {
  if (!requireAuthAction()) return;
  const item = state.templates.find((entry) => entry.id === templateId);
  if (!item) return;

  await api.updateTemplate(templateId, {
    name: item.name || "",
    category: item.category || "authority",
    visibility: "public",
    bodyTemplate: item.body_template || "",
    variablesSchema: item.variables_schema || [],
    defaultValues: item.default_values || {}
  });

  await loadTemplates();
  renderAdminDirectories();
}

async function createBackupFromAdmin() {
  if (!requireAuthAction()) return;
  const result = await withButtonLoading(els.btnCreateBackup, "Сохраняем...", async () => api.createBackup());
  logRuntime("create backup", result);
  await loadAdminBackups();
}

async function restoreBackupFromAdmin(fileName) {
  if (!requireAuthAction()) return;
  if (!fileName) return;

  const confirmed = await confirmDestructiveAction(`База будет восстановлена из копии ${fileName}. Подтвердите.`);
  if (!confirmed) return;

  const result = await api.restoreBackup(fileName);
  logRuntime("restore backup", result);

  await ensureAdminUsersLoaded();
  await loadInstitutions();
  await loadTemplates();
  await loadCases();
  await loadDeletedAdminItems();
  await loadAdminBackups();
}

async function deleteUserFromAdmin(userId, nickname) {
  if (!canManageUsers()) return;
  if (!userId) return;
  const confirmed = await confirmDestructiveAction(`Пользователь ${nickname || ""} будет удалён. Подтвердите.`);
  if (!confirmed) return;
  const data = await api.deleteUser(userId);
  logRuntime("delete user", data);
  state.adminUsers = state.adminUsers.filter((item) => item.id !== userId);
  if (state.casesUserFilter === userId) {
    state.casesUserFilter = "";
    state.casesUserFilterText = "";
  }
  if (state.institutionsUserFilter === userId) {
    state.institutionsUserFilter = "";
    state.institutionsUserFilterText = "";
  }
  if (state.templatesUserFilter === userId) {
    state.templatesUserFilter = "";
    state.templatesUserFilterText = "";
  }
  if (state.adminPrivateInstitutionsUserFilter === userId) {
    state.adminPrivateInstitutionsUserFilter = "";
    state.adminPrivateInstitutionsUserFilterText = "";
  }
  if (state.adminPrivateTemplatesUserFilter === userId) {
    state.adminPrivateTemplatesUserFilter = "";
    state.adminPrivateTemplatesUserFilterText = "";
  }
  renderAdminUsers();
  renderDirectoryUserFilters();
  await loadInstitutions();
  await loadTemplates();
  await loadCases();
}

async function restoreDeletedCaseFromAdmin(caseId) {
  if (!canManageUsers()) return;
  if (!caseId) return;
  const result = await api.restoreDeletedCase(caseId);
  logRuntime("restore deleted case", result);
  await loadCases();
  await loadDeletedAdminItems();
}

async function restoreDeletedInstitutionFromAdmin(institutionId) {
  if (!canManageUsers()) return;
  if (!institutionId) return;
  const result = await api.restoreDeletedInstitution(institutionId);
  logRuntime("restore deleted institution", result);
  await loadInstitutions();
  await loadDeletedAdminItems();
}

async function restoreDeletedTemplateFromAdmin(templateId) {
  if (!canManageUsers()) return;
  if (!templateId) return;
  const result = await api.restoreDeletedTemplate(templateId);
  logRuntime("restore deleted template", result);
  await loadTemplates();
  await loadDeletedAdminItems();
}
function openRuntimeLogModal() {
  els.runtimeLogModal.classList.remove("hidden");
}

function closeRuntimeLogModal() {
  els.runtimeLogModal.classList.add("hidden");
}

let confirmModalResolver = null;

function closeConfirmModal(result = false) {
  els.confirmModal?.classList.add("hidden");
  if (confirmModalResolver) {
    const resolve = confirmModalResolver;
    confirmModalResolver = null;
    resolve(result);
  }
}

function confirmDestructiveAction(message = "Операция удаления необратима. Подтвердите.") {
  if (!els.confirmModal || !els.confirmModalMessage) {
    return Promise.resolve(false);
  }

  els.confirmModalMessage.textContent = message;
  els.confirmModal.classList.remove("hidden");

  return new Promise((resolve) => {
    confirmModalResolver = resolve;
  });
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
  sessionStorage.setItem("complaints_cases_status_filter", state.casesStatusFilter || "");
  sessionStorage.setItem("complaints_cases_user_filter", state.casesUserFilter || "");
}

function loadCaseFiltersFromSession() {
  state.casesSearch = sessionStorage.getItem("complaints_cases_search") || "";
  state.casesInstitutionFilter = sessionStorage.getItem("complaints_cases_institution_filter") || "";
  state.casesStatusFilter = sessionStorage.getItem("complaints_cases_status_filter") || "";
  state.casesUserFilter = sessionStorage.getItem("complaints_cases_user_filter") || "";
}

function getCategoryLabel(value) {
  return DIRECTORY_CATEGORY_LABELS[value] || "Без категории";
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 Б";
  }

  const units = ["Б", "КБ", "МБ", "ГБ"];
  let current = bytes;
  let index = 0;

  while (current >= 1024 && index < units.length - 1) {
    current /= 1024;
    index += 1;
  }

  const digits = current >= 10 || index === 0 ? 0 : 1;
  return `${current.toFixed(digits)} ${units[index]}`;
}

function renderContextNav() {
  if (!els.contextNav || !els.contextNavTitle) {
    return;
  }

  let title = "Раздел";
  let items = [];

  if (state.currentScreen === "case-workspace") {
    title = "Обращение";
    items = [
      { action: "tab:variables", label: "Переменные", active: state.currentWorkspaceTab === "variables" },
      { action: "tab:text", label: "Текст", active: state.currentWorkspaceTab === "text" },
      { action: "tab:files", label: "Файлы", active: state.currentWorkspaceTab === "files" },
      { action: "tab:submit", label: "Отправка", active: state.currentWorkspaceTab === "submit" },
      { action: "tab:result", label: "Ответ", active: state.currentWorkspaceTab === "result" }
    ];
  } else if (state.currentScreen === "institutions") {
    title = "Фильтры";
    const scopeOptions = isAuthenticated() ? getDirectoryScopeOptions("institutions") : [];
    const scopeItems = scopeOptions.map((item) => ({
      action: `institutions-scope:${item.value}`,
      label: item.label,
      active: state.institutionsScopeFilter === item.value
    }));
    const categoryItems = DIRECTORY_CATEGORIES.map((item) => ({
      action: `institutions-category:${item.value}`,
      label: item.label,
      active: state.institutionsCategoryFilter === item.value
    }));
    items = scopeItems.concat(scopeItems.length ? [{ action: "__divider__", label: "", active: false }] : []).concat(categoryItems);
  } else if (state.currentScreen === "templates") {
    title = "Фильтры";
    const scopeOptions = isAuthenticated() ? getDirectoryScopeOptions("templates") : [];
    const scopeItems = scopeOptions.map((item) => ({
      action: `templates-scope:${item.value}`,
      label: item.label,
      active: state.templatesScopeFilter === item.value
    }));
    const categoryItems = DIRECTORY_CATEGORIES.map((item) => ({
      action: `templates-category:${item.value}`,
      label: item.label,
      active: state.templatesCategoryFilter === item.value
    }));
    items = scopeItems.concat(scopeItems.length ? [{ action: "__divider__", label: "", active: false }] : []).concat(categoryItems);
  } else if (state.currentScreen === "admin") {
    title = "Панель администратора";
    items = [
      { action: "admin-section:users", label: "Пользователи", active: state.adminSection === "users" },
      { action: "admin-section:private_institutions", label: "Личные организации", active: state.adminSection === "private_institutions" },
      { action: "admin-section:private_templates", label: "Личные шаблоны", active: state.adminSection === "private_templates" },
      { action: "admin-section:deleted", label: "Просмотр помеченных", active: state.adminSection === "deleted" },
      { action: "admin-action:purge-deleted", label: "Удаление помеченных", active: false },
      { action: "admin-section:backups", label: "Резервные копии", active: state.adminSection === "backups" }
    ];
  } else {
    if (isAuthenticated()) {
      title = "Обращения";
      items = [
        { action: "dashboard:create-case", label: "Создать обращение", active: false }
      ];
    } else {
      title = "О сервисе";
      items = [];
    }
  }

  els.contextNavTitle.textContent = title;
  els.contextNav.innerHTML = items.map((item) => {
    if (item.action === "__divider__") {
      return '<div class="context-divider" aria-hidden="true"></div>';
    }
    return `
      <button class="context-btn ${item.active ? "active" : ""}" type="button" data-context-action="${escapeHtml(item.action)}">
        ${escapeHtml(item.label)}
      </button>
    `;
  }).join("");
}

function setScreen(name) {
  state.currentScreen = name;
  els.screens.forEach((screen) => {
    screen.classList.toggle("hidden", screen.dataset.screenPanel !== name);
  });
  const navScreen = name === "case-workspace" ? "dashboard" : name;
  els.navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.screen === navScreen);
  });
  renderContextNav();
}

function setWorkspaceTab(name) {
  state.currentWorkspaceTab = name || null;

  els.tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === name);
  });
  els.tabPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.tabPanel !== name);
  });
  renderContextNav();
}

function scrollMainContentToTop() {
  els.mainContent?.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollToWorkspaceTab(name) {
  const panel = document.querySelector(`[data-tab-panel="${name}"]`);
  if (!panel) {
    scrollMainContentToTop();
    return;
  }

  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function canOpenSubmitTab() {
  return true;
}

function updateWorkspaceTabAvailability() {
  els.tabButtons.forEach((btn) => {
    btn.disabled = false;
  });
}

function resetInstitutionForm() {
  state.editingInstitutionId = null;
  if (els.institutionName) els.institutionName.disabled = false;
  if (els.institutionCategory) els.institutionCategory.disabled = false;
  if (els.institutionSubmitUrl) els.institutionSubmitUrl.disabled = false;
  if (els.institutionMaxAttachments) els.institutionMaxAttachments.disabled = false;
  if (els.institutionMaxTextLength) els.institutionMaxTextLength.disabled = false;
  if (els.btnCreateInstitution) els.btnCreateInstitution.classList.remove("hidden");
  els.institutionName.value = "";
  els.institutionCategory.value = "authority";
  els.institutionVisibility.value = canManageDirectories() ? "public" : "private";
  els.institutionSubmitUrl.value = "";
  els.institutionMaxAttachments.value = "5";
  els.institutionMaxTextLength.value = "4000";
  els.btnCreateInstitution.textContent = "Сохранить организацию";
  syncDirectoryVisibilityControls();
}

function resetTemplateForm() {
  state.editingTemplateId = null;
  if (els.templateName) els.templateName.disabled = false;
  if (els.templateCategory) els.templateCategory.disabled = false;
  if (els.templateBody) els.templateBody.disabled = false;
  if (els.btnCreateTemplate) els.btnCreateTemplate.classList.remove("hidden");
  els.templateName.value = "";
  els.templateCategory.value = "authority";
  els.templateVisibility.value = canManageDirectories() ? "public" : "private";
  els.templateBody.value = "";
  els.btnCreateTemplate.textContent = "Сохранить шаблон";
  syncDirectoryVisibilityControls();
}

function openInstitutionEdit(item) {
  const canEdit = canEditDirectoryItem(item);
  state.editingInstitutionId = item.id;
  if (els.institutionName) els.institutionName.disabled = !canEdit;
  if (els.institutionCategory) els.institutionCategory.disabled = !canEdit;
  if (els.institutionSubmitUrl) els.institutionSubmitUrl.disabled = !canEdit;
  if (els.institutionMaxAttachments) els.institutionMaxAttachments.disabled = !canEdit;
  if (els.institutionMaxTextLength) els.institutionMaxTextLength.disabled = !canEdit;
  if (els.btnCreateInstitution) {
    els.btnCreateInstitution.classList.toggle("hidden", !canEdit);
  }
  els.institutionName.value = item.name || "";
  els.institutionCategory.value = item.category || "authority";
  els.institutionVisibility.value = item.visibility || "private";
  els.institutionSubmitUrl.value = item.submit_url || "";
  els.institutionMaxAttachments.value = String(item.max_attachments ?? 5);
  els.institutionMaxTextLength.value = String(item.max_text_length ?? 4000);
  els.btnCreateInstitution.textContent = canEdit ? "Сохранить изменения" : "Сохранить организацию";
  syncDirectoryVisibilityControls();
  els.institutionFormPanel.classList.remove("hidden");
  setScreen("institutions");
}

function openTemplateEdit(item) {
  const canEdit = canEditDirectoryItem(item);
  state.editingTemplateId = item.id;
  if (els.templateName) els.templateName.disabled = !canEdit;
  if (els.templateCategory) els.templateCategory.disabled = !canEdit;
  if (els.templateBody) els.templateBody.disabled = !canEdit;
  if (els.btnCreateTemplate) {
    els.btnCreateTemplate.classList.toggle("hidden", !canEdit);
  }
  els.templateName.value = item.name || "";
  els.templateCategory.value = item.category || "authority";
  els.templateVisibility.value = item.visibility || "private";
  els.templateBody.value = item.body_template || "";
  els.btnCreateTemplate.textContent = canEdit ? "Сохранить изменения" : "Сохранить шаблон";
  syncDirectoryVisibilityControls();
  els.templateFormPanel.classList.remove("hidden");
  setScreen("templates");
}

function getPreviewUrl(caseId, fileId) {
  const path = window.location.pathname || '/';
  const [, prefix] = path.split('/');
  const appPrefix = prefix || 'complaints';
  return `https://complaints-api.doorsvip.ru/${appPrefix}/api/cases/${caseId}/files/${fileId}/preview`;
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
    badges.push({ text: "НЕТ ОРГАНИЗАЦИИ", cls: "warn" });
  }

  if (!item.template_id) {
    badges.push({ text: "НЕТ ШАБЛОНА", cls: "warn" });
  }

  const primaryStatus = String(item.case_status || "").trim() || "created";
  if (CASE_STATUS_LABELS[primaryStatus]) {
    badges.push({
      text: CASE_STATUS_LABELS[primaryStatus],
      cls: CASE_STATUS_CLASSES[primaryStatus] || "info"
    });
  }

  if (Number(item.linked_cases_count || 0) > 0) {
    badges.push({ text: "ЕСТЬ СВЯЗАННЫЕ", cls: "info" });
  }

  return badges;
}

function renderCases() {
  const query = (state.casesSearch || "").trim().toLowerCase();
  const institutionFilter = state.casesInstitutionFilter || "";
  const statusFilter = state.casesStatusFilter || "";
  const userFilter = state.casesUserFilter || "";

  const filteredCases = state.cases.filter((item) => {
    if (institutionFilter && item.institution_id !== institutionFilter) {
      return false;
    }

    if (userFilter && item.owner_user_id !== userFilter) {
      return false;
    }

    if (statusFilter) {
      if (statusFilter === "created_group") {
        if (!["no_organization", "no_template", "created"].includes(item.case_status)) {
          return false;
        }
      } else if (item.case_status !== statusFilter) {
        return false;
      }
    }

    if (!query) return true;

    const haystack = [
      item.title || "",
      item.description || "",
      item.case_number || "",
      item.institution_name || "",
      item.template_name || "",
      item.owner_nickname || ""
    ].join(" ").toLowerCase();

    return haystack.includes(query);
  });

  renderDirectoryUserFilters();

  if (!filteredCases.length) {
    els.casesList.innerHTML = '<div class="notice">Ничего не найдено.</div>';
    return;
  }

  const showOwner = isAdminRole(state.authUser?.role);
  const canDeleteCases = isAuthenticated();

  els.casesList.innerHTML = filteredCases.map((item) => {
    const badges = getCaseStatusBadges(item)
      .map((badge) => `<span class="status-badge ${badge.cls}">${escapeHtml(badge.text)}</span>`)
      .join("");

    return `
      <div class="table-row cases-row ${showOwner ? "cases-row-admin" : ""} clickable-row" data-open-case-id="${item.id}">
        <div>
          <div class="row-title">${escapeHtml(item.title || "Без названия")}</div>
          <div class="row-meta">${escapeHtml(item.description || "")}</div>
          <div class="status-badges">${badges}</div>
        </div>
        <div>
          <div class="row-meta">Номер</div>
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
        ${showOwner ? `
        <div>
          <div class="row-meta">Пользователь</div>
          <div>${escapeHtml(item.owner_nickname || "—")}</div>
        </div>` : ""}
        <div>
          <div class="row-meta">Дата</div>
          <div>${escapeHtml(item.case_date || "—")}</div>
        </div>
        <div class="actions">
          ${canDeleteCases
            ? `<button class="btn btn-secondary icon-delete-btn" title="Удалить" aria-label="Удалить" data-delete-case-id="${item.id}" data-delete-case-number="${item.case_number}">🗑</button>`
            : ""}
        </div>
      </div>
    `;
  }).join("");

  document.querySelectorAll("[data-open-case-id]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      handle(() => openCase(btn.dataset.openCaseId));
    });
  });

  document.querySelectorAll("[data-delete-case-id]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      handle(() => deleteCaseFromList(
      btn.dataset.deleteCaseId,
      btn.dataset.deleteCaseNumber
    ));
    });
  });
}

function renderInstitutions() {
  const canUseFavorites = isAuthenticated() && !isAdminRole(state.authUser?.role);
  const showOwner = isAdminRole(state.authUser?.role);
  const search = String(state.institutionsSearch || "").trim().toLowerCase();
  const filteredInstitutions = state.institutions.filter((item) => {
    if (showOwner) {
      if (state.institutionsScopeFilter === "owned") {
        if (item.visibility !== "private") {
          return false;
        }
      }
      if (state.institutionsUserFilter && item.owner_user_id !== state.institutionsUserFilter) {
        return false;
      }
    } else if (state.institutionsScopeFilter === "favorites" && !item.is_favorite) {
      return false;
    }
    if (!state.institutionsCategoryFilter) {
      if (!search) return true;
      const haystack = `${item.name || ""} ${item.submit_url || ""} ${item.owner_nickname || ""}`.toLowerCase();
      return haystack.includes(search);
    }
    if ((item.category || "authority") !== state.institutionsCategoryFilter) {
      return false;
    }
    if (!search) return true;
    const haystack = `${item.name || ""} ${item.submit_url || ""} ${item.owner_nickname || ""}`.toLowerCase();
    return haystack.includes(search);
  });

  if (!filteredInstitutions.length) {
    els.institutionsList.innerHTML = '<div class="notice">Организаций пока нет.</div>';
  } else {
    els.institutionsList.innerHTML = filteredInstitutions.map((item) => `
      <div class="table-row compact-3 ${canOpenDirectoryItem(item) ? "clickable-row" : ""}" data-edit-institution-id="${item.id}">
        <div>
          <div class="row-title">${escapeHtml(item.name)}</div>
          <div class="row-meta">${escapeHtml(getCategoryLabel(item.category || "authority"))} · ${escapeHtml(getVisibilityLabel(item.visibility))}</div>
          ${showOwner && item.owner_nickname ? `<div class="row-meta">Автор: ${escapeHtml(item.owner_nickname)}</div>` : ""}
        </div>
        <div>${escapeHtml(item.submit_url)}</div>
        <div class="actions">
          ${item.visibility === "public" && canUseFavorites
            ? `<button class="btn btn-secondary icon-delete-btn favorite-btn ${item.is_favorite ? "active" : ""}" title="${item.is_favorite ? "Убрать из моих организаций" : "Добавить в мои организации"}" aria-label="${item.is_favorite ? "Убрать из моих организаций" : "Добавить в мои организации"}" data-favorite-institution-id="${item.id}">${item.is_favorite ? "★" : "☆"}</button>`
            : ""}
          ${canEditDirectoryItem(item)
            ? `<button class="btn btn-secondary icon-delete-btn" title="Удалить" aria-label="Удалить" data-delete-institution-id="${item.id}" data-delete-institution-name="${escapeHtml(item.name)}">🗑</button>`
            : ""}
        </div>
      </div>
    `).join("");
  }

  document.querySelectorAll("[data-edit-institution-id]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      const item = state.institutions.find((x) => x.id === btn.dataset.editInstitutionId);
      if (item && canOpenDirectoryItem(item)) openInstitutionEdit(item);
    });
  });
  document.querySelectorAll("[data-delete-institution-id]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      handle(() => deleteInstitutionFromList(
      btn.dataset.deleteInstitutionId,
      btn.dataset.deleteInstitutionName
    ));
  });
});
  document.querySelectorAll("[data-favorite-institution-id]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      handle(() => toggleInstitutionFavorite(btn.dataset.favoriteInstitutionId));
    });
  });

  renderDirectoryUserFilters();
  if (els.institutionsSearchInput) {
    els.institutionsSearchInput.value = state.institutionsSearch || "";
  }
  fillInstitutionSelects();
  renderCaseFilters();
}

function renderTemplates() {
  const canUseFavorites = isAuthenticated() && !isAdminRole(state.authUser?.role);
  const showOwner = isAdminRole(state.authUser?.role);
  const search = String(state.templatesSearch || "").trim().toLowerCase();
  const filteredTemplates = state.templates.filter((item) => {
    if (showOwner) {
      if (state.templatesScopeFilter === "owned") {
        if (item.visibility !== "private") {
          return false;
        }
      }
      if (state.templatesUserFilter && item.owner_user_id !== state.templatesUserFilter) {
        return false;
      }
    } else if (state.templatesScopeFilter === "favorites" && !item.is_favorite) {
      return false;
    }
    if (!state.templatesCategoryFilter) {
      if (!search) return true;
      const haystack = `${item.name || ""} ${item.body_template || ""} ${item.owner_nickname || ""}`.toLowerCase();
      return haystack.includes(search);
    }
    if ((item.category || "authority") !== state.templatesCategoryFilter) {
      return false;
    }
    if (!search) return true;
    const haystack = `${item.name || ""} ${item.body_template || ""} ${item.owner_nickname || ""}`.toLowerCase();
    return haystack.includes(search);
  });

  if (!filteredTemplates.length) {
    els.templatesList.innerHTML = '<div class="notice">Шаблонов пока нет.</div>';
  } else {
    els.templatesList.innerHTML = filteredTemplates.map((item) => `
      <div class="table-row compact-3 ${canOpenDirectoryItem(item) ? "clickable-row" : ""}" data-edit-template-id="${item.id}">
        <div>
          <div class="row-title">${escapeHtml(item.name)}</div>
          <div class="row-meta">${escapeHtml(getCategoryLabel(item.category || "authority"))} · ${escapeHtml(getVisibilityLabel(item.visibility))}</div>
          ${showOwner && item.owner_nickname ? `<div class="row-meta">Автор: ${escapeHtml(item.owner_nickname)}</div>` : ""}
        </div>
        <div></div>
        <div class="actions">
          ${item.visibility === "public" && canUseFavorites
            ? `<button class="btn btn-secondary icon-delete-btn favorite-btn ${item.is_favorite ? "active" : ""}" title="${item.is_favorite ? "Убрать из моих шаблонов" : "Добавить в мои шаблоны"}" aria-label="${item.is_favorite ? "Убрать из моих шаблонов" : "Добавить в мои шаблоны"}" data-favorite-template-id="${item.id}">${item.is_favorite ? "★" : "☆"}</button>`
            : ""}
          ${canEditDirectoryItem(item)
            ? `<button class="btn btn-secondary icon-delete-btn" title="Удалить" aria-label="Удалить" data-delete-template-id="${item.id}" data-delete-template-name="${escapeHtml(item.name)}">🗑</button>`
            : ""}
        </div>
      </div>
    `).join("");
  }

  document.querySelectorAll("[data-edit-template-id]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      const item = state.templates.find((x) => x.id === btn.dataset.editTemplateId);
      if (item && canOpenDirectoryItem(item)) openTemplateEdit(item);
    });
  });
  document.querySelectorAll("[data-delete-template-id]").forEach((btn) => {
  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    handle(() => deleteTemplateFromList(
    btn.dataset.deleteTemplateId,
    btn.dataset.deleteTemplateName
  ));
  });
});
  document.querySelectorAll("[data-favorite-template-id]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      handle(() => toggleTemplateFavorite(btn.dataset.favoriteTemplateId));
    });
  });

  renderDirectoryUserFilters();
  if (els.templatesSearchInput) {
    els.templatesSearchInput.value = state.templatesSearch || "";
  }
  fillTemplateSelect();
}

function fillInstitutionSelects() {
  const options = ['<option value="">— не выбрано —</option>']
    .concat(state.institutions.map((item) => `<option value="${item.id}">${escapeHtml(item.name)} (${escapeHtml(getVisibilityLabel(item.visibility))})</option>`))
    .join("");

  els.caseInstitutionSelect.innerHTML = options;
}

function fillTemplateSelect() {
  const options = ['<option value="">— не выбрано —</option>']
    .concat(state.templates.map((item) => `<option value="${item.id}">${escapeHtml(item.name)} (${escapeHtml(getVisibilityLabel(item.visibility))})</option>`))
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
    els.variablesEmptyState.textContent = "Сначала откройте обращение.";
    els.variablesEmptyState.classList.remove("hidden");
    return;
  }

  if (!template) {
    els.variablesForm.innerHTML = "";
    els.variablesEmptyState.textContent = "Сначала выберите шаблон в карточке обращения.";
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

  applyReadonlyUiState();
}

async function saveCaseMeta() {
  if (!requireAuthAction()) return;
  if (!state.currentCaseId) return;

  return withButtonLoading(els.btnSaveCaseMeta, "Сохранение...", async () => {
    const caseDate = parseStrictDisplayDate(els.caseDate.value, "Дата обращения");
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
  const institutionOptions = ['<option value="">Все организации</option>']
    .concat(state.institutions.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`))
    .join("");
  const statusOptions = CASE_STATUS_FILTER_OPTIONS
    .map((item) => `<option value="${item.value}">${escapeHtml(item.label)}</option>`)
    .join("");

  els.casesInstitutionFilter.innerHTML = institutionOptions;
  els.casesInstitutionFilter.value = state.casesInstitutionFilter || "";
  els.casesStatusFilter.innerHTML = statusOptions;
  els.casesStatusFilter.value = state.casesStatusFilter || "";
  els.casesSearchInput.value = state.casesSearch || "";
  renderDirectoryUserFilters();
}

function renderWorkspaceSummary() {
  const caseData = state.currentCase?.case || {};

  els.workspaceTitle.textContent = caseData.title
    ? `${caseData.title}`
    : (caseData.case_number ? `Обращение ${caseData.case_number}` : "Обращение");

  const subtitleParts = [];
  if (caseData.description) {
    subtitleParts.push(caseData.description);
  }
  if (isAdminRole(state.authUser?.role)) {
    subtitleParts.push(`Пользователь: ${caseData.owner_nickname || "—"}`);
  }
  els.workspaceSubtitle.textContent = subtitleParts.join(" · ");

  els.caseInstitutionSelect.value = caseData.institution_id || "";
  els.caseTemplateSelect.value = caseData.template_id || "";

  els.caseTitle.value = caseData.title || "";
  els.caseDescription.value = caseData.description || "";
  els.caseNumberReadonly.value = caseData.case_number || "";
  els.caseDate.value = caseData.case_date || "";
  updateWorkspaceTabAvailability();
  renderVariablesForm();
  renderRelatedCases();
  applyReadonlyUiState();
}

function renderRelatedCases() {
  if (!els.relatedCasesList) return;

  if (!state.relatedCases.length) {
    els.relatedCasesList.innerHTML = '<div class="notice">Связанных обращений пока нет.</div>';
    return;
  }

  els.relatedCasesList.innerHTML = state.relatedCases.map((item) => `
    <div class="table-row cases-row clickable-row" data-open-related-case-id="${item.id}">
      <div>
        <div class="row-title">${escapeHtml(item.title || "Без названия")}</div>
        <div class="row-meta">${escapeHtml(item.description || "")}</div>
      </div>
      <div>
        <div class="row-meta">Номер</div>
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
      <div class="actions"></div>
    </div>
  `).join("");

  els.relatedCasesList.querySelectorAll("[data-open-related-case-id]").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      handle(() => openCase(button.dataset.openRelatedCaseId));
    });
  });
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
          <label class="file-select-toggle"><input type="checkbox" data-file-selected-id="${file.id}" ${isSelected ? "checked" : ""} ${!isAuthenticated() ? "disabled" : ""} /> В подачу</label>
        </div>
      </div>
    `;
  }).join("");

  bindPreviewOpeners(els.workspaceFilesList);
  els.workspaceFilesList.querySelectorAll("[data-file-selected-id]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (!isAuthenticated()) return;
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
  applyReadonlyUiState();
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
    els.submitFilesList.innerHTML = '<div class="notice">Файлы в папке artifacts пока не подготовлены.</div>';
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

function setCreateCaseProgress(visible, label = "Создаём обращение...") {
  setProgress(els.createCaseProgress, els.createCaseProgressLabel, visible, label);
}

function setFilesSyncProgress(visible, label = "Синхронизируем файлы...") {
  setProgress(els.filesSyncProgress, els.filesSyncProgressLabel, visible, label);
}

function setResultUploadProgress(visible, label = "Загружаем файлы ответа...") {
  setProgress(els.resultUploadProgress, els.resultUploadProgressLabel, visible, label);
}

function renderResultFiles() {
  els.resultComment.value = state.currentCase?.case?.response_comment || "";

  if (!state.resultFiles.length) {
    els.resultFilesList.innerHTML = '<div class="notice">Файлы ответа пока не загружены.</div>';
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
  if (!isAuthenticated()) return;
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

async function persistResultCommentIfNeeded() {
  if (!isAuthenticated()) return;
  if (!state.currentCaseId || !els.resultComment) return;

  const caseData = state.currentCase?.case || {};
  const nextResponseComment = String(els.resultComment.value || "").trim();

  if ((caseData.response_comment || "") === nextResponseComment) {
    return;
  }

  const data = await api.updateCaseMeta(state.currentCaseId, {
    responseComment: nextResponseComment
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

async function refreshCurrentCaseData() {
  if (!state.currentCaseId) return;

  const data = await api.getCase(state.currentCaseId);
  state.currentCase = data;
  state.currentCaseFiles = data.files || [];
  state.relatedCases = data.relatedCases || [];
  renderWorkspaceSummary();
  renderWorkspaceFiles();
  renderResultFiles();
}

async function createCase() {
  if (!requireAuthAction()) return;
  return withButtonLoading(els.btnCreateCase, "Создание...", async () => {
    setCreateCaseProgress(true, "Создаём обращение...");
    try {
      const data = await api.createCase();
      logRuntime("create case", data);

      await loadCases();

      const newCaseId = data?.case?.id || data?.id || null;

      if (newCaseId) {
        await openCase(newCaseId);
        setScreen("case-workspace");
      }
    } finally {
      setCreateCaseProgress(false);
    }
  });
}

async function loadInstitutions() {
  try {
    const data = await api.listInstitutions();
    state.institutions = data.institutions || [];
    renderInstitutions();
    renderAdminDirectories();
    logRuntime("list institutions", data);
  } catch (error) {
    const message = String(error?.message || "");
    if (error?.status === 401 || message.toLowerCase().includes("unauthorized")) {
      state.institutions = [];
      renderInstitutions();
      return;
    }
    throw error;
  }
}

async function createInstitution() {
  if (!requireAuthAction()) return;
  return withButtonLoading(els.btnCreateInstitution, "Сохранение...", async () => {
    const payload = {
      name: els.institutionName.value.trim(),
      category: els.institutionCategory.value || "authority",
      visibility: els.institutionVisibility.value || "private",
      submitUrl: els.institutionSubmitUrl.value.trim(),
      maxAttachments: Number(els.institutionMaxAttachments.value || 5),
      maxTextLength: Number(els.institutionMaxTextLength.value || 4000),
      acceptedFormats: ["image/jpeg", "image/png"],
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
  try {
    const data = await api.listTemplates();
    state.templates = data.templates || [];
    renderTemplates();
    renderAdminDirectories();
    renderVariableToolbar(els.templateVariableToolbar, els.templateBody);
    logRuntime("list templates", data);
  } catch (error) {
    const message = String(error?.message || "");
    if (error?.status === 401 || message.toLowerCase().includes("unauthorized")) {
      state.templates = [];
      renderTemplates();
      return;
    }
    throw error;
  }
}

async function createTemplate() {
  if (!requireAuthAction()) return;
  return withButtonLoading(els.btnCreateTemplate, "Сохранение...", async () => {
    const payload = {
      name: els.templateName.value.trim(),
      category: els.templateCategory.value || "authority",
      visibility: els.templateVisibility.value || "private",
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
  state.relatedCases = data.relatedCases || [];
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
  setWorkspaceTab(null);
  scrollMainContentToTop();
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
  if (!requireAuthAction()) return;
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

async function uploadWorkspaceFiles() {
  if (!requireAuthAction()) return;
  if (!state.currentCaseId || !els.workspaceFilesInput?.files?.length) return;

  const files = [...els.workspaceFilesInput.files];
  const data = await api.uploadIncomingFiles(state.currentCaseId, files);
  state.currentCase = { case: data.case, fsm: data.fsm };
  state.currentCaseFiles = data.files || [];
  state.submitData = null;
  renderWorkspaceSummary();
  renderWorkspaceFiles();
  logRuntime("upload incoming files", data);
  els.workspaceFilesInput.value = "";
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
  if (!requireAuthAction()) return;
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
  if (!requireAuthAction()) return;
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

async function createLinkedCase() {
  if (!requireAuthAction()) return;
  if (!state.currentCaseId) return;

  const data = await api.createCase({ parentCaseId: state.currentCaseId });
  logRuntime("create linked case", data);
  await loadCases();

  const linkedCaseId = data?.case?.id || null;
  if (linkedCaseId) {
    await openCase(linkedCaseId);
    setScreen("case-workspace");
  }
}

async function uploadResultFiles() {
  if (!requireAuthAction()) return;
  if (!state.currentCaseId || !els.resultFilesInput?.files?.length) return;

  const files = [...els.resultFilesInput.files];
  setResultUploadProgress(true, "Загружаем файлы ответа...");
  try {
    const data = await api.uploadResultFiles(state.currentCaseId, files);
    logRuntime("upload result files", data);
    els.resultFilesInput.value = "";
    await loadResultFiles();
    await reloadCurrentCase();
    setWorkspaceTab("result");
  } finally {
    setResultUploadProgress(false);
  }
}

async function buildPackageOnly() {
  if (!state.currentCaseId) return;

  const data = await api.buildPackage(state.currentCaseId);
  state.currentCase = { case: data.case, fsm: data.fsm };
  renderWorkspaceSummary();
  logRuntime("build package", data);
}

async function openSubmitTab() {
  if (!requireAuthAction()) return;
  if (!state.currentCaseId) return;

  setWorkspaceTab("submit");
  if (state.submitData) {
    renderSubmit();
    return;
  }

  const currentFsmState = state.currentCase?.fsm?.state || "";
  const requiresPackageBuild = currentFsmState !== "package_ready";
  setSubmitProgress(true, requiresPackageBuild ? "Собираем пакет..." : "Подготавливаем отправку...");
  try {
    if (requiresPackageBuild) {
      await buildPackageOnly();
    }
    await prepareSubmit({ skipProgress: true });
  } finally {
    setSubmitProgress(false);
  }
}

async function rebuildSubmitPackage() {
  if (!requireAuthAction()) return;
  if (!state.currentCaseId) return;

  setWorkspaceTab("submit");
  setSubmitProgress(true, "Собираем пакет заново...");
  try {
    state.submitData = null;
    await buildPackageOnly();
    await prepareSubmit({ skipProgress: true });
  } finally {
    setSubmitProgress(false);
  }
}

async function prepareSubmit(options = {}) {
  if (!requireAuthAction()) return;
  if (!state.currentCaseId) return;
  const skipProgress = Boolean(options.skipProgress);

  return withButtonLoading(null, "Подготовка...", async () => {
    if (!skipProgress) {
      setSubmitProgress(true, "Перемещаем файлы и готовим отправку...");
    }
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
      if (!skipProgress) {
        setSubmitProgress(false);
      }
    }
  });
}

async function deleteCaseFromList(caseId, caseNumber) {
  if (!requireAuthAction()) return;
  const confirmed = await confirmDestructiveAction("Обращение будет скрыто и помечено на удаление. Подтвердите.");
  if (!confirmed) return;

  const data = await api.deleteCase(caseId);
  logRuntime("mark case deleted", data);

  if (state.currentCaseId === caseId) {
    state.currentCaseId = null;
    state.currentCase = null;
    state.currentCaseFiles = [];
    state.relatedCases = [];
    state.variables = {};
    state.submitData = null;
    state.resultFiles = [];
    state.textContent = "";
    setScreen("dashboard");
  }

  await loadCases();
}

async function saveCaseAsTemplate() {
  if (!requireAuthAction()) return;
  if (!state.currentCaseId) return;

  return withButtonLoading(els.btnSaveAsTemplate, "Сохранение...", async () => {
    const data = await api.saveCaseAsTemplate(state.currentCaseId);
    logRuntime("save case as template", data);

    await loadTemplates();
  });
}

async function openWorkspaceTabByName(tabName) {
  if (!tabName) return;

  if (state.currentWorkspaceTab === "submit" && tabName !== "submit") {
    await handle(persistSubmitMetaIfNeeded);
  }
  if (state.currentWorkspaceTab === "result" && tabName !== "result") {
    await handle(persistResultCommentIfNeeded);
  }

  if (tabName === "submit") {
    await openSubmitTab();
    scrollToWorkspaceTab("submit");
    return;
  }

  setWorkspaceTab(tabName);
  if (tabName === "variables") await loadVariables().catch(() => {});
  if (tabName === "text") await loadText().catch(() => {});
  if (tabName === "files") await syncFiles().catch(() => {});
  if (tabName === "result") {
    await refreshCurrentCaseData().catch(() => {});
    await loadResultFiles().catch(() => {});
  }
  scrollToWorkspaceTab(tabName);
}

async function deleteInstitutionFromList(institutionId, institutionName) {
  if (!requireAuthAction()) return;
  const confirmed = await confirmDestructiveAction("Организация будет скрыта и помечена на удаление. Подтвердите.");
  if (!confirmed) return;

  const data = await api.deleteInstitution(institutionId);
  logRuntime("mark institution deleted", data);

  await loadInstitutions();
}

async function toggleInstitutionFavorite(institutionId) {
  if (!requireAuthAction()) return;
  const item = state.institutions.find((entry) => entry.id === institutionId);
  if (!item) return;

  if (item.is_favorite) {
    await api.removeInstitutionFavorite(institutionId);
  } else {
    await api.addInstitutionFavorite(institutionId);
  }

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
      if (state.currentScreen === "case-workspace" && state.currentWorkspaceTab === "result") {
        await handle(persistResultCommentIfNeeded);
      }
      setScreen(btn.dataset.screen);
        if (btn.dataset.screen === "dashboard") {
          if (isAuthenticated()) {
            await loadCases();
          }
          scrollMainContentToTop();
        }
        if (btn.dataset.screen === "institutions") {
          await ensureAdminUsersLoaded();
          resetInstitutionForm();
          els.institutionFormPanel?.classList.add("hidden");
          await loadInstitutions();
        }
        if (btn.dataset.screen === "templates") {
          await ensureAdminUsersLoaded();
          resetTemplateForm();
          els.templateFormPanel?.classList.add("hidden");
          await loadTemplates();
        }
        if (btn.dataset.screen === "admin") {
          state.adminSection = "users";
          await loadInstitutions();
          await loadTemplates();
          await loadAdminUsers();
          await loadAdminBackups();
          renderAdminPanels();
          scrollMainContentToTop();
        }
      });
  });

  els.btnLogin?.addEventListener("click", () => handle(loginUser));
  els.btnRegister?.addEventListener("click", () => handle(registerUser));
  els.btnOpenAuthModal?.addEventListener("click", () => openAuthModal("login"));
  els.btnShowRegisterPanel?.addEventListener("click", () => setAuthModalMode("register"));
  els.btnShowLoginPanel?.addEventListener("click", () => setAuthModalMode("login"));
  els.btnCloseAuthModal?.addEventListener("click", closeAuthModal);
  els.authModalBackdrop?.addEventListener("click", closeAuthModal);
  els.btnAdminScreen?.addEventListener("click", async () => {
    if (!isAdminRole(state.authUser?.role)) return;
    setScreen("admin");
    state.adminSection = "users";
    await loadInstitutions();
    await loadTemplates();
    await loadAdminUsers();
    await loadAdminBackups();
    renderAdminPanels();
    scrollMainContentToTop();
  });
  els.btnLogout?.addEventListener("click", () => handle(logoutUser));
  els.btnCreateBackup?.addEventListener("click", () => handle(createBackupFromAdmin));
  els.authLoginPassword?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handle(loginUser);
    }
  });
  els.authRegisterPassword?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handle(registerUser);
    }
  });

  els.btnBrandHome?.addEventListener("click", async () => {
    if (state.currentScreen === "case-workspace" && state.currentWorkspaceTab === "submit") {
      await handle(persistSubmitMetaIfNeeded);
    }
    if (state.currentScreen === "case-workspace" && state.currentWorkspaceTab === "result") {
      await handle(persistResultCommentIfNeeded);
    }
    setScreen("dashboard");
    if (isAuthenticated()) {
      await handle(loadCases);
    }
    scrollMainContentToTop();
  });

  els.contextNav?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-context-action]");
    if (!button) return;

    const action = button.dataset.contextAction || "";
    if (action.startsWith("screen:")) {
      const screenName = action.slice("screen:".length);
      setScreen(screenName);
      if (screenName === "dashboard" && isAuthenticated()) {
        await handle(loadCases);
      }
      return;
    }
    if (action.startsWith("tab:")) {
      await handle(() => openWorkspaceTabByName(action.slice(4)));
      return;
    }
    if (action === "dashboard:create-case") {
      await handle(createCase);
      return;
    }

      if (action.startsWith("institutions-category:")) {
        state.institutionsCategoryFilter = action.slice("institutions-category:".length);
        renderContextNav();
        renderInstitutions();
        return;
      }

      if (action.startsWith("institutions-scope:")) {
        state.institutionsScopeFilter = action.slice("institutions-scope:".length);
        if (state.institutionsScopeFilter !== "owned") {
          state.institutionsUserFilter = "";
          state.institutionsUserFilterText = "";
        }
        renderContextNav();
        renderInstitutions();
        return;
      }

      if (action.startsWith("templates-category:")) {
        state.templatesCategoryFilter = action.slice("templates-category:".length);
        renderContextNav();
        renderTemplates();
        return;
      }

      if (action.startsWith("templates-scope:")) {
        state.templatesScopeFilter = action.slice("templates-scope:".length);
        if (state.templatesScopeFilter !== "owned") {
          state.templatesUserFilter = "";
          state.templatesUserFilterText = "";
        }
        renderContextNav();
        renderTemplates();
        return;
      }

      if (action.startsWith("admin-section:")) {
        state.adminSection = action.slice("admin-section:".length);
        renderContextNav();
        renderAdminPanels();
        if (state.adminSection === "deleted") {
          await handle(loadDeletedAdminItems);
        } else if (state.adminSection === "backups") {
          await handle(loadAdminBackups);
        }
        return;
      }

      if (action === "admin-action:purge-deleted") {
        await handle(purgeDeletedRecords);
        return;
      }
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
        input.value = parseStrictDisplayDate(input.value, input === els.caseDate ? "Дата обращения" : "Дата регистрации");
      } catch {
        // Keep masked value visible; full validation error is shown on save.
      }
    });
  });

  els.btnSaveCaseMeta?.addEventListener("click", () => handle(saveCaseMeta));
  els.btnCloseImageModal?.addEventListener("click", closeImageModal);
  els.imageModalBackdrop?.addEventListener("click", closeImageModal);
  els.imageModalSelectedCheckbox?.addEventListener("change", () => {
    const fileId = els.imageModalSelectedCheckbox.dataset.fileId;
    if (!fileId) return;
    syncModalSelectionState(fileId, els.imageModalSelectedCheckbox.checked);
    renderWorkspaceFiles();
  });
  if (els.btnShowRuntimeLog) {
    els.btnShowRuntimeLog.addEventListener("click", openRuntimeLogModal);
  }
  els.btnCloseRuntimeLog?.addEventListener("click", closeRuntimeLogModal);
  els.runtimeLogBackdrop?.addEventListener("click", closeRuntimeLogModal);
  els.btnConfirmModalYes?.addEventListener("click", () => closeConfirmModal(true));
  els.btnConfirmModalCancel?.addEventListener("click", () => closeConfirmModal(false));
  els.confirmModalBackdrop?.addEventListener("click", () => closeConfirmModal(false));
  if (els.casesSearchInput) {
  els.casesSearchInput.addEventListener("input", (event) => {
    state.casesSearch = event.target.value || "";
    saveCaseFiltersToSession();
    renderCases();
  });
}
  els.casesInstitutionFilter?.addEventListener("change", (event) => {
    state.casesInstitutionFilter = event.target.value || "";
    saveCaseFiltersToSession();
    renderCases();
  });
  els.casesStatusFilter?.addEventListener("change", (event) => {
    state.casesStatusFilter = event.target.value || "";
    saveCaseFiltersToSession();
    renderCases();
  });
  els.casesUserFilter?.addEventListener("input", (event) => {
    const value = event.target.value || "";
    state.casesUserFilterText = value;
    const user = getAdminUserByFilterValue(value);
    state.casesUserFilter = user?.id || "";
    saveCaseFiltersToSession();
    renderCases();
  });
  els.institutionUserFilter?.addEventListener("input", (event) => {
    const value = event.target.value || "";
    state.institutionsUserFilterText = value;
    const user = getAdminUserByFilterValue(value);
    state.institutionsUserFilter = user?.id || "";
    renderInstitutions();
  });
  els.institutionsSearchInput?.addEventListener("input", (event) => {
    state.institutionsSearch = event.target.value || "";
    renderInstitutions();
  });
  els.templateUserFilter?.addEventListener("input", (event) => {
    const value = event.target.value || "";
    state.templatesUserFilterText = value;
    const user = getAdminUserByFilterValue(value);
    state.templatesUserFilter = user?.id || "";
    renderTemplates();
  });
  els.templatesSearchInput?.addEventListener("input", (event) => {
    state.templatesSearch = event.target.value || "";
    renderTemplates();
  });
  els.adminPrivateInstitutionUserFilter?.addEventListener("input", (event) => {
    const value = event.target.value || "";
    state.adminPrivateInstitutionsUserFilterText = value;
    const user = getAdminUserByFilterValue(value);
    state.adminPrivateInstitutionsUserFilter = user?.id || "";
    renderAdminDirectories();
  });
  els.adminPrivateTemplateUserFilter?.addEventListener("input", (event) => {
    const value = event.target.value || "";
    state.adminPrivateTemplatesUserFilterText = value;
    const user = getAdminUserByFilterValue(value);
    state.adminPrivateTemplatesUserFilter = user?.id || "";
    renderAdminDirectories();
  });
  els.btnResetCaseFilters?.addEventListener("click", () => {
    state.casesSearch = "";
    state.casesInstitutionFilter = "";
    state.casesStatusFilter = "";
    state.casesUserFilter = "";
    state.casesUserFilterText = "";
    saveCaseFiltersToSession();
    renderCaseFilters();
    renderCases();
  });
  els.tabButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      await handle(() => openWorkspaceTabByName(btn.dataset.tab));
    });
  });

  els.btnCancelInstitution?.addEventListener("click", () => {
    resetInstitutionForm();
    els.institutionFormPanel.classList.add("hidden");
  });

  els.btnCancelTemplate?.addEventListener("click", () => {
    resetTemplateForm();
    els.templateFormPanel.classList.add("hidden");
  });

  els.btnCreateCase?.addEventListener("click", () => handle(createCase));
  els.btnCreateLinkedCase?.addEventListener("click", () => handle(createLinkedCase));

  els.btnToggleInstitutionForm?.addEventListener("click", () => {
    if (!requireAuthAction()) return;
    resetInstitutionForm();
    els.institutionFormPanel.classList.remove("hidden");
  });

  els.btnCreateInstitution?.addEventListener("click", () => handle(createInstitution));

  els.btnToggleTemplateForm?.addEventListener("click", () => {
    if (!requireAuthAction()) return;
    resetTemplateForm();
    els.templateFormPanel.classList.remove("hidden");
  });
  
  els.btnCreateTemplate?.addEventListener("click", () => handle(createTemplate));

  els.btnBackToCases?.addEventListener("click", async () => {
    if (state.currentWorkspaceTab === "submit") {
      await handle(persistSubmitMetaIfNeeded);
    }
    if (state.currentWorkspaceTab === "result") {
      await handle(persistResultCommentIfNeeded);
    }
    setScreen("dashboard");
    if (isAuthenticated()) {
      await handle(loadCases);
    }
    scrollMainContentToTop();
  });
  els.btnSaveFilesSelection?.addEventListener("click", () => handle(saveFiles));
  els.btnPickWorkspaceFiles?.addEventListener("click", () => {
    if (!requireAuthAction()) return;
    els.workspaceFilesInput?.click();
  });
  els.workspaceFilesInput?.addEventListener("change", () => handle(uploadWorkspaceFiles));
  els.workspaceDropzone?.addEventListener("click", () => {
    if (!requireAuthAction()) return;
    els.workspaceFilesInput?.click();
  });
  els.workspaceDropzone?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (!requireAuthAction()) return;
    els.workspaceFilesInput?.click();
  });
  ["dragenter", "dragover"].forEach((eventName) => {
    els.workspaceDropzone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      els.workspaceDropzone?.classList.add("drag-over");
    });
  });
  ["dragleave", "dragend"].forEach((eventName) => {
    els.workspaceDropzone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      els.workspaceDropzone?.classList.remove("drag-over");
    });
  });
  els.workspaceDropzone?.addEventListener("drop", (event) => {
    event.preventDefault();
    event.stopPropagation();
    els.workspaceDropzone?.classList.remove("drag-over");
    if (!requireAuthAction()) return;
    const files = event.dataTransfer?.files;
    if (!files?.length || !els.workspaceFilesInput) return;
    els.workspaceFilesInput.files = files;
    handle(uploadWorkspaceFiles);
  });
  els.btnSaveVariables?.addEventListener("click", () => handle(saveVariables));
  els.btnSaveText?.addEventListener("click", () => handle(saveText));
  els.btnDownloadSubmitText?.addEventListener("click", downloadSubmitText);
  els.btnCopySubmitText?.addEventListener("click", () => handle(() => copyToClipboard(els.submitText.value, "Текст жалобы скопирован")));
  els.btnRebuildSubmitPackage?.addEventListener("click", () => handle(rebuildSubmitPackage));
  els.btnCopySubmitUrl?.addEventListener("click", () => handle(async () => {
    const url = String(els.submitInstitutionUrl.value || "").trim();

    if (!url) {
      alert("URL организации пока пустой.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }));
  els.btnDownloadSubmitFiles?.addEventListener("click", () => handle(downloadSubmitFiles));
  els.btnUploadResultFiles?.addEventListener("click", () => {
    if (!requireAuthAction()) return;
    els.resultFilesInput?.click();
  });
  els.resultFilesInput?.addEventListener("change", () => handle(uploadResultFiles));
  els.resultComment?.addEventListener("blur", () => {
    if (!isAuthenticated()) return;
    handle(persistResultCommentIfNeeded);
  });
  els.adminUsersList?.addEventListener("change", (event) => {
    const select = event.target.closest("[data-user-role-id]");
    if (!select || !canManageUsers()) return;

    handle(async () => {
      const data = await api.updateUserRole(select.dataset.userRoleId, select.value);
      const nextUser = data.user;
      state.adminUsers = state.adminUsers.map((item) => item.id === nextUser.id ? nextUser : item);
      renderAdminUsers();
      logRuntime("update user role", data);
    });
  });
  els.adminUsersList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-user-id]");
    if (!button || !canManageUsers()) return;
    handle(() => deleteUserFromAdmin(button.dataset.deleteUserId, button.dataset.deleteUserNickname));
  });
}

async function deleteTemplateFromList(templateId, templateName) {
  if (!requireAuthAction()) return;
  const confirmed = await confirmDestructiveAction("Шаблон будет скрыт и помечен на удаление. Подтвердите.");
  if (!confirmed) return;

  const data = await api.deleteTemplate(templateId);
  logRuntime("mark template deleted", data);

  await loadTemplates();
}

async function toggleTemplateFavorite(templateId) {
  if (!requireAuthAction()) return;
  const item = state.templates.find((entry) => entry.id === templateId);
  if (!item) return;

  if (item.is_favorite) {
    await api.removeTemplateFavorite(templateId);
  } else {
    await api.addTemplateFavorite(templateId);
  }

  await loadTemplates();
}

async function handle(fn) {
  try {
    await fn();
  } catch (error) {
    const message = String(error?.message || "");
    if (message.toLowerCase().includes("generated text artifact not found")) {
      return;
    }
    if (error?.status === 401 || message.toLowerCase().includes("unauthorized")) {
      if (!isAuthenticated()) {
        openAuthModal("login");
      }
      return;
    }
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
  setAuthModalMode("login");
  renderAuthState();
  await restoreAuthSession();
}

bootstrap().catch((error) => {
  const message = String(error?.message || "");
  if (message.toLowerCase().includes("unauthorized")) {
    return;
  }
  logRuntime("bootstrap error", error?.message || String(error));
  alert(error?.message || "Bootstrap error");
});



