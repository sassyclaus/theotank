import satori from "satori";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { COLORS } from "./design-tokens";
import type { AskContent } from "../types/ask";
import type { PollContent } from "../types/poll";
import type { ReviewContent } from "../types/review";

// ── Types ───────────────────────────────────────────────────────────

export interface ShareImageMetadata {
  title: string;
  teamName: string | null;
  theologianCount: number;
}

type ToolType = "ask" | "poll" | "super_poll" | "review";

// ── Fonts (lazy-loaded) ─────────────────────────────────────────────

const FONTS_DIR = path.join(__dirname, "../fonts");

let _fonts: Awaited<ReturnType<typeof loadFonts>> | null = null;

async function loadFonts() {
  return [
    {
      name: "Playfair Display",
      data: fs.readFileSync(path.join(FONTS_DIR, "PlayfairDisplay-Regular.ttf")),
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Playfair Display",
      data: fs.readFileSync(path.join(FONTS_DIR, "PlayfairDisplay-Bold.ttf")),
      weight: 700 as const,
      style: "normal" as const,
    },
    {
      name: "Inter",
      data: fs.readFileSync(path.join(FONTS_DIR, "Inter-Regular.ttf")),
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Inter",
      data: fs.readFileSync(path.join(FONTS_DIR, "Inter-Medium.ttf")),
      weight: 500 as const,
      style: "normal" as const,
    },
    {
      name: "Inter",
      data: fs.readFileSync(path.join(FONTS_DIR, "Inter-SemiBold.ttf")),
      weight: 600 as const,
      style: "normal" as const,
    },
  ];
}

async function getFonts() {
  if (!_fonts) {
    _fonts = await loadFonts();
  }
  return _fonts;
}

// ── Helpers ─────────────────────────────────────────────────────────

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 1) + "\u2026";
}

function toolLabel(toolType: ToolType): string {
  return toolType.charAt(0).toUpperCase() + toolType.slice(1);
}

function toolColor(toolType: ToolType): string {
  return toolType === "ask" ? COLORS.teal : COLORS.oxblood;
}

// ── Shared Frame ────────────────────────────────────────────────────

function wrapInFrame(toolType: ToolType, children: any): any {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.bg,
        padding: "40px",
        fontFamily: "Inter",
      },
      children: [
        // Top row: spacer + badge
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "flex-end",
              width: "100%",
            },
            children: {
              type: "div",
              props: {
                style: {
                  backgroundColor: toolColor(toolType),
                  color: COLORS.white,
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: "4px 14px",
                  borderRadius: "12px",
                },
                children: toolLabel(toolType),
              },
            },
          },
        },
        // Main content area (flex-grow)
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
              justifyContent: "center",
            },
            children,
          },
        },
        // Bottom row: wordmark
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "flex-end",
            },
            children: {
              type: "div",
              props: {
                style: {
                  fontFamily: "Playfair Display",
                  fontWeight: 700,
                  fontSize: "22px",
                  color: COLORS.textPrimary,
                },
                children: "TheoTank",
              },
            },
          },
        },
      ],
    },
  };
}

// ── Ask Template ────────────────────────────────────────────────────

function buildAskCard(content: AskContent, metadata: ShareImageMetadata): any {
  const question = truncate(content.question, 120);
  const perspectiveCircles = content.perspectives.slice(0, 8).map((p) => ({
    type: "div",
    props: {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "48px",
        height: "48px",
        borderRadius: "24px",
        backgroundColor: p.theologian.color,
        color: COLORS.white,
        fontSize: "16px",
        fontWeight: 600,
        marginRight: "8px",
      },
      children: p.theologian.initials,
    },
  }));

  return [
    // Question
    {
      type: "div",
      props: {
        style: {
          fontFamily: "Playfair Display",
          fontWeight: 700,
          fontSize: "36px",
          color: COLORS.textPrimary,
          lineHeight: 1.2,
          marginBottom: "24px",
        },
        children: question,
      },
    },
    // Team name
    metadata.teamName
      ? {
          type: "div",
          props: {
            style: {
              fontSize: "16px",
              fontWeight: 500,
              color: COLORS.teal,
              marginBottom: "20px",
            },
            children: metadata.teamName,
          },
        }
      : null,
    // Theologian initials row
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexWrap: "wrap" as const,
        },
        children: [
          ...perspectiveCircles,
          content.perspectives.length > 8
            ? {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "48px",
                    height: "48px",
                    borderRadius: "24px",
                    backgroundColor: COLORS.surface,
                    color: COLORS.textSecondary,
                    fontSize: "14px",
                    fontWeight: 600,
                  },
                  children: `+${content.perspectives.length - 8}`,
                },
              }
            : null,
        ].filter(Boolean),
      },
    },
  ].filter(Boolean);
}

// ── Poll Template ───────────────────────────────────────────────────

function buildPollCard(content: PollContent, metadata: ShareImageMetadata): any {
  const question = truncate(content.question, 100);
  const totalVotes = content.theologianSelections.length;

  // Count votes per option
  const voteCounts: Record<string, number> = {};
  for (const label of content.optionLabels) voteCounts[label] = 0;
  for (const sel of content.theologianSelections) {
    voteCounts[sel.selection] = (voteCounts[sel.selection] ?? 0) + 1;
  }

  const barColors = [COLORS.teal, COLORS.gold, COLORS.sage, COLORS.oxblood, COLORS.terracotta];

  const bars = content.optionLabels.slice(0, 5).map((label, i) => {
    const count = voteCounts[label] ?? 0;
    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    const barWidthPct = Math.max(3, pct);

    return {
      type: "div",
      props: {
        style: {
          display: "flex",
          alignItems: "center",
          marginBottom: "10px",
          width: "100%",
        },
        children: [
          // Label
          {
            type: "div",
            props: {
              style: {
                width: "200px",
                fontSize: "15px",
                fontWeight: 500,
                color: COLORS.textPrimary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap" as const,
                marginRight: "12px",
                flexShrink: 0,
              },
              children: truncate(label, 28),
            },
          },
          // Bar
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexGrow: 1,
                height: "28px",
                backgroundColor: COLORS.surface,
                borderRadius: "4px",
                overflow: "hidden",
              },
              children: {
                type: "div",
                props: {
                  style: {
                    width: `${barWidthPct}%`,
                    height: "100%",
                    backgroundColor: barColors[i % barColors.length],
                    borderRadius: "4px",
                  },
                  children: null,
                },
              },
            },
          },
          // Percentage
          {
            type: "div",
            props: {
              style: {
                width: "55px",
                textAlign: "right" as const,
                fontSize: "15px",
                fontWeight: 600,
                color: COLORS.textPrimary,
                flexShrink: 0,
                marginLeft: "8px",
              },
              children: `${pct}%`,
            },
          },
        ],
      },
    };
  });

  return [
    // Question
    {
      type: "div",
      props: {
        style: {
          fontFamily: "Playfair Display",
          fontWeight: 700,
          fontSize: "28px",
          color: COLORS.textPrimary,
          lineHeight: 1.2,
          marginBottom: "24px",
        },
        children: question,
      },
    },
    // Bars
    ...bars,
    // Vote count
    {
      type: "div",
      props: {
        style: {
          fontSize: "13px",
          color: COLORS.textSecondary,
          marginTop: "8px",
        },
        children: `${totalVotes} theologian${totalVotes !== 1 ? "s" : ""} polled`,
      },
    },
  ];
}

// ── Review Template ─────────────────────────────────────────────────

function buildReviewCard(content: ReviewContent, metadata: ShareImageMetadata): any {
  const fileLabel = truncate(content.reviewFileLabel, 60);

  return [
    // File label
    {
      type: "div",
      props: {
        style: {
          fontSize: "16px",
          fontWeight: 500,
          color: COLORS.textSecondary,
          marginBottom: "16px",
        },
        children: fileLabel,
      },
    },
    // Giant grade
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "200px",
          height: "200px",
          borderRadius: "20px",
          backgroundColor: COLORS.tealLight,
          alignSelf: "center",
          marginBottom: "20px",
        },
        children: {
          type: "div",
          props: {
            style: {
              fontFamily: "Playfair Display",
              fontWeight: 700,
              fontSize: "120px",
              color: COLORS.teal,
              lineHeight: 1,
            },
            children: content.overallGrade,
          },
        },
      },
    },
    // Graders count
    {
      type: "div",
      props: {
        style: {
          fontSize: "14px",
          color: COLORS.textSecondary,
          textAlign: "center" as const,
        },
        children: `Reviewed by ${content.grades.length} theologian${content.grades.length !== 1 ? "s" : ""}`,
      },
    },
  ];
}

// ── Main Entry ──────────────────────────────────────────────────────

export async function renderShareImage(
  toolType: ToolType,
  content: unknown,
  metadata: ShareImageMetadata,
): Promise<Buffer> {
  let children: any;

  switch (toolType) {
    case "ask":
      children = buildAskCard(content as AskContent, metadata);
      break;
    case "poll":
    case "super_poll":
      children = buildPollCard(content as PollContent, metadata);
      break;
    case "review":
      children = buildReviewCard(content as ReviewContent, metadata);
      break;
  }

  const tree = wrapInFrame(toolType, children);
  const fonts = await getFonts();

  const svg = await satori(tree, {
    width: 1200,
    height: 630,
    fonts,
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return png;
}
