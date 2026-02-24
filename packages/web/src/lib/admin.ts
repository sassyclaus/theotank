import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./api-client";

async function verifyAdmin(): Promise<{ ok: true }> {
  return apiClient.get<{ ok: true }>("/api/admin/verify");
}

export function useAdminVerify() {
  return useQuery({
    queryKey: ["admin", "verify"],
    queryFn: verifyAdmin,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}
