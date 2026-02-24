// ── Types ──────────────────────────────────────────────────────────

export interface DashboardKpi {
  label: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
}

export interface AttentionItem {
  id: string;
  icon: "warning" | "info";
  label: string;
  link: string;
}

export interface LiveFeedItem {
  id: string;
  time: string;
  type: "submission" | "signup" | "unlock";
  description: string;
  detail?: string;
}

export interface FunnelMetrics {
  signups: number;
  firstSubmission: number;
  secondSubmission: number;
  converted: number;
  churned: number;
}

export interface ToolMixEntry {
  tool: string;
  percentage: number;
  color: string;
}

export interface RevenueTier {
  tier: string;
  price: string;
  users: number;
}

// ── KPIs ───────────────────────────────────────────────────────────

export const dashboardKpis: DashboardKpi[] = [
  {
    label: "Active Users",
    value: "1,247",
    change: "+8% WoW",
    changeType: "positive",
  },
  {
    label: "Submissions Today",
    value: "342",
    change: "+12% WoW",
    changeType: "positive",
  },
  {
    label: "MRR",
    value: "$12,400",
    change: "+6% MoM",
    changeType: "positive",
  },
  {
    label: "Public Library",
    value: "2,847",
    change: "+124 this week",
    changeType: "positive",
  },
];

// ── Attention Items ────────────────────────────────────────────────

export const attentionItems: AttentionItem[] = [
  {
    id: "att-1",
    icon: "warning",
    label: "3 flagged results awaiting moderation",
    link: "/admin/content",
  },
  {
    id: "att-2",
    icon: "warning",
    label: "1 failed job (retry?)",
    link: "/admin/system",
  },
  {
    id: "att-3",
    icon: "info",
    label: "Calvin corpus upload stalled at 72%",
    link: "/admin/research",
  },
  {
    id: "att-4",
    icon: "info",
    label: "12 support emails unread",
    link: "/admin/users",
  },
];

// ── Live Feed ──────────────────────────────────────────────────────

export const liveFeedItems: LiveFeedItem[] = [
  {
    id: "lf-1",
    time: "12:04",
    type: "submission",
    description: "Poll submitted",
    detail: '"Should Christians practice contemplative prayer?"',
  },
  {
    id: "lf-2",
    time: "12:01",
    type: "signup",
    description: "New user signed up",
    detail: "via Google OAuth",
  },
  {
    id: "lf-3",
    time: "11:58",
    type: "submission",
    description: "Ask submitted",
    detail: '"How did Luther understand vocation?"',
  },
  {
    id: "lf-4",
    time: "11:52",
    type: "unlock",
    description: "Research unlocked",
    detail: "Barth corpus — Pro tier",
  },
  {
    id: "lf-5",
    time: "11:47",
    type: "submission",
    description: "Review submitted",
    detail: '"Institutes of the Christian Religion" Book III',
  },
  {
    id: "lf-6",
    time: "11:43",
    type: "signup",
    description: "New user signed up",
    detail: "via email invite",
  },
];

// ── Funnel Metrics ─────────────────────────────────────────────────

export const funnelMetrics: FunnelMetrics = {
  signups: 89,
  firstSubmission: 64,
  secondSubmission: 41,
  converted: 23,
  churned: 4,
};

// ── Tool Mix ───────────────────────────────────────────────────────

export const toolMix: ToolMixEntry[] = [
  { tool: "Ask", percentage: 58, color: "bg-blue-500" },
  { tool: "Poll", percentage: 24, color: "bg-teal" },
  { tool: "Review", percentage: 12, color: "bg-amber-500" },
  { tool: "Research", percentage: 6, color: "bg-oxblood" },
];

// ── Revenue Breakdown ──────────────────────────────────────────────

export const revenueBreakdown: RevenueTier[] = [
  { tier: "Base", price: "$9.99", users: 842 },
  { tier: "Pro", price: "$24.99", users: 312 },
  { tier: "Scholar", price: "$49.99", users: 47 },
];
