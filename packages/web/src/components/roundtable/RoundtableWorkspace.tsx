import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { modeConfig, type RoundtableMode } from "@/data/mock-roundtable";
import { ModeTabBar } from "./ModeTabBar";
import { AskPanel } from "./AskPanel";
import { PollPanel } from "./PollPanel";
import { ReviewPanel } from "./ReviewPanel";
import { TeamSelector } from "./TeamSelector";
import { DeliberationOverlay } from "./DeliberationOverlay";

export function RoundtableWorkspace() {
  // ── Mode state ───────────────────────────────────────────────────
  const [activeMode, setActiveMode] = useState<RoundtableMode>("ask");
  const [fadingOut, setFadingOut] = useState(false);
  const pendingMode = useRef<RoundtableMode | null>(null);

  // ── Shared state ─────────────────────────────────────────────────
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [isDeliberating, setIsDeliberating] = useState(false);

  // ── Ask state ────────────────────────────────────────────────────
  const [askQuestion, setAskQuestion] = useState("");
  const [showNudge, setShowNudge] = useState(false);
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Poll state ───────────────────────────────────────────────────
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // ── Review state ─────────────────────────────────────────────────
  const [reviewFileName, setReviewFileName] = useState<string | null>(null);
  const [reviewFocusPrompt, setReviewFocusPrompt] = useState("");

  // ── Ask nudge debounce ───────────────────────────────────────────
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

  // ── Tab transition ───────────────────────────────────────────────
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

  // ── Poll helpers ─────────────────────────────────────────────────
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

  // ── CTA handler ──────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    setIsDeliberating(true);
    setTimeout(() => setIsDeliberating(false), 3000);
  }, []);

  const isCTADisabled =
    isDeliberating ||
    (activeMode === "ask" && askQuestion.trim().length === 0) ||
    (activeMode === "poll" && pollQuestion.trim().length === 0) ||
    (activeMode === "review" && !reviewFileName);

  return (
    <section className="mx-auto max-w-3xl px-4 pb-12">
      <Card className="relative overflow-hidden">
        {isDeliberating && <DeliberationOverlay />}
        <CardContent className="space-y-5">
          <ModeTabBar activeMode={activeMode} onModeChange={handleModeChange} />

          <p className="text-sm text-text-secondary">
            {modeConfig[activeMode].description}
          </p>

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

          <TeamSelector value={selectedTeam} onChange={setSelectedTeam} />

          <Button
            size="lg"
            className="w-full"
            disabled={isCTADisabled}
            onClick={handleSubmit}
          >
            {modeConfig[activeMode].cta}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
