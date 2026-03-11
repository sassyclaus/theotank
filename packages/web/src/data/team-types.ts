export interface TeamMember {
  theologianId: string;
  name: string;
  slug: string;
  initials: string;
  tradition: string | null;
  color: string;
  imageUrl: string | null;
}

export interface NativeTeamSummary {
  id: string;
  name: string;
  description: string | null;
  isNative: true;
  memberCount: number;
  members: TeamMember[];
}

export interface CustomTeam {
  id: string;
  name: string;
  description: string | null;
  isNative: false;
  members: TeamMember[];
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
  memberIds: string[];
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
  memberIds?: string[];
}
