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

export async function getResultContent(id: string): Promise<AskContentResponse> {
  return apiClient.get<AskContentResponse>(`/api/results/${id}/content`);
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
