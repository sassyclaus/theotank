export interface PollJobPayload {
  resultId: string;
}

export interface LLMCritiqueResponse {
  is_accurate: boolean;
  corrected_position: string;
  critique_strength: "none" | "minor" | "major";
}

export interface LLMPollResponse {
  selected_option: string;
  justification: string;
}

export interface PollTheologianResult {
  theologian: {
    name: string;
    initials: string;
    dates: string;
    tradition: string;
    color: string;
    born: number | null;
  };
  recalledPosition: string;
  selection: string;
  justification: string;
}

export interface PollTheologianError {
  theologianName: string;
  error: string;
}

export interface PollContent {
  question: string;
  optionLabels: string[];
  summary: string;
  theologianSelections: Array<{
    theologian: {
      name: string;
      initials: string;
      dates: string;
      tradition: string;
      color: string;
      born: number | null;
    };
    selection: string;
    justification: string;
  }>;
  errors: PollTheologianError[];
}
