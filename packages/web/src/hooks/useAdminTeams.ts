import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminListNativeTeams,
  adminCreateNativeTeam,
  adminUpdateNativeTeam,
  adminDeleteNativeTeam,
  adminReorderNativeTeams,
  adminListTeamSnapshots,
} from "@/lib/api";
import type {
  CreateNativeTeamPayload,
  UpdateNativeTeamPayload,
  ReorderPayload,
} from "@/data/admin/team-types";

const adminTeamKeys = {
  all: ["admin", "teams"] as const,
  native: () => [...adminTeamKeys.all, "native"] as const,
  snapshots: (teamId: string) =>
    [...adminTeamKeys.all, "snapshots", teamId] as const,
};

export function useAdminNativeTeams() {
  return useQuery({
    queryKey: adminTeamKeys.native(),
    queryFn: adminListNativeTeams,
  });
}

export function useAdminCreateNativeTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateNativeTeamPayload) =>
      adminCreateNativeTeam(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTeamKeys.native() });
    },
  });
}

export function useAdminUpdateNativeTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateNativeTeamPayload;
    }) => adminUpdateNativeTeam(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTeamKeys.native() });
    },
  });
}

export function useAdminDeleteNativeTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminDeleteNativeTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTeamKeys.native() });
    },
  });
}

export function useTeamSnapshots(teamId: string) {
  return useQuery({
    queryKey: adminTeamKeys.snapshots(teamId),
    queryFn: () => adminListTeamSnapshots(teamId),
  });
}

export function useAdminReorderNativeTeams() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReorderPayload) => adminReorderNativeTeams(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTeamKeys.native() });
    },
  });
}
