import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { modeConfig, type RoundtableMode } from "@/data/mock-roundtable";
import { useNativeTeams, useMyTeams } from "@/hooks/useTeams";
import { useCreateResult } from "@/hooks/useResults";
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

  // ── Team data ───────────────────────────────────────────────────
  const { data: nativeTeams } = useNativeTeams();
  const { data: myTeams } = useMyTeams();

  // ── Result mutation ─────────────────────────────────────────────
  const createResult = useCreateResult();

  // Set default to first native team once loaded
  useEffect(() => {
    if (selectedTeam === null && nativeTeams && nativeTeams.length > 0) {
      setSelectedTeam(nativeTeams[0].id);
    }
  }, [selectedTeam, nativeTeams]);

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
  const [showNudge, setShowNudge] = useState(false);
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Poll state ──────────────────────────────────────────────────
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // ── Review state ────────────────────────────────────────────────
  const [reviewFileName, setReviewFileName] = useState<string | null>(null);
  const [reviewFocusPrompt, setReviewFocusPrompt] = useState("");

  // ── Ask nudge debounce ──────────────────────────────────────────
  useEffect(() => {
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    if (askQuestion.length > 30) {
      nudgeTimer.current = setTimeout(() => setShowNudge(true), 800);
    } else {
      setShowNudge(false);
    }
    return () => {
      if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    };
  }, [askQuestion]);

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
    if (!selectedTeam || activeMode !== "ask" || !askQuestion.trim()) return;

    setWsPhase({ phase: "submitting" });

    try {
      const result = await createResult.mutateAsync({
        toolType: "ask",
        teamId: selectedTeam,
        question: askQuestion.trim(),
      });
      setWsPhase({ phase: "deliberating", resultId: result.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed";
      setWsPhase({ phase: "error", message });
    }
  }, [selectedTeam, activeMode, askQuestion, createResult]);

  const handleReset = useCallback(() => {
    setAskQuestion("");
    setShowNudge(false);
    setWsPhase({ phase: "idle" });
  }, []);

  // ── Render deliberation view ────────────────────────────────────
  if (wsPhase.phase === "deliberating") {
    return (
      <DeliberationView resultId={wsPhase.resultId} onReset={handleReset} />
    );
  }

  const isSubmitting = wsPhase.phase === "submitting";

  const isCTADisabled =
    isSubmitting ||
    selectedTeam === null ||
    (activeMode === "ask" && askQuestion.trim().length === 0) ||
    (activeMode === "poll" && pollQuestion.trim().length === 0) ||
    (activeMode === "review" && !reviewFileName);

  return (
    <section className="mx-auto max-w-3xl px-4 pb-12">
      <Card className="relative overflow-hidden">
        <CardContent className="space-y-5">
          <ModeTabBar activeMode={activeMode} onModeChange={handleModeChange} />

          <p className="text-sm text-text-secondary">
            {modeConfig[activeMode].description}
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
                showNudge={showNudge}
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
                fileName={reviewFileName}
                focusPrompt={reviewFocusPrompt}
                onFileChange={setReviewFileName}
                onFocusPromptChange={setReviewFocusPrompt}
              />
            )}
          </div>

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

          <Button
            size="lg"
            className="w-full"
            disabled={isCTADisabled}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Submitting..." : modeConfig[activeMode].cta}
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
