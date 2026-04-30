export function roleLabel(role, roleLabels = {}) {
  return roleLabels[role] || role || "Пользователь";
}

export function isAdminRole(role) {
  return role === "admin_view" || role === "admin_full";
}

export function canManageDirectoriesByRole(role) {
  return role === "admin_full";
}

export function canManageUsersByRole(role) {
  return role === "admin_full";
}

export function getDirectoryScopeOptions({ kind, isAuthenticated, isAdmin }) {
  if (isAdmin) {
    return kind === "institutions"
      ? [
          { value: "", label: "Все организации" },
          { value: "public", label: "Общие" },
          { value: "owned", label: "Организации пользователей" }
        ]
      : [
          { value: "", label: "Все шаблоны" },
          { value: "public", label: "Общие" },
          { value: "owned", label: "Шаблоны пользователей" }
        ];
  }

  if (!isAuthenticated) {
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

export function getAdminUserFilterValue(user, roleLabels = {}) {
  return `${user.nickname} [${roleLabel(user.role, roleLabels)}]`;
}

export function getVisibilityLabel(visibility) {
  return visibility === "private" ? "Личное" : "Общее";
}

export function canEditDirectoryItem(item) {
  return Boolean(item?.can_edit);
}

export function canOpenDirectoryItem(item, isAuthenticated) {
  if (!isAuthenticated) {
    return false;
  }
  return Boolean(item);
}
