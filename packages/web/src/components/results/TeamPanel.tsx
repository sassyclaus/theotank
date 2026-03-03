import { Link } from "react-router";
import { Users } from "lucide-react";

interface TeamMember {
  name: string;
  initials?: string | null;
  tradition?: string | null;
}

interface TeamPanelProps {
  teamName: string;
  members: TeamMember[];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function TeamPanel({ teamName, members }: TeamPanelProps) {
  if (members.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-surface bg-surface/50 px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-text-secondary">
        <Users className="h-3.5 w-3.5" />
        {teamName}
        <span className="text-text-secondary/60">
          ({members.length} theologian{members.length !== 1 ? "s" : ""})
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {members.map((m) => (
          <Link
            key={m.name}
            to={`/theologians/${slugify(m.name)}`}
            className="rounded-full bg-white px-2.5 py-0.5 text-xs text-text-primary shadow-sm transition-colors hover:bg-teal/10 hover:text-teal"
          >
            {m.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
