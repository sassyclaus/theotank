import { ResearchHero } from "@/components/research/ResearchHero";
import { AvailableCorpora } from "@/components/research/AvailableCorpora";
import { HowResearchDiffers } from "@/components/research/HowResearchDiffers";
import { RecentResearchQueries } from "@/components/research/RecentResearchQueries";

export default function Research() {
  return (
    <>
      <ResearchHero />
      <AvailableCorpora />
      <HowResearchDiffers />
      <RecentResearchQueries />
    </>
  );
}
