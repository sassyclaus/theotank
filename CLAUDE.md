# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `packages/web/` using Bun:

```bash
bun run dev      # Vite dev server with hot reload
bun run build    # TypeScript type-check (tsc -b) + Vite production build
bun run preview  # Serve production build locally
```

No test runner or linter is configured yet.

## Architecture

**Monorepo** using Bun workspaces (`packages/*`). Currently one package: `@theotank/web`.

**Stack:** React 19 + Vite 6 + TypeScript 5.7 + Tailwind CSS v4 + react-router v7 (BrowserRouter)

**Path alias:** `@/` resolves to `packages/web/src/`

### Routing

All routes are defined in `packages/web/src/App.tsx` using react-router `<Routes>`. Every route is wrapped in a shared `<Layout />` component (sticky nav + `<Outlet />`). Pages live in `src/pages/`. Currently the Home page is fully implemented; Roundtable, Research, Library, and Theologians are stubs.

### Component Organization

- `src/components/ui/` — Reusable primitives (Button, Card, Input). Button uses CVA for type-safe variants. Card is a compound component set (Card, CardHeader, CardTitle, CardDescription, CardContent).
- `src/components/layout/` — Layout shell, TopNav, MobileMenu
- `src/components/home/` — Home page sections (HeroSection, TheologianMosaic, ToolCards, ResearchCallout, PublicCorpusSection)
- `src/data/` — Mock data with TypeScript interfaces (navigation links, theologians, trending items)
- `src/hooks/` — Custom hooks (`useIsMobile` at 768px breakpoint)
- `src/lib/utils.ts` — `cn()` utility combining clsx + tailwind-merge

### Styling

Tailwind v4 via the `@tailwindcss/vite` plugin (no `tailwind.config` file). Design tokens are defined as CSS `@theme` variables in `src/index.css`:

- **Colors:** `bg` (warm white), `surface` (card backgrounds), `teal` (Tier 1 synthesis), `oxblood` (Tier 2 research), `gold` (CTA/interactive), `nav-bg`
- **Fonts:** `font-serif` (Playfair Display for headings), `font-sans` (Inter for body)
- **Animations:** `marquee-left`, `marquee-right` for theologian mosaic

Use these token names in Tailwind classes (e.g., `text-teal`, `bg-surface`, `font-serif`).

### Design System

The platform uses a two-register visual system: **teal** for Tier 1 synthesis tools (Roundtable) and **oxblood** for Tier 2 research tools. Gold is reserved for interactive/CTA elements. The aesthetic is warm and institutional (think Brookings/Foreign Affairs). See `UX-DESIGN.md` for the full design brief.

Responsive breakpoint at 768px — mobile uses a hamburger menu with Radix Dialog overlay; desktop uses inline nav links.

### Key Dependencies

- **Radix UI** (`@radix-ui/react-dialog`, `@radix-ui/react-slot`) for accessible primitives
- **CVA** (class-variance-authority) for component variant management
- **Lucide React** for icons
