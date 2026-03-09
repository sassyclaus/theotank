export interface ToolData {
  title: string;
  slug: string;
  description: string;
  sampleLabel: string;
  sampleContent: string;
  sampleAttribution?: string;
}

export const tools: ToolData[] = [
  {
    title: "Ask",
    slug: "ask",
    description:
      "Pose a question to a curated panel of theologians. Get an simulated deliberation — each voice responding in their own tradition.",
    sampleLabel: "Sample response",
    sampleContent:
      '"Grace is not a substance that can be measured, but the very presence of God acting upon the soul — preceding any merit, enabling the will, and completing what it begins."',
    sampleAttribution: "— simulated Augustine, in response to a panel question",
  },
  {
    title: "Poll",
    slug: "poll",
    description:
      "Put any question to the entire roster. See where 2,000 years of simulated theology lands — tradition by tradition, era by era.",
    sampleLabel: "Sample result",
    sampleContent: "Was Mary perpetually virgin?",
    // The poll card renders a custom chart mockup, not just text
  },
  {
    title: "Review",
    slug: "review",
    description:
      "Upload a sermon, essay, or lecture. Get simulated feedback from a panel of history's sharpest theological minds — with specific, actionable notes.",
    sampleLabel: "Sample grade",
    sampleContent: "B+",
    sampleAttribution: "simulated panel consensus on a submitted sermon",
  },
];
