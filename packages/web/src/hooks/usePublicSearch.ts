import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { searchPublicResults } from "@/lib/api";

export function usePublicSearch(params: {
  q?: string;
  tool?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["public", "search", params.q, params.tool, params.sort, params.limit, params.offset],
    queryFn: () => searchPublicResults(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
