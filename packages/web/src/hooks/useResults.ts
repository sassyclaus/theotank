import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createResult,
  retryResult,
  listResults,
  getResult,
  getResultProgress,
  getResultContent,
  createPdfJob,
  getPdfStatus,
  getPublicResultMeta,
  getPublicResultContent,
} from "@/lib/api";
import type { CreateResultPayload, PublicResultMeta, PublicResultContent } from "@/data/result-types";

const resultKeys = {
  all: ["results"] as const,
  list: () => [...resultKeys.all, "list"] as const,
  detail: (id: string) => [...resultKeys.all, "detail", id] as const,
  progress: (id: string) => [...resultKeys.all, "progress", id] as const,
  content: (id: string) => [...resultKeys.all, "content", id] as const,
  pdfStatus: (id: string) => [...resultKeys.all, "pdf-status", id] as const,
  publicMeta: (id: string) => ["public-result", "meta", id] as const,
  publicContent: (id: string) => ["public-result", "content", id] as const,
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

export function useRetryResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => retryResult(id),
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
    refetchInterval: polling
      ? (query) => {
          const status = query.state.data?.status;
          if (status === "completed" || status === "failed") return false;
          return 3000;
        }
      : false,
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

export function useResultContent(resultId: string | undefined, contentUrl: string | undefined) {
  return useQuery({
    queryKey: resultKeys.content(resultId!),
    queryFn: () => getResultContent(contentUrl!),
    enabled: !!resultId && !!contentUrl,
    staleTime: Infinity,
  });
}

export function useCreatePdfJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resultId: string) => createPdfJob(resultId),
    onSuccess: (_data, resultId) => {
      queryClient.invalidateQueries({ queryKey: resultKeys.pdfStatus(resultId) });
      queryClient.invalidateQueries({ queryKey: resultKeys.detail(resultId) });
    },
  });
}

export function usePdfStatus(id: string | undefined, polling = false) {
  return useQuery({
    queryKey: resultKeys.pdfStatus(id!),
    queryFn: () => getPdfStatus(id!),
    enabled: !!id,
    refetchInterval: polling ? 2000 : false,
  });
}

export function usePublicResult(id: string | undefined) {
  const metaQuery = useQuery({
    queryKey: resultKeys.publicMeta(id!),
    queryFn: () => getPublicResultMeta(id!),
    enabled: !!id,
    staleTime: 60_000,
  });

  const contentQuery = useQuery({
    queryKey: resultKeys.publicContent(id!),
    queryFn: () => getPublicResultContent(metaQuery.data!.contentUrl),
    enabled: !!metaQuery.data?.contentUrl,
    staleTime: 60_000,
  });

  return {
    meta: metaQuery.data as PublicResultMeta | undefined,
    content: contentQuery.data as PublicResultContent | undefined,
    isLoading: metaQuery.isLoading || (metaQuery.isSuccess && contentQuery.isLoading),
    error: metaQuery.error || contentQuery.error,
  };
}
