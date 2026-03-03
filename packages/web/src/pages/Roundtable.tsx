import { RoundtableHero } from "@/components/roundtable/RoundtableHero";
import { RoundtableWorkspace } from "@/components/roundtable/RoundtableWorkspace";
import { RecentLibrary } from "@/components/roundtable/RecentLibrary";

export default function Roundtable() {
  return (
    <>
      <RoundtableHero />
      <RoundtableWorkspace />
      <RecentLibrary />
    </>
  );
}
