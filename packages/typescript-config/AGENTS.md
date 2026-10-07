# packages/typescript-config

## Overview

Shared TS bases. `base.json` is node shaped for API plus service packages, `vite.json` is web shaped for apps plus UI.

## Conventions

- Node packages extend the base, web packages extend vite.
- Keep shared flags here, workspace files add only what differs.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
