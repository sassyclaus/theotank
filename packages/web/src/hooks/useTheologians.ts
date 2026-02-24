import { useQuery } from "@tanstack/react-query";
import { listTheologians, getTheologian } from "@/lib/api";

const theologianKeys = {
  all: ["theologians"] as const,
  list: () => [...theologianKeys.all, "list"] as const,
  detail: (slug: string) => [...theologianKeys.all, "detail", slug] as const,
};

export function useTheologians() {
  return useQuery({
    queryKey: theologianKeys.list(),
    queryFn: listTheologians,
  });
}

export function useTheologian(slug: string | undefined) {
  return useQuery({
    queryKey: theologianKeys.detail(slug!),
    queryFn: () => getTheologian(slug!),
    enabled: !!slug,
  });
}
