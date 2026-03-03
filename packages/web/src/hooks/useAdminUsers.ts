import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminListUsers,
  adminGetUser,
  adminUpdateUserTier,
  adminSetUsageOverride,
  adminDeleteUsageOverride,
  adminGetUsageHistory,
} from "@/lib/api";
import type { UpdateTierPayload, SetUsageOverridePayload } from "@/data/admin/user-types";

const adminUserKeys = {
  all: ["admin", "users"] as const,
  list: () => [...adminUserKeys.all, "list"] as const,
  detail: (id: string) => [...adminUserKeys.all, "detail", id] as const,
  usageHistory: (id: string, toolType?: string) =>
    [...adminUserKeys.all, "usage-history", id, toolType ?? "all"] as const,
};

export function useAdminUsers() {
  return useQuery({
    queryKey: adminUserKeys.list(),
    queryFn: adminListUsers,
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: adminUserKeys.detail(id),
    queryFn: () => adminGetUser(id),
    enabled: !!id,
  });
}

export function useAdminUpdateTier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTierPayload }) =>
      adminUpdateUserTier(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.list() });
      queryClient.invalidateQueries({
        queryKey: adminUserKeys.detail(variables.id),
      });
    },
  });
}

export function useAdminSetUsageOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SetUsageOverridePayload }) =>
      adminSetUsageOverride(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.list() });
      queryClient.invalidateQueries({
        queryKey: adminUserKeys.detail(variables.id),
      });
    },
  });
}

export function useAdminDeleteUsageOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, toolType }: { id: string; toolType: string }) =>
      adminDeleteUsageOverride(id, toolType),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.list() });
      queryClient.invalidateQueries({
        queryKey: adminUserKeys.detail(variables.id),
      });
    },
  });
}

export function useAdminUsageHistory(id: string, toolType?: string) {
  return useQuery({
    queryKey: adminUserKeys.usageHistory(id, toolType),
    queryFn: () => adminGetUsageHistory(id, toolType),
    enabled: !!id,
  });
}
