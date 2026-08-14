# pi-meta-ai

Pi extension for [Meta Model API](https://dev.meta.ai) — adds **Muse Spark 1.2**, **Muse Spark 1.2 Contributor**, and **Muse Spark 1.1** to [pi coding agent](https://github.com/badlogic/pi-mono) via API key.

Meta Model API is OpenAI-compatible with Responses API at `https://api.meta.ai/v1`. This extension registers provider `meta-ai` using `openai-responses` for full agentic support: tool calling, parallel tools, streaming, reasoning effort, structured output, image input, prompt caching, 1M context.

## Prerequisites

- Node.js >=18
- Pi coding agent installed:

```bash
bun add --global --ignore-scripts @earendil-works/pi-coding-agent
```

Verify: `pi --version` should be >=0.80

## Install

**From source (dev):**

```bash
git clone https://github.com/RooseveltAdvisors/pi-meta-ai
cd pi-meta-ai
pi -e ./extensions/meta-model-api
```

**As a pi package:**

```bash
pi install git:github.com/RooseveltAdvisors/pi-meta-ai
```

## Quick start

1. **Get API key:** https://dev.meta.ai → API keys → Create. Key format `LLM|...`

2. **Authenticate (pick one):**

   **Option A — Inside pi (recommended):**
   ```
   /login → API key → Meta Model API → paste LLM|... key
   ```

   **Option B — Env var (before launching pi):**
   ```bash
   export MODEL_API_KEY="LLM|..."
   # Also supports META_API_KEY as fallback
   
   # If installed as pi package:
   pi
   
   # If running from source checkout:
   MODEL_API_KEY="LLM|..." pi -e ./extensions/meta-model-api
   ```

   > Env vars must be set before launching pi. If you set them after pi is running, run `/reload` or restart pi from the shell where var is exported.

3. **Select model:**
   ```
   /model → meta-ai/muse-spark-1.2
   ```

4. **Verify:**
   ```
   /meta status
   ```

5. Chat normally. Pi tools (read, bash, edit, write) work out of the box.

## Commands

- `/meta status` — show provider, authentication status/source, active model
- `/meta help` — usage help
- `/login` — manage API keys
- `/model` — switch models

## Features

- **API:** `openai-responses` (primary), chat completions compatible via Meta
- **Tool calling:** parallel tools
- **Reasoning:** via pi thinking levels `minimal`, `low`, `medium`, `high`, `xhigh` → mapped to Meta `minimal`/`low`/`medium`/`high` (`xhigh` clamps to `high`, `off` uses default)
- **Structured output:** JSON schema
- **Input:** text, image (PNG, JPEG, WebP, GIF)
- **Caching:** prompt caching automatic
- **Context:** 1M tokens, 64K max output

Registered pricing per million tokens is $1.25 input / $4.25 output for Muse Spark 1.2 and $0.10 input / $0.20 output for Muse Spark 1.2 Contributor. Muse Spark 1.1 remains a free preview, so its `cost` is intentionally set to `0`.

## Config reference (without extension)

If you prefer static config for Muse Spark 1.1, create `~/.pi/agent/models.json` — see [`models.json.example`](./models.json.example):

```json
{
  "providers": {
    "meta-ai": {
      "baseUrl": "https://api.meta.ai/v1",
      "apiKey": "$MODEL_API_KEY",
      "api": "openai-responses",
      "models": [
        {
          "id": "muse-spark-1.1",
          "name": "Muse Spark 1.1",
          "reasoning": true,
          "input": ["text", "image"],
          "contextWindow": 1048576,
          "maxTokens": 64000,
          "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
          "thinkingLevelMap": {
            "minimal": "minimal",
            "low": "low",
            "medium": "medium",
            "high": "high",
            "xhigh": "high"
          },
          "compat": {
            "supportsReasoningEffort": true,
            "supportsDeveloperRole": true,
            "supportsUsageInStreaming": true
          }
        }
      ]
    }
  }
}
```

Extension install is recommended for all supported models, better login UX, and future updates.

## Troubleshooting

**Model not visible in `/model`:**
- Ensure extension is loaded: `pi -e ./extensions/meta-model-api` or `pi install ...`
- Run `/reload` then `/model`
- Check `/meta status` shows "Model registered: yes"

**`Meta Model API not authenticated`:**
- Run `/login → API key → Meta Model API` and paste `LLM|...` key
- Or `export MODEL_API_KEY=LLM|...` **before** launching pi, then `/reload`
- Verify with `/meta status` — should show `Resolved: yes ✓ ready`

**Invalid key error:**
- Key must start with `LLM|` from https://dev.meta.ai
- Re-create key at dev.meta.ai → API keys → Create
- Try `/logout meta-ai` then `/login` again

**Env var not picked up:**
- Export before launch: `export MODEL_API_KEY=... && pi`
- Inside running pi, `/reload` after export won't pick up new env if parent shell didn't have it — restart pi from shell where var is exported

## Security

- Never commit real API keys, `.env`, or `~/.pi/agent/auth.json`
- Use `/login` (stored in OS-protected `auth.json`) or env vars for keys
- `/meta status` reports authentication status and source without displaying keys
- See [SECURITY.md](./SECURITY.md)

## Development

```bash
bun install
bun run test
pi -e ./extensions/meta-model-api/index.ts
# inside pi:
# /meta status
# /model → meta-ai/muse-spark-1.2
```

Structure:

```
pi-meta-ai/
  extensions/
    meta-model-api/
      index.ts      extension entry
  models.json.example
  package.json
  README.md
  LICENSE
```

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

MIT — see [LICENSE](./LICENSE)
