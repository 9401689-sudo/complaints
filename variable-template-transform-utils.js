import { FIXED_VARIABLES } from "./fixed-variables-config.js";
import {
  formatComplaintDate,
  formatDateForInput,
  normalizeDisplayDate
} from "./date-text-utils.js";

export function getRenderableVariableValue(field, variables) {
  const enabled = String(variables[field.enabledKey] ?? "true").toLowerCase() === "true";

  if (!enabled) {
    return "";
  }

  const rawValue = String(variables[field.key] ?? "");
  return field.key === "complaint_date" ? formatComplaintDate(rawValue) : rawValue;
}

export function getDefaultTemplateValues() {
  return {
    complaint_date: "",
    address: "",
    license_plate: ""
  };
}

export function getTemplateVariablesSchema() {
  return FIXED_VARIABLES.map(({ key, label, type }) => ({
    key,
    label,
    type,
    required: false
  }));
}

export function normalizeVariableState(variables = {}) {
  const normalized = { ...variables };

  for (const field of FIXED_VARIABLES) {
    const rawEnabled = normalized[field.enabledKey];
    const enabled = rawEnabled === undefined ? true : String(rawEnabled).toLowerCase() === "true";
    normalized[field.enabledKey] = String(enabled);

    if (normalized[field.key] === undefined || normalized[field.key] === null || normalized[field.key] === "") {
      normalized[field.key] = field.key === "complaint_date" ? formatDateForInput(new Date()) : "";
    }

    if (field.key === "complaint_date") {
      normalized[field.key] = normalizeDisplayDate(normalized[field.key]);
    }
  }

  return normalized;
}
