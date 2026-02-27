import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminListJobs,
  adminGetJob,
  adminRetryJob,
  adminCancelJob,
  adminUpdateJobPriority,
  adminBulkRetryJobs,
  adminBulkCancelJobs,
} from "@/lib/api";
import type { JobListParams } from "@/data/admin/job-types";

const adminJobKeys = {
  all: ["admin", "jobs"] as const,
  list: (params?: JobListParams) => [...adminJobKeys.all, "list", params] as const,
  detail: (id: string) => [...adminJobKeys.all, "detail", id] as const,
};

export function useAdminJobs(params?: JobListParams) {
  return useQuery({
    queryKey: adminJobKeys.list(params),
    queryFn: () => adminListJobs(params),
    refetchInterval: 10_000,
  });
}

export function useAdminJob(id: string) {
  return useQuery({
    queryKey: adminJobKeys.detail(id),
    queryFn: () => adminGetJob(id),
    enabled: !!id,
    refetchInterval: 5_000,
  });
}

export function useAdminRetryJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminRetryJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminJobKeys.all });
    },
  });
}

export function useAdminCancelJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminCancelJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminJobKeys.all });
    },
  });
}

export function useAdminUpdateJobPriority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: string }) =>
      adminUpdateJobPriority(id, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminJobKeys.all });
    },
  });
}

export function useAdminBulkRetryJobs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => adminBulkRetryJobs(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminJobKeys.all });
    },
  });
}

export function useAdminBulkCancelJobs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => adminBulkCancelJobs(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminJobKeys.all });
    },
  });
}
