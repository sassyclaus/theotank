import type { TeamMember } from "@/data/team-types";

export interface AdminNativeTeam {
  id: string;
  name: string;
  description: string | null;
  isNative: true;
  displayOrder: number;
  visible: boolean;
  version: number;
  memberCount: number;
  members: TeamMember[];
}

export interface CreateNativeTeamPayload {
  name: string;
  description?: string;
  memberIds: string[];
  displayOrder?: number;
  visible?: boolean;
}

export interface UpdateNativeTeamPayload {
  name?: string;
  description?: string;
  memberIds?: string[];
  displayOrder?: number;
  visible?: boolean;
}

export interface ReorderPayload {
  orders: Array<{ id: string; displayOrder: number }>;
}

export interface TeamSnapshot {
  id: string;
  teamId: string;
  version: number;
  name: string;
  description: string | null;
  members: Array<{
    theologianId: string;
    name: string;
    initials: string;
    tradition: string | null;
  }>;
  createdAt: string;
}
