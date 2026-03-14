const API_BASE = "https://complaints-api.doorsvip.ru/complaints/api";

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;

  const headers = {
    ...(options.headers || {})
  };

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
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {})
    }
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
  listCases() {
    return request("/cases");
  },

  createCase() {
    return request("/cases", {
      method: "POST",
      body: JSON.stringify({})
    });
  },

  getCase(caseId) {
    return request(`/cases/${caseId}`);
  },

  getResultFiles(caseId) {
    return request(`/cases/${caseId}/result-files`);
  },

  listInstitutions() {
    return request("/institutions");
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
