// ── API Payloads ────────────────────────────────────────────────────

export type CreateResultPayload =
  | { toolType: "ask"; teamId: string; question: string }
  | { toolType: "poll"; teamId: string; question: string; options: string[] }
  | { toolType: "review"; teamId: string; reviewFileId: string; focusPrompt?: string }
  | { toolType: "research"; theologianId: string; question: string };

// ── Result Summary (from GET /api/results) ──────────────────────────

export interface ResultSummary {
  id: string;
  toolType: "ask" | "poll" | "review" | "research";
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
  toolType: "ask" | "poll" | "review" | "research";
  title: string;
  status: "pending" | "processing" | "completed" | "failed";
  inputPayload: { question?: string; options?: string[] };
  previewData: unknown;
  previewExcerpt: string | null;
  contentKey: string | null;
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
}

// ── Progress Log (from GET /api/results/:id/progress) ───────────────

export interface ProgressLogEntry {
  id: string;
  resultId: string;
  step: number;
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
  overallGrade: string;
  summary: string;
  grades: ReviewContentGrade[];
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
