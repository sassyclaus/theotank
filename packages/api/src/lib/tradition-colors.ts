export const TRADITION_COLORS: Record<string, string> = {
  Reformed: "#5A7A62",
  Catholic: "#1B6B6D",
  Orthodox: "#6B6560",
  Lutheran: "#B8963E",
  Anglican: "#2E5D7A",
  Methodist: "#1B6B6D",
  Baptist: "#5A7A62",
  Puritan: "#4A4540",
  "Neo-Orthodox": "#6B6560",
};

const DEFAULT_COLOR = "#B8963E";

export function colorForTradition(tradition: string | null): string {
  if (!tradition) return DEFAULT_COLOR;
  return TRADITION_COLORS[tradition] ?? DEFAULT_COLOR;
}
