import { HeroSection } from "@/components/home/HeroSection";
import { ToolCards } from "@/components/home/ToolCards";
import { ResearchCallout } from "@/components/home/ResearchCallout";
import { PublicCorpusSection } from "@/components/home/PublicCorpusSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <ToolCards />
      <ResearchCallout />
      <PublicCorpusSection />
    </>
  );
}
