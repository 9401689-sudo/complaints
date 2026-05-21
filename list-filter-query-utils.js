export function deriveVisibleCases(cases = [], filters = {}) {
  const query = normalizeQuery(filters.query);
  const institutionFilter = filters.institutionFilter || "";
  const statusFilter = filters.statusFilter || "";
  const userFilter = filters.userFilter || "";

  return cases.filter((item) => {
    if (institutionFilter && item.institution_id !== institutionFilter) {
      return false;
    }

    if (userFilter && item.owner_user_id !== userFilter) {
      return false;
    }

    if (statusFilter) {
      if (statusFilter === "created_group") {
        if (!isCreatedGroupStatus(item.case_status)) {
          return false;
        }
      } else if (item.case_status !== statusFilter) {
        return false;
      }
    }

    return includesQuery([
      item.title || "",
      item.description || "",
      item.case_number || "",
      item.institution_name || "",
      item.template_name || "",
      item.owner_nickname || ""
    ], query);
  });
}

export function deriveVisibleInstitutions(institutions = [], filters = {}) {
  const showOwner = Boolean(filters.showOwner);
  const scopeFilter = filters.scopeFilter || "";
  const userFilter = filters.userFilter || "";
  const categoryFilter = filters.categoryFilter || "";
  const searchQuery = normalizeQuery(filters.search);

  return institutions.filter((item) => {
    if (showOwner) {
      if (scopeFilter === "owned" && item.visibility !== "private") {
        return false;
      }
      if (scopeFilter === "public" && item.visibility !== "public") {
        return false;
      }
      if (userFilter && item.owner_user_id !== userFilter) {
        return false;
      }
    } else if (scopeFilter === "favorites" && !item.is_favorite) {
      return false;
    }

    if (categoryFilter && (item.category || "authority") !== categoryFilter) {
      return false;
    }

    return includesQuery([
      item.name || "",
      item.submit_url || "",
      item.owner_nickname || ""
    ], searchQuery);
  });
}

export function deriveVisibleTemplates(templates = [], filters = {}) {
  const showOwner = Boolean(filters.showOwner);
  const scopeFilter = filters.scopeFilter || "";
  const userFilter = filters.userFilter || "";
  const categoryFilter = filters.categoryFilter || "";
  const searchQuery = normalizeQuery(filters.search);

  return templates.filter((item) => {
    if (showOwner) {
      if (scopeFilter === "owned" && item.visibility !== "private") {
        return false;
      }
      if (scopeFilter === "public" && item.visibility !== "public") {
        return false;
      }
      if (userFilter && item.owner_user_id !== userFilter) {
        return false;
      }
    } else if (scopeFilter === "favorites" && !item.is_favorite) {
      return false;
    }

    if (categoryFilter && (item.category || "authority") !== categoryFilter) {
      return false;
    }

    return includesQuery([
      item.name || "",
      item.body_template || "",
      item.owner_nickname || ""
    ], searchQuery);
  });
}

function normalizeQuery(value) {
  return String(value || "").trim().toLowerCase();
}

function includesQuery(parts, query) {
  if (!query) {
    return true;
  }

  return parts.join(" ").toLowerCase().includes(query);
}

function isCreatedGroupStatus(status) {
  return status === "no_organization"
    || status === "no_template"
    || status === "created";
}
