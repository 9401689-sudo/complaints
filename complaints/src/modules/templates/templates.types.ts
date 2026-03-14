export interface TemplateRecord {
  id: string;
  name: string;
  institution_id: string | null;
  body_template: string;
  variables_schema: unknown[];
  default_values: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateBody {
  name: string;
  bodyTemplate: string;
  variablesSchema?: unknown[];
  defaultValues?: Record<string, unknown>;
}

export interface UpdateTemplateBody {
  name?: string;
  bodyTemplate?: string;
  variablesSchema?: unknown[];
  defaultValues?: Record<string, unknown>;
}
