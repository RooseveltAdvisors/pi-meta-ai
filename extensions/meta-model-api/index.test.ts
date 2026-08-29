import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { AuthStorage, ModelRegistry } from "@earendil-works/pi-coding-agent";
import registerMetaExtension from "./index.js";

type Notify = (message: string, level: string) => void;

function createHarness(authStatus: { configured: boolean; source?: string }) {
  const events = new Map<string, (...args: any[]) => unknown>();
  const commands = new Map<string, { handler: (...args: any[]) => unknown }>();
  const notifications: Array<{ message: string; level: string }> = [];
  const registry = {
    find: () => ({ provider: "meta-ai", id: "muse-spark-1.1" }),
    getProviderAuthStatus: () => authStatus,
  };
  const ctx = {
    modelRegistry: registry,
    model: undefined,
    ui: {
      setStatus: () => undefined,
      notify: ((message, level) => notifications.push({ message, level })) as Notify,
    },
  };
  const pi = {
    registerProvider: () => undefined,
    on: (event: string, handler: (...args: any[]) => unknown) => events.set(event, handler),
    registerCommand: (name: string, command: { handler: (...args: any[]) => unknown }) => commands.set(name, command),
  };

  registerMetaExtension(pi as any);

  return { commands, ctx, events, notifications };
}

function getStoredAuthStatus(type: "api_key" | "oauth") {
  const credential = type === "api_key"
    ? { type: "api_key" as const, key: "LLM|stored-secret-value" }
    : { type: "oauth" as const, access: "access-token", refresh: "refresh-token", expires: Date.now() + 60_000 };
  const registry = ModelRegistry.inMemory(AuthStorage.inMemory({ "meta-ai": credential }));
  return registry.getProviderAuthStatus("meta-ai");
}

async function start(harness: ReturnType<typeof createHarness>) {
  await harness.events.get("session_start")?.({}, harness.ctx);
}

describe("Meta Model API authentication", () => {
  test("uses configured public provider auth status for stored credentials", async () => {
    const harness = createHarness(getStoredAuthStatus("api_key"));

    await start(harness);

    assert.deepEqual(harness.notifications, []);
  });

  test("treats public auth status for a legacy stored credential as configured", async () => {
    const publicStatus = getStoredAuthStatus("oauth");
    assert.deepEqual(publicStatus, { configured: true, source: "stored" });
    const harness = createHarness(publicStatus);

    await start(harness);
    await harness.commands.get("meta")?.handler("status", harness.ctx);

    assert.equal(harness.notifications.at(-1)?.level, "info");
    assert.match(harness.notifications.at(-1)?.message ?? "", /Provider auth: configured \(source: stored\)/);
  });

  test("emits exactly one warning when neither public nor environment auth is configured", async () => {
    const previousModelKey = process.env.MODEL_API_KEY;
    const previousMetaKey = process.env.META_API_KEY;
    delete process.env.MODEL_API_KEY;
    delete process.env.META_API_KEY;

    try {
      const harness = createHarness({ configured: false });

      await start(harness);

      assert.equal(harness.notifications.length, 1);
      assert.equal(harness.notifications[0]?.level, "warning");
    } finally {
      if (previousModelKey === undefined) delete process.env.MODEL_API_KEY;
      else process.env.MODEL_API_KEY = previousModelKey;
      if (previousMetaKey === undefined) delete process.env.META_API_KEY;
      else process.env.META_API_KEY = previousMetaKey;
    }
  });

  test("preserves META_API_KEY environment fallback without exposing the key", async () => {
    const previousModelKey = process.env.MODEL_API_KEY;
    const previousMetaKey = process.env.META_API_KEY;
    delete process.env.MODEL_API_KEY;
    process.env.META_API_KEY = "LLM|test-secret-value";

    try {
      const harness = createHarness({ configured: false });

      await start(harness);
      await harness.commands.get("meta")?.handler("status", harness.ctx);

      assert.equal(harness.notifications.length, 1);
      assert.doesNotMatch(harness.notifications[0]?.message ?? "", /test-secret-value/);
      assert.match(harness.notifications[0]?.message ?? "", /META_API_KEY/);
      assert.match(harness.notifications[0]?.message ?? "", /Resolved: yes ✓ ready/);
      assert.equal(harness.notifications[0]?.level, "info");
    } finally {
      if (previousModelKey === undefined) delete process.env.MODEL_API_KEY;
      else process.env.MODEL_API_KEY = previousModelKey;
      if (previousMetaKey === undefined) delete process.env.META_API_KEY;
      else process.env.META_API_KEY = previousMetaKey;
    }
  });
});
