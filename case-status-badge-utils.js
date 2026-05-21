import {
  CASE_STATUS_CLASSES,
  CASE_STATUS_LABELS
} from "./case-status-constants.js";

export function getCaseStatusBadges(item) {
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
