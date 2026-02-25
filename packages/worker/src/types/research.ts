export interface ResearchJobPayload {
  resultId: string;
}

// ── Stage 0.5: Interpretation ──────────────────────────────────────

export interface InterpretationAngle {
  label: string;
  interpretation: string;
  theologicalConcepts: string[];
  priority: "PRIMARY" | "SUPPORTING";
}

export interface InterpretationPlan {
  coreQuestions: string[];
  angles: InterpretationAngle[];
  anachronisticTerms: string[];
}

// ── Stage 1: Search Plan ───────────────────────────────────────────

export interface AngleSearchPlan {
  angleLabel: string;
  latinPhrases: string[];
  latinKeyTerms: string[];
  englishTerms: string[];
}

export interface SearchPlan {
  angles: AngleSearchPlan[];
}

// ── Retrieval ──────────────────────────────────────────────────────

export interface RetrievedParagraph {
  paragraphId: string;
  nodeId: string;
  editionId: string;
  text: string;
  normalizedText: string | null;
  canonicalRef: string | null;
  sortOrder: number;
  scores: Record<string, number>; // path → score
}

export interface EvidenceLocus {
  nodeId: string;
  heading: string | null;
  canonicalRef: string | null;
  editionId: string;
  workTitle: string;
  bestScore: number;
  paragraphs: RetrievedParagraph[];
}

export interface ExpandedEvidenceItem {
  paragraph: RetrievedParagraph;
  contextBefore: string | null;
  contextAfter: string | null;
  translation: string;
  workTitle: string;
  heading: string | null;
  canonicalRef: string | null;
}

// ── Claims & Verification ──────────────────────────────────────────

export type ClaimType = "paraphrase" | "quote" | "inference";
export type Confidence = "HIGH" | "MEDIUM" | "LOW";
export type VerificationVerdict = "SUPPORTS" | "PARTIAL" | "NOT_SUPPORTED";

export interface ExtractedClaim {
  claimText: string;
  claimType: ClaimType;
  citedParagraphIds: string[];
}

export interface VerificationResult {
  verdict: VerificationVerdict;
  latinQuote: string;
  englishQuote: string;
  paragraphId: string;
}

export interface VerifiedClaim {
  claimText: string;
  claimType: ClaimType;
  confidence: Confidence;
  verifications: VerificationResult[];
  citedParagraphIds: string[];
}

// ── Final Output ───────────────────────────────────────────────────

export interface ResearchCitationSource {
  workTitle: string;
  canonicalRef: string;
  originalText: string;
  translation: string;
}

export interface ResearchCitation {
  id: string;
  marker: string;
  claimText: string;
  claimType: ClaimType;
  confidence: Confidence;
  sources: ResearchCitationSource[];
}

export interface ResearchContent {
  tool: "research";
  question: string;
  theologianName: string;
  theologianSlug: string;
  responseText: string;
  citations: ResearchCitation[];
  metadata: {
    anglesProcessed: number;
    totalClaims: number;
    evidenceItemsUsed: number;
  };
}

// ── LLM Response Shapes ────────────────────────────────────────────

export interface LLMInterpretationResponse {
  core_questions: string[];
  angles: {
    label: string;
    interpretation: string;
    theological_concepts: string[];
    priority: "PRIMARY" | "SUPPORTING";
  }[];
  anachronistic_terms: string[];
}

export interface LLMSearchPlanResponse {
  angles: {
    angle_label: string;
    latin_phrases: string[];
    latin_key_terms: string[];
    english_terms: string[];
  }[];
}

export interface LLMTranslationResponse {
  translation: string;
}

export interface LLMClaimExtractionResponse {
  claims: {
    claim_text: string;
    claim_type: "paraphrase" | "quote" | "inference";
    cited_paragraph_ids: string[];
  }[];
}

export interface LLMVerificationResponse {
  verdict: "SUPPORTS" | "PARTIAL" | "NOT_SUPPORTED";
  latin_quote: string;
  english_quote: string;
}

export interface LLMSynthesisResponse {
  response_text: string;
  citation_plan: {
    marker: string;
    claim_index: number;
  }[];
}
