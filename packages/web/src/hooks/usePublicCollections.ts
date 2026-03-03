import { useQuery } from "@tanstack/react-query";
import { getPublicCollections } from "@/lib/api";

export function usePublicCollections() {
  return useQuery({
    queryKey: ["public", "collections"],
    queryFn: getPublicCollections,
  });
}
