import { useQuery } from "@tanstack/react-query";
import { listResearchCorpora } from "@/lib/api";

const researchKeys = {
  all: ["research"] as const,
  corpora: () => [...researchKeys.all, "corpora"] as const,
};

export function useResearchCorpora() {
  return useQuery({
    queryKey: researchKeys.corpora(),
    queryFn: listResearchCorpora,
  });
}
