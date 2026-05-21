export function isAdminRole(role) {
  return role === "admin_view" || role === "admin_full";
}

export function isAuthenticatedUser(authUser) {
  return Boolean(authUser);
}

export function canManageDirectories(authUser) {
  return authUser?.role === "admin_full";
}

export function canManageUsers(authUser) {
  return authUser?.role === "admin_full";
}

export function canEditDirectoryItem(item) {
  return Boolean(item?.can_edit);
}

export function canOpenDirectoryItem(authUser, item) {
  if (!isAuthenticatedUser(authUser)) {
    return false;
  }
  return Boolean(item);
}

export function getDirectoryScopeOptions(authUser, kind) {
  if (isAdminRole(authUser?.role)) {
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

  if (!isAuthenticatedUser(authUser)) {
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
