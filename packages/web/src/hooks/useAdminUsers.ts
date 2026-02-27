import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminListUsers,
  adminGetUser,
  adminUpdateUserCredits,
  adminGetUserLedger,
} from "@/lib/api";
import type { UpdateCreditPayload } from "@/data/admin/user-types";

const adminUserKeys = {
  all: ["admin", "users"] as const,
  list: () => [...adminUserKeys.all, "list"] as const,
  detail: (id: string) => [...adminUserKeys.all, "detail", id] as const,
  ledger: (id: string, creditType?: string) =>
    [...adminUserKeys.all, "ledger", id, creditType ?? "all"] as const,
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

export function useAdminUpdateCredits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCreditPayload }) =>
      adminUpdateUserCredits(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.list() });
      queryClient.invalidateQueries({
        queryKey: adminUserKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: adminUserKeys.all,
        predicate: (query) =>
          query.queryKey[2] === "ledger" && query.queryKey[3] === variables.id,
      });
    },
  });
}

export function useAdminUserLedger(id: string, creditType?: string) {
  return useQuery({
    queryKey: adminUserKeys.ledger(id, creditType),
    queryFn: () => adminGetUserLedger(id, creditType),
    enabled: !!id,
  });
}
