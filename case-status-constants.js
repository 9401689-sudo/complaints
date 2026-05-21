export const CASE_STATUS_LABELS = {
  created: "СОЗДАНО",
  sent: "ОТПРАВЛЕНО",
  has_reply: "ЕСТЬ ОТВЕТ"
};

export const CASE_STATUS_CLASSES = {
  created: "info",
  sent: "ready",
  has_reply: "ready"
};

export const ROLE_LABELS = {
  user: "пользователь",
  admin_view: "только просмотр",
  admin_full: "полный доступ"
};

export const CASE_STATUS_FILTER_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "created_group", label: "Создано" },
  { value: "sent", label: "Отправлено" },
  { value: "has_reply", label: "Есть ответ" }
];
