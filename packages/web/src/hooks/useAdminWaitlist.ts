import { useQuery } from "@tanstack/react-query";
import { adminListWaitlist } from "@/lib/api";
import type { WaitlistListParams } from "@/data/admin/waitlist-types";

const adminWaitlistKeys = {
  all: ["admin", "waitlist"] as const,
  list: (params?: WaitlistListParams) =>
    [...adminWaitlistKeys.all, "list", params] as const,
};

export function useAdminWaitlist(params?: WaitlistListParams) {
  return useQuery({
    queryKey: adminWaitlistKeys.list(params),
    queryFn: () => adminListWaitlist(params),
    refetchInterval: 30_000,
  });
}
