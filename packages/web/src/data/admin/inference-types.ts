export interface InferenceOverview {
  totalEstimatedCost: number;
  avgCostPerResult: number;
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalResults: number;
}

export interface InferenceByTool {
  toolType: string;
  resultCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  avgCostPerResult: number;
}

export interface InferenceDailyTrend {
  date: string;
  toolType: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface InferenceTopUser {
  userId: string;
  email: string | null;
  name: string | null;
  resultCount: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface InferenceModelBreakdown {
  model: string;
  calls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface InferenceData {
  overview: InferenceOverview;
  byTool: InferenceByTool[];
  dailyTrend: InferenceDailyTrend[];
  topUsers: InferenceTopUser[];
  modelBreakdown: InferenceModelBreakdown[];
  modelPricing: Record<string, { input: number; output: number }>;
}

// ── Results Feed ─────────────────────────────────────────────────────

export interface InferenceResultFeedItem {
  resultId: string;
  title: string;
  toolType: string;
  status: string;
  userName: string | null;
  userEmail: string | null;
  inferenceCalls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  createdAt: string;
}

export interface InferenceResultFeedResponse {
  results: InferenceResultFeedItem[];
  total: number;
}

export interface InferenceResultFeedParams {
  period?: number;
  toolType?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sort?: "createdAt" | "cost";
  order?: "asc" | "desc";
}
