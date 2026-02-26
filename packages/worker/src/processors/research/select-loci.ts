import type { Logger } from "../../lib/logger";
import { getNodeMetadata } from "../../lib/corpus-queries";
import type {
  RetrievedParagraph,
  EvidenceLocus,
  ResearchAlgoConfig,
} from "../../types/research";

export interface SelectLociResult {
  selectedLoci: EvidenceLocus[];
  nodeMeta: Map<string, { heading: string | null; canonicalRef: string | null; workTitle: string }>;
  paragraphsArray: RetrievedParagraph[];
}

export async function selectLoci(
  allParagraphs: Map<string, RetrievedParagraph>,
  algoConfig: ResearchAlgoConfig,
  log: Logger,
): Promise<SelectLociResult> {
  const rc = algoConfig.retrieval;
  const paragraphsArray = Array.from(allParagraphs.values());

  // Get node metadata
  const uniqueNodeIds = [...new Set(paragraphsArray.map((p) => p.nodeId))];
  const nodeMeta = await getNodeMetadata(uniqueNodeIds);

  // Group by nodeId → EvidenceLocus
  const locusMap = new Map<string, EvidenceLocus>();
  for (const para of paragraphsArray) {
    const meta = nodeMeta.get(para.nodeId);
    if (!locusMap.has(para.nodeId)) {
      locusMap.set(para.nodeId, {
        nodeId: para.nodeId,
        heading: meta?.heading ?? null,
        canonicalRef: meta?.canonicalRef ?? null,
        editionId: para.editionId,
        workTitle: meta?.workTitle ?? "Unknown",
        bestScore: 0,
        paragraphs: [],
      });
    }
    const locus = locusMap.get(para.nodeId)!;
    locus.paragraphs.push(para);
    const paraMaxScore = Math.max(...Object.values(para.scores));
    if (paraMaxScore > locus.bestScore) locus.bestScore = paraMaxScore;
  }

  // Sort loci by best score, cap per work
  const allLoci = Array.from(locusMap.values()).sort(
    (a, b) => b.bestScore - a.bestScore,
  );

  const workCount = new Map<string, number>();
  const selectedLoci: EvidenceLocus[] = [];
  for (const locus of allLoci) {
    if (selectedLoci.length >= rc.maxLoci) break;
    const wCount = workCount.get(locus.workTitle) ?? 0;
    if (wCount >= rc.maxPerWork) continue;
    workCount.set(locus.workTitle, wCount + 1);
    selectedLoci.push(locus);
  }

  const workNames = new Set(selectedLoci.map((l) => l.workTitle));
  log.info(
    { selectedLoci: selectedLoci.length, works: [...workNames] },
    "Locus selection complete",
  );

  return { selectedLoci, nodeMeta, paragraphsArray };
}
