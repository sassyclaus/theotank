// ── Moderation ─────────────────────────────────────────────────────

export interface ModerationItem {
  id: string;
  resultId: string;
  type: "auto_flagged" | "user_report";
  reason: string | null;
  reporterId: string | null;
  createdAt: string;
  result: {
    title: string;
    toolType: string;
    teamName: string | null;
  };
}

// ── Public Library ────────────────────────────────────────────────

export interface PublicLibraryItem {
  id: string;
  title: string;
  toolType: string;
  viewCount: number;
  saveCount: number;
  moderationStatus: "approved" | "pending_review" | "removed";
  createdAt: string;
}

export interface ContentStats {
  total: number;
  addedThisWeek: number;
  removedThisWeek: number;
  privateRate: string;
}

export interface PublicLibraryResponse {
  items: PublicLibraryItem[];
  stats: ContentStats;
}

// ── Flagged ───────────────────────────────────────────────────────

export interface FlaggedItem {
  id: string;
  title: string;
  toolType: string;
  teamName: string | null;
  flagCount: number;
  latestFlagAt: string;
}
