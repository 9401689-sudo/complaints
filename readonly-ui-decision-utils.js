const HIDDEN_BUTTONS = [
  "btnCreateCase",
  "btnToggleInstitutionForm",
  "btnToggleTemplateForm",
  "btnCreateLinkedCase",
  "btnSaveCaseMeta",
  "btnSaveFilesSelection",
  "btnPickWorkspaceFiles",
  "btnSaveVariables",
  "btnSaveText",
  "btnRebuildSubmitPackage",
  "btnUploadResultFiles"
];

const DISABLED_CONTROLS = [
  "resultComment",
  "caseTitle",
  "caseDescription",
  "caseDate",
  "caseInstitutionSelect",
  "caseTemplateSelect"
];

const READONLY_CONTROLS = [
  "caseTextEditor"
];

const HIDDEN_ZONES = [
  "workspaceDropzone"
];

export function deriveReadonlyUiStateMatrix(input = {}) {
  const authenticated = Boolean(input.isAuthenticated);
  const readOnly = !authenticated;

  return {
    readOnly,
    hiddenButtons: HIDDEN_BUTTONS,
    disabledControls: DISABLED_CONTROLS,
    readOnlyControls: READONLY_CONTROLS,
    hiddenZones: HIDDEN_ZONES,
    variablesFormControlsDisabled: true
  };
}
