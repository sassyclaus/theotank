import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminGetModerationQueue,
  adminGetPublicLibrary,
  adminGetFlaggedItems,
  adminApproveFlag,
  adminRemoveFlag,
  adminFlagResult,
  adminRestoreResult,
} from "@/lib/api";

const adminContentKeys = {
  all: ["admin", "content"] as const,
  moderation: () => [...adminContentKeys.all, "moderation"] as const,
  library: (params?: { search?: string }) =>
    [...adminContentKeys.all, "library", params?.search ?? ""] as const,
  flagged: () => [...adminContentKeys.all, "flagged"] as const,
};

export function useAdminModerationQueue() {
  return useQuery({
    queryKey: adminContentKeys.moderation(),
    queryFn: adminGetModerationQueue,
  });
}

export function useAdminPublicLibrary(params?: { search?: string }) {
  return useQuery({
    queryKey: adminContentKeys.library(params),
    queryFn: () => adminGetPublicLibrary(params),
  });
}

export function useAdminFlaggedItems() {
  return useQuery({
    queryKey: adminContentKeys.flagged(),
    queryFn: adminGetFlaggedItems,
  });
}

export function useAdminApproveFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (flagId: string) => adminApproveFlag(flagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminContentKeys.all });
    },
  });
}

export function useAdminRemoveFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (flagId: string) => adminRemoveFlag(flagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminContentKeys.all });
    },
  });
}

export function useAdminFlagResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      resultId,
      reason,
      setPendingReview,
    }: {
      resultId: string;
      reason?: string;
      setPendingReview?: boolean;
    }) => adminFlagResult(resultId, { reason, setPendingReview }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminContentKeys.all });
    },
  });
}

export function useAdminRestoreResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resultId: string) => adminRestoreResult(resultId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminContentKeys.all });
    },
  });
}
