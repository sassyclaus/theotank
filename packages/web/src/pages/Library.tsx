import { useState } from "react";
import type { LibraryTab, ExploreSortOption } from "@/data/mock-library";
import { LibraryHero } from "@/components/library/LibraryHero";
import { LibraryTabBar } from "@/components/library/LibraryTabBar";
import { MyLibraryView } from "@/components/library/MyLibraryView";
import { ExploreView } from "@/components/library/ExploreView";

export default function Library() {
  const [activeTab, setActiveTab] = useState<LibraryTab>("my-library");

  // My Library filters (persisted across tab switches)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTool, setSelectedTool] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");

  // Explore filters
  const [exploreQuery, setExploreQuery] = useState("");
  const [exploreSortBy, setExploreSortBy] = useState<ExploreSortOption>("recent");

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
          />
        )}
      </section>
    </>
  );
}
