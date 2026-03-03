export type ToolType = "ask" | "poll" | "super_poll" | "review" | "research";

export interface ToolUsage {
  used: number;
  limit: number;
  override?: {
    monthlyLimit: number;
    reason: string | null;
    expiresAt: string | null;
  };
}

export interface AdminUserSummary {
  id: string;
  clerkId: string;
  email: string | null;
  name: string | null;
  imageUrl: string | null;
  tier: string;
  usage: Record<string, number>;
  resultCount: number;
  createdAt: string;
}

export interface AdminUserResult {
  id: string;
  toolType: ToolType;
  title: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
}

export interface AdminUserDetail {
  id: string;
  clerkId: string;
  email: string | null;
  name: string | null;
  imageUrl: string | null;
  tier: string;
  usage: Record<string, ToolUsage>;
  results: AdminUserResult[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTierPayload {
  tier: string;
}

export interface SetUsageOverridePayload {
  toolType: string;
  monthlyLimit: number;
  reason?: string;
  expiresAt?: string;
}

export interface UsageHistoryEntry {
  id: string;
  toolType: string;
  resultId: string | null;
  resultTitle: string | null;
  teamSize: number | null;
  createdAt: string;
}
