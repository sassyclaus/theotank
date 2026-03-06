export interface AskJobPayload {
  resultId: string;
}

export interface AskPerspectiveEntry {
  theologian: {
    name: string;
    initials: string;
    dates: string;
    tradition: string;
    color: string;
  };
  perspective: string;
  reaction: string | null;
  keyThemes: string[];
  relevantWorks: string[];
}

export interface AskSynthesis {
  comparison: string;
  keyAgreements: string[];
  keyDisagreements: string[];
  sermonIdeas: string[];
}

export interface AskContent {
  question: string;
  perspectives: AskPerspectiveEntry[];
  synthesis: AskSynthesis;
  critiqueMetrics?: AskCritiqueMetrics;
}

export interface LLMPerspectiveResponse {
  perspective: string;
  key_themes: string[];
  relevant_works: string[];
}

export interface LLMAskCritiqueResponse {
  is_accurate: boolean;
  position_issues: string;
  citation_issues: string;
  anachronism_issues: string;
  corrected_perspective: string;
  corrected_works: string[];
  critique_strength: "none" | "minor" | "major";
}

export interface AskCritiqueMetrics {
  total: number;
  corrected: number;
  softFailures: number;
  strengthBreakdown: {
    none: number;
    minor: number;
    major: number;
  };
}

export interface LLMReactionResponse {
  reaction: string;
}

export interface LLMSynthesisResponse {
  comparison: string;
  key_agreements: string[];
  key_disagreements: string[];
  sermon_ideas: string[];
}
