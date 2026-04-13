# Project Pulse

An AI-powered project intelligence system built with React, Vite, TypeScript, and Tailwind CSS.

## Architecture

- **Frontend**: React 18 + TypeScript, served by Vite dev server on port 5000
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: React Router DOM v6
- **State**: TanStack React Query
- **Forms**: React Hook Form + Zod validation

## Key Directories

- `src/` — All application source code
  - `pages/` — Route-level page components
  - `components/` — Reusable UI components
  - `hooks/` — Custom React hooks
  - `contexts/` — React context providers
  - `data/` — Static data / mock data
  - `lib/` — Utility functions
  - `types/` — TypeScript type definitions

## Running the App

```bash
npm run dev
```

The dev server starts on port 5000.

## Build

```bash
npm run build
```

## Feature Layers

- **Intelligence Layer** (`/intelligence`) — Drift detection, assumption tracking, signal feed
- **Visibility Layer** (`/visibility`) — Stakeholder Lens toggle (CEO/Tech Lead/Finance views), Timeline Replay (project state scrubber), Dependency Graph (SVG deliverable map with critical chain)
- **Predictive Layer** (`/predictive`) — Delivery Forecast (P50/P70/P95 dates, velocity vs required), Risk Heatmap (room-level risk scoring), Pattern Matching (match current project against historical project outcomes)

## Data Files

- `src/data/seedProject.ts` — AI SEO Dashboard project seed data
- `src/data/seedBrandingProject.ts` — KijijiPay Branding project seed data
- `src/data/seedDecisions.ts` — Decisions, meetings, scope changes, red flags for both projects
- `src/data/seedSnapshots.ts` — Weekly historical snapshots + historical pattern library

## Notes

- Migrated from Lovable to Replit (April 2025)
- Removed `lovable-tagger` dev dependency from Vite config (not needed on Replit)
- Vite configured with `host: "0.0.0.0"` and `allowedHosts: true` for Replit proxy compatibility
