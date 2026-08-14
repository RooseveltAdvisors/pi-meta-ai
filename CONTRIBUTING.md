# Contributing

## Getting started

```bash
git clone https://github.com/RooseveltAdvisors/pi-meta-ai
cd pi-meta-ai
bun install
bun run test
```

## Local dev

Load extension from source:

```bash
pi -e ./extensions/meta-model-api/index.ts
```

Inside pi:

```
/login → API key → Meta Model API → paste LLM|... key
/model → meta-ai/muse-spark-1.2
/meta status
```

Export env var alternative (before launching):

```bash
export MODEL_API_KEY="LLM|..."
pi -e ./extensions/meta-model-api
```

## Tests & validation

- `bun run test` — focused regression tests, then TypeScript validation
- `bun run typecheck` — TypeScript validation only (no emit)
- Manual test checklist:
  - [ ] `/meta status` shows authentication status/source and `Resolved: yes` when authenticated
  - [ ] `/meta status` shows warning when not authenticated
  - [ ] `/login` → API key → Meta Model API works
  - [ ] Env var fallback works (`MODEL_API_KEY` and `META_API_KEY`)
  - [ ] `/model` lists all supported Meta models documented in the README
  - [ ] Tool calling works (read, bash, etc.)
  - [ ] Thinking levels map correctly
  - [ ] No footer status pollution (`setStatus` cleared on start/shutdown)

## Project standards

- Conventional commits preferred (`feat:`, `fix:`, `docs:`, `chore:`)
- Keep README user-focused — no internal pi impl details unless necessary
- No secrets in commits — use `/login` or env vars
- Maintain compatibility with pi >=0.80.x

## Release

- Update version in `package.json`
- `bun pm pack --dry-run` — verify files list
- Tag and publish per pi package registry guidance

## Reporting issues

Use GitHub issues: https://github.com/RooseveltAdvisors/pi-meta-ai/issues
Include pi version (`pi --version`), Node version, and `/meta status` output (which never includes keys).
