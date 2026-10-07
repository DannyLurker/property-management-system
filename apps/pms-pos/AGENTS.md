# apps/pms-pos

## Overview

Staff Vite plus React 19 SPA for PMS screens and the POS terminal. Consumes shared parts from `@pms/ui`, never forks its own copies.

## Key files

| File | Owns |
|---|---|
| `src/App.tsx` | shell proving shared UI wiring |
| `src/index.css` | theme import plus class scanning |
| `vite.config.ts` | React plus Tailwind plugins |

## Commands

```bash
pnpm --filter @pms/pms-pos dev
pnpm --filter @pms/pms-pos build
```

## Conventions

- Parts come from `@pms/ui`. Local components only for screens, never duplicates of shared parts.
- Lint is oxlint. Touch targets stay large for terminal use.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
