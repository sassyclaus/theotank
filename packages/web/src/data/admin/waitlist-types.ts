export interface WaitlistStats {
  total: number;
  confirmed: number;
  today: number;
  thisWeek: number;
  withReferral: number;
  withQuestion: number;
  byPersona: Record<string, number>;
  byToolInterest: Record<string, number>;
}

export interface WaitlistSignup {
  id: string;
  email: string;
  emailConfirmed: boolean;
  toolInterest: string | null;
  persona: string | null;
  referralCode: string;
  referredBy: string | null;
  referralCount: number;
  queuePosition: number;
  firstQuestion: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: string;
}

export interface WaitlistListParams {
  search?: string;
  persona?: string;
  toolInterest?: string;
  emailConfirmed?: string;
  limit?: number;
  offset?: number;
  sort?: "createdAt" | "queuePosition";
  order?: "asc" | "desc";
}

export interface WaitlistListResponse {
  stats: WaitlistStats;
  signups: WaitlistSignup[];
  total: number;
}
