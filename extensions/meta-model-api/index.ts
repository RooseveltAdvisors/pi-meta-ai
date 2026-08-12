/**
 * Pi Extension: Meta Model API
 *
 * Provides Meta's Muse Spark model via api.meta.ai using API key authentication.
 * OpenAI Responses-compatible with tool calling, reasoning, structured output,
 * image input, and prompt caching.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const PROVIDER_ID = "meta-ai";
const DISPLAY_NAME = "Meta Model API";
const BASE_URL = "https://api.meta.ai/v1";
const MODEL_ID = "muse-spark-1.1";
const MODEL_ID_12 = "muse-spark-1.2";
const MODEL_ID_12_CONTRIB = "muse-spark-1.2-contributor";
const ENV_VAR = "MODEL_API_KEY";
const META_ENV_VAR = "META_API_KEY";

function getEnvKey(): string | undefined {
  return process.env[ENV_VAR] || process.env[META_ENV_VAR];
}

type ProviderAuthStatus = {
  configured: boolean;
  source?: string;
  label?: string;
};

function getAuthSummary(ctx: any): {
  configured: boolean;
  source: string;
  providerStatus: ProviderAuthStatus;
} {
  const providerStatus: ProviderAuthStatus = ctx.modelRegistry.getProviderAuthStatus(PROVIDER_ID);
  const envConfigured = !!getEnvKey();
  const envSource = process.env[ENV_VAR]
    ? ENV_VAR
    : process.env[META_ENV_VAR]
      ? META_ENV_VAR
      : undefined;

  return {
    configured: providerStatus.configured || envConfigured,
    source: providerStatus.configured
      ? providerStatus.label || providerStatus.source || "provider auth"
      : envSource || "none",
    providerStatus,
  };
}

export default function (pi: ExtensionAPI) {
  // Allow META_API_KEY as fallback — shim to MODEL_API_KEY so pi's $MODEL_API_KEY interpolation works.
  if (!process.env[ENV_VAR] && process.env[META_ENV_VAR]) {
    process.env[ENV_VAR] = process.env[META_ENV_VAR];
  }

  pi.registerProvider(PROVIDER_ID, {
    name: DISPLAY_NAME,
    baseUrl: BASE_URL,
    // Pi will resolve key from: 1) auth.json (api_key), 2) $MODEL_API_KEY env var.
    apiKey: `$${ENV_VAR}`,
    api: "openai-responses",
    models: [
      {
        id: MODEL_ID_12,
        name: "Muse Spark 1.2",
        reasoning: true,
        input: ["text", "image"],
        cost: { input: 1.25, output: 4.25, cacheRead: 0.15, cacheWrite: 0.15 },
        contextWindow: 1_048_576,
        maxTokens: 64_000,
        thinkingLevelMap: {
          minimal: "minimal",
          low: "low",
          medium: "medium",
          high: "high",
          xhigh: "high",
        },
        compat: {
          supportsReasoningEffort: true,
          supportsDeveloperRole: true,
          supportsUsageInStreaming: true,
        },
      },
      {
        id: MODEL_ID_12_CONTRIB,
        name: "Muse Spark 1.2 Contributor",
        reasoning: true,
        input: ["text", "image"],
        cost: { input: 0.10, output: 0.20, cacheRead: 0.002, cacheWrite: 0.002 },
        contextWindow: 1_048_576,
        maxTokens: 64_000,
        thinkingLevelMap: {
          minimal: "minimal",
          low: "low",
          medium: "medium",
          high: "high",
          xhigh: "high",
        },
        compat: {
          supportsReasoningEffort: true,
          supportsDeveloperRole: true,
          supportsUsageInStreaming: true,
        },
      },
      {
        id: MODEL_ID,
        name: "Muse Spark 1.1",
        reasoning: true,
        input: ["text", "image"],
        // Pricing is currently free preview for Meta Model API. Revisit before GA if pricing is published.
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 1_048_576,
        maxTokens: 64_000,
        thinkingLevelMap: {
          minimal: "minimal",
          low: "low",
          medium: "medium",
          high: "high",
          xhigh: "high",
        },
        compat: {
          supportsReasoningEffort: true,
          supportsDeveloperRole: true,
          supportsUsageInStreaming: true,
        },
      },
    ],
  });

  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.setStatus("meta-ai", undefined);

    const model = ctx.modelRegistry.find(PROVIDER_ID, MODEL_ID);
    if (!model) {
      ctx.ui.notify(`Meta provider not registered correctly. Try /reload or reinstall extension.`, "error");
      return;
    }

    const auth = getAuthSummary(ctx);

    if (!auth.configured) {
      ctx.ui.notify(
        `Meta Model API not authenticated. Run /login → API key → '${DISPLAY_NAME}' to add your key, or export ${ENV_VAR}=LLM|... before launching pi. Then /model → ${PROVIDER_ID}/${MODEL_ID}`,
        "warning"
      );
    }
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    ctx.ui.setStatus("meta-ai", undefined);
  });

  pi.registerCommand("meta", {
    description: "Meta Model API status and help",
    handler: async (args, ctx) => {
      const sub = (args || "").trim().split(/\s+/)[0] || "status";

      if (sub === "status") {
        const envKey = getEnvKey();
        const model = ctx.modelRegistry.find(PROVIDER_ID, MODEL_ID);
        const auth = getAuthSummary(ctx);
        const isActive = ctx.model?.provider === PROVIDER_ID && ctx.model?.id === MODEL_ID;

        const lines = [
          `${DISPLAY_NAME} — Status`,
          `────────────────────────────────────────`,
          `Provider: ${PROVIDER_ID} (${DISPLAY_NAME})`,
          `Base URL: ${BASE_URL}`,
          `Models:`,
          `  ${MODEL_ID_12} — Muse Spark 1.2 (1M ctx, $1.25/$4.25 per M)`,
          `  ${MODEL_ID_12_CONTRIB} — Muse Spark 1.2 Contributor (1M ctx, $0.10/$0.20 per M)`,
          `  ${MODEL_ID} — Muse Spark 1.1 (1M ctx, free preview)`,
          `  API: openai-responses`,
          ``,
          `Auth:`,
          `  Status: ${auth.configured ? "configured ✓ ready" : "not configured"}`,
          `  Source: ${auth.source}`,
          `  Provider auth: ${auth.providerStatus.configured ? "configured" : "not configured"}`,
          `  Env ${ENV_VAR}: ${envKey ? "configured" : "(not set)"}${process.env[META_ENV_VAR] ? ` (fallback ${META_ENV_VAR} detected)` : ""}`,
          `  Resolved: ${auth.configured ? "yes ✓ ready" : "no — run /login or set env var"}`,
          ``,
          `State:`,
          `  Model registered: ${model ? "yes" : "no"}`,
          `  Active model: ${isActive ? "yes ✓" : "no — use /model to select meta-ai/muse-spark-1.1"}`,
          ``,
          `Next steps:`,
          `  1. /login → API key → "${DISPLAY_NAME}" → paste LLM|... key`,
          `  2. /model → ${PROVIDER_ID}/${MODEL_ID}`,
          `  3. Ask anything — pi tools (read, bash, edit, write) work out of the box`,
          ``,
          `Env alternative: export ${ENV_VAR}=LLM|... then /reload (also supports ${META_ENV_VAR})`,
        ];

        ctx.ui.notify(lines.join("\n"), auth.configured ? "info" : "warning");
        return;
      }

      if (sub === "help") {
        ctx.ui.notify(
          [
            `${DISPLAY_NAME} — Pi Extension`,
            ``,
            `Commands:`,
            `  /meta status — show authentication status/source, active model`,
            `  /meta help   — this help`,
            `  /login       — add your key via API key → Meta Model API`,
            `  /model       — select a Meta model (muse-spark-1.2, muse-spark-1.2-contributor, muse-spark-1.1)`,
            ``,
            `Setup:`,
            `  1. Get key: https://dev.meta.ai → API keys → Create (LLM|...)`,
            `  2. Export or login:`,
            `     export MODEL_API_KEY=LLM|...   (before launching pi)`,
            `     or inside pi: /login → API key → Meta Model API`,
            `  3. /model → meta-ai/muse-spark-1.2`,
            ``,
            `Docs: https://dev.meta.ai/docs`,
          ].join("\n"),
          "info"
        );
        return;
      }

      ctx.ui.notify(`Unknown subcommand "${sub}". Try /meta status or /meta help`, "warning");
    },
  });
}
