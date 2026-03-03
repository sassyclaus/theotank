import { useQuery } from "@tanstack/react-query";
import { getMyUsage } from "@/lib/api";

export function useUsage() {
  return useQuery({
    queryKey: ["usage"],
    queryFn: getMyUsage,
    staleTime: 30_000,
  });
}
