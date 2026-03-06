import { useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { modeConfig, type RoundtableMode } from "@/data/mock-roundtable";
import { useNativeTeams, useMyTeams } from "@/hooks/useTeams";
import { useCreateResult } from "@/hooks/useResults";
import { useUsage } from "@/hooks/useUsage";
import { ApiError } from "@/lib/api-client";
import { ModeTabBar } from "./ModeTabBar";
import { AskPanel } from "./AskPanel";
import { PollPanel } from "./PollPanel";
import { ReviewPanel } from "./ReviewPanel";
import { TeamSelector } from "./TeamSelector";
import { TeamMemberPreview } from "./TeamMemberPreview";
import { TeamManagementDialog } from "./TeamManagementDialog";
import { DeliberationView } from "./DeliberationView";

type WorkspacePhase =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "deliberating"; resultId: string }
  | { phase: "error"; message: string };

export function RoundtableWorkspace() {
  // ── Phase state ─────────────────────────────────────────────────
  const [wsPhase, setWsPhase] = useState<WorkspacePhase>({ phase: "idle" });

  // ── Mode state ──────────────────────────────────────────────────
  const [activeMode, setActiveMode] = useState<RoundtableMode>("ask");
  const [fadingOut, setFadingOut] = useState(false);
  const pendingMode = useRef<RoundtableMode | null>(null);

  // ── Shared state ────────────────────────────────────────────────
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [manageTeamsOpen, setManageTeamsOpen] = useState(false);

  // ── Poll Everyone toggle (super-poll within Poll tab) ──────────
  const [pollEveryone, setPollEveryone] = useState(false);

  // ── Team data ───────────────────────────────────────────────────
  const { data: nativeTeams } = useNativeTeams();
  const { data: myTeams } = useMyTeams();

  // ── Usage data ────────────────────────────────────────────────
  const { data: usage } = useUsage();

  // ── Result mutation ─────────────────────────────────────────────
  const createResult = useCreateResult();

  // Resolve selected team members for preview
  const selectedTeamInfo = (() => {
    if (!selectedTeam) return null;
    const native = nativeTeams?.find((t) => t.id === selectedTeam);
    if (native) return { members: native.members, totalCount: native.memberCount };
    const custom = myTeams?.find((t) => t.id === selectedTeam);
    if (custom) return { members: custom.members, totalCount: custom.members.length };
    return null;
  })();

  // ── Ask state ───────────────────────────────────────────────────
  const [askQuestion, setAskQuestion] = useState("");

  // ── Poll state ────────────────────────────────────────────────
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // ── Review state ────────────────────────────────────────────────
  const [selectedReviewFileId, setSelectedReviewFileId] = useState<string | null>(null);
  const [reviewFocusPrompt, setReviewFocusPrompt] = useState("");


  // ── Tab transition ──────────────────────────────────────────────
  const handleModeChange = useCallback(
    (mode: RoundtableMode) => {
      if (mode === activeMode || fadingOut) return;
      pendingMode.current = mode;
      setFadingOut(true);
      setTimeout(() => {
        setActiveMode(mode);
        setFadingOut(false);
        pendingMode.current = null;
      }, 150);
    },
    [activeMode, fadingOut],
  );

  // ── Poll helpers ────────────────────────────────────────────────
  const handleOptionChange = useCallback(
    (index: number, value: string) => {
      const next = [...pollOptions];
      next[index] = value;
      setPollOptions(next);
    },
    [pollOptions],
  );

  const handleAddOption = useCallback(() => {
    if (pollOptions.length < 6) setPollOptions([...pollOptions, ""]);
  }, [pollOptions]);

  const handleRemoveOption = useCallback(
    (index: number) => {
      if (pollOptions.length > 2) {
        setPollOptions(pollOptions.filter((_, i) => i !== index));
      }
    },
    [pollOptions],
  );

  // ── CTA handler ─────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (activeMode === "ask") {
      if (!selectedTeam || !askQuestion.trim()) return;

      setWsPhase({ phase: "submitting" });

      try {
        const result = await createResult.mutateAsync({
          toolType: "ask",
          teamId: selectedTeam,
          question: askQuestion.trim(),
        });
        setWsPhase({ phase: "deliberating", resultId: result.id });
      } catch (err) {
        setWsPhase({ phase: "error", message: formatSubmitError(err) });
      }
    } else if (activeMode === "poll") {
      if (!pollQuestion.trim()) return;
      const trimmedOptions = pollOptions
        .map((o) => o.trim())
        .filter((o) => o.length > 0);
      if (trimmedOptions.length < 2) return;

      if (pollEveryone) {
        // Super-poll: no team needed
        setWsPhase({ phase: "submitting" });

        try {
          const result = await createResult.mutateAsync({
            toolType: "super_poll",
            question: pollQuestion.trim(),
            options: trimmedOptions,
          });
          setWsPhase({ phase: "deliberating", resultId: result.id });
        } catch (err) {
          setWsPhase({ phase: "error", message: formatSubmitError(err) });
        }
      } else {
        // Regular poll: team required
        if (!selectedTeam) return;

        setWsPhase({ phase: "submitting" });

        try {
          const result = await createResult.mutateAsync({
            toolType: "poll",
            teamId: selectedTeam,
            question: pollQuestion.trim(),
            options: trimmedOptions,
          });
          setWsPhase({ phase: "deliberating", resultId: result.id });
        } catch (err) {
          setWsPhase({ phase: "error", message: formatSubmitError(err) });
        }
      }
    } else if (activeMode === "review") {
      if (!selectedTeam || !selectedReviewFileId) return;

      setWsPhase({ phase: "submitting" });

      try {
        const result = await createResult.mutateAsync({
          toolType: "review",
          teamId: selectedTeam,
          reviewFileId: selectedReviewFileId,
          focusPrompt: reviewFocusPrompt.trim() || undefined,
        });
        setWsPhase({ phase: "deliberating", resultId: result.id });
      } catch (err) {
        setWsPhase({ phase: "error", message: formatSubmitError(err) });
      }
    }
  }, [selectedTeam, activeMode, askQuestion, pollQuestion, pollOptions, pollEveryone, selectedReviewFileId, reviewFocusPrompt, createResult]);

  const handleReset = useCallback(() => {
    setAskQuestion("");
    setPollQuestion("");
    setPollOptions(["", ""]);
    setWsPhase({ phase: "idle" });
  }, []);

  // ── Render deliberation view ────────────────────────────────────
  if (wsPhase.phase === "deliberating") {
    return (
      <DeliberationView resultId={wsPhase.resultId} onReset={handleReset} />
    );
  }

  const isSubmitting = wsPhase.phase === "submitting";

  // Determine the effective tool type for usage display
  const effectiveToolType = activeMode === "poll" && pollEveryone ? "super_poll" : activeMode;

  const isCTADisabled =
    isSubmitting ||
    (activeMode !== "poll" && selectedTeam === null) ||
    (activeMode === "poll" && !pollEveryone && selectedTeam === null) ||
    (activeMode === "ask" && askQuestion.trim().length === 0) ||
    (activeMode === "poll" &&
      (pollQuestion.trim().length === 0 ||
        pollOptions.filter((o) => o.trim().length > 0).length < 2)) ||
    (activeMode === "review" && !selectedReviewFileId);

  // Usage info based on effective tool type
  const currentToolUsage = usage?.tools[effectiveToolType];
  const isAtLimit = currentToolUsage
    ? currentToolUsage.used >= currentToolUsage.limit
    : false;

  // CTA label
  const ctaLabel = isSubmitting
    ? "Submitting..."
    : activeMode === "poll" && pollEveryone
      ? "Run Super Poll"
      : modeConfig[activeMode].cta;

  return (
    <section className="mx-auto max-w-3xl px-4 pb-12">
      <Card className="relative overflow-hidden">
        <CardContent className="space-y-5">
          <ModeTabBar activeMode={activeMode} onModeChange={handleModeChange} />

          <p className="text-sm text-text-secondary">
            {activeMode === "poll" && pollEveryone
              ? "Poll every theologian on the platform (~376) for a comprehensive view across all traditions and eras."
              : modeConfig[activeMode].description}
          </p>

          {/* Error banner */}
          {wsPhase.phase === "error" && (
            <div className="rounded-lg border border-terracotta/30 bg-terracotta/5 px-4 py-3">
              <p className="text-sm text-terracotta">{wsPhase.message}</p>
              <button
                className="mt-1 text-xs text-terracotta underline"
                onClick={() => setWsPhase({ phase: "idle" })}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Panel region with min-height to prevent layout jank */}
          <div
            className="min-h-[280px] transition-opacity duration-150"
            style={{ opacity: fadingOut ? 0 : 1 }}
          >
            {activeMode === "ask" && (
              <AskPanel
                question={askQuestion}
                onChange={setAskQuestion}
              />
            )}
            {activeMode === "poll" && (
              <PollPanel
                question={pollQuestion}
                options={pollOptions}
                onQuestionChange={setPollQuestion}
                onOptionChange={handleOptionChange}
                onAddOption={handleAddOption}
                onRemoveOption={handleRemoveOption}
              />
            )}
            {activeMode === "review" && (
              <ReviewPanel
                selectedFileId={selectedReviewFileId}
                focusPrompt={reviewFocusPrompt}
                onFileIdChange={setSelectedReviewFileId}
                onFocusPromptChange={setReviewFocusPrompt}
              />
            )}
          </div>

          {/* Poll Everyone toggle — only shown in poll mode */}
          {activeMode === "poll" && (
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-text-secondary/10 px-4 py-3 transition-colors hover:bg-surface">
              <input
                type="checkbox"
                checked={pollEveryone}
                onChange={(e) => setPollEveryone(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative h-5 w-9 shrink-0 rounded-full bg-text-secondary/20 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-teal peer-checked:after:translate-x-4" />
              <Globe className="h-4 w-4 text-teal" />
              <div className="flex-1">
                <span className="text-sm font-medium text-text-primary">Poll Everyone</span>
                <p className="text-xs text-text-secondary">
                  Poll all ~376 theologians instead of a single team
                </p>
              </div>
            </label>
          )}

          {/* Super-poll callout when toggled on */}
          {activeMode === "poll" && pollEveryone && (
            <div className="rounded-lg border border-teal/20 bg-teal/5 px-4 py-3">
              <p className="text-sm text-teal">
                Super-polls have a separate, lower monthly limit due to the scale of polling all theologians.
              </p>
            </div>
          )}

          {/* Team selector — hidden when poll everyone is active */}
          {!(activeMode === "poll" && pollEveryone) && (
            <>
              <TeamSelector
                value={selectedTeam}
                onChange={setSelectedTeam}
                onManageTeams={() => setManageTeamsOpen(true)}
              />

              {selectedTeamInfo && (
                <TeamMemberPreview
                  members={selectedTeamInfo.members}
                  totalCount={selectedTeamInfo.totalCount}
                />
              )}
            </>
          )}

          {/* Usage indicator */}
          {currentToolUsage && (
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>
                {currentToolUsage.used} / {currentToolUsage.limit}{" "}
                {pollEveryone && activeMode === "poll" ? "super poll" : activeMode} uses this month
              </span>
              {isAtLimit && (
                <span className="font-medium text-terracotta">Limit reached</span>
              )}
            </div>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={isCTADisabled || isAtLimit}
            onClick={handleSubmit}
          >
            {ctaLabel}
          </Button>
        </CardContent>
      </Card>

      <TeamManagementDialog
        open={manageTeamsOpen}
        onOpenChange={setManageTeamsOpen}
      />
    </section>
  );
}

function formatSubmitError(err: unknown): string {
  if (err instanceof ApiError && err.code === "USAGE_LIMIT_REACHED") {
    const { toolType, used, limit } = err.data;
    const label = String(toolType).replace("_", " ");
    return `You've reached your monthly ${label} limit (${used}/${limit}). Try again next month or contact us for more.`;
  }
  if (err instanceof Error) return err.message;
  return "Submission failed";
}
