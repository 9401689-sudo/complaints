export function deriveWorkspaceSummaryText(input = {}) {
  const caseData = input.caseData || {};
  const isAdmin = Boolean(input.isAdmin);

  const title = caseData.title
    ? String(caseData.title)
    : (caseData.case_number ? `Обращение ${caseData.case_number}` : "Обращение");

  const subtitleParts = [];
  if (caseData.description) {
    subtitleParts.push(String(caseData.description));
  }
  if (isAdmin) {
    subtitleParts.push(`Пользователь: ${caseData.owner_nickname || "—"}`);
  }

  return {
    title,
    subtitle: subtitleParts.join(" · ")
  };
}

export function deriveWorkspaceFileSelectionStatusText(selected, orderValue) {
  return selected
    ? `В подаче · порядок ${Number(orderValue)}`
    : "Не выбран для подачи";
}

export function deriveCreateCaseProgressLabel() {
  return "Создаём обращение...";
}

export function deriveFilesSyncProgressLabel(kind, payload = {}) {
  if (kind === "sync_initial") {
    return "Синхронизируем файлы из incoming...";
  }

  if (kind === "upload_batch") {
    const done = Number(payload.done || 0);
    const total = Number(payload.total || 0);
    return `Загружено ${done} из ${total}`;
  }

  return "Синхронизируем файлы...";
}

export function deriveResultUploadProgressLabel(done, total) {
  return `Загружено ${Number(done || 0)} из ${Number(total || 0)}`;
}

export function deriveSubmitProgressLabel(kind) {
  if (kind === "rebuild") {
    return "Собираем пакет заново...";
  }
  if (kind === "prepare") {
    return "Перемещаем файлы и готовим отправку...";
  }
  return "Подготовка отправки...";
}
