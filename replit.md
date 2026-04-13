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

## Notes

- Migrated from Lovable to Replit (April 2025)
- Removed `lovable-tagger` dev dependency from Vite config (not needed on Replit)
- Vite configured with `host: "0.0.0.0"` and `allowedHosts: true` for Replit proxy compatibility
