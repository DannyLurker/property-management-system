# packages/ui

## Overview

Shared shadcn parts on Tailwind v4 in new-york style. Consumed first by the staff app, adopted by booking at v1.1.0.

## Key files

| File | Owns |
|---|---|
| `src/components/ui/` | button, input, card |
| `src/lib/utils.ts` | style merge helper |
| `src/styles/theme.css` | tokens plus class scanning |
| `components.json` | shadcn configuration |

## Conventions

- Add parts through the shadcn CLI at the package root, one shared home.
- Interactive parts carry the client marker for Next.js reuse later.
- Theme tokens stay neutral until the design system spec sets brand values.

## Agent skills

- [shadcn](../../.agents/skills/shadcn/): `shadcn-ui/ui`, parts catalog for this package

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
