export interface InstitutionRecord {
  id: string;
  name: string;
  category: string;
  visibility: 'public' | 'private';
  owner_user_id: string | null;
  owner_nickname?: string | null;
  can_edit?: boolean;
  is_favorite?: boolean;
  submit_url: string;
  max_attachments: number;
  max_text_length: number;
  accepted_formats: string[];
  deleted_at?: string | null;
  created_at: string;
}

export interface CreateInstitutionBody {
  name: string;
  category?: string;
  visibility?: 'public' | 'private';
  submitUrl: string;
  maxAttachments?: number;
  maxTextLength?: number;
  acceptedFormats?: string[];
}

export interface UpdateInstitutionBody {
  name?: string;
  category?: string;
  visibility?: 'public' | 'private';
  submitUrl?: string;
  maxAttachments?: number;
  maxTextLength?: number;
  acceptedFormats?: string[];
}
