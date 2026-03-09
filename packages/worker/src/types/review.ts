export interface ReviewJobPayload {
  resultId: string;
}

export interface ReviewGradeEntry {
  theologian: {
    name: string;
    initials: string;
    dates: string;
    tradition: string;
    color: string;
  };
  grade: string;
  reaction: string;
  strengths: string[];
  weaknesses: string[];
}

export interface ReviewCritiqueMetrics {
  total: number;
  corrected: number;
  softFailures: number;
  strengthBreakdown: { none: number; minor: number; major: number };
}

export interface LLMReviewCritiqueResponse {
  is_accurate: boolean;
  framework_issues: string;
  grade_consistency_issues: string;
  corrected_grade: string;
  corrected_reaction: string;
  corrected_strengths: string[];
  corrected_weaknesses: string[];
  critique_strength: "none" | "minor" | "major";
}

export interface ReviewContent {
  reviewFileLabel: string;
  focusPrompt: string | null;
  description?: string | null;
  overallGrade: string;
  summary: string;
  grades: ReviewGradeEntry[];
  critiqueMetrics?: ReviewCritiqueMetrics;
  wasTruncated?: boolean;
  originalCharCount?: number;
}

export interface LLMReviewResponse {
  grade: string;
  reaction: string;
  strengths: string[];
  weaknesses: string[];
}

export interface LLMReviewSynthesisResponse {
  overall_grade: string;
  summary: string;
}
