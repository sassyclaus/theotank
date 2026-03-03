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

export interface ReviewContent {
  reviewFileLabel: string;
  focusPrompt: string | null;
  overallGrade: string;
  summary: string;
  grades: ReviewGradeEntry[];
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
