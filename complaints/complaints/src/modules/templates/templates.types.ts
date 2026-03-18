export interface TemplateRecord {
  id: string;
  name: string;
  institution_id: string | null;
  body_template: string;
  variables_schema: unknown[];
  default_values: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateBody {
  name: string;
  institutionId?: string | null;
  bodyTemplate: string;
  variablesSchema?: unknown[];
  defaultValues?: Record<string, unknown>;
  active?: boolean;
}

export interface UpdateTemplateBody {
  name?: string;
  institutionId?: string | null;
  bodyTemplate?: string;
  variablesSchema?: unknown[];
  defaultValues?: Record<string, unknown>;
  active?: boolean;
}
