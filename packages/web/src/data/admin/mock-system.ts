// ── Types ──────────────────────────────────────────────────────────

export interface InferenceCost {
  tool: string;
  totalCost: number;
  avgCostPerQuery: number;
}

export interface UnitEconomics {
  revenuePerSubmission: string;
  costPerSubmission: string;
  isNegative: boolean;
  marginTarget: string;
}

export interface InferenceCostData {
  totalSpend: string;
  perTool: InferenceCost[];
  unitEconomics: UnitEconomics;
}

export interface JobQueueStats {
  active: number;
  queued: number;
  avgProcessingTime: Record<string, string>;
  failed24h: number;
}

export interface FeatureFlag {
  id: string;
  key: string;
  label: string;
  enabled: boolean;
}

export interface ApiStatusItem {
  name: string;
  status: "operational" | "degraded" | "down";
  detail?: string;
}

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  service: string;
  error: string;
  userAffected: string;
  status: "new" | "investigating" | "resolved";
}

// ── Inference Costs ───────────────────────────────────────────────

export const mockInferenceCosts: InferenceCostData = {
  totalSpend: "$2,847.23",
  perTool: [
    { tool: "Ask", totalCost: 1_204, avgCostPerQuery: 0.42 },
    { tool: "Poll", totalCost: 891, avgCostPerQuery: 1.23 },
    { tool: "Review", totalCost: 412, avgCostPerQuery: 0.89 },
    { tool: "Research", totalCost: 340, avgCostPerQuery: 1.82 },
  ],
  unitEconomics: {
    revenuePerSubmission: "$0.58",
    costPerSubmission: "$0.71",
    isNegative: true,
    marginTarget: "$0.40+",
  },
};

// ── Job Queue ─────────────────────────────────────────────────────

export const mockJobQueue: JobQueueStats = {
  active: 3,
  queued: 7,
  avgProcessingTime: {
    Ask: "34s",
    Poll: "2m 12s",
    Review: "1m 05s",
    Research: "3m 45s",
  },
  failed24h: 1,
};

// ── Feature Flags ─────────────────────────────────────────────────

export const mockFeatureFlags: FeatureFlag[] = [
  {
    id: "ff-1",
    key: "explore_tab",
    label: "Explore tab in main navigation",
    enabled: true,
  },
  {
    id: "ff-2",
    key: "similar_results_nudge",
    label: "Show similar results nudge after submission",
    enabled: false,
  },
  {
    id: "ff-3",
    key: "review_audio_upload",
    label: "Audio upload for Review tool",
    enabled: false,
  },
  {
    id: "ff-4",
    key: "calvin_corpus",
    label: "Calvin corpus access for Research",
    enabled: false,
  },
  {
    id: "ff-5",
    key: "share_card_v2",
    label: "Redesigned share card layout",
    enabled: true,
  },
  {
    id: "ff-6",
    key: "debate_tool",
    label: "Debate tool (beta)",
    enabled: false,
  },
];

// ── API Status ────────────────────────────────────────────────────

export const mockApiStatus: ApiStatusItem[] = [
  { name: "LLM Provider", status: "operational" },
  { name: "Rate Limit Headroom", status: "operational", detail: "72%" },
  { name: "Embedding Pipeline", status: "operational" },
  {
    name: "Search Index",
    status: "operational",
    detail: "Last reindex: 2h ago",
  },
];

// ── Error Log ─────────────────────────────────────────────────────

export const mockErrorLog: ErrorLogEntry[] = [
  {
    id: "err-1",
    timestamp: "2026-02-23 11:42:18",
    service: "LLM Gateway",
    error: "Timeout after 30s — Claude response stalled",
    userAffected: "user_9f2k3",
    status: "new",
  },
  {
    id: "err-2",
    timestamp: "2026-02-22 08:15:03",
    service: "Embedding Pipeline",
    error: "Dimension mismatch on batch insert (expected 1536, got 768)",
    userAffected: "system",
    status: "investigating",
  },
  {
    id: "err-3",
    timestamp: "2026-02-21 19:33:47",
    service: "Job Runner",
    error: "Poll job exceeded max retries (3/3)",
    userAffected: "user_h8m1q",
    status: "resolved",
  },
  {
    id: "err-4",
    timestamp: "2026-02-20 14:07:22",
    service: "Auth Service",
    error: "Clerk webhook signature verification failed",
    userAffected: "system",
    status: "resolved",
  },
];
