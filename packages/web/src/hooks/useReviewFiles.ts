import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listReviewFiles,
  requestReviewFileUpload,
  confirmReviewFileUpload,
  deleteReviewFile,
  uploadFileToPresignedUrl,
} from "@/lib/api";
import type { ReviewFile } from "@/data/review-file-types";

const reviewFileKeys = {
  all: ["reviewFiles"] as const,
  list: () => [...reviewFileKeys.all, "list"] as const,
};

/**
 * List review files with auto-polling while any file is in a non-terminal state.
 */
export function useReviewFiles() {
  return useQuery({
    queryKey: reviewFileKeys.list(),
    queryFn: listReviewFiles,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const hasProcessing = data.some(
        (f) =>
          f.status === "pending" ||
          f.status === "uploaded" ||
          f.status === "processing"
      );
      return hasProcessing ? 3000 : false;
    },
  });
}

/**
 * Upload a review file: request presigned URL → PUT file → confirm upload.
 * Uses optimistic update so the file appears in the list immediately.
 */
export function useUploadReviewFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      label,
    }: {
      file: File;
      label?: string;
    }) => {
      // 1. Request presigned upload URL
      const { id, uploadUrl } = await requestReviewFileUpload({
        fileName: file.name,
        contentType: file.type,
        label,
      });

      // 2. Upload file directly to S3
      await uploadFileToPresignedUrl(uploadUrl, file);

      // 3. Confirm upload to start processing
      await confirmReviewFileUpload(id);

      return {
        id,
        fileName: file.name,
        contentType: file.type,
        label: label || file.name.replace(/\.[^/.]+$/, ""),
      };
    },
    onMutate: async ({ file, label }) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: reviewFileKeys.list() });

      const previous = queryClient.getQueryData<ReviewFile[]>(
        reviewFileKeys.list()
      );

      // Optimistically add the file in "processing" state
      const optimisticFile: ReviewFile = {
        id: `optimistic-${Date.now()}`,
        label: label || file.name.replace(/\.[^/.]+$/, ""),
        fileName: file.name,
        contentType: file.type,
        charCount: null,
        status: "processing",
        errorMessage: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ReviewFile[]>(reviewFileKeys.list(), (old) => [
        optimisticFile,
        ...(old ?? []),
      ]);

      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Roll back optimistic update on error
      if (context?.previous) {
        queryClient.setQueryData(reviewFileKeys.list(), context.previous);
      }
    },
    onSettled: () => {
      // Refetch to get real server state
      queryClient.invalidateQueries({ queryKey: reviewFileKeys.list() });
    },
  });
}

/**
 * Delete a review file.
 */
export function useDeleteReviewFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteReviewFile(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: reviewFileKeys.list() });

      const previous = queryClient.getQueryData<ReviewFile[]>(
        reviewFileKeys.list()
      );

      queryClient.setQueryData<ReviewFile[]>(reviewFileKeys.list(), (old) =>
        old?.filter((f) => f.id !== id) ?? []
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(reviewFileKeys.list(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: reviewFileKeys.list() });
    },
  });
}

/**
 * Find the most recent ready file from a list.
 */
export function getMostRecentReadyFile(
  files: ReviewFile[] | undefined
): ReviewFile | undefined {
  if (!files) return undefined;
  return files.find((f) => f.status === "ready");
}
