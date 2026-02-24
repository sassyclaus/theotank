import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminListTheologians,
  adminGetTheologian,
  adminCreateTheologian,
  adminUpdateTheologian,
  adminGetPortraitUploadUrl,
  uploadFileToPresignedUrl,
} from "@/lib/api";
import type {
  CreateTheologianPayload,
  UpdateTheologianPayload,
} from "@/data/admin/theologian-types";

const adminTheologianKeys = {
  all: ["admin", "theologians"] as const,
  list: () => [...adminTheologianKeys.all, "list"] as const,
  detail: (id: string) => [...adminTheologianKeys.all, "detail", id] as const,
};

export function useAdminTheologians() {
  return useQuery({
    queryKey: adminTheologianKeys.list(),
    queryFn: adminListTheologians,
  });
}

export function useAdminTheologian(id: string | undefined) {
  return useQuery({
    queryKey: adminTheologianKeys.detail(id!),
    queryFn: () => adminGetTheologian(id!),
    enabled: !!id,
  });
}

export function useAdminCreateTheologian() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTheologianPayload) =>
      adminCreateTheologian(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTheologianKeys.list() });
    },
  });
}

export function useAdminUpdateTheologian() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTheologianPayload;
    }) => adminUpdateTheologian(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminTheologianKeys.list() });
      queryClient.invalidateQueries({
        queryKey: adminTheologianKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ["theologians"] });
    },
  });
}

export function useUploadPortrait() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      // 1. Get presigned URL
      const { url, key } = await adminGetPortraitUploadUrl(id, file.type);
      // 2. Upload to S3
      await uploadFileToPresignedUrl(url, file);
      // 3. Save imageKey to DB
      await adminUpdateTheologian(id, { imageKey: key });
      return key;
    },
    onSuccess: (_key, variables) => {
      queryClient.invalidateQueries({ queryKey: adminTheologianKeys.list() });
      queryClient.invalidateQueries({
        queryKey: adminTheologianKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ["theologians"] });
    },
  });
}
