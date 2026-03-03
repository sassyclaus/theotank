import { useState } from "react";
import { ResearchHero } from "@/components/research/ResearchHero";
import { AvailableCorpora } from "@/components/research/AvailableCorpora";
import { HowResearchDiffers } from "@/components/research/HowResearchDiffers";
import { RecentResearchQueries } from "@/components/research/RecentResearchQueries";
import { ResearchWorkspace } from "@/components/research/ResearchWorkspace";
import { DeliberationView } from "@/components/roundtable/DeliberationView";
import type { ResearchCorpus } from "@/lib/api";

type ResearchPhase =
  | { phase: "browse" }
  | { phase: "compose"; theologianSlug: string; theologianName: string }
  | { phase: "deliberating"; resultId: string };

export default function Research() {
  const [state, setState] = useState<ResearchPhase>({ phase: "browse" });

  const handleCorpusSelect = (corpus: ResearchCorpus) => {
    setState({
      phase: "compose",
      theologianSlug: corpus.theologianSlug,
      theologianName: corpus.theologianName,
    });
  };

  if (state.phase === "compose") {
    return (
      <>
        <ResearchHero />
        <ResearchWorkspace
          theologianSlug={state.theologianSlug}
          theologianName={state.theologianName}
          onBack={() => setState({ phase: "browse" })}
          onSubmit={(resultId) => setState({ phase: "deliberating", resultId })}
        />
      </>
    );
  }

  if (state.phase === "deliberating") {
    return (
      <>
        <ResearchHero />
        <DeliberationView
          resultId={state.resultId}
          onReset={() => setState({ phase: "browse" })}
          variant="research"
        />
      </>
    );
  }

  // Browse phase
  return (
    <>
      <ResearchHero />
      <AvailableCorpora onSelect={handleCorpusSelect} />
      <HowResearchDiffers />
      <RecentResearchQueries />
    </>
  );
}
