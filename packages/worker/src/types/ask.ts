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
}

export interface LLMPerspectiveResponse {
  perspective: string;
  key_themes: string[];
  relevant_works: string[];
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
