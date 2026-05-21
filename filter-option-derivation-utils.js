export function deriveAdminUserDatalistOptions(adminUsers = [], toFilterValue) {
  return adminUsers.map((user) => ({
    value: resolveAdminUserFilterValue(user, toFilterValue)
  }));
}

export function getAdminUserByFilterValue(adminUsers = [], value, toFilterValue) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return null;
  }

  return adminUsers.find((user) => resolveAdminUserFilterValue(user, toFilterValue) === normalized) || null;
}

export function getAdminUserFilterInputValue(adminUsers = [], userId, toFilterValue) {
  if (!userId) {
    return "";
  }

  const user = adminUsers.find((item) => item.id === userId);
  return user ? resolveAdminUserFilterValue(user, toFilterValue) : "";
}

export function deriveCaseFilterOptions(institutions = [], statusOptions = []) {
  return {
    institutionOptions: [
      { value: "", label: "Все организации" },
      ...institutions.map((item) => ({ value: item.id, label: item.name || "" }))
    ],
    statusOptions: statusOptions.map((item) => ({ value: item.value, label: item.label }))
  };
}

function resolveAdminUserFilterValue(user, toFilterValue) {
  if (typeof toFilterValue === "function") {
    return String(toFilterValue(user));
  }

  return String(user?.nickname || "");
}
