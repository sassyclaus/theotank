import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listNativeTeams,
  listMyTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} from "@/lib/api";
import type { CreateTeamPayload, UpdateTeamPayload } from "@/data/team-types";

const teamKeys = {
  all: ["teams"] as const,
  native: () => [...teamKeys.all, "native"] as const,
  my: () => [...teamKeys.all, "my"] as const,
};

export function useNativeTeams() {
  return useQuery({
    queryKey: teamKeys.native(),
    queryFn: listNativeTeams,
  });
}

export function useMyTeams() {
  return useQuery({
    queryKey: teamKeys.my(),
    queryFn: listMyTeams,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTeamPayload) => createTeam(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.my() });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTeamPayload }) =>
      updateTeam(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.my() });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.my() });
    },
  });
}
