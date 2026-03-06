import type { ResearchAlgoConfig } from "./types/research";

// ── Shared types ─────────────────────────────────────────────────────

export interface ModelRef {
  model: string;
  provider: string;
}

export interface AskAlgoConfig {
  defaultModels: {
    perspective: ModelRef;
    critique: ModelRef;
    reaction: ModelRef;
    synthesis: ModelRef;
  };
}

export interface PollAlgoConfig {
  defaultModels: {
    recall: ModelRef;
    critique: ModelRef;
    select: ModelRef;
  };
}

export interface ReviewAlgoConfig {
  defaultModels: {
    review: ModelRef;
    synthesis: ModelRef;
  };
}

export type { ResearchAlgoConfig };

export type ToolType = "ask" | "poll" | "super_poll" | "review" | "research";
export type AlgoConfig =
  | AskAlgoConfig
  | PollAlgoConfig
  | ReviewAlgoConfig
  | ResearchAlgoConfig;

// ── Version strings (stamped on each result) ─────────────────────────

export const ALGO_VERSIONS: Record<ToolType, string> = {
  ask: "2.0.0",
  poll: "1.0.0",
  super_poll: "1.0.0",
  review: "1.0.0",
  research: "1.0.0",
};

// ── Default configs (mirror previous seed data) ──────────────────────

export const DEFAULT_ASK_CONFIG: AskAlgoConfig = {
  defaultModels: {
    perspective: { model: "gpt-5.1", provider: "openai" },
    critique: { model: "gpt-5-mini-2025-08-07", provider: "openai" },
    reaction: { model: "gpt-5-mini-2025-08-07", provider: "openai" },
    synthesis: { model: "gpt-5-mini-2025-08-07", provider: "openai" },
  },
};

export const DEFAULT_POLL_CONFIG: PollAlgoConfig = {
  defaultModels: {
    recall: { model: "gpt-5.1", provider: "openai" },
    critique: { model: "gpt-5-mini-2025-08-07", provider: "openai" },
    select: { model: "gpt-5-mini-2025-08-07", provider: "openai" },
  },
};

export const DEFAULT_REVIEW_CONFIG: ReviewAlgoConfig = {
  defaultModels: {
    review: { model: "gpt-5-mini-2025-08-07", provider: "openai" },
    synthesis: { model: "gpt-5-mini-2025-08-07", provider: "openai" },
  },
};

export const DEFAULT_RESEARCH_CONFIG: ResearchAlgoConfig = {
  defaultModels: {
    interpreter: { model: "gpt-5-mini-2025-08-07", provider: "openai" },
    search_planner: { model: "gpt-5-mini-2025-08-07", provider: "openai" },
    translator: { model: "gpt-5-mini-2025-08-07", provider: "openai" },
    claim_extractor: { model: "gpt-5-mini-2025-08-07", provider: "openai" },
    verifier: { model: "gpt-5-mini-2025-08-07", provider: "openai" },
    synthesizer: { model: "gpt-5.1", provider: "openai" },
  },
  embedding: { model: "text-embedding-3-small", dimensions: 1536 },
  retrieval: {
    maxLoci: 12,
    maxPerWork: 4,
    maxEvidenceItems: 25,
    maxAngles: 4,
    contextWindowParagraphs: 1,
    topNodesPerAngle: 10,
    topParagraphsPerNode: 3,
    topDirectParagraphs: 20,
    topTrigramResults: 15,
    topTranslationFtsResults: 15,
    topTranslationSemanticResults: 15,
  },
  claims: { maxClaimsPerLocus: 5, maxLociForSynthesis: 10 },
};

// ── Lookup helper ────────────────────────────────────────────────────

const CONFIG_MAP: Record<ToolType, AlgoConfig> = {
  ask: DEFAULT_ASK_CONFIG,
  poll: DEFAULT_POLL_CONFIG,
  super_poll: DEFAULT_POLL_CONFIG,
  review: DEFAULT_REVIEW_CONFIG,
  research: DEFAULT_RESEARCH_CONFIG,
};

export function getDefaultConfig(toolType: ToolType): AlgoConfig {
  return CONFIG_MAP[toolType];
}
