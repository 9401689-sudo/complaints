function getAppPrefix() {
  const path = window.location.pathname || "/";
  const [, prefix] = path.split("/");
  return prefix || "complaints";
}

const API_BASE = `https://complaints-api.doorsvip.ru/${getAppPrefix()}/api`;
const AUTH_TOKEN_KEY = "complaints_auth_token";

function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

function setAuthToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;

  const headers = {
    ...(options.headers || {})
  };

  const token = getAuthToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = isJson
      ? payload?.error || payload?.message || `HTTP ${response.status}`
      : `HTTP ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    error.url = url;
    throw error;
  }

  return payload;
}

async function requestBlob(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    ...(options.headers || {})
  };

  const token = getAuthToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const message = `HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.url = url;
    throw error;
  }

  const contentDisposition = response.headers.get("content-disposition") || "";
  const match = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename=\"?([^\";]+)\"?/i);
  const filename = decodeURIComponent(match?.[1] || match?.[2] || "download.bin");
  const blob = await response.blob();

  return { blob, filename };
}

export const api = {
  setAuthToken,

  getAuthToken() {
    return getAuthToken();
  },

  clearAuthToken() {
    setAuthToken("");
  },

  register(payload) {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  login(payload) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  me() {
    return request("/auth/me");
  },

  logout() {
    return request("/auth/logout", {
      method: "POST"
    });
  },

  listUsers() {
    return request("/auth/users");
  },

  updateUserRole(userId, role) {
    return request(`/auth/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role })
    });
  },

  deleteUser(userId) {
    return request(`/auth/users/${userId}`, {
      method: "DELETE"
    });
  },

  purgeDeleted() {
    return request("/admin/purge-deleted", {
      method: "POST"
    });
  },

  listDeletedAdminItems() {
    return request("/admin/deleted");
  },

  restoreDeletedCase(id) {
    return request(`/admin/deleted/cases/${id}/restore`, {
      method: "POST"
    });
  },

  restoreDeletedInstitution(id) {
    return request(`/admin/deleted/institutions/${id}/restore`, {
      method: "POST"
    });
  },

  restoreDeletedTemplate(id) {
    return request(`/admin/deleted/templates/${id}/restore`, {
      method: "POST"
    });
  },

  listBackups() {
    return request("/admin/backups");
  },

  createBackup() {
    return request("/admin/backups", {
      method: "POST"
    });
  },

  restoreBackup(fileName) {
    return request("/admin/backups/restore", {
      method: "POST",
      body: JSON.stringify({ fileName })
    });
  },

  deleteBackup(fileName) {
    return request("/admin/backups", {
      method: "DELETE",
      body: JSON.stringify({ fileName })
    });
  },

  listCases() {
    return request("/cases");
  },

  createCase(payload = {}) {
    return request("/cases", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  getCase(caseId) {
    return request(`/cases/${caseId}`);
  },

  getResultFiles(caseId) {
    return request(`/cases/${caseId}/result-files`);
  },

  async uploadResultFiles(caseId, files) {
    const preparedFiles = await Promise.all((files || []).map(async (file) => {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";

      for (let index = 0; index < bytes.length; index += 1) {
        binary += String.fromCharCode(bytes[index]);
      }

      return {
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        contentBase64: btoa(binary)
      };
    }));

    return request(`/cases/${caseId}/result-files/upload`, {
      method: "POST",
      body: JSON.stringify({ files: preparedFiles })
    });
  },

  async uploadIncomingFiles(caseId, files) {
    const preparedFiles = await Promise.all((files || []).map(async (file) => {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";

      for (let index = 0; index < bytes.length; index += 1) {
        binary += String.fromCharCode(bytes[index]);
      }

      return {
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        contentBase64: btoa(binary)
      };
    }));

    return request(`/cases/${caseId}/files/upload`, {
      method: "POST",
      body: JSON.stringify({ files: preparedFiles })
    });
  },

  listInstitutions() {
    return request("/institutions");
  },

  addInstitutionFavorite(id) {
    return request(`/institutions/${id}/favorite`, {
      method: "POST"
    });
  },

  removeInstitutionFavorite(id) {
    return request(`/institutions/${id}/favorite`, {
      method: "DELETE"
    });
  },

  createInstitution(payload) {
    return request("/institutions", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  updateInstitution(id, payload) {
    return request(`/institutions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },

  deleteInstitution(institutionId) {
    return request(`/institutions/${institutionId}`, {
      method: "DELETE"
    });
  },

  listTemplates() {
    return request("/templates");
  },

  addTemplateFavorite(id) {
    return request(`/templates/${id}/favorite`, {
      method: "POST"
    });
  },

  removeTemplateFavorite(id) {
    return request(`/templates/${id}/favorite`, {
      method: "DELETE"
    });
  },

  createTemplate(payload) {
    return request("/templates", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  updateTemplate(id, payload) {
    return request(`/templates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },

  deleteTemplate(templateId) {
    return request(`/templates/${templateId}`, {
      method: "DELETE"
    });
  },

  syncFiles(caseId) {
    return request(`/cases/${caseId}/sync-files`, {
      method: "POST"
    });
  },

  updateFiles(caseId, files) {
    return request(`/cases/${caseId}/files`, {
      method: "PATCH",
      body: JSON.stringify({ files })
    });
  },

  updateCaseConfig(caseId, payload) {
    return request(`/cases/${caseId}/config`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },

  getVariables(caseId) {
    return request(`/cases/${caseId}/variables`);
  },

  saveVariables(caseId, variables) {
    return request(`/cases/${caseId}/variables`, {
      method: "PUT",
      body: JSON.stringify({ variables })
    });
  },

  generateText(caseId) {
    return request(`/cases/${caseId}/generate-text`, {
      method: "POST"
    });
  },

  updateCaseMeta(caseId, payload) {
    return request(`/cases/${caseId}/meta`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },

  getText(caseId) {
    return request(`/cases/${caseId}/text`);
  },

  saveText(caseId, content) {
    return request(`/cases/${caseId}/text`, {
      method: "PUT",
      body: JSON.stringify({ content })
    });
  },

  buildPackage(caseId) {
    return request(`/cases/${caseId}/build-package`, {
      method: "POST"
    });
  },

  prepareSubmit(caseId) {
    return request(`/cases/${caseId}/submit-prepare`, {
      method: "POST"
    });
  },

  saveCaseAsTemplate(caseId) {
    return request(`/cases/${caseId}/save-as-template`, {
      method: "POST"
    });
  },

  deleteCase(caseId) {
    return request(`/cases/${caseId}`, {
      method: "DELETE"
    });
  },

  downloadCaseFile(caseId, fileId) {
    return requestBlob(`/cases/${caseId}/files/${fileId}/download`);
  }
};
