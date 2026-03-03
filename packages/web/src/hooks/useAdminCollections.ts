import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminListCollections,
  adminGetCollection,
  adminCreateCollection,
  adminUpdateCollection,
  adminDeleteCollection,
  adminAddCollectionResult,
  adminRemoveCollectionResult,
  adminReorderCollectionResults,
  adminReorderCollections,
} from "@/lib/api";
import type {
  CreateCollectionPayload,
  UpdateCollectionPayload,
} from "@/data/admin/collection-types";

const adminCollectionKeys = {
  all: ["admin", "collections"] as const,
  list: () => [...adminCollectionKeys.all, "list"] as const,
  detail: (id: string) => [...adminCollectionKeys.all, "detail", id] as const,
};

export function useAdminCollections() {
  return useQuery({
    queryKey: adminCollectionKeys.list(),
    queryFn: adminListCollections,
  });
}

export function useAdminCollection(id: string) {
  return useQuery({
    queryKey: adminCollectionKeys.detail(id),
    queryFn: () => adminGetCollection(id),
    enabled: !!id,
  });
}

export function useAdminCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCollectionPayload) =>
      adminCreateCollection(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCollectionKeys.list() });
    },
  });
}

export function useAdminUpdateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCollectionPayload;
    }) => adminUpdateCollection(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminCollectionKeys.list() });
      queryClient.invalidateQueries({
        queryKey: adminCollectionKeys.detail(variables.id),
      });
    },
  });
}

export function useAdminDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminDeleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCollectionKeys.list() });
    },
  });
}

export function useAdminAddCollectionResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      collectionId,
      resultId,
    }: {
      collectionId: string;
      resultId: string;
    }) => adminAddCollectionResult(collectionId, resultId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminCollectionKeys.list() });
      queryClient.invalidateQueries({
        queryKey: adminCollectionKeys.detail(variables.collectionId),
      });
    },
  });
}

export function useAdminRemoveCollectionResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      collectionId,
      resultId,
    }: {
      collectionId: string;
      resultId: string;
    }) => adminRemoveCollectionResult(collectionId, resultId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminCollectionKeys.list() });
      queryClient.invalidateQueries({
        queryKey: adminCollectionKeys.detail(variables.collectionId),
      });
    },
  });
}

export function useAdminReorderCollectionResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      collectionId,
      resultIds,
    }: {
      collectionId: string;
      resultIds: string[];
    }) => adminReorderCollectionResults(collectionId, resultIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: adminCollectionKeys.detail(variables.collectionId),
      });
    },
  });
}

export function useAdminReorderCollections() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (collectionIds: string[]) =>
      adminReorderCollections(collectionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCollectionKeys.list() });
    },
  });
}
