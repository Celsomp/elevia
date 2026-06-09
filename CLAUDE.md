# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Elevia is a mobile-first personal development PWA. The core mechanic is a living sunflower avatar that visually reflects the user's progress — it grows with focus sessions, completed missions, and reflections, and wilts with neglect. The AI companion "Helia" provides empathetic, context-aware coaching.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build locally
npm run lint         # ESLint
npm run test         # Vitest (all tests)
npm run test -- --run src/path/to/file.test.ts  # Single test file
```

## Stack

**Frontend:** React 18 + TypeScript 5, Vite 5, Tailwind CSS v3, shadcn/ui (Radix), Framer Motion, React Router v6, TanStack Query, next-themes

**Backend:** Supabase (PostgreSQL + Auth + Edge Functions on Deno)

**AI:** Lovable AI Gateway (Gemini/GPT) — NOT Claude/Anthropic API

**Payments:** Stripe (subscription, not yet active)

## Architecture

### Auth & User Flow
Auth is handled entirely by Supabase. On signup, a `handle_new_user` trigger auto-creates a row in `profiles`. The `plan` field (`free` | `premium`) is protected by a `protect_plan_on_update` trigger — it cannot be escalated from client-side. All tables enforce RLS; users can only CRUD their own rows.

### Helia AI (Edge Function)
`supabase/functions/helia-chat` is a Deno Edge Function that streams SSE responses. It injects user context (profile, weakest life areas, current streak) into the system prompt before calling the AI gateway. The frontend consumes this as a streaming fetch — do not use a standard JSON response pattern here.

### Sunflower State
The sunflower's visual state is derived from a combination of: current streak, focus sessions in the last 7 days, and whether today's missions were completed. This is computed client-side from data fetched via TanStack Query — there is no server-side sunflower state column.

### Life Wheel Areas
8 areas: Career, Health, Relationships, Finances, Personal Growth, Leisure, Environment, Family. Set during onboarding via the Roda da Vida assessment. The 3 lowest-scoring areas drive daily mission generation.

### Free vs Premium Limits
Enforced client-side for UX and server-side in the Edge Function. Limits: Free = 2 missions/day, 3 reflections/week, 5 Helia messages/day, focus presets 25/45 min. Premium lifts all caps and adds 60 min preset + advanced analytics.

## Design Tokens

Tailwind uses HSL semantic tokens. Primary accent is sunflower yellow `#E8B931`. Typography: `Playfair Display` for display/emotional headings, `DM Sans` for body. Dark mode via `next-themes`. Never use cold/tech palette — stay within warm naturals (sunflower, warm orange, natural green, cream).

## Key Constraints

- **Mobile-first absolute** — all layouts designed for thumb reach, one decision per screen
- **PWA** — `manifest.json` required, service worker for offline shell
- **No admin UI** — single-user app, project management is done via Supabase Cloud dashboard
- **Framer Motion** — use for sunflower growth animations and screen transitions only; avoid gratuitous motion elsewhere
- **RLS on every table** — never query without a user context; service_role is Edge Functions only
