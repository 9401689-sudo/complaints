import { ROLE_LABELS } from "./case-status-constants.js";
import { DIRECTORY_CATEGORY_LABELS } from "./directory-category-constants.js";

export function roleLabel(role) {
  return ROLE_LABELS[role] || role || "Пользователь";
}

export function getCategoryLabel(value) {
  return DIRECTORY_CATEGORY_LABELS[value] || "Без категории";
}

export function getAdminUserFilterValue(user) {
  return `${user.nickname} [${roleLabel(user.role)}]`;
}
