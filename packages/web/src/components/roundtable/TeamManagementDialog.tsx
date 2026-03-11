import { useState, useMemo } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, ChevronDown, ChevronUp, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useNativeTeams, useMyTeams, useCreateTeam, useUpdateTeam, useDeleteTeam } from "@/hooks/useTeams";
import { useTheologians } from "@/hooks/useTheologians";
import { TheologianPickerItem } from "./TheologianPickerItem";
import { TraditionBadge } from "@/components/theologians/TraditionBadge";
import type { CustomTeam, NativeTeamSummary } from "@/data/team-types";
import type { Tradition } from "@/data/mock-theologians";
import { TRADITIONS } from "@/data/mock-theologians";

interface TeamManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type View = "list" | "editor";
type Tab = "native" | "my";

export function TeamManagementDialog({ open, onOpenChange }: TeamManagementDialogProps) {
  const [view, setView] = useState<View>("list");
  const [activeTab, setActiveTab] = useState<Tab>("native");
  const [editingTeam, setEditingTeam] = useState<CustomTeam | null>(null);

  // Reset state when dialog closes
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setView("list");
      setEditingTeam(null);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="xl" className="flex max-h-[85vh] flex-col">
        {view === "list" ? (
          <TeamListView
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onCreateNew={() => {
              setEditingTeam(null);
              setView("editor");
            }}
            onEdit={(team) => {
              setEditingTeam(team);
              setView("editor");
            }}
          />
        ) : (
          <TeamEditorView
            team={editingTeam}
            onBack={() => {
              setView("list");
              setEditingTeam(null);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Team List View ────────────────────────────────────────────────────

interface TeamListViewProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onCreateNew: () => void;
  onEdit: (team: CustomTeam) => void;
}

function TeamListView({ activeTab, onTabChange, onCreateNew, onEdit }: TeamListViewProps) {
  const { data: nativeTeams } = useNativeTeams();
  const { data: myTeams } = useMyTeams();
  const deleteTeam = useDeleteTeam();

  const handleDelete = (team: CustomTeam) => {
    if (window.confirm(`Delete "${team.name}"? This cannot be undone.`)) {
      deleteTeam.mutate(team.id);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Manage Teams</DialogTitle>
        <DialogDescription>
          Browse native teams or create your own custom panels.
        </DialogDescription>
      </DialogHeader>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface px-6">
        <button
          type="button"
          onClick={() => onTabChange("native")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "native"
              ? "border-b-2 border-teal text-teal"
              : "text-text-secondary hover:text-text-primary",
          )}
        >
          Native Teams
        </button>
        <button
          type="button"
          onClick={() => onTabChange("my")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "my"
              ? "border-b-2 border-teal text-teal"
              : "text-text-secondary hover:text-text-primary",
          )}
        >
          My Teams
        </button>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {activeTab === "native" ? (
          <NativeTeamList teams={nativeTeams ?? []} />
        ) : (
          <MyTeamList
            teams={myTeams ?? []}
            onEdit={onEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-surface px-6 py-4">
        <Button variant="gold" onClick={onCreateNew} className="w-full">
          <Plus className="h-4 w-4" />
          Create New Team
        </Button>
      </div>
    </>
  );
}

// ── Native Team List ──────────────────────────────────────────────────

function NativeTeamList({ teams }: { teams: NativeTeamSummary[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (teams.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-secondary">
        No native teams available.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {teams.map((team) => {
        const isExpanded = expandedId === team.id;
        return (
          <div key={team.id} className="rounded-lg border border-surface">
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : team.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface/50"
            >
              <Users className="h-4 w-4 shrink-0 text-teal" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {team.name}
                </p>
                {team.description && (
                  <p className="mt-0.5 truncate text-xs text-text-secondary">
                    {team.description}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs text-text-secondary">
                {team.memberCount} members
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-text-secondary" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-text-secondary" />
              )}
            </button>
            {isExpanded && (
              <div className="border-t border-surface px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {team.members.map((m) => (
                    <span
                      key={m.theologianId}
                      className="flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1"
                    >
                      {m.imageUrl ? (
                        <img src={m.imageUrl} alt={m.name} className="h-5 w-5 rounded-full object-cover" />
                      ) : (
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                          style={{ backgroundColor: m.color }}
                        >
                          {m.initials}
                        </span>
                      )}
                      <span className="text-xs text-text-primary">{m.name}</span>
                    </span>
                  ))}
                  {team.memberCount > team.members.length && (
                    <span className="flex items-center px-2 text-xs text-text-secondary">
                      +{team.memberCount - team.members.length} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── My Team List ──────────────────────────────────────────────────────

interface MyTeamListProps {
  teams: CustomTeam[];
  onEdit: (team: CustomTeam) => void;
  onDelete: (team: CustomTeam) => void;
}

function MyTeamList({ teams, onEdit, onDelete }: MyTeamListProps) {
  if (teams.length === 0) {
    return (
      <div className="py-8 text-center">
        <Users className="mx-auto h-8 w-8 text-text-secondary/40" />
        <p className="mt-2 text-sm text-text-secondary">
          You haven't created any teams yet.
        </p>
        <p className="text-xs text-text-secondary/60">
          Create a custom panel to curate your own group of theologians.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {teams.map((team) => (
        <div
          key={team.id}
          className="flex items-center gap-3 rounded-lg border border-surface px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary">{team.name}</p>
            {team.description && (
              <p className="mt-0.5 truncate text-xs text-text-secondary">
                {team.description}
              </p>
            )}
            <div className="mt-1.5 flex items-center gap-1">
              {team.members.slice(0, 4).map((m) => (
                m.imageUrl ? (
                  <img key={m.theologianId} src={m.imageUrl} alt={m.name} title={m.name} className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <span
                    key={m.theologianId}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ backgroundColor: m.color }}
                    title={m.name}
                  >
                    {m.initials}
                  </span>
                )
              ))}
              {team.members.length > 4 && (
                <span className="ml-1 text-xs text-text-secondary">
                  +{team.members.length - 4}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(team)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(team)}>
              <Trash2 className="h-4 w-4 text-oxblood" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Team Editor View ──────────────────────────────────────────────────

interface TeamEditorViewProps {
  team: CustomTeam | null;
  onBack: () => void;
}

function TeamEditorView({ team, onBack }: TeamEditorViewProps) {
  const [name, setName] = useState(team?.name ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(team?.members.map((m) => m.theologianId) ?? []),
  );
  const [search, setSearch] = useState("");
  const [traditionFilter, setTraditionFilter] = useState<string | null>(null);

  const { data: allTheologians } = useTheologians();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();

  const isSaving = createTeam.isPending || updateTeam.isPending;

  const filteredTheologians = useMemo(() => {
    if (!allTheologians) return [];
    return allTheologians.filter((t) => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (traditionFilter && t.tradition !== traditionFilter) return false;
      return true;
    });
  }, [allTheologians, search, traditionFilter]);

  const toggleTheologian = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    const memberIds = Array.from(selectedIds);
    if (team) {
      await updateTeam.mutateAsync({
        id: team.id,
        payload: { name, description: description || undefined, memberIds },
      });
    } else {
      await createTeam.mutateAsync({
        name,
        description: description || undefined,
        memberIds,
      });
    }
    onBack();
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-md p-1 transition-colors hover:bg-surface"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <DialogTitle>{team ? "Edit Team" : "Create New Team"}</DialogTitle>
        </div>
      </DialogHeader>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-4">
        {/* Name & Description */}
        <div className="space-y-3">
          <div>
            <label htmlFor="team-name" className="mb-1 block text-sm font-medium text-text-primary">
              Name
            </label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Apologetics Panel"
            />
          </div>
          <div>
            <label htmlFor="team-desc" className="mb-1 block text-sm font-medium text-text-primary">
              Description
            </label>
            <textarea
              id="team-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="flex w-full rounded-lg border border-surface bg-white px-4 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        {/* Current Members */}
        {selectedIds.size > 0 && allTheologians && (
          <div>
            <p className="mb-2 text-sm font-medium text-text-primary">
              Current Members ({selectedIds.size})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {allTheologians
                .filter((t) => selectedIds.has(t.id))
                .map((t) => (
                  <span
                    key={t.id}
                    className="flex items-center gap-1.5 rounded-full bg-surface py-1 pl-1.5 pr-2"
                  >
                    {t.imageUrl ? (
                      <img src={t.imageUrl} alt={t.name} className="h-5 w-5 rounded-full object-cover" />
                    ) : (
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                        style={{ backgroundColor: t.color }}
                      >
                        {t.initials}
                      </span>
                    )}
                    <span className="text-xs text-text-primary">{t.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleTheologian(t.id)}
                      className="ml-0.5 text-text-secondary hover:text-text-primary"
                    >
                      &times;
                    </button>
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Theologian Picker */}
        <div>
          <p className="mb-2 text-sm font-medium text-text-primary">
            Add Theologians
          </p>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="mb-2"
          />
          <div className="mb-2 flex flex-wrap gap-1.5">
            {TRADITIONS.map((t) => (
              <TraditionBadge
                key={t}
                tradition={t}
                interactive
                selected={traditionFilter === t}
                onClick={() =>
                  setTraditionFilter(traditionFilter === t ? null : t)
                }
              />
            ))}
          </div>
          <div className="max-h-[240px] overflow-y-auto rounded-lg border border-surface">
            {filteredTheologians.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-secondary">
                No theologians match your filters.
              </p>
            ) : (
              filteredTheologians.map((t) => (
                <TheologianPickerItem
                  key={t.id}
                  name={t.name}
                  initials={t.initials}
                  tradition={t.tradition}
                  color={t.color}
                  imageUrl={t.imageUrl}
                  selected={selectedIds.has(t.id)}
                  onToggle={() => toggleTheologian(t.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-surface px-6 py-4">
        <Button
          className="w-full"
          onClick={handleSave}
          disabled={!name.trim() || selectedIds.size === 0 || isSaving}
        >
          {isSaving ? "Saving..." : team ? "Save Changes" : "Create Team"}
        </Button>
      </div>
    </>
  );
}
