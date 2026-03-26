# Giget

Giget is a zero-dependency CLI and programmatic API for downloading templates and git repositories. It supports GitHub, GitLab, Bitbucket, Sourcehut, and custom registries with offline caching via etags.

## Quick Reference

```bash
eval "$(fnm env --use-on-cd 2>/dev/null)"  # Enable node/pnpm
pnpm build          # Build with obuild (rolldown)
pnpm dev            # Run tests in watch mode
pnpm vitest run test/utils.test.ts   # Run a specific test
pnpm test           # Full: lint + typecheck + tests + coverage
pnpm lint:fix       # Oxlint + oxfmt auto-fix
pnpm giget          # Run CLI from source (node ./src/cli.ts)
```

## Architecture

```
src/
  index.ts        # Public exports (re-exports from giget.ts, types.ts, registry.ts)
  giget.ts        # Core: downloadTemplate() — resolves provider, downloads tarball, extracts
  providers.ts    # Built-in providers: github, gitlab, bitbucket, sourcehut, http
  registry.ts     # Template registry provider (fetches JSON from registry URL)
  types.ts        # Type definitions: GitInfo, TemplateInfo, TemplateProvider, options
  cli.ts          # CLI entry (uses citty). Bin: dist/cli.mjs
  _utils.ts       # Internal: fetch wrapper, download with etag cache, parseGitURI, shell utils
```

**Flow:** Input string → resolve provider (`gh:`, `gitlab:`, `https:`, or registry lookup) → provider returns `TemplateInfo` (tar URL, ref, subdir) → download tarball to `~/.cache/giget/` with etag caching → extract with `tar` (lazy import) → optionally install deps with `nypm` (lazy import).

### Provider System

Providers are functions `(input, { auth }) => TemplateInfo | null`. Built-in providers live in `src/providers.ts`:

- **GitHub** (`gh:`/`github:`) — uses GitHub API tarball endpoint. Supports GitHub Enterprise via `GIGET_GITHUB_URL` env.
- **GitLab** (`gitlab:`) — self-hosted via `GIGET_GITLAB_URL` env. Has `sec-fetch-mode` workaround header.
- **Bitbucket** (`bitbucket:`) — standard tarball endpoint.
- **Sourcehut** (`sourcehut:`) — uses `git.sr.ht` archive endpoint.
- **HTTP** (`http:`/`https:`) — direct tarball URL or JSON registry file.

Git URI format: `org/repo[/subdir][#ref]` — parsed by `parseGitURI()` in `_utils.ts`.

### Template Registry

Default registry: `https://raw.githubusercontent.com/unjs/giget/main/templates`. Template JSON files in `templates/` dir map shortcut names (e.g., `nuxt`, `h3`) to tarball URLs. Custom registries via `--registry` flag or `GIGET_REGISTRY` env.

## Key Design Decisions

- **Zero runtime dependencies** — all deps (`citty`, `pathe`, `nypm`, `tar`) are bundled at build time into `dist/_chunks/`.
- **Lazy imports** — `tar` and `nypm` are dynamically imported only when needed.
- **Etag caching** — tarballs cached in `~/.cache/giget/` with `.json` metadata files for etag tracking.
- **ESM only** — output is `.mjs` with `.d.mts` type declarations.

## Build

Uses `obuild` (Rolldown-based). Config in `build.config.ts`:

- Entries: `src/index.ts`, `src/cli.ts`
- Output: ESM (`.mjs`) + declarations (`.d.mts`)
- Plugin minifies bundled libs in `_chunks/libs/`

## Testing

Uses **vitest**. Tests in `test/`:

- `test/getgit.test.ts` — integration tests (clones from GitHub, tests caching/offline/error handling)
- `test/utils.test.ts` — unit tests for `parseGitURI()` with various URI formats

## Linting & Formatting

- **Oxlint** (`.oxlintrc.json`) — plugins: unicorn, typescript, oxc
- **Oxfmt** (`.oxfmtrc.json`) — Rust-based formatter

## CI

GitHub Actions (`.github/workflows/ci.yml`): runs on Ubuntu + Windows, Node 22, pnpm via corepack. Steps: lint → build → test with coverage → codecov upload.

## Release

```bash
pnpm release  # test → build → changelogen --release → npm publish → git push --follow-tags
```
