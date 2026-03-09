import { useQuery } from "@tanstack/react-query";
import { adminGetInferenceResultsFeed } from "@/lib/api";
import type {
  InferenceResultFeedResponse,
  InferenceResultFeedParams,
} from "@/data/admin/inference-types";

export function useAdminInferenceResults(params: InferenceResultFeedParams) {
  return useQuery<InferenceResultFeedResponse>({
    queryKey: ["admin", "inference", "results", params],
    queryFn: () => adminGetInferenceResultsFeed(params),
    staleTime: 60_000,
  });
}
