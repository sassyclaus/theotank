import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createResult,
  listResults,
  getResult,
  getResultProgress,
  getResultContent,
} from "@/lib/api";
import type { CreateResultPayload } from "@/data/result-types";

const resultKeys = {
  all: ["results"] as const,
  list: () => [...resultKeys.all, "list"] as const,
  detail: (id: string) => [...resultKeys.all, "detail", id] as const,
  progress: (id: string) => [...resultKeys.all, "progress", id] as const,
  content: (id: string) => [...resultKeys.all, "content", id] as const,
};

export function useCreateResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateResultPayload) => createResult(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resultKeys.list() });
    },
  });
}

export function useResults() {
  return useQuery({
    queryKey: resultKeys.list(),
    queryFn: listResults,
  });
}

export function useResult(id: string | undefined, polling = false) {
  return useQuery({
    queryKey: resultKeys.detail(id!),
    queryFn: () => getResult(id!),
    enabled: !!id,
    refetchInterval: polling ? 3000 : false,
  });
}

export function useResultProgress(id: string | undefined, polling = false) {
  return useQuery({
    queryKey: resultKeys.progress(id!),
    queryFn: () => getResultProgress(id!),
    enabled: !!id,
    refetchInterval: polling ? 2500 : false,
  });
}

export function useResultContent(id: string | undefined, enabled = false) {
  return useQuery({
    queryKey: resultKeys.content(id!),
    queryFn: () => getResultContent(id!),
    enabled: !!id && enabled,
  });
}
