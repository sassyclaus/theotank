import { useState, useCallback } from "react";
import { useSearchParams } from "react-router";
import type { LibraryTab, ExploreSortOption } from "@/data/mock-library";
import { LibraryHero } from "@/components/library/LibraryHero";
import { LibraryTabBar } from "@/components/library/LibraryTabBar";
import { MyLibraryView } from "@/components/library/MyLibraryView";
import { ExploreView } from "@/components/library/ExploreView";

const VALID_TABS: LibraryTab[] = ["my-library", "explore"];

export default function Library() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: LibraryTab = VALID_TABS.includes(tabParam as LibraryTab)
    ? (tabParam as LibraryTab)
    : "my-library";

  const setActiveTab = useCallback(
    (tab: LibraryTab) => {
      setSearchParams(
        tab === "my-library" ? {} : { tab },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // My Library filters (persisted across tab switches)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTool, setSelectedTool] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");

  // Explore filters
  const [exploreQuery, setExploreQuery] = useState("");
  const [exploreSortBy, setExploreSortBy] = useState<ExploreSortOption>("recent");
  const [exploreTool, setExploreTool] = useState("all");

  return (
    <>
      <LibraryHero />
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="mb-6">
          <LibraryTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {activeTab === "my-library" ? (
          <MyLibraryView
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedTool={selectedTool}
            onToolChange={setSelectedTool}
            selectedTeam={selectedTeam}
            onTeamChange={setSelectedTeam}
          />
        ) : (
          <ExploreView
            searchQuery={exploreQuery}
            onSearchChange={setExploreQuery}
            sortBy={exploreSortBy}
            onSortChange={setExploreSortBy}
            selectedTool={exploreTool}
            onToolChange={setExploreTool}
          />
        )}
      </section>
    </>
  );
}
