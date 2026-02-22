// ── Types ────────────────────────────────────────────────────────────

export type LibraryToolType = "ask" | "poll" | "review" | "research";
export type LibraryItemStatus = "complete" | "processing" | "failed";
export type LibraryTab = "my-library" | "explore";
export type ExploreSortOption = "recent" | "most-viewed" | "most-saved";

export interface PollBar {
  label: string;
  percentage: number;
}

export type LibraryPreview =
  | { type: "ask"; conclusion: string }
  | { type: "poll"; bars: PollBar[] }
  | { type: "review"; grade: string }
  | { type: "research"; citedSourcesCount: number };

export interface MyLibraryItem {
  id: string;
  title: string;
  tool: LibraryToolType;
  team: string;
  date: string;
  status: LibraryItemStatus;
  preview: LibraryPreview;
}

export interface CuratedCollection {
  id: string;
  title: string;
  description: string;
  resultCount: number;
  coverColor: string;
}

export interface PublicResultItem {
  id: string;
  title: string;
  tool: Exclude<LibraryToolType, "research">;
  team: string;
  date: string;
  previewExcerpt: string;
  viewCount: number;
  saveCount: number;
  isSaved: boolean;
}

export interface TrendingLibraryItem {
  id: string;
  title: string;
  tool: Exclude<LibraryToolType, "research">;
  team: string;
  viewCount: number;
}

export interface LibraryFilterOption {
  id: string;
  label: string;
}

// ── Config Maps ─────────────────────────────────────────────────────

import { MessageCircle, BarChart3, FileCheck, BookOpen, type LucideIcon } from "lucide-react";

export const TOOL_ICONS: Record<LibraryToolType, LucideIcon> = {
  ask: MessageCircle,
  poll: BarChart3,
  review: FileCheck,
  research: BookOpen,
};

export const TOOL_LABELS: Record<LibraryToolType, string> = {
  ask: "Ask",
  poll: "Poll",
  review: "Review",
  research: "Research",
};

export const TOOL_COLORS: Record<LibraryToolType, { bg: string; text: string }> = {
  ask: { bg: "bg-teal/10", text: "text-teal" },
  poll: { bg: "bg-teal/10", text: "text-teal" },
  review: { bg: "bg-teal/10", text: "text-teal" },
  research: { bg: "bg-oxblood/10", text: "text-oxblood" },
};

// ── Filters ─────────────────────────────────────────────────────────

export const toolTypeFilters: LibraryFilterOption[] = [
  { id: "all", label: "All" },
  { id: "ask", label: "Ask" },
  { id: "poll", label: "Poll" },
  { id: "review", label: "Review" },
  { id: "research", label: "Research" },
];

export const teamFilters: LibraryFilterOption[] = [
  { id: "all", label: "All Teams" },
  { id: "church-fathers", label: "Church Fathers" },
  { id: "reformers", label: "Reformers" },
  { id: "modern-theologians", label: "Modern Theologians" },
  { id: "catholic-doctors", label: "Catholic Doctors" },
  { id: "all-theologians", label: "All Theologians" },
];

// ── My Library Items ────────────────────────────────────────────────

export const myLibraryItems: MyLibraryItem[] = [
  {
    id: "ml-1",
    title: "How did the early church understand justification?",
    tool: "ask",
    team: "Church Fathers",
    date: "Feb 20, 2026",
    status: "complete",
    preview: {
      type: "ask",
      conclusion:
        "The panel identified three distinct strands of justification theology in the ante-Nicene period, noting that Irenaeus emphasized recapitulation while Augustine later shifted toward imputed righteousness.",
    },
  },
  {
    id: "ml-2",
    title: "Is penal substitutionary atonement the best framework for understanding the cross?",
    tool: "ask",
    team: "All Theologians",
    date: "Feb 18, 2026",
    status: "complete",
    preview: {
      type: "ask",
      conclusion:
        "The panel was divided: Reformed voices strongly affirmed PSA as central, while Orthodox and Catholic panelists preferred Christus Victor and satisfaction models respectively.",
    },
  },
  {
    id: "ml-3",
    title: "What role does natural theology play in modern apologetics?",
    tool: "ask",
    team: "Modern Theologians",
    date: "Feb 17, 2026",
    status: "processing",
    preview: { type: "ask", conclusion: "" },
  },
  {
    id: "ml-4",
    title: "Can a coherent doctrine of the Trinity be articulated without the filioque clause?",
    tool: "ask",
    team: "Church Fathers",
    date: "Feb 14, 2026",
    status: "complete",
    preview: {
      type: "ask",
      conclusion:
        "Eastern panelists argued persuasively that the monarchy of the Father provides sufficient trinitarian structure, while Western voices maintained that filioque guards against subordinationism.",
    },
  },
  {
    id: "ml-5",
    title: "Should women be ordained to pastoral ministry?",
    tool: "poll",
    team: "All Theologians",
    date: "Feb 15, 2026",
    status: "complete",
    preview: {
      type: "poll",
      bars: [
        { label: "In favor", percentage: 44 },
        { label: "Opposed", percentage: 39 },
        { label: "Nuanced", percentage: 17 },
      ],
    },
  },
  {
    id: "ml-6",
    title: "Is infant baptism scripturally warranted?",
    tool: "poll",
    team: "Reformers",
    date: "Feb 10, 2026",
    status: "complete",
    preview: {
      type: "poll",
      bars: [
        { label: "Yes", percentage: 62 },
        { label: "No", percentage: 25 },
        { label: "Unclear", percentage: 13 },
      ],
    },
  },
  {
    id: "ml-7",
    title: "Review of 'Mere Christianity' Chapter 3 argument",
    tool: "review",
    team: "Reformers",
    date: "Feb 12, 2026",
    status: "complete",
    preview: { type: "review", grade: "B+" },
  },
  {
    id: "ml-8",
    title: "Review of student paper on Barth's doctrine of election",
    tool: "review",
    team: "Modern Theologians",
    date: "Feb 8, 2026",
    status: "failed",
    preview: { type: "review", grade: "" },
  },
  {
    id: "ml-9",
    title: "What does Aquinas say about the natural law and eternal law?",
    tool: "research",
    team: "Thomas Aquinas",
    date: "Feb 19, 2026",
    status: "complete",
    preview: { type: "research", citedSourcesCount: 5 },
  },
  {
    id: "ml-10",
    title: "How does Aquinas distinguish the analogy of proportionality from attribution?",
    tool: "research",
    team: "Thomas Aquinas",
    date: "Feb 16, 2026",
    status: "complete",
    preview: { type: "research", citedSourcesCount: 3 },
  },
];

// ── Curated Collections ─────────────────────────────────────────────

export const curatedCollections: CuratedCollection[] = [
  {
    id: "cc-1",
    title: "The Atonement Debate",
    description:
      "Penal substitution, Christus Victor, moral influence, and satisfaction — the major theories explored across traditions.",
    resultCount: 42,
    coverColor: "border-t-teal",
  },
  {
    id: "cc-2",
    title: "Baptism Through the Ages",
    description:
      "From the Didache to the Baptist confessions — how the church has understood the waters of initiation.",
    resultCount: 31,
    coverColor: "border-t-gold",
  },
  {
    id: "cc-3",
    title: "Reformation's Unfinished Arguments",
    description:
      "Justification, sola scriptura, and ecclesiology — the debates that still divide and define Protestantism.",
    resultCount: 57,
    coverColor: "border-t-oxblood",
  },
];

// ── Public Results (Explore) ────────────────────────────────────────

export const publicResults: PublicResultItem[] = [
  {
    id: "pr-1",
    title: "What is the relationship between divine sovereignty and human free will?",
    tool: "ask",
    team: "All Theologians",
    date: "Feb 21, 2026",
    previewExcerpt:
      "The panel explored four major positions: Calvinist compatibilism, Arminian libertarianism, Molinist middle knowledge, and open theism. Augustine and Aquinas grounded sovereignty in...",
    viewCount: 1240,
    saveCount: 89,
    isSaved: false,
  },
  {
    id: "pr-2",
    title: "Should the church embrace a post-millennial eschatology?",
    tool: "poll",
    team: "Reformers",
    date: "Feb 20, 2026",
    previewExcerpt:
      "Results split along predictable lines: Puritan voices favored post-millennialism, while dispensationalist-leaning panelists held firm to premillennialism...",
    viewCount: 870,
    saveCount: 42,
    isSaved: false,
  },
  {
    id: "pr-3",
    title: "Is the prosperity gospel a heresy or a distortion?",
    tool: "ask",
    team: "Modern Theologians",
    date: "Feb 19, 2026",
    previewExcerpt:
      "The panel reached near-unanimous consensus that prosperity theology distorts the biblical witness, though they disagreed on whether 'heresy' was the appropriate theological category...",
    viewCount: 2100,
    saveCount: 156,
    isSaved: true,
  },
  {
    id: "pr-4",
    title: "Review of 'The Cost of Discipleship' opening argument",
    tool: "review",
    team: "Modern Theologians",
    date: "Feb 18, 2026",
    previewExcerpt:
      "Bonhoeffer's distinction between cheap and costly grace received high marks for rhetorical force. Barth praised the christological grounding while Tillich questioned the...",
    viewCount: 560,
    saveCount: 34,
    isSaved: false,
  },
  {
    id: "pr-5",
    title: "How should Christians think about the ethics of AI?",
    tool: "ask",
    team: "All Theologians",
    date: "Feb 17, 2026",
    previewExcerpt:
      "The panel drew on imago Dei theology, natural law, and the doctrine of vocation to frame the ethical landscape. Aquinas's framework of proportionate means proved surprisingly relevant...",
    viewCount: 3400,
    saveCount: 210,
    isSaved: false,
  },
  {
    id: "pr-6",
    title: "Is liturgical worship more biblical than contemporary worship?",
    tool: "poll",
    team: "All Theologians",
    date: "Feb 16, 2026",
    previewExcerpt:
      "A slight majority favored liturgical forms as more connected to the early church, though several panelists argued that the regulative principle supports simplicity over elaborate ritual...",
    viewCount: 980,
    saveCount: 67,
    isSaved: false,
  },
  {
    id: "pr-7",
    title: "What does the church owe to the poor?",
    tool: "ask",
    team: "Catholic Doctors",
    date: "Feb 15, 2026",
    previewExcerpt:
      "Catholic social teaching figured prominently, with Aquinas's doctrine of superfluous goods and the preferential option for the poor framing the discussion. Liberation theology voices...",
    viewCount: 740,
    saveCount: 51,
    isSaved: false,
  },
  {
    id: "pr-8",
    title: "Review of local church's statement of faith",
    tool: "review",
    team: "Reformers",
    date: "Feb 14, 2026",
    previewExcerpt:
      "The panel gave the document a B overall, noting strong Christological foundations but flagging an underdeveloped pneumatology and vague language on sacraments...",
    viewCount: 320,
    saveCount: 18,
    isSaved: false,
  },
];

// ── Trending ────────────────────────────────────────────────────────

export const trendingLibraryItems: TrendingLibraryItem[] = [
  {
    id: "tl-1",
    title: "How should Christians think about the ethics of AI?",
    tool: "ask",
    team: "All Theologians",
    viewCount: 3400,
  },
  {
    id: "tl-2",
    title: "Is the prosperity gospel a heresy or a distortion?",
    tool: "ask",
    team: "Modern Theologians",
    viewCount: 2100,
  },
  {
    id: "tl-3",
    title: "Divine sovereignty and human free will",
    tool: "ask",
    team: "All Theologians",
    viewCount: 1240,
  },
  {
    id: "tl-4",
    title: "Is liturgical worship more biblical than contemporary?",
    tool: "poll",
    team: "All Theologians",
    viewCount: 980,
  },
  {
    id: "tl-5",
    title: "Should the church embrace post-millennial eschatology?",
    tool: "poll",
    team: "Reformers",
    viewCount: 870,
  },
];
