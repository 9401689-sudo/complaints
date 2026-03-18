export interface CaseVariableRecord {
  id: string;
  case_id: string;
  var_key: string;
  var_value: string | null;
  created_at: string;
}

export type CaseVariablesMap = Record<string, string>;

export interface UpdateCaseVariablesBody {
  variables: Record<string, string | null | undefined>;
}
