# Saad Barghouth · Notaq Project Archive

A bilingual English/Arabic project portfolio built with React and Vite. It preserves the 95 source records, groups one Red Sea Global deployment preview under the existing destination-management project, and shows 94 distinct project entries. The interface includes RTL Arabic, search, filters, sort, list/grid views, theme persistence, project details and verified screenshot evidence.

## Run

From the monorepo root:

```sh
pnpm --filter @workspace/notaq-portfolio run dev
```

Build and type-check:

```sh
pnpm --filter @workspace/notaq-portfolio run typecheck
pnpm --filter @workspace/notaq-portfolio run build
```

## Evidence audit

The project-specific link and screenshot audit is reproducible with:

```sh
pnpm --filter @workspace/notaq-portfolio run portfolio:audit
```

The audit reads the public Notaq listing, checks direct public destinations without signing into protected applications, and captures screenshots only when the live page identity is established. Link mismatches stay in the audit but are not exposed as direct project links. Generated deliverables are written to `docs/` and the complete inventory is in `data/`.

Create a distributable source archive with:

```sh
pnpm --filter @workspace/notaq-portfolio run project:zip
```

## Audit outputs

- `docs/link-audit.md` and `docs/link-audit.csv`
- `docs/screenshot-audit.md` and `docs/screenshot-audit.csv`
- `docs/project-identity-audit.md`
- `docs/screenshot-contact-sheet.jpg`
- `data/project-inventory.json` and `data/project-inventory.csv`
- `downloads/notaq-portfolio-project.zip`