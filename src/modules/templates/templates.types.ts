export interface TemplateRecord {
  id: string;
  name: string;
  category: string;
  visibility: 'public' | 'private';
  owner_user_id: string | null;
  owner_nickname?: string | null;
  can_edit?: boolean;
  institution_id: string | null;
  body_template: string;
  variables_schema: unknown[];
  default_values: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateBody {
  name: string;
  category?: string;
  visibility?: 'public' | 'private';
  bodyTemplate: string;
  variablesSchema?: unknown[];
  defaultValues?: Record<string, unknown>;
}

export interface UpdateTemplateBody {
  name?: string;
  category?: string;
  visibility?: 'public' | 'private';
  bodyTemplate?: string;
  variablesSchema?: unknown[];
  defaultValues?: Record<string, unknown>;
}
