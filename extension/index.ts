import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

type ExposeMode = "local" | "tunnel";

interface DailyPluginConfig {
  enabled?: boolean;
  systemRoot?: string;
  defaultExposeMode?: ExposeMode;
}

interface StartParams {
  exposeMode?: ExposeMode;
  port?: number;
  dataDir?: string;
  publicDir?: string;
  requireApiAuth?: boolean;
  apiToken?: string;
}

interface RuntimeInfo {
  [key: string]: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let resolvedConfig: Required<DailyPluginConfig>;
let startScript = "";
let stopScript = "";
let statusScript = "";
let runtimeFile = "/tmp/daily-system/runtime.env";

function toResult(payload: unknown) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function runBash(scriptPath: string, env?: Record<string, string>) {
  return spawnSync("bash", [scriptPath], {
    encoding: "utf8",
    env: { ...process.env, ...(env || {}) },
  });
}

function parseRuntimeEnv(filePath = runtimeFile): RuntimeInfo {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const obj: RuntimeInfo = {};
  for (const line of lines) {
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) obj[key] = value;
  }
  return obj;
}

function validateExposeMode(mode?: string): mode is ExposeMode {
  return mode === "local" || mode === "tunnel";
}

const StartParamsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    exposeMode: {
      type: "string",
      enum: ["local", "tunnel"],
      description: "服务暴露模式：local 或 tunnel",
    },
    port: {
      type: "number",
      description: "服务端口，默认 8888",
    },
    dataDir: {
      type: "string",
      description: "数据目录（相对/绝对路径都可）",
    },
    publicDir: {
      type: "string",
      description: "静态资源目录（默认 ./web）",
    },
    requireApiAuth: {
      type: "boolean",
      description: "是否开启 API 鉴权",
    },
    apiToken: {
      type: "string",
      description: "API token（requireApiAuth=true 时可指定）",
    },
  },
};

const EmptySchema = {
  type: "object",
  additionalProperties: false,
  properties: {},
};

const dailySystemPlugin = {
  id: "daily-system",
  name: "Daily System Runtime",
  description: "Runtime tools for daily-system lifecycle",
  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      enabled: { type: "boolean", default: true },
      systemRoot: { type: "string" },
      defaultExposeMode: { type: "string", enum: ["local", "tunnel"], default: "local" },
    },
  },

  register(api: any) {
    const logger = api.logger;
    const raw: DailyPluginConfig = api.config?.plugins?.entries?.["daily-system"]?.config ?? {};

    resolvedConfig = {
      enabled: raw.enabled ?? true,
      systemRoot: raw.systemRoot ?? path.resolve(__dirname, ".."),
      defaultExposeMode: raw.defaultExposeMode ?? "local",
    };

    startScript = path.join(resolvedConfig.systemRoot, "deploy", "start.sh");
    stopScript = path.join(resolvedConfig.systemRoot, "deploy", "stop.sh");
    statusScript = path.join(resolvedConfig.systemRoot, "deploy", "status.sh");

    if (!resolvedConfig.enabled) {
      logger.info("[daily-system] plugin disabled by config");
      return;
    }

    if (!fs.existsSync(startScript) || !fs.existsSync(stopScript) || !fs.existsSync(statusScript)) {
      logger.error(`[daily-system] missing deploy scripts under ${resolvedConfig.systemRoot}`);
      return;
    }

    if (typeof api.registerTool === "function") {
      api.registerTool(
        {
          name: "daily_start_service",
          description:
            "Start daily-system service. Default local mode; tunnel mode optional. Returns URL and auth status.",
          parameters: StartParamsSchema,
          async execute(_id: string, params: StartParams) {
            const mode = params.exposeMode ?? resolvedConfig.defaultExposeMode;
            if (!validateExposeMode(mode)) {
              return toResult({ ok: false, error: "invalid exposeMode, expected local|tunnel" });
            }

            const env: Record<string, string> = {
              EXPOSE_MODE: mode,
            };
            if (params.port) env.PORT = String(params.port);
            if (params.dataDir) env.DATA_DIR = params.dataDir;
            if (params.publicDir) env.PUBLIC_DIR = params.publicDir;
            if (typeof params.requireApiAuth === "boolean") {
              env.REQUIRE_API_AUTH = params.requireApiAuth ? "1" : "0";
            }
            if (params.apiToken) env.API_TOKEN = params.apiToken;

            const run = runBash(startScript, env);
            if (run.status !== 0) {
              return toResult({
                ok: false,
                error: "failed to start service",
                exitCode: run.status,
                stdout: (run.stdout || "").trim(),
                stderr: (run.stderr || "").trim(),
              });
            }

            const runtime = parseRuntimeEnv();
            return toResult({
              ok: true,
              mode: runtime.EXPOSE_MODE || mode,
              url: runtime.URL || null,
              localUrl: runtime.LOCAL_URL || null,
              port: runtime.PORT ? Number(runtime.PORT) : null,
              requireApiAuth: runtime.REQUIRE_API_AUTH === "1",
              apiToken: runtime.API_TOKEN || "",
              logs: {
                server: runtime.LOG_FILE || "",
                tunnel: runtime.TUNNEL_LOG || "",
              },
            });
          },
        },
        { optional: false }
      );

      api.registerTool(
        {
          name: "daily_status",
          description: "Get daily-system running status and current URL/mode information.",
          parameters: EmptySchema,
          async execute() {
            const run = runBash(statusScript);
            const runtime = parseRuntimeEnv();
            return toResult({
              ok: run.status === 0,
              statusOutput: (run.stdout || "").trim(),
              mode: runtime.EXPOSE_MODE || null,
              url: runtime.URL || null,
              localUrl: runtime.LOCAL_URL || null,
              requireApiAuth: runtime.REQUIRE_API_AUTH === "1",
            });
          },
        },
        { optional: false }
      );

      api.registerTool(
        {
          name: "daily_get_link",
          description: "Get current access links and auth info for running daily-system service.",
          parameters: EmptySchema,
          async execute() {
            const runtime = parseRuntimeEnv();
            if (!runtime.URL) {
              return toResult({
                ok: false,
                error: "service not running or runtime metadata not found",
              });
            }
            return toResult({
              ok: true,
              mode: runtime.EXPOSE_MODE || null,
              url: runtime.URL,
              localUrl: runtime.LOCAL_URL || null,
              requireApiAuth: runtime.REQUIRE_API_AUTH === "1",
              apiToken: runtime.API_TOKEN || "",
            });
          },
        },
        { optional: false }
      );

      api.registerTool(
        {
          name: "daily_stop_service",
          description: "Stop daily-system service and tunnel process if running.",
          parameters: EmptySchema,
          async execute() {
            const run = runBash(stopScript);
            return toResult({
              ok: run.status === 0,
              output: (run.stdout || "").trim(),
              stderr: (run.stderr || "").trim(),
            });
          },
        },
        { optional: false }
      );

      logger.info("[daily-system] tools registered: daily_start_service, daily_status, daily_get_link, daily_stop_service");
    } else {
      logger.warn("[daily-system] registerTool API unavailable");
    }

    if (typeof api.registerService === "function") {
      api.registerService({
        id: "daily-system-runtime",
        start: () => {
          logger.info(`[daily-system] runtime plugin ready: root=${resolvedConfig.systemRoot}`);
        },
        stop: () => {
          logger.info("[daily-system] runtime plugin stopped");
        },
      });
    }
  },
};

export default dailySystemPlugin;
