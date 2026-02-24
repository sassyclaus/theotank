// ── Types ──────────────────────────────────────────────────────────

export interface CustomTeamStats {
  totalCreated: number;
  activeThisMonth: number;
  avgTeamSize: number;
  mostCommonTheologian: string;
  mostCommonPercent: number;
}

// ── Custom Team Stats ─────────────────────────────────────────────

export const mockCustomTeamStats: CustomTeamStats = {
  totalCreated: 89,
  activeThisMonth: 34,
  avgTeamSize: 6.2,
  mostCommonTheologian: "Augustine",
  mostCommonPercent: 67,
};
