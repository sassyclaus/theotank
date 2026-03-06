import { COLORS } from "../lib/design-tokens";

type ToolType = "ask" | "poll" | "super_poll" | "review" | "research";

const TOOL_LABELS: Record<ToolType, string> = {
  ask: "Ask",
  poll: "Poll",
  super_poll: "Super Poll",
  review: "Review",
  research: "Research",
};

function accentColor(toolType: ToolType): string {
  return toolType === "research" ? COLORS.oxblood : COLORS.teal;
}

interface ResultCompletedEmailParams {
  title: string;
  toolType: ToolType;
  previewExcerpt: string | null;
  resultUrl: string;
}

export function buildResultCompletedHtml({
  title,
  toolType,
  previewExcerpt,
  resultUrl,
}: ResultCompletedEmailParams): string {
  const accent = accentColor(toolType);
  const label = TOOL_LABELS[toolType];

  const excerptBlock = previewExcerpt
    ? `<p style="margin:16px 0 0;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;color:${COLORS.textSecondary};">${escapeHtml(previewExcerpt)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Your ${label} result is ready</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.bg};font-family:Inter,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.bg};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Wordmark -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <span style="font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:${COLORS.textPrimary};">TheoTank</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:${COLORS.surface};border-radius:12px;padding:32px;">

              <!-- Tool badge -->
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:${accent};border-radius:4px;padding:4px 10px;">
                    <span style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:600;color:${COLORS.white};text-transform:uppercase;letter-spacing:0.5px;">${label}</span>
                  </td>
                </tr>
              </table>

              <!-- Title -->
              <h1 style="margin:16px 0 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;line-height:1.3;color:${COLORS.textPrimary};">${escapeHtml(title)}</h1>

              <!-- Excerpt -->
              ${excerptBlock}

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td style="background-color:${COLORS.gold};border-radius:8px;">
                    <a href="${resultUrl}" target="_blank" style="display:inline-block;padding:12px 28px;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:600;color:${COLORS.white};text-decoration:none;">View Your Result</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:${COLORS.textSecondary};">You received this email because you submitted a ${label} on TheoTank.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
