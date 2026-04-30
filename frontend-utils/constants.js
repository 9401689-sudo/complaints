export const FIXED_VARIABLES = [
  {
    key: "complaint_date",
    enabledKey: "complaint_date_enabled",
    label: "Дата",
    type: "date",
    token: "{{complaint_date}}"
  },
  {
    key: "address",
    enabledKey: "address_enabled",
    label: "Адрес",
    type: "text",
    token: "{{address}}"
  },
  {
    key: "license_plate",
    enabledKey: "license_plate_enabled",
    label: "Гос.номер",
    type: "text",
    token: "{{license_plate}}"
  }
];

export const DIRECTORY_CATEGORIES = [
  { value: "", label: "Все категории" },
  { value: "authority", label: "Органы власти" },
  { value: "state_org", label: "Государственные организации" },
  { value: "other_org", label: "Прочие организации" }
];

export const DIRECTORY_CATEGORY_LABELS = {
  authority: "Органы власти",
  state_org: "Государственные организации",
  other_org: "Прочие организации"
};

export const CASE_STATUS_FILTER_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "created_group", label: "Создано" },
  { value: "sent", label: "Отправлено" },
  { value: "has_reply", label: "Есть ответ" }
];

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
