export interface InstitutionRecord {
  id: string;
  name: string;
  submit_url: string;
  max_attachments: number;
  max_text_length: number;
  accepted_formats: string[];
  active: boolean;
  created_at: string;
}

export interface CreateInstitutionBody {
  name: string;
  submitUrl: string;
  maxAttachments?: number;
  maxTextLength?: number;
  acceptedFormats?: string[];
  active?: boolean;
}

export interface UpdateInstitutionBody {
  name?: string;
  submitUrl?: string;
  maxAttachments?: number;
  maxTextLength?: number;
  acceptedFormats?: string[];
  active?: boolean;
}
