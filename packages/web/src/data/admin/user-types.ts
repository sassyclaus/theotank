export interface AdminUserSummary {
  id: string;
  clerkId: string;
  email: string | null;
  name: string | null;
  imageUrl: string | null;
  credits: Record<string, number>;
  resultCount: number;
  createdAt: string;
}

export interface AdminUserResult {
  id: string;
  toolType: "ask" | "poll" | "review" | "research";
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
  credits: Record<string, number>;
  results: AdminUserResult[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCreditPayload {
  creditType: string;
  balance: number;
}

export interface CreditLedgerEntry {
  id: string;
  userId: string;
  creditType: string;
  delta: number;
  balanceAfter: number;
  reason: string;
  resultId: string | null;
  adminId: string | null;
  createdAt: string;
}
