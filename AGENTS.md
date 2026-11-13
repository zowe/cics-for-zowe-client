# Agent guidance

## Repository structure

This is a monorepo. The primary packages are under `packages/`:

| Package | Path | Purpose |
|---|---|---|
| `vsce` | `packages/vsce` | VS Code extension |
| `sdk` | `packages/sdk` | CICS REST client SDK |
| `vsce-api` | `packages/vsce-api` | Extender API types |
| `cli` | `packages/cli` | Zowe CLI plug-in |

## Running commands

Always run package-level scripts via `pnpm run <script>` or `pnpm --filter <pkg> <script>` — do not invoke `jest`, `tsc`, `eslint`, or `webpack` directly. Each package has its own config files and the npm scripts wire them up correctly.

```sh
cd packages/vsce

pnpm run test:unit   # unit tests (uses unit.jest_config.ts)
pnpm run lint        # ESLint
pnpm run build       # webpack dev build + l10n export
```

To run all unit tests across the whole monorepo:

```sh
# from repo root
pnpm run test:unit
```

## Typecheck

`tsc --noEmit` is safe to run directly from a package directory when you need a quick type check without building:

```sh
cd packages/vsce
npx tsc --noEmit
```

