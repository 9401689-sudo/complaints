export interface InstitutionRecord {
  id: string;
  name: string;
  category: string;
  submit_url: string;
  max_attachments: number;
  max_text_length: number;
  accepted_formats: string[];
  created_at: string;
}

export interface CreateInstitutionBody {
  name: string;
  category?: string;
  submitUrl: string;
  maxAttachments?: number;
  maxTextLength?: number;
  acceptedFormats?: string[];
}

export interface UpdateInstitutionBody {
  name?: string;
  category?: string;
  submitUrl?: string;
  maxAttachments?: number;
  maxTextLength?: number;
  acceptedFormats?: string[];
}
