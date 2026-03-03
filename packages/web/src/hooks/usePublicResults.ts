import { useQuery } from "@tanstack/react-query";
import { getPublicResults } from "@/lib/api";
import type { PublicResultSort } from "@/data/result-types";

export function usePublicResults(params?: {
  sort?: PublicResultSort;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ["public", "results", params?.sort, params?.limit, params?.search],
    queryFn: () => getPublicResults(params),
    staleTime: 60_000,
  });
}
