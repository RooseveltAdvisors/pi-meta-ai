# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Fixed
- Startup auth checks now use the public provider auth status, avoiding false unauthenticated warnings for stored credentials.
- `/meta status` reports authentication status and source without displaying key fragments.

## 0.1.1 - 2026-07-09

### Fixed
- Auth check now correctly rejects legacy `oauth` credentials unless env var present, prevents false `✓ ready` status (codex blocker fix)
- README env-var quickstart clarifies `pi -e ./extensions/meta-model-api` must stay loaded for source installs
- `getProviderAuthStatus` + `hasValidStored` used instead of `find()` for auth detection

### Added
- `LICENSE` file (MIT)
- `CONTRIBUTING.md`, `SECURITY.md`, `.env.example`, `tsconfig.json`
- `package.json` metadata: `author`, `homepage`, `bugs`, `engines`, `files`, `typecheck` script
- `.gitignore` expanded (env files, tsbuildinfo, coverage logs)

### Changed
- README rewritten for exec-ready first-time UX: prerequisites, install, quickstart, troubleshooting, security, cost note
- `models.json.example` now includes `compat` flags to match extension

## 0.1.0 - 2026-07-09

- Initial release: Pi extension for Meta Model API Muse Spark 1.1
- Provider `meta-ai` with `openai-responses` API, 1M context, tool calling, reasoning, image input
- Commands `/meta status`, `/meta help`, API key login via `/login`
- Env var support `MODEL_API_KEY` and `META_API_KEY` fallback
