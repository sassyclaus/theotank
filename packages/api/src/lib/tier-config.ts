export interface TierLimits {
  label: string;
  monthlyLimits: Record<string, number>;
  maxTeamSize: number | null;
}

export const TIER_CONFIG: Record<string, TierLimits> = {
  free: {
    label: "Free",
    monthlyLimits: {
      ask: 50,
      poll: 25,
      super_poll: 3,
      review: 25,
      research: 10,
    },
    maxTeamSize: null,
  },
  // pro: {
  //   label: "Pro",
  //   monthlyLimits: { ask: 200, poll: 100, super_poll: 20, review: 100, research: 50 },
  //   maxTeamSize: null,
  // },
};

export function getTierConfig(tier: string): TierLimits {
  return TIER_CONFIG[tier] ?? TIER_CONFIG.free;
}
