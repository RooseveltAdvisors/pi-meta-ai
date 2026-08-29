# Contributing

## Getting started

```bash
git clone https://github.com/seemethere/pi-meta-ai
cd pi-meta-ai
npm install
npm run typecheck
npm test
```

## Local dev

Load extension from source:

```bash
pi -e ./extensions/meta-model-api/index.ts
```

Inside pi:

```
/login → API key → Meta Model API → paste LLM|... key
/model → meta-ai/muse-spark-1.1
/meta status
```

Export env var alternative (before launching):

```bash
export MODEL_API_KEY="LLM|..."
pi -e ./extensions/meta-model-api
```

## Tests & validation

- `npm run typecheck` — TypeScript validation (no emit)
- `npm test` — regression tests and TypeScript validation
- Manual test checklist:
  - [ ] `/meta status` shows authentication status/source and `Resolved: yes` when authenticated
  - [ ] `/meta status` shows warning when not authenticated
  - [ ] `/login` → API key → Meta Model API works
  - [ ] Env var fallback works (`MODEL_API_KEY` and `META_API_KEY`)
  - [ ] `/model` lists `meta-ai/muse-spark-1.1`
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
- `npm pack --dry-run` — verify files list
- Tag and publish per pi package registry guidance

## Reporting issues

Use GitHub issues: https://github.com/seemethere/pi-meta-ai/issues
Include pi version (`pi --version`), Node version, and `/meta status` output without secrets.
