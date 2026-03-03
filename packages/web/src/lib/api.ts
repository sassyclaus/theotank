import { apiClient } from "./api-client";
import type { TheologianProfile } from "@/data/mock-theologians";
import type {
  NativeTeamSummary,
  CustomTeam,
  CreateTeamPayload,
  UpdateTeamPayload,
} from "@/data/team-types";
import type {
  CreateResultPayload,
  ResultSummary,
  ResultDetail,
  ProgressLogEntry,
  AskContentResponse,
  PollContentResponse,
  ReviewContentResponse,
  ResearchContentResponse,
  PdfStatusResponse,
  PublicResultMeta,
  PublicResultListItem,
  PublicResultSort,
  UsageSummary,
} from "@/data/result-types";
import type {
  AdminNativeTeam,
  CreateNativeTeamPayload,
  UpdateNativeTeamPayload,
  ReorderPayload,
  TeamSnapshot,
} from "@/data/admin/team-types";
import type {
  AdminTheologian,
  CreateTheologianPayload,
  UpdateTheologianPayload,
  PresignedUploadResponse,
} from "@/data/admin/theologian-types";
import type {
  AdminUserSummary,
  AdminUserDetail,
  UpdateTierPayload,
  SetUsageOverridePayload,
  UsageHistoryEntry,
} from "@/data/admin/user-types";
import type {
  JobListResponse,
  JobListParams,
  JobDetail,
  BulkActionResponse,
} from "@/data/admin/job-types";

export async function listTheologians(): Promise<TheologianProfile[]> {
  return apiClient.get<TheologianProfile[]>("/api/theologians");
}

export async function getTheologian(
  slug: string,
): Promise<TheologianProfile> {
  return apiClient.get<TheologianProfile>(`/api/theologians/${slug}`);
}

// ── Teams ────────────────────────────────────────────────────────────

export async function listNativeTeams(): Promise<NativeTeamSummary[]> {
  return apiClient.get<NativeTeamSummary[]>("/api/teams");
}

export async function listMyTeams(): Promise<CustomTeam[]> {
  return apiClient.get<CustomTeam[]>("/api/teams/my");
}

export async function createTeam(
  payload: CreateTeamPayload,
): Promise<CustomTeam> {
  return apiClient.post<CustomTeam>("/api/teams", payload);
}

export async function updateTeam(
  id: string,
  payload: UpdateTeamPayload,
): Promise<CustomTeam> {
  return apiClient.put<CustomTeam>(`/api/teams/${id}`, payload);
}

export async function deleteTeam(id: string): Promise<void> {
  return apiClient.delete<void>(`/api/teams/${id}`);
}

// ── Results ─────────────────────────────────────────────────────────

export async function createResult(
  payload: CreateResultPayload,
): Promise<{ id: string; status: string; toolType: string; title: string; createdAt: string }> {
  return apiClient.post("/api/results", payload);
}

export async function listResults(): Promise<ResultSummary[]> {
  return apiClient.get<ResultSummary[]>("/api/results");
}

export async function getResult(id: string): Promise<ResultDetail> {
  return apiClient.get<ResultDetail>(`/api/results/${id}`);
}

export async function getResultProgress(id: string): Promise<ProgressLogEntry[]> {
  return apiClient.get<ProgressLogEntry[]>(`/api/results/${id}/progress`);
}

export async function getResultContent(url: string): Promise<AskContentResponse | PollContentResponse | ReviewContentResponse | ResearchContentResponse> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch content: ${res.statusText}`);
  }
  return res.json();
}

export async function retryResult(
  id: string,
): Promise<{ id: string; status: string; toolType: string; title: string; createdAt: string }> {
  return apiClient.post(`/api/results/${id}/retry`);
}

// ── PDF Generation ──────────────────────────────────────────────────

export async function createPdfJob(
  resultId: string,
): Promise<PdfStatusResponse> {
  return apiClient.post<PdfStatusResponse>(`/api/results/${resultId}/pdf`);
}

export async function getPdfStatus(
  resultId: string,
): Promise<PdfStatusResponse> {
  return apiClient.get<PdfStatusResponse>(
    `/api/results/${resultId}/pdf/status`,
  );
}

export async function downloadPdf(resultId: string): Promise<void> {
  const { url, filename } = await apiClient.get<{
    url: string;
    filename: string;
  }>(`/api/results/${resultId}/pdf/download`);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

// ── Review Files ────────────────────────────────────────────────────

import type {
  ReviewFile,
  ReviewFileUploadResponse,
} from "@/data/review-file-types";

export async function requestReviewFileUpload(payload: {
  fileName: string;
  contentType: string;
  label?: string;
}): Promise<ReviewFileUploadResponse> {
  return apiClient.post<ReviewFileUploadResponse>(
    "/api/review-files/upload-url",
    payload,
  );
}

export async function confirmReviewFileUpload(
  id: string,
): Promise<{ id: string; status: string; jobId: string }> {
  return apiClient.post(`/api/review-files/${id}/confirm`);
}

export async function listReviewFiles(): Promise<ReviewFile[]> {
  return apiClient.get<ReviewFile[]>("/api/review-files");
}

export async function deleteReviewFile(id: string): Promise<void> {
  return apiClient.delete<void>(`/api/review-files/${id}`);
}

// ── Admin Teams ─────────────────────────────────────────────────────

export async function adminListNativeTeams(): Promise<AdminNativeTeam[]> {
  return apiClient.get<AdminNativeTeam[]>("/api/admin/teams");
}

export async function adminCreateNativeTeam(
  payload: CreateNativeTeamPayload,
): Promise<AdminNativeTeam> {
  return apiClient.post<AdminNativeTeam>("/api/admin/teams", payload);
}

export async function adminUpdateNativeTeam(
  id: string,
  payload: UpdateNativeTeamPayload,
): Promise<AdminNativeTeam> {
  return apiClient.put<AdminNativeTeam>(`/api/admin/teams/${id}`, payload);
}

export async function adminDeleteNativeTeam(id: string): Promise<void> {
  return apiClient.delete<void>(`/api/admin/teams/${id}`);
}

export async function adminReorderNativeTeams(
  payload: ReorderPayload,
): Promise<void> {
  return apiClient.put<void>("/api/admin/teams/reorder", payload);
}

export async function adminListTeamSnapshots(
  teamId: string,
): Promise<TeamSnapshot[]> {
  return apiClient.get<TeamSnapshot[]>(`/api/admin/teams/${teamId}/snapshots`);
}

// ── Admin Theologians ──────────────────────────────────────────────

export async function adminListTheologians(): Promise<AdminTheologian[]> {
  return apiClient.get<AdminTheologian[]>("/api/admin/theologians");
}

export async function adminGetTheologian(
  id: string,
): Promise<AdminTheologian> {
  return apiClient.get<AdminTheologian>(`/api/admin/theologians/${id}`);
}

export async function adminCreateTheologian(
  payload: CreateTheologianPayload,
): Promise<AdminTheologian> {
  return apiClient.post<AdminTheologian>("/api/admin/theologians", payload);
}

export async function adminUpdateTheologian(
  id: string,
  payload: UpdateTheologianPayload,
): Promise<AdminTheologian> {
  return apiClient.put<AdminTheologian>(
    `/api/admin/theologians/${id}`,
    payload,
  );
}

export async function adminGetPortraitUploadUrl(
  id: string,
  contentType: string,
): Promise<PresignedUploadResponse> {
  return apiClient.post<PresignedUploadResponse>(
    `/api/admin/theologians/${id}/upload-url`,
    { contentType },
  );
}

export async function uploadFileToPresignedUrl(
  url: string,
  file: File,
): Promise<void> {
  const res = await fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.statusText}`);
  }
}

// ── Admin Users ──────────────────────────────────────────────────────

export async function adminListUsers(): Promise<AdminUserSummary[]> {
  return apiClient.get<AdminUserSummary[]>("/api/admin/users");
}

export async function adminGetUser(id: string): Promise<AdminUserDetail> {
  return apiClient.get<AdminUserDetail>(`/api/admin/users/${id}`);
}

export async function adminUpdateUserTier(
  id: string,
  payload: UpdateTierPayload,
): Promise<{ tier: string }> {
  return apiClient.put(`/api/admin/users/${id}/tier`, payload);
}

export async function adminSetUsageOverride(
  id: string,
  payload: SetUsageOverridePayload,
): Promise<{ ok: boolean }> {
  return apiClient.put(`/api/admin/users/${id}/usage-override`, payload);
}

export async function adminDeleteUsageOverride(
  id: string,
  toolType: string,
): Promise<{ ok: boolean }> {
  return apiClient.delete(`/api/admin/users/${id}/usage-override/${toolType}`);
}

export async function adminGetUsageHistory(
  id: string,
  toolType?: string,
): Promise<{ entries: UsageHistoryEntry[] }> {
  const params = toolType ? `?toolType=${toolType}` : "";
  return apiClient.get(`/api/admin/users/${id}/usage-history${params}`);
}

// ── User Usage ──────────────────────────────────────────────────────

export async function getMyUsage(): Promise<UsageSummary> {
  return apiClient.get<UsageSummary>("/api/usage");
}

// ── Admin Jobs ───────────────────────────────────────────────────────

export async function adminListJobs(params?: JobListParams): Promise<JobListResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.type) query.set("type", params.type);
  if (params?.priority) query.set("priority", params.priority);
  if (params?.search) query.set("search", params.search);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  if (params?.sort) query.set("sort", params.sort);
  if (params?.order) query.set("order", params.order);
  const qs = query.toString();
  return apiClient.get<JobListResponse>(`/api/admin/jobs${qs ? `?${qs}` : ""}`);
}

export async function adminGetJob(id: string): Promise<JobDetail> {
  return apiClient.get<JobDetail>(`/api/admin/jobs/${id}`);
}

export async function adminRetryJob(id: string): Promise<{ ok: boolean }> {
  return apiClient.post(`/api/admin/jobs/${id}/retry`);
}

export async function adminCancelJob(id: string): Promise<{ ok: boolean }> {
  return apiClient.post(`/api/admin/jobs/${id}/cancel`);
}

export async function adminUpdateJobPriority(
  id: string,
  priority: string,
): Promise<{ ok: boolean }> {
  return apiClient.put(`/api/admin/jobs/${id}/priority`, { priority });
}

export async function adminBulkRetryJobs(): Promise<BulkActionResponse> {
  return apiClient.post<BulkActionResponse>("/api/admin/jobs/bulk/retry");
}

export async function adminBulkCancelJobs(): Promise<BulkActionResponse> {
  return apiClient.post<BulkActionResponse>("/api/admin/jobs/bulk/cancel");
}

// ── Admin Content ───────────────────────────────────────────────────

import type {
  ModerationItem,
  PublicLibraryResponse,
  FlaggedItem,
} from "@/data/admin/content-types";
import type {
  AdminCollection,
  AdminCollectionDetail,
  CreateCollectionPayload,
  UpdateCollectionPayload,
  PublicCollection,
} from "@/data/admin/collection-types";

export async function adminGetModerationQueue(): Promise<ModerationItem[]> {
  return apiClient.get<ModerationItem[]>("/api/admin/content/moderation");
}

export async function adminGetPublicLibrary(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<PublicLibraryResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  const qs = query.toString();
  return apiClient.get<PublicLibraryResponse>(
    `/api/admin/content/library${qs ? `?${qs}` : ""}`
  );
}

export async function adminGetFlaggedItems(): Promise<FlaggedItem[]> {
  return apiClient.get<FlaggedItem[]>("/api/admin/content/flagged");
}

export async function adminApproveFlag(flagId: string): Promise<{ ok: boolean }> {
  return apiClient.post(`/api/admin/content/flags/${flagId}/approve`);
}

export async function adminRemoveFlag(flagId: string): Promise<{ ok: boolean }> {
  return apiClient.post(`/api/admin/content/flags/${flagId}/remove`);
}

export async function adminFlagResult(
  resultId: string,
  payload?: { reason?: string; setPendingReview?: boolean }
): Promise<{ ok: boolean }> {
  return apiClient.post(`/api/admin/content/results/${resultId}/flag`, payload);
}

export async function adminRestoreResult(resultId: string): Promise<{ ok: boolean }> {
  return apiClient.post(`/api/admin/content/results/${resultId}/restore`);
}

// ── Admin Collections ───────────────────────────────────────────────

export async function adminListCollections(): Promise<AdminCollection[]> {
  return apiClient.get<AdminCollection[]>("/api/admin/collections");
}

export async function adminGetCollection(id: string): Promise<AdminCollectionDetail> {
  return apiClient.get<AdminCollectionDetail>(`/api/admin/collections/${id}`);
}

export async function adminCreateCollection(
  payload: CreateCollectionPayload
): Promise<AdminCollection> {
  return apiClient.post<AdminCollection>("/api/admin/collections", payload);
}

export async function adminUpdateCollection(
  id: string,
  payload: UpdateCollectionPayload
): Promise<AdminCollection> {
  return apiClient.put<AdminCollection>(`/api/admin/collections/${id}`, payload);
}

export async function adminDeleteCollection(id: string): Promise<{ ok: boolean }> {
  return apiClient.delete(`/api/admin/collections/${id}`);
}

export async function adminAddCollectionResult(
  collectionId: string,
  resultId: string
): Promise<{ ok: boolean; position: number }> {
  return apiClient.post(`/api/admin/collections/${collectionId}/results`, {
    resultId,
  });
}

export async function adminRemoveCollectionResult(
  collectionId: string,
  resultId: string
): Promise<{ ok: boolean }> {
  return apiClient.delete(
    `/api/admin/collections/${collectionId}/results/${resultId}`
  );
}

export async function adminReorderCollectionResults(
  collectionId: string,
  resultIds: string[]
): Promise<{ ok: boolean }> {
  return apiClient.put(
    `/api/admin/collections/${collectionId}/results/reorder`,
    { resultIds }
  );
}

export async function adminReorderCollections(
  collectionIds: string[]
): Promise<{ ok: boolean }> {
  return apiClient.put("/api/admin/collections/reorder", { collectionIds });
}

// ── Admin Inference ──────────────────────────────────────────────────

import type { InferenceData } from "@/data/admin/inference-types";

export async function adminGetInferenceData(period = 30): Promise<InferenceData> {
  return apiClient.get<InferenceData>(`/api/admin/inference?period=${period}`);
}

// ── Public Sharing (unauthenticated) ────────────────────────────────

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export async function getPublicResultMeta(
  id: string,
): Promise<PublicResultMeta> {
  const res = await fetch(`${API_BASE_URL}/public/results/${id}`);
  if (!res.ok) {
    throw new Error(
      res.status === 404 ? "Result not available" : `Request failed: ${res.statusText}`,
    );
  }
  return res.json();
}

export async function getPublicResultContent(
  url: string,
): Promise<AskContentResponse | PollContentResponse | ReviewContentResponse> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch content: ${res.statusText}`);
  }
  return res.json();
}

export async function searchPublicResults(params?: {
  q?: string;
  tool?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}): Promise<import("@/data/result-types").PublicSearchResponse> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.tool && params.tool !== "all") query.set("tool", params.tool);
  if (params?.sort) query.set("sort", params.sort);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  const qs = query.toString();
  const res = await fetch(
    `${API_BASE_URL}/public/search${qs ? `?${qs}` : ""}`
  );
  if (!res.ok) {
    throw new Error(`Failed to search public results: ${res.statusText}`);
  }
  return res.json();
}

export async function getPublicResults(params?: {
  sort?: PublicResultSort;
  limit?: number;
  search?: string;
}): Promise<PublicResultListItem[]> {
  const query = new URLSearchParams();
  if (params?.sort) query.set("sort", params.sort);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  const res = await fetch(
    `${API_BASE_URL}/public/results${qs ? `?${qs}` : ""}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch public results: ${res.statusText}`);
  }
  return res.json();
}

export async function getPublicCollections(): Promise<PublicCollection[]> {
  const res = await fetch(`${API_BASE_URL}/public/collections`);
  if (!res.ok) {
    throw new Error(`Failed to fetch collections: ${res.statusText}`);
  }
  return res.json();
}
