// ── Admin Collections ─────────────────────────────────────────────

export interface AdminCollection {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  slug: string;
  status: "live" | "draft";
  position: number | null;
  resultCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCollectionResult {
  resultId: string;
  title: string;
  toolType: string;
  position: number;
}

export interface AdminCollectionDetail extends AdminCollection {
  results: AdminCollectionResult[];
}

export interface CreateCollectionPayload {
  title: string;
  subtitle?: string;
  description?: string;
  slug?: string;
  status?: "live" | "draft";
}

export interface UpdateCollectionPayload {
  title?: string;
  subtitle?: string;
  description?: string;
  slug?: string;
  status?: "live" | "draft";
  position?: number | null;
}

// ── Public Collections ────────────────────────────────────────────

export interface PublicCollection {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  slug: string;
  resultCount: number;
}
