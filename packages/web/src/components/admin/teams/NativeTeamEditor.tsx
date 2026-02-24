import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, X, Loader2 } from "lucide-react";
import { SearchFilter } from "@/components/admin/ui/SearchFilter";
import { AdminTheologianPickerItem } from "./AdminTheologianPickerItem";
import { TeamVersionHistory } from "./TeamVersionHistory";
import { useTheologians } from "@/hooks/useTheologians";
import {
  useAdminCreateNativeTeam,
  useAdminUpdateNativeTeam,
  useAdminDeleteNativeTeam,
} from "@/hooks/useAdminTeams";
import type { AdminNativeTeam } from "@/data/admin/team-types";
import { cn } from "@/lib/utils";

interface NativeTeamEditorProps {
  team: AdminNativeTeam | null;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-admin-border bg-white">
      <div className="border-b border-admin-border px-5 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

const TRADITIONS = [
  "Reformed",
  "Catholic",
  "Orthodox",
  "Lutheran",
  "Anglican",
  "Methodist",
  "Baptist",
  "Puritan",
  "Neo-Orthodox",
];

export function NativeTeamEditor({ team }: NativeTeamEditorProps) {
  const navigate = useNavigate();
  const isCreate = team === null;

  const [name, setName] = useState(team?.name ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [displayOrder, setDisplayOrder] = useState(team?.displayOrder ?? 0);
  const [visible, setVisible] = useState(team?.visible ?? true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(team?.members.map((m) => m.theologianId) ?? []),
  );
  const [search, setSearch] = useState("");
  const [traditionFilter, setTraditionFilter] = useState<string | null>(null);

  const { data: theologians, isLoading: theologiansLoading } = useTheologians();
  const createMutation = useAdminCreateNativeTeam();
  const updateMutation = useAdminUpdateNativeTeam();
  const deleteMutation = useAdminDeleteNativeTeam();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const filteredTheologians = useMemo(() => {
    if (!theologians) return [];
    return theologians.filter((t) => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (traditionFilter && t.tradition !== traditionFilter) return false;
      return true;
    });
  }, [theologians, search, traditionFilter]);

  const selectedMembers = useMemo(() => {
    if (!theologians) return [];
    return theologians.filter((t) => selectedIds.has(t.id));
  }, [theologians, selectedIds]);

  function toggleMember(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleSave() {
    if (!name.trim()) return;

    if (isCreate) {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        memberIds: Array.from(selectedIds),
        displayOrder,
        visible,
      });
    } else {
      await updateMutation.mutateAsync({
        id: team.id,
        payload: {
          name: name.trim(),
          description: description.trim() || undefined,
          memberIds: Array.from(selectedIds),
          displayOrder,
          visible,
        },
      });
    }

    navigate("/admin/teams");
  }

  async function handleDelete() {
    if (!team) return;
    if (!window.confirm(`Delete "${team.name}"? This cannot be undone.`)) return;
    await deleteMutation.mutateAsync(team.id);
    navigate("/admin/teams");
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/teams"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Teams
      </Link>

      <Section title="Details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Team name"
              className="w-full rounded-lg border border-admin-border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Display Order
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full rounded-lg border border-admin-border bg-white px-3 py-2 text-sm text-gray-900 focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => setVisible(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-admin-accent focus:ring-admin-accent"
                />
                Visible
              </label>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description of this team"
              className="w-full rounded-lg border border-admin-border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
            />
          </div>
        </div>
      </Section>

      <Section title={`Members (${selectedIds.size} selected)`}>
        {/* Selected member chips */}
        {selectedMembers.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedMembers.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-1 pr-2 text-xs text-gray-700"
              >
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: t.color ?? "#B8963E" }}
                >
                  {t.initials}
                </span>
                {t.name}
                <button
                  type="button"
                  onClick={() => toggleMember(t.id)}
                  className="rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search and tradition filter */}
        <div className="space-y-3">
          <SearchFilter
            value={search}
            onChange={setSearch}
            placeholder="Search theologians..."
          />
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setTraditionFilter(null)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                traditionFilter === null
                  ? "bg-admin-accent text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              All
            </button>
            {TRADITIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() =>
                  setTraditionFilter(traditionFilter === t ? null : t)
                }
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  traditionFilter === t
                    ? "bg-admin-accent text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Theologian list */}
        <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-admin-border">
          {theologiansLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : filteredTheologians.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No theologians match your filters.
            </p>
          ) : (
            filteredTheologians.map((t) => (
              <AdminTheologianPickerItem
                key={t.id}
                name={t.name}
                initials={t.initials ?? t.name.slice(0, 2).toUpperCase()}
                tradition={t.tradition ?? null}
                color={t.color ?? "#B8963E"}
                selected={selectedIds.has(t.id)}
                onToggle={() => toggleMember(t.id)}
              />
            ))
          )}
        </div>
      </Section>

      {!isCreate && <TeamVersionHistory teamId={team.id} />}

      {/* Footer actions */}
      <div className="flex items-center justify-between">
        <div>
          {!isCreate && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Team"}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className="rounded-md bg-admin-accent px-4 py-2 text-sm font-medium text-white hover:bg-admin-accent/90 disabled:opacity-50"
        >
          {isSaving
            ? "Saving..."
            : isCreate
              ? "Create Team"
              : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
