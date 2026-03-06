// ── Types ────────────────────────────────────────────────────────────

export type RoundtableMode = "ask" | "poll" | "review";

export interface RecentLibraryItem {
  id: string;
  question: string;
  tool: RoundtableMode;
  team: string;
  date: string;
  preview: string;
}

export interface ModeConfig {
  label: string;
  description: string;
  cta: string;
}

// ── Data ─────────────────────────────────────────────────────────────

export const modeConfig: Record<RoundtableMode, ModeConfig> = {
  ask: {
    label: "Ask",
    description: "Pose a theological question and receive a synthesized panel response.",
    cta: "Convene Panel",
  },
  poll: {
    label: "Poll",
    description: "Survey the panel on a question with structured response options.",
    cta: "Run Poll",
  },
  review: {
    label: "Review",
    description: "Submit a document for theological review and commentary.",
    cta: "Submit for Review",
  },
};

export const recentLibraryItems: RecentLibraryItem[] = [
  {
    id: "r1",
    question: "How did the early church understand justification?",
    tool: "ask",
    team: "Church Fathers",
    date: "Feb 18, 2026",
    preview:
      "The panel identified three distinct strands of justification theology in the ante-Nicene period, noting that Irenaeus emphasized recapitulation while Augustine later shifted the discussion toward imputed righteousness...",
  },
  {
    id: "r2",
    question: "Should women be ordained to pastoral ministry?",
    tool: "poll",
    team: "All Theologians",
    date: "Feb 15, 2026",
    preview:
      "Results: 8 in favor, 7 opposed, 3 nuanced. Calvin and Barth offered the most detailed dissenting positions, while Hildegard and Wright provided supporting arguments grounded in Galatians 3:28...",
  },
  {
    id: "r3",
    question: "Review of 'Mere Christianity' Chapter 3 argument",
    tool: "review",
    team: "Reformers",
    date: "Feb 12, 2026",
    preview:
      "Luther commended the accessible prose but questioned the natural-law framework. Calvin noted the absence of explicit covenant theology. Knox found the ecumenical tone admirable but insufficiently Reformed...",
  },
];

export const deliberationMessages: string[] = [
  "The panel is deliberating...",
  "Consulting primary sources...",
  "Synthesizing perspectives...",
  "Preparing the panel's response...",
];
