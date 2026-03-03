import { useQuery } from "@tanstack/react-query";
import { adminGetInferenceData } from "@/lib/api";
import type { InferenceData } from "@/data/admin/inference-types";

export function useAdminInference(period = 30) {
  return useQuery<InferenceData>({
    queryKey: ["admin", "inference", period],
    queryFn: () => adminGetInferenceData(period),
    staleTime: 60_000,
  });
}
