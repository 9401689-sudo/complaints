import { FIXED_VARIABLES } from "./fixed-variables-config.js";
import { collapseDuplicateDateSuffixes } from "./date-text-utils.js";
import {
  getRenderableVariableValue,
  normalizeVariableState
} from "./variable-template-transform-utils.js";

export function resolveCurrentTemplate(templates = [], templateId = "") {
  if (!templateId) {
    return null;
  }

  return templates.find((item) => item.id === templateId) || null;
}

export function buildComputedTextPreview(template, variables) {
  if (!template?.body_template) {
    return "";
  }

  const mergedVariables = normalizeVariableState({
    ...(template.default_values && typeof template.default_values === "object"
      ? template.default_values
      : {}),
    ...(variables || {})
  });

  const rendered = template.body_template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
    const field = FIXED_VARIABLES.find((item) => item.key === key);
    if (field) {
      return getRenderableVariableValue(field, mergedVariables);
    }

    return String(mergedVariables[key] ?? "");
  });

  return collapseDuplicateDateSuffixes(rendered);
}
