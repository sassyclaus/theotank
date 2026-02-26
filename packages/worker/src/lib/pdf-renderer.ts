import PDFDocument from "pdfkit";
import path from "path";
import type { AskContent } from "../types/ask";
import type { PollContent } from "../types/poll";
import type { ReviewContent } from "../types/review";
import type { ResearchContent } from "../types/research";

// ── Design Tokens ──────────────────────────────────────────────────

const COLORS = {
  bg: "#F8F6F1",
  surface: "#EFECE4",
  teal: "#1B6B6D",
  tealLight: "#E6F0F0",
  oxblood: "#7A2E2E",
  oxbloodLight: "#F5EAEA",
  gold: "#B8963E",
  goldLight: "#F5F0E0",
  textPrimary: "#1A1A1A",
  textSecondary: "#6B6560",
  sage: "#5A7A62",
  terracotta: "#C4573A",
  white: "#FFFFFF",
};

const FONTS_DIR = path.join(__dirname, "../fonts");

const PAGE = {
  width: 612,
  height: 792,
  marginLeft: 60,
  marginRight: 60,
  marginTop: 60,
  marginBottom: 60,
};

const CONTENT_WIDTH = PAGE.width - PAGE.marginLeft - PAGE.marginRight;

// ── Types ───────────────────────────────────────────────────────────

type ToolType = "ask" | "poll" | "review" | "research";

interface PdfMetadata {
  title: string;
  teamName: string | null;
  theologianName: string | null;
  createdAt: Date;
  question: string | null;
}

// ── Main Entry ─────────────────────────────────────────────────────

export async function renderPdf(
  toolType: ToolType,
  content: unknown,
  metadata: PdfMetadata,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "letter",
    margins: {
      top: PAGE.marginTop,
      bottom: PAGE.marginBottom,
      left: PAGE.marginLeft,
      right: PAGE.marginRight,
    },
    bufferPages: true,
    info: {
      Title: metadata.title,
      Author: "TheoTank",
      Creator: "TheoTank PDF Generator",
    },
  });

  // Register fonts
  doc.registerFont("Playfair", path.join(FONTS_DIR, "PlayfairDisplay-Regular.ttf"));
  doc.registerFont("Playfair-Bold", path.join(FONTS_DIR, "PlayfairDisplay-Bold.ttf"));
  doc.registerFont("Inter", path.join(FONTS_DIR, "Inter-Regular.ttf"));
  doc.registerFont("Inter-Medium", path.join(FONTS_DIR, "Inter-Medium.ttf"));
  doc.registerFont("Inter-SemiBold", path.join(FONTS_DIR, "Inter-SemiBold.ttf"));

  // Collect chunks
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  // Draw common header
  drawPageHeader(doc, toolType, metadata);

  // Draw tool-specific body
  switch (toolType) {
    case "ask":
      drawAskBody(doc, content as AskContent, metadata);
      break;
    case "poll":
      drawPollBody(doc, content as PollContent, metadata);
      break;
    case "review":
      drawReviewBody(doc, content as ReviewContent, metadata);
      break;
    case "research":
      drawResearchBody(doc, content as ResearchContent, metadata);
      break;
  }

  // Add page footers to all pages
  // Temporarily remove bottom margin so writing in the footer zone
  // doesn't trigger pdfkit's auto-pagination
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    const savedBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    drawPageFooter(doc, i + 1, pageCount);
    doc.page.margins.bottom = savedBottom;
  }

  doc.end();

  return new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

// ── Page Header ────────────────────────────────────────────────────

function drawPageHeader(
  doc: PDFKit.PDFDocument,
  toolType: ToolType,
  metadata: PdfMetadata,
) {
  const accentColor = toolType === "research" ? COLORS.oxblood : COLORS.teal;

  // TheoTank wordmark
  doc.font("Playfair-Bold").fontSize(18).fillColor(COLORS.textPrimary);
  doc.text("TheoTank", PAGE.marginLeft, PAGE.marginTop);

  // Tool type badge
  const badgeLabel = toolType.charAt(0).toUpperCase() + toolType.slice(1);
  const badgeWidth = doc.widthOfString(badgeLabel) + 16;
  const badgeX = PAGE.width - PAGE.marginRight - badgeWidth;
  const badgeY = PAGE.marginTop + 2;
  doc
    .roundedRect(badgeX, badgeY, badgeWidth, 20, 10)
    .fill(accentColor);
  doc
    .font("Inter-SemiBold")
    .fontSize(9)
    .fillColor(COLORS.white)
    .text(badgeLabel, badgeX, badgeY + 5, { width: badgeWidth, align: "center" });

  // Date
  const dateStr = metadata.createdAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  doc.font("Inter").fontSize(9).fillColor(COLORS.textSecondary);
  doc.text(dateStr, PAGE.marginLeft, PAGE.marginTop + 28);

  // Divider
  doc.moveTo(PAGE.marginLeft, PAGE.marginTop + 44)
    .lineTo(PAGE.width - PAGE.marginRight, PAGE.marginTop + 44)
    .strokeColor(COLORS.surface)
    .lineWidth(1)
    .stroke();

  // Title
  doc.font("Playfair-Bold").fontSize(22).fillColor(COLORS.textPrimary);
  doc.text(metadata.title, PAGE.marginLeft, PAGE.marginTop + 56, {
    width: CONTENT_WIDTH,
  });

  // Team/theologian name
  const teamLabel = metadata.theologianName ?? metadata.teamName;
  if (teamLabel) {
    doc.font("Inter-Medium").fontSize(10).fillColor(accentColor);
    doc.text(teamLabel, PAGE.marginLeft, doc.y + 6, { width: CONTENT_WIDTH });
  }

  // Question (if different from title)
  if (metadata.question && metadata.question !== metadata.title) {
    doc.font("Inter").fontSize(10).fillColor(COLORS.textSecondary);
    doc.text(`"${metadata.question}"`, PAGE.marginLeft, doc.y + 4, {
      width: CONTENT_WIDTH,
    });
  }

  // Spacing after header
  doc.y += 20;
}

// ── Page Footer ────────────────────────────────────────────────────

function drawPageFooter(
  doc: PDFKit.PDFDocument,
  pageNum: number,
  totalPages: number,
) {
  const y = PAGE.height - 35;
  doc.font("Inter").fontSize(8).fillColor(COLORS.textSecondary);
  doc.text("Generated by TheoTank", PAGE.marginLeft, y, {
    width: CONTENT_WIDTH / 2,
    lineBreak: false,
  });
  doc.text(`${pageNum} / ${totalPages}`, PAGE.width / 2, y, {
    width: CONTENT_WIDTH / 2,
    align: "right",
    lineBreak: false,
  });
}

// ── Utilities ──────────────────────────────────────────────────────

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  const available = PAGE.height - PAGE.marginBottom - doc.y;
  if (available < needed) {
    doc.addPage();
  }
}

function drawSectionTitle(doc: PDFKit.PDFDocument, text: string) {
  ensureSpace(doc, 40);
  doc.font("Playfair-Bold").fontSize(14).fillColor(COLORS.textPrimary);
  doc.text(text, PAGE.marginLeft, doc.y, { width: CONTENT_WIDTH });
  doc.y += 8;
}

function drawDivider(doc: PDFKit.PDFDocument) {
  doc.y += 8;
  doc.moveTo(PAGE.marginLeft, doc.y)
    .lineTo(PAGE.width - PAGE.marginRight, doc.y)
    .strokeColor(COLORS.surface)
    .lineWidth(0.5)
    .stroke();
  doc.y += 12;
}

function drawTheologianHeader(
  doc: PDFKit.PDFDocument,
  name: string,
  initials: string,
  dates: string,
  tradition: string,
  color: string,
) {
  ensureSpace(doc, 60);

  // Colored initials circle
  const circleX = PAGE.marginLeft + 14;
  const circleY = doc.y + 14;
  doc.circle(circleX, circleY, 14).fill(color);
  doc.font("Inter-SemiBold").fontSize(10).fillColor(COLORS.white);
  const initialsWidth = doc.widthOfString(initials);
  doc.text(initials, circleX - initialsWidth / 2, circleY - 5, {
    lineBreak: false,
  });

  // Name + metadata
  const textX = PAGE.marginLeft + 36;
  doc.font("Inter-SemiBold").fontSize(11).fillColor(COLORS.textPrimary);
  doc.text(name, textX, doc.y + 3, { width: CONTENT_WIDTH - 36, lineBreak: false });
  doc.font("Inter").fontSize(9).fillColor(COLORS.textSecondary);
  const metaText = [dates, tradition].filter(Boolean).join(" · ");
  doc.text(metaText, textX, doc.y + 2, { width: CONTENT_WIDTH - 36 });
  doc.y += 8;
}

// ── Ask Body ───────────────────────────────────────────────────────

function drawAskBody(
  doc: PDFKit.PDFDocument,
  content: AskContent,
  _metadata: PdfMetadata,
) {
  // Synthesis comparison
  drawSectionTitle(doc, "Synthesis");
  doc.font("Inter").fontSize(10).fillColor(COLORS.textPrimary);
  doc.text(content.synthesis.comparison, PAGE.marginLeft, doc.y, {
    width: CONTENT_WIDTH,
    lineGap: 3,
  });
  doc.y += 10;

  // Key Agreements
  if (content.synthesis.keyAgreements.length > 0) {
    drawSectionTitle(doc, "Key Agreements");
    for (const item of content.synthesis.keyAgreements) {
      ensureSpace(doc, 20);
      doc.font("Inter").fontSize(10).fillColor(COLORS.textPrimary);
      doc.text(`•  ${item}`, PAGE.marginLeft + 8, doc.y, {
        width: CONTENT_WIDTH - 8,
        lineGap: 2,
      });
      doc.y += 4;
    }
    doc.y += 6;
  }

  // Key Disagreements
  if (content.synthesis.keyDisagreements.length > 0) {
    drawSectionTitle(doc, "Key Disagreements");
    for (const item of content.synthesis.keyDisagreements) {
      ensureSpace(doc, 20);
      doc.font("Inter").fontSize(10).fillColor(COLORS.textPrimary);
      doc.text(`•  ${item}`, PAGE.marginLeft + 8, doc.y, {
        width: CONTENT_WIDTH - 8,
        lineGap: 2,
      });
      doc.y += 4;
    }
    doc.y += 6;
  }

  // Per-theologian perspectives
  drawSectionTitle(doc, "Individual Perspectives");
  drawDivider(doc);

  for (const entry of content.perspectives) {
    const t = entry.theologian;
    drawTheologianHeader(doc, t.name, t.initials, t.dates, t.tradition, t.color);

    doc.font("Inter").fontSize(10).fillColor(COLORS.textPrimary);
    doc.text(entry.perspective, PAGE.marginLeft, doc.y, {
      width: CONTENT_WIDTH,
      lineGap: 3,
    });
    doc.y += 6;

    if (entry.keyThemes.length > 0) {
      doc.font("Inter-Medium").fontSize(9).fillColor(COLORS.textSecondary);
      doc.text(`Key themes: ${entry.keyThemes.join(", ")}`, PAGE.marginLeft, doc.y, {
        width: CONTENT_WIDTH,
      });
      doc.y += 4;
    }

    drawDivider(doc);
  }
}

// ── Poll Body ──────────────────────────────────────────────────────

function drawPollBody(
  doc: PDFKit.PDFDocument,
  content: PollContent,
  _metadata: PdfMetadata,
) {
  // Summary
  drawSectionTitle(doc, "Summary");
  doc.font("Inter").fontSize(10).fillColor(COLORS.textPrimary);
  doc.text(content.summary, PAGE.marginLeft, doc.y, {
    width: CONTENT_WIDTH,
    lineGap: 3,
  });
  doc.y += 16;

  // Bar chart
  drawSectionTitle(doc, "Results");
  const totalVotes = content.theologianSelections.length;
  const barColors = [COLORS.teal, COLORS.gold, COLORS.sage, COLORS.oxblood, COLORS.terracotta];

  // Count votes per option
  const voteCounts: Record<string, number> = {};
  for (const label of content.optionLabels) voteCounts[label] = 0;
  for (const sel of content.theologianSelections) {
    voteCounts[sel.selection] = (voteCounts[sel.selection] ?? 0) + 1;
  }

  const barHeight = 24;
  const barGap = 10;
  const labelWidth = 120;
  const barAreaWidth = CONTENT_WIDTH - labelWidth - 50;

  ensureSpace(doc, (barHeight + barGap) * content.optionLabels.length + 20);

  for (let i = 0; i < content.optionLabels.length; i++) {
    const label = content.optionLabels[i];
    const count = voteCounts[label];
    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    const barWidth = Math.max(2, (pct / 100) * barAreaWidth);
    const color = barColors[i % barColors.length];
    const y = doc.y;

    // Label
    doc.font("Inter-Medium").fontSize(10).fillColor(COLORS.textPrimary);
    doc.text(label, PAGE.marginLeft, y + 6, { width: labelWidth, lineBreak: false });

    // Bar
    doc.roundedRect(PAGE.marginLeft + labelWidth, y + 2, barWidth, barHeight - 4, 3)
      .fill(color);

    // Percentage
    doc.font("Inter-SemiBold").fontSize(10).fillColor(COLORS.textPrimary);
    doc.text(
      `${pct}%`,
      PAGE.marginLeft + labelWidth + barWidth + 8,
      y + 6,
      { width: 40, lineBreak: false },
    );

    doc.y = y + barHeight + barGap;
  }

  doc.y += 10;

  // Per-theologian selections
  drawSectionTitle(doc, "Individual Selections");
  drawDivider(doc);

  for (const sel of content.theologianSelections) {
    const t = sel.theologian;
    drawTheologianHeader(
      doc,
      t.name,
      t.initials,
      t.dates,
      t.tradition,
      t.color,
    );

    doc.font("Inter-SemiBold").fontSize(10).fillColor(COLORS.teal);
    doc.text(`Selected: ${sel.selection}`, PAGE.marginLeft, doc.y, {
      width: CONTENT_WIDTH,
    });
    doc.y += 4;

    doc.font("Inter").fontSize(10).fillColor(COLORS.textPrimary);
    doc.text(sel.justification, PAGE.marginLeft, doc.y, {
      width: CONTENT_WIDTH,
      lineGap: 3,
    });

    drawDivider(doc);
  }
}

// ── Review Body ────────────────────────────────────────────────────

function drawReviewBody(
  doc: PDFKit.PDFDocument,
  content: ReviewContent,
  _metadata: PdfMetadata,
) {
  // Overall grade hero
  ensureSpace(doc, 100);
  const gradeBoxWidth = 80;
  const gradeBoxHeight = 80;
  const gradeX = PAGE.marginLeft + (CONTENT_WIDTH - gradeBoxWidth) / 2;
  const gradeY = doc.y;

  doc.roundedRect(gradeX, gradeY, gradeBoxWidth, gradeBoxHeight, 8)
    .fill(COLORS.tealLight);
  doc.font("Playfair-Bold").fontSize(36).fillColor(COLORS.teal);
  const gradeTextWidth = doc.widthOfString(content.overallGrade);
  doc.text(
    content.overallGrade,
    gradeX + (gradeBoxWidth - gradeTextWidth) / 2,
    gradeY + 18,
    { lineBreak: false },
  );

  doc.y = gradeY + gradeBoxHeight + 12;

  // Summary
  drawSectionTitle(doc, "Summary");
  doc.font("Inter").fontSize(10).fillColor(COLORS.textPrimary);
  doc.text(content.summary, PAGE.marginLeft, doc.y, {
    width: CONTENT_WIDTH,
    lineGap: 3,
  });
  doc.y += 12;

  // Per-theologian grades
  drawSectionTitle(doc, "Individual Assessments");
  drawDivider(doc);

  for (const grade of content.grades) {
    const t = grade.theologian;
    drawTheologianHeader(doc, t.name, t.initials, t.dates, t.tradition, t.color);

    // Grade badge
    doc.font("Inter-SemiBold").fontSize(11).fillColor(COLORS.teal);
    doc.text(`Grade: ${grade.grade}`, PAGE.marginLeft, doc.y, {
      width: CONTENT_WIDTH,
    });
    doc.y += 4;

    // Assessment
    doc.font("Inter").fontSize(10).fillColor(COLORS.textPrimary);
    doc.text(grade.reaction, PAGE.marginLeft, doc.y, {
      width: CONTENT_WIDTH,
      lineGap: 3,
    });
    doc.y += 6;

    // Strengths
    if (grade.strengths.length > 0) {
      ensureSpace(doc, 20);
      doc.font("Inter-SemiBold").fontSize(9).fillColor(COLORS.sage);
      doc.text("Strengths:", PAGE.marginLeft, doc.y, { width: CONTENT_WIDTH });
      doc.y += 2;
      for (const s of grade.strengths) {
        ensureSpace(doc, 16);
        doc.font("Inter").fontSize(9).fillColor(COLORS.textPrimary);
        doc.text(`✓  ${s}`, PAGE.marginLeft + 8, doc.y, {
          width: CONTENT_WIDTH - 8,
        });
        doc.y += 2;
      }
      doc.y += 4;
    }

    // Weaknesses
    if (grade.weaknesses.length > 0) {
      ensureSpace(doc, 20);
      doc.font("Inter-SemiBold").fontSize(9).fillColor(COLORS.terracotta);
      doc.text("Weaknesses:", PAGE.marginLeft, doc.y, { width: CONTENT_WIDTH });
      doc.y += 2;
      for (const w of grade.weaknesses) {
        ensureSpace(doc, 16);
        doc.font("Inter").fontSize(9).fillColor(COLORS.textPrimary);
        doc.text(`⚠  ${w}`, PAGE.marginLeft + 8, doc.y, {
          width: CONTENT_WIDTH - 8,
        });
        doc.y += 2;
      }
      doc.y += 4;
    }

    drawDivider(doc);
  }
}

// ── Research Body ──────────────────────────────────────────────────

function drawResearchBody(
  doc: PDFKit.PDFDocument,
  content: ResearchContent,
  _metadata: PdfMetadata,
) {
  // Response text
  drawSectionTitle(doc, "Response");

  // Split response text and render, preserving citation markers
  const paragraphs = content.responseText.split("\n\n").filter(Boolean);
  for (const para of paragraphs) {
    ensureSpace(doc, 30);
    doc.font("Inter").fontSize(10).fillColor(COLORS.textPrimary);
    doc.text(para.trim(), PAGE.marginLeft, doc.y, {
      width: CONTENT_WIDTH,
      lineGap: 3,
    });
    doc.y += 8;
  }

  doc.y += 8;

  // Citation apparatus
  if (content.citations.length > 0) {
    drawSectionTitle(doc, "Citation Apparatus");
    drawDivider(doc);

    for (const citation of content.citations) {
      ensureSpace(doc, 60);

      // Marker + claim
      doc.font("Inter-SemiBold").fontSize(10).fillColor(COLORS.oxblood);
      doc.text(`[${citation.marker}]`, PAGE.marginLeft, doc.y, {
        width: 30,
        lineBreak: false,
      });

      doc.font("Inter").fontSize(9).fillColor(COLORS.textPrimary);
      doc.text(citation.claimText, PAGE.marginLeft + 30, doc.y, {
        width: CONTENT_WIDTH - 30,
        lineGap: 2,
      });
      doc.y += 4;

      // Sources
      for (const source of citation.sources) {
        ensureSpace(doc, 40);
        doc.font("Inter-Medium").fontSize(9).fillColor(COLORS.textSecondary);
        doc.text(
          `${source.workTitle} — ${source.canonicalRef}`,
          PAGE.marginLeft + 30,
          doc.y,
          { width: CONTENT_WIDTH - 30 },
        );
        doc.y += 2;

        if (source.originalText) {
          doc.font("Inter").fontSize(8).fillColor(COLORS.textSecondary);
          doc.text(source.originalText, PAGE.marginLeft + 38, doc.y, {
            width: CONTENT_WIDTH - 38,
            lineGap: 2,
          });
          doc.y += 2;
        }

        if (source.translation) {
          doc.font("Inter").fontSize(8).fillColor(COLORS.textPrimary);
          doc.text(`"${source.translation}"`, PAGE.marginLeft + 38, doc.y, {
            width: CONTENT_WIDTH - 38,
            lineGap: 2,
          });
          doc.y += 4;
        }
      }

      drawDivider(doc);
    }
  }

  // Metadata footer
  ensureSpace(doc, 40);
  doc.font("Inter").fontSize(8).fillColor(COLORS.textSecondary);
  doc.text(
    `Angles processed: ${content.metadata.anglesProcessed} · Claims: ${content.metadata.totalClaims} · Evidence items: ${content.metadata.evidenceItemsUsed}`,
    PAGE.marginLeft,
    doc.y,
    { width: CONTENT_WIDTH },
  );
}
