export function getCaseStatusBadges(item, statusLabels, statusClasses) {
  const badges = [];

  if (!item.institution_id) {
    badges.push({ text: "НЕТ ОРГАНИЗАЦИИ", cls: "warn" });
  }

  if (!item.template_id) {
    badges.push({ text: "НЕТ ШАБЛОНА", cls: "warn" });
  }

  const primaryStatus = String(item.case_status || "").trim() || "created";
  if (statusLabels[primaryStatus]) {
    badges.push({
      text: statusLabels[primaryStatus],
      cls: statusClasses[primaryStatus] || "info"
    });
  }

  if (Number(item.linked_cases_count || 0) > 0) {
    badges.push({ text: "ЕСТЬ СВЯЗАННЫЕ", cls: "info" });
  }

  return badges;
}
