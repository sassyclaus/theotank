export interface AdminTheologian {
  id: string;
  slug: string;
  name: string;
  initials: string | null;
  tagline: string | null;
  bio: string | null;
  born: number | null;
  died: number | null;
  era: string | null;
  tradition: string | null;
  languagePrimary: string | null;
  voiceStyle: string | null;
  keyWorks: string[];
  imageKey: string | null;
  imageUrl: string | null;
  hasResearch: boolean;
  profileCompleteness: "full" | "partial" | "minimal";
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTheologianPayload {
  name?: string;
  tagline?: string | null;
  bio?: string | null;
  born?: number | null;
  died?: number | null;
  era?: string | null;
  tradition?: string | null;
  languagePrimary?: string | null;
  voiceStyle?: string | null;
  keyWorks?: string[];
  imageKey?: string | null;
  hasResearch?: boolean;
}

export interface CreateTheologianPayload {
  name: string;
  bio?: string;
  tagline?: string;
  born?: number;
  died?: number;
  era?: string;
  tradition?: string;
  languagePrimary?: string;
  voiceStyle?: string;
  keyWorks?: string[];
}

export interface PresignedUploadResponse {
  url: string;
  key: string;
}
