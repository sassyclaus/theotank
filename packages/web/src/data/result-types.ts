// ── API Payloads ────────────────────────────────────────────────────

export type CreateResultPayload =
  | { toolType: "ask"; teamId: string; question: string }
  | { toolType: "poll"; teamId: string; question: string; options: string[] }
  | { toolType: "super_poll"; question: string; options: string[] }
  | { toolType: "review"; teamId: string; reviewFileId: string; focusPrompt?: string; title?: string; description?: string }
  | { toolType: "research"; theologianId: string; question: string };

// ── Result Summary (from GET /api/results) ──────────────────────────

export interface ResultSummary {
  id: string;
  toolType: "ask" | "poll" | "super_poll" | "review" | "research";
  title: string;
  status: "pending" | "processing" | "completed" | "failed";
  previewData: unknown;
  previewExcerpt: string | null;
  pdfKey: string | null;
  createdAt: string;
  completedAt: string | null;
  teamName: string | null;
  theologianName: string | null;
}

// ── Result Detail (from GET /api/results/:id) ───────────────────────

export interface ResultDetail {
  id: string;
  userId: string;
  toolType: "ask" | "poll" | "super_poll" | "review" | "research";
  title: string;
  status: "pending" | "processing" | "completed" | "failed";
  inputPayload: { question?: string; options?: string[] };
  previewData: unknown;
  previewExcerpt: string | null;
  contentKey: string | null;
  contentUrl: string | null;
  pdfKey: string | null;
  models: unknown;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  teamName: string | null;
  teamMembers: Array<{
    theologianId: string;
    name: string;
    initials: string | null;
    tradition: string | null;
  }> | null;
  theologianName: string | null;
  theologianSlug: string | null;
  isPrivate?: boolean;
}

// ── Progress Log (from GET /api/results/:id/progress) ───────────────

export interface ProgressLogEntry {
  id: string;
  resultId: string;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ── Ask Content (from GET /api/results/:id/content) ─────────────────

export interface AskContentPerspective {
  theologian: {
    name: string;
    initials: string;
    dates: string;
    tradition: string;
    color: string;
  };
  perspective: string;
  reaction?: string | null;
  keyThemes: string[];
  relevantWorks: string[];
}

export interface AskContentResponse {
  question: string;
  perspectives: AskContentPerspective[];
  synthesis: {
    comparison: string;
    keyAgreements: string[];
    keyDisagreements: string[];
    sermonIdeas: string[];
  };
  critiqueMetrics?: {
    total: number;
    corrected: number;
    softFailures: number;
    strengthBreakdown: {
      none: number;
      minor: number;
      major: number;
    };
  };
}

// ── Poll Content (from GET /api/results/:id/content) ────────────────

export interface PollContentResponse {
  question: string;
  optionLabels: string[];
  summary: string;
  theologianSelections: {
    theologian: {
      name: string;
      initials: string;
      dates: string;
      tradition: string;
      color: string;
      born: number | null;
    };
    selection: string;
    justification: string;
  }[];
  errors: { theologianName: string; error: string }[];
  critiqueMetrics?: {
    total: number;
    corrected: number;
    softFailures: number;
    strengthBreakdown: {
      none: number;
      minor: number;
      major: number;
    };
  };
}

// ── Review Content (from GET /api/results/:id/content) ──────────────

export interface ReviewContentGrade {
  theologian: {
    name: string;
    initials: string;
    dates: string;
    tradition: string;
    color: string;
  };
  grade: string;
  reaction: string;
  strengths: string[];
  weaknesses: string[];
}

export interface ReviewContentResponse {
  reviewFileLabel: string;
  focusPrompt: string | null;
  description?: string | null;
  overallGrade: string;
  summary: string;
  grades: ReviewContentGrade[];
  wasTruncated?: boolean;
  originalCharCount?: number;
}

// ── Research Content (from GET /api/results/:id/content) ────────────

export interface ResearchCitationSource {
  workTitle: string;
  canonicalRef: string;
  originalText: string;
  translation: string;
}

export interface ResearchCitationItem {
  id: string;
  marker: string;
  claimText: string;
  claimType: "paraphrase" | "quote" | "inference";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  sources: ResearchCitationSource[];
}

// ── Public Sharing Types ─────────────────────────────────────────────

// Public JSON uses the same schema as full JSON with redacted fields:
//   Ask:    perspectives = []
//   Poll:   theologianSelections[].justification = "", errors = []
//   Review: grades = []
// When fullContent fallback is used, the full JSON is served but the
// frontend only renders the non-gated portions.

export type PublicResultContent =
  | AskContentResponse
  | PollContentResponse
  | ReviewContentResponse;

export interface PublicResultMeta {
  id: string;
  toolType: "ask" | "poll" | "super_poll" | "review";
  title: string;
  teamName: string | null;
  teamMembers: Array<{
    theologianId: string;
    name: string;
    initials: string | null;
    tradition: string | null;
  }>;
  createdAt: string;
  contentUrl: string;
  fullContent: boolean;
  shareImageUrl: string | null;
}

// ── Public Result List Item (from GET /public/results) ──────────────

export type PublicResultSort = "recent" | "views_week" | "saves_week";

export interface PublicResultListItem {
  id: string;
  title: string;
  toolType: "ask" | "poll" | "super_poll" | "review";
  teamName: string | null;
  previewExcerpt: string | null;
  viewCount: number;
  saveCount: number;
  createdAt: string;
  weeklyViews?: number;
  weeklySaves?: number;
}

// ── Public Search Types (from GET /public/search) ───────────────────

export type PublicSearchSort = "relevance" | "recent" | "views" | "saves";

export interface PublicSearchResult {
  id: string;
  title: string;
  toolType: "ask" | "poll" | "super_poll" | "review";
  teamName: string | null;
  previewExcerpt: string | null;
  viewCount: number;
  saveCount: number;
  createdAt: string;
}

export interface PublicSearchResponse {
  results: PublicSearchResult[];
  query: string;
  hasMore: boolean;
}

// ── PDF Status ──────────────────────────────────────────────────────

export interface PdfStatusResponse {
  status: "not_started" | "pending" | "processing" | "completed" | "failed";
  pdfKey?: string;
  pdfJobId?: string;
  errorMessage?: string;
}

// ── Research Content (from GET /api/results/:id/content) ────────────

export interface ResearchContentResponse {
  tool: "research";
  question: string;
  theologianName: string;
  theologianSlug: string;
  responseText: string;
  citations: ResearchCitationItem[];
  metadata: {
    anglesProcessed: number;
    totalClaims: number;
    evidenceItemsUsed: number;
  };
}

// ── Usage Summary ───────────────────────────────────────────────────

export interface UsageSummary {
  tier: string;
  tools: Record<string, { used: number; limit: number }>;
}
