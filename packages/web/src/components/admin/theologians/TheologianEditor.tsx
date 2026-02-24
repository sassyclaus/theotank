import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, ImageIcon, Upload, X, Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/admin/ui/Badge";
import {
  useAdminUpdateTheologian,
  useUploadPortrait,
} from "@/hooks/useAdminTheologians";
import type { AdminTheologian } from "@/data/admin/theologian-types";

const ERAS = [
  "Apostolic",
  "Patristic",
  "Medieval",
  "Reformation",
  "Post-Reformation",
  "Modern",
] as const;

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
] as const;

interface TheologianEditorProps {
  theologian: AdminTheologian;
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-gray-500">
      {children}
    </label>
  );
}

export function TheologianEditor({ theologian }: TheologianEditorProps) {
  const t = theologian;

  // Form state
  const [name, setName] = useState(t.name);
  const [tagline, setTagline] = useState(t.tagline ?? "");
  const [bio, setBio] = useState(t.bio ?? "");
  const [born, setBorn] = useState(t.born?.toString() ?? "");
  const [died, setDied] = useState(t.died?.toString() ?? "");
  const [era, setEra] = useState(t.era ?? "");
  const [tradition, setTradition] = useState(t.tradition ?? "");
  const [voiceStyle, setVoiceStyle] = useState(t.voiceStyle ?? "");
  const [keyWorks, setKeyWorks] = useState<string[]>(t.keyWorks ?? []);
  const [newWork, setNewWork] = useState("");

  // Reset form when theologian changes (e.g. after save)
  useEffect(() => {
    setName(t.name);
    setTagline(t.tagline ?? "");
    setBio(t.bio ?? "");
    setBorn(t.born?.toString() ?? "");
    setDied(t.died?.toString() ?? "");
    setEra(t.era ?? "");
    setTradition(t.tradition ?? "");
    setVoiceStyle(t.voiceStyle ?? "");
    setKeyWorks(t.keyWorks ?? []);
  }, [t]);

  // Mutations
  const updateMutation = useAdminUpdateTheologian();
  const uploadMutation = useUploadPortrait();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dirty check — only send changed fields
  function getDirtyFields() {
    const payload: Record<string, unknown> = {};
    if (name !== t.name) payload.name = name;
    if (tagline !== (t.tagline ?? "")) payload.tagline = tagline || null;
    if (bio !== (t.bio ?? "")) payload.bio = bio || null;
    const bornNum = born ? parseInt(born, 10) : null;
    if (bornNum !== t.born) payload.born = bornNum;
    const diedNum = died ? parseInt(died, 10) : null;
    if (diedNum !== t.died) payload.died = diedNum;
    if (era !== (t.era ?? "")) payload.era = era || null;
    if (tradition !== (t.tradition ?? ""))
      payload.tradition = tradition || null;
    if (voiceStyle !== (t.voiceStyle ?? ""))
      payload.voiceStyle = voiceStyle || null;
    if (JSON.stringify(keyWorks) !== JSON.stringify(t.keyWorks))
      payload.keyWorks = keyWorks;
    return payload;
  }

  const dirty = Object.keys(getDirtyFields()).length > 0;

  function handleSave() {
    const payload = getDirtyFields();
    if (Object.keys(payload).length === 0) return;
    updateMutation.mutate({ id: t.id, payload });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate({ id: t.id, file });
    // Reset file input so same file can be re-selected
    e.target.value = "";
  }

  function addWork() {
    const trimmed = newWork.trim();
    if (!trimmed || keyWorks.includes(trimmed)) return;
    setKeyWorks([...keyWorks, trimmed]);
    setNewWork("");
  }

  function removeWork(index: number) {
    setKeyWorks(keyWorks.filter((_, i) => i !== index));
  }

  const lifespan =
    born && died ? `${born}\u2013${died}` : born ? `b. ${born}` : "";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/admin/theologians"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Theologians
      </Link>

      {/* Save bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{t.name}</h2>
        <div className="flex items-center gap-3">
          {updateMutation.isSuccess && (
            <span className="text-xs text-admin-success">Saved</span>
          )}
          {updateMutation.isError && (
            <span className="text-xs text-admin-danger">Save failed</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || updateMutation.isPending}
            className="rounded-md bg-admin-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-admin-accent/90 disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Identity */}
      <Section title="Identity">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <FieldLabel>Name</FieldLabel>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
            />
          </div>
          <div>
            <FieldLabel>Birth Year</FieldLabel>
            <input
              type="number"
              value={born}
              onChange={(e) => setBorn(e.target.value)}
              placeholder="e.g. 354"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
            />
          </div>
          <div>
            <FieldLabel>Death Year</FieldLabel>
            <input
              type="number"
              value={died}
              onChange={(e) => setDied(e.target.value)}
              placeholder="Leave blank if living"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
            />
          </div>
          <div>
            <FieldLabel>Era</FieldLabel>
            <select
              value={era}
              onChange={(e) => setEra(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
            >
              <option value="">Not set</option>
              {ERAS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>Tradition</FieldLabel>
            <select
              value={tradition}
              onChange={(e) => setTradition(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
            >
              <option value="">Not set</option>
              {TRADITIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>Lifespan</FieldLabel>
            <p className="mt-1.5 text-sm text-gray-700">
              {lifespan || (
                <span className="italic text-gray-400">Not set</span>
              )}
            </p>
          </div>
        </div>
      </Section>

      {/* Tagline */}
      <Section title="Tagline">
        <div>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Brief one-line description..."
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
          />
        </div>
      </Section>

      {/* Portrait */}
      <Section title="Portrait">
        <div className="flex items-center gap-4">
          {t.imageUrl ? (
            <img
              src={t.imageUrl}
              alt={`Portrait of ${t.name}`}
              className="h-24 w-24 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              <ImageIcon className="h-8 w-8 text-gray-300" />
            </div>
          )}
          <div>
            {t.imageKey ? (
              <>
                <Badge variant="success">Portrait uploaded</Badge>
                <p className="mt-1 text-xs text-gray-500">{t.imageKey}</p>
              </>
            ) : (
              <Badge variant="warning">Missing portrait</Badge>
            )}
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/webp,image/png,image/jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    {t.imageKey ? "Replace" : "Upload"} Portrait
                  </>
                )}
              </button>
            </div>
            {uploadMutation.isError && (
              <p className="mt-1 text-xs text-admin-danger">Upload failed</p>
            )}
          </div>
        </div>
      </Section>

      {/* Biography */}
      <Section title="Biography">
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={5}
          placeholder="Enter biography..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-relaxed focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
        />
      </Section>

      {/* Voice Style */}
      <Section title="Voice Style">
        <textarea
          value={voiceStyle}
          onChange={(e) => setVoiceStyle(e.target.value)}
          rows={3}
          placeholder="Describe the theologian's voice and persona for AI synthesis..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-relaxed focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
        />
      </Section>

      {/* Key Works */}
      <Section title="Key Works">
        {keyWorks.length > 0 ? (
          <ul className="space-y-1.5">
            {keyWorks.map((work, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-700"
              >
                {work}
                <button
                  type="button"
                  onClick={() => removeWork(i)}
                  className="text-gray-400 hover:text-admin-danger"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-gray-400">
            No key works recorded.
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newWork}
            onChange={(e) => setNewWork(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addWork();
              }
            }}
            placeholder="Add a work..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
          />
          <button
            type="button"
            onClick={addWork}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </Section>

      {/* Platform Presence */}
      <Section title="Platform Presence">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <span className="text-xs font-medium text-gray-500">
              Research Corpus
            </span>
            <div className="mt-0.5">
              {t.hasResearch ? (
                <Badge variant="success">Available</Badge>
              ) : (
                <Badge variant="neutral">Not uploaded</Badge>
              )}
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500">
              Profile Completeness
            </span>
            <div className="mt-0.5">
              <Badge
                variant={
                  t.profileCompleteness === "full"
                    ? "success"
                    : t.profileCompleteness === "partial"
                      ? "warning"
                      : "danger"
                }
              >
                {t.profileCompleteness.charAt(0).toUpperCase() +
                  t.profileCompleteness.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
