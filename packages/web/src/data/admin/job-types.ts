export type JobStatus = "pending" | "processing" | "completed" | "failed";
export type JobPriority = "critical" | "high" | "normal" | "low";
export type JobType = "ask" | "poll" | "review" | "research" | "pdf" | "review_file";

export interface JobStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  completedLast24h: number;
  failedLast24h: number;
  avgDurationMs: number | null;
}

export interface JobSummary {
  id: string;
  type: string;
  status: JobStatus;
  priority: JobPriority;
  attempts: number;
  maxAttempts: number;
  lockedBy: string | null;
  errorMessage: string | null;
  resultId: string | null;
  resultTitle: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface JobListResponse {
  stats: JobStats;
  jobs: JobSummary[];
  total: number;
}

export interface LinkedResult {
  id: string;
  title: string;
  toolType: string;
  status: string;
  userId: string;
}

export interface JobDetail {
  id: string;
  type: string;
  status: JobStatus;
  priority: JobPriority;
  attempts: number;
  maxAttempts: number;
  lockedBy: string | null;
  lockedAt: string | null;
  payload: unknown;
  result: unknown;
  errorMessage: string | null;
  errorDetails: unknown;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  linkedResult: LinkedResult | null;
}

export interface JobListParams {
  status?: JobStatus;
  type?: string;
  priority?: JobPriority;
  search?: string;
  limit?: number;
  offset?: number;
  sort?: "createdAt" | "updatedAt";
  order?: "asc" | "desc";
}

export interface BulkActionResponse {
  count: number;
}
