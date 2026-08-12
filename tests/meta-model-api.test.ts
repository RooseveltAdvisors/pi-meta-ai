import { afterEach, describe, expect, test } from "bun:test";
import registerMetaExtension from "../extensions/meta-model-api/index.ts";

const ENV_KEYS = ["MODEL_API_KEY", "META_API_KEY"] as const;
const originalEnv = new Map(ENV_KEYS.map((key) => [key, process.env[key]]));

type Notification = { message: string; level: string };

function clearAuthEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

function restoreAuthEnv() {
  for (const key of ENV_KEYS) {
    const value = originalEnv.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function createExtension() {
  const handlers = new Map<string, (event: unknown, ctx: unknown) => Promise<void>>();
  const commands = new Map<string, { handler: (args: string, ctx: unknown) => Promise<void> }>();

  registerMetaExtension({
    registerProvider() {},
    on(event, handler) {
      handlers.set(event, handler as (event: unknown, ctx: unknown) => Promise<void>);
    },
    registerCommand(name, command) {
      commands.set(name, command as { handler: (args: string, ctx: unknown) => Promise<void> });
    },
  } as never);

  return { handlers, commands };
}

function createContext(configured: boolean, source?: string) {
  const notifications: Notification[] = [];
  const authStatusProviderIds: string[] = [];
  const modelRegistry = {
    find: () => ({ provider: "meta-ai", id: "muse-spark-1.1" }),
    getProviderAuthStatus: (providerId: string) => {
      authStatusProviderIds.push(providerId);
      return { configured, source };
    },
  };

  Object.defineProperty(modelRegistry, "authStorage", {
    get() {
      throw new Error("private authStorage must not be accessed");
    },
  });

  return {
    context: {
      modelRegistry,
      model: undefined,
      ui: {
        setStatus() {},
        notify(message: string, level: string) {
          notifications.push({ message, level });
        },
      },
    },
    notifications,
    authStatusProviderIds,
  };
}

afterEach(restoreAuthEnv);

describe("Meta Model API authentication", () => {
  test("uses public stored auth status and suppresses the startup warning", async () => {
    clearAuthEnv();
    const extension = createExtension();
    const { context, notifications, authStatusProviderIds } = createContext(true, "stored");

    await extension.handlers.get("session_start")!(undefined, context);

    expect(authStatusProviderIds).toEqual(["meta-ai"]);
    expect(notifications).toEqual([]);
  });

  test("treats a public stored status as configured without legacy credential inspection", async () => {
    clearAuthEnv();
    const extension = createExtension();
    const { context, notifications } = createContext(true, "stored");

    await extension.commands.get("meta")!.handler("status", context);

    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.level).toBe("info");
    expect(notifications[0]?.message).toContain("Status: configured");
    expect(notifications[0]?.message).toContain("Source: stored");
    expect(notifications[0]?.message).not.toContain("legacy");
  });

  test("emits exactly one warning when public auth status is not configured", async () => {
    clearAuthEnv();
    const extension = createExtension();
    const { context, notifications } = createContext(false);

    await extension.handlers.get("session_start")!(undefined, context);

    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.level).toBe("warning");
    expect(notifications[0]?.message).toContain("not authenticated");
  });

  for (const envName of ENV_KEYS) {
    test(`preserves the ${envName} environment fallback without exposing its value`, async () => {
      clearAuthEnv();
      process.env[envName] = "test-only-key";
      const extension = createExtension();
      const { context, notifications } = createContext(false);

      await extension.handlers.get("session_start")!(undefined, context);
      expect(notifications).toEqual([]);

      await extension.commands.get("meta")!.handler("status", context);

      expect(notifications).toHaveLength(1);
      expect(notifications[0]?.message).toContain("Status: configured");
      expect(notifications[0]?.message).toContain(`Source: ${envName}`);
      expect(notifications[0]?.message).not.toContain("test-only-key");
    });
  }
});
