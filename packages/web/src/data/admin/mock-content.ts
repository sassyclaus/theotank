// ── Types ──────────────────────────────────────────────────────────

export interface ModerationItem {
  id: string;
  type: "auto-flagged" | "user-report";
  query: string;
  tool: "ask" | "poll" | "review";
  team: string;
  timeAgo: string;
  flagReason: string;
  reportCount?: number;
}

export interface PublicLibraryItem {
  id: string;
  title: string;
  tool: "ask" | "poll" | "super_poll" | "review" | "research";
  views: number;
  unlocks: number;
  status: "public" | "removed" | "flagged";
}

export interface ContentStats {
  total: number;
  addedThisWeek: number;
  removedThisWeek: number;
  optOutRate: string;
}

// ── Moderation Queue ──────────────────────────────────────────────

export const moderationQueue: ModerationItem[] = [
  {
    id: "mod-1",
    type: "auto-flagged",
    query: "Is it sinful to be homosexual?",
    tool: "ask",
    team: "All Theologians",
    timeAgo: "4 hours ago",
    flagReason: "Sensitive topic — sexuality & sin",
  },
  {
    id: "mod-2",
    type: "user-report",
    query: "Best arguments for why Christianity is false",
    tool: "ask",
    team: "Skeptics + Apologists",
    timeAgo: "1 day ago",
    flagReason: "Reported as potentially bad-faith framing",
    reportCount: 2,
  },
  {
    id: "mod-3",
    type: "auto-flagged",
    query: "Can God make a rock too heavy to lift?",
    tool: "ask",
    team: "All Theologians",
    timeAgo: "6 hours ago",
    flagReason: "Low-quality / logical paradox bait",
  },
];

// ── Public Library ────────────────────────────────────────────────

export const publicLibraryItems: PublicLibraryItem[] = [
  {
    id: "lib-1",
    title: "What is the relationship between faith and reason in Aquinas?",
    tool: "ask",
    views: 4_210,
    unlocks: 387,
    status: "public",
  },
  {
    id: "lib-2",
    title: "Should Christians support capital punishment?",
    tool: "poll",
    views: 3_875,
    unlocks: 312,
    status: "public",
  },
  {
    id: "lib-3",
    title: "Review: Mere Christianity by C.S. Lewis",
    tool: "review",
    views: 2_940,
    unlocks: 256,
    status: "public",
  },
  {
    id: "lib-4",
    title: "How did the early church fathers interpret Genesis 1?",
    tool: "ask",
    views: 2_615,
    unlocks: 198,
    status: "public",
  },
  {
    id: "lib-5",
    title: "Is predestination compatible with free will?",
    tool: "poll",
    views: 2_102,
    unlocks: 175,
    status: "public",
  },
  {
    id: "lib-6",
    title: "Karl Barth's doctrine of election explained",
    tool: "research",
    views: 1_830,
    unlocks: 142,
    status: "public",
  },
  {
    id: "lib-7",
    title: "Review: The Cost of Discipleship by Dietrich Bonhoeffer",
    tool: "review",
    views: 1_574,
    unlocks: 118,
    status: "public",
  },
  {
    id: "lib-8",
    title: "What does Augustine say about the problem of evil?",
    tool: "ask",
    views: 1_203,
    unlocks: 94,
    status: "public",
  },
];

// ── Content Stats ─────────────────────────────────────────────────

export const contentStats: ContentStats = {
  total: 2_847,
  addedThisWeek: 124,
  removedThisWeek: 2,
  optOutRate: "18%",
};
