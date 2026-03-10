import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

type ExposeMode = "local" | "tunnel";
type BoardStatus = "new" | "claimed" | "done" | "failed";

interface DailyPluginConfig {
  enabled?: boolean;
  systemRoot?: string;
  defaultExposeMode?: ExposeMode;
  workspacePath?: string;
  boardPath?: string;
}

interface StartParams {
  exposeMode?: ExposeMode;
  port?: number;
  dataDir?: string;
  publicDir?: string;
  requireApiAuth?: boolean;
  apiToken?: string;
  returnApiToken?: boolean;
}

interface RuntimeInfo {
  [key: string]: string;
}

interface ApplyScheduleParams {
  workspacePath?: string;
  morningCommand?: string;
  nightlyCommand?: string;
  dryRun?: boolean;
}

interface BoardPublishParams {
  title: string;
  description?: string;
  source?: string;
  priority?: "low" | "medium" | "high";
  dueAt?: string;
  suggestedAgent?: string;
  payload?: unknown;
  createdBy?: string;
}

interface BoardListParams {
  status?: BoardStatus | "all";
  limit?: number;
}

interface BoardClaimParams {
  taskId: string;
  agentId: string;
}

interface BoardCompleteParams {
  taskId: string;
  agentId: string;
  resultNote?: string;
  success?: boolean;
}

interface GetLinkParams {
  includeApiToken?: boolean;
}

interface SelfCheckParams {
  workspacePath?: string;
  boardPath?: string;
  autoFix?: boolean;
}

interface BoardTask {
  id: string;
  title: string;
  description: string;
  source: string;
  status: BoardStatus;
  priority: "low" | "medium" | "high";
  dueAt: string | null;
  suggestedAgent: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  claimedBy: string | null;
  claimedAt: string | null;
  completedBy: string | null;
  completedAt: string | null;
  resultNote: string | null;
  payload: unknown;
}

interface BoardPaths {
  tasksFile: string;
  eventsFile: string;
}

interface HeartbeatBuildResult {
  workspacePath: string;
  configPath: string;
  heartbeatPath: string;
  morningTime: string;
  nightlyTime: string;
  content: string;
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

function toError(error: string, details?: unknown) {
  return toResult({
    ok: false,
    error,
    details,
  });
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

function resolvePathFromRoot(p: string): string {
  if (path.isAbsolute(p)) return p;
  return path.resolve(resolvedConfig.systemRoot, p);
}

function nowIso() {
  return new Date().toISOString();
}

function getBoardPaths(boardPathOverride?: string): BoardPaths {
  const tasksFile = resolvePathFromRoot(boardPathOverride || resolvedConfig.boardPath);
  const eventsFile = path.join(path.dirname(tasksFile), "events.ndjson");
  return { tasksFile, eventsFile };
}

function ensureParentDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function loadBoardTasks(paths: BoardPaths): BoardTask[] {
  if (!fs.existsSync(paths.tasksFile)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(paths.tasksFile, "utf8"));
    return Array.isArray(raw) ? (raw as BoardTask[]) : [];
  } catch {
    return [];
  }
}

function saveBoardTasks(paths: BoardPaths, tasks: BoardTask[]) {
  ensureParentDir(paths.tasksFile);
  fs.writeFileSync(paths.tasksFile, JSON.stringify(tasks, null, 2), "utf8");
}

function appendBoardEvent(paths: BoardPaths, event: Record<string, unknown>) {
  ensureParentDir(paths.eventsFile);
  fs.appendFileSync(paths.eventsFile, `${JSON.stringify(event)}\n`, "utf8");
}

function maskToken(token: string | undefined) {
  if (!token) return "";
  if (token.length <= 6) return "***";
  return `${token.slice(0, 3)}***${token.slice(-3)}`;
}

function buildHeartbeatContent(morningTime: string, nightlyTime: string, morningCommand: string, nightlyCommand: string) {
  return [
    "## 日记系统定时任务",
    "",
    `- ${morningTime} ${morningCommand}`,
    `- ${nightlyTime} ${nightlyCommand}`,
    "",
  ].join("\n");
}

function prepareHeartbeatData(workspacePathRaw: string, morningCommand: string, nightlyCommand: string): HeartbeatBuildResult {
  const workspacePath = resolvePathFromRoot(workspacePathRaw);
  const configPath = path.join(workspacePath, "config.json");
  const heartbeatPath = path.join(workspacePath, "HEARTBEAT.md");
  if (!fs.existsSync(configPath)) {
    throw new Error(`config.json not found: ${configPath}`);
  }

  let cfg: any;
  try {
    cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (e) {
    throw new Error(`failed to parse config.json: ${String(e)}`);
  }

  const morningTime = cfg.morning_time;
  const nightlyTime = cfg.nightly_time;
  if (!morningTime || !nightlyTime) {
    throw new Error(`config.json missing morning_time or nightly_time: ${configPath}`);
  }

  const content = buildHeartbeatContent(morningTime, nightlyTime, morningCommand, nightlyCommand);
  return {
    workspacePath,
    configPath,
    heartbeatPath,
    morningTime,
    nightlyTime,
    content,
  };
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
    returnApiToken: {
      type: "boolean",
      description: "是否在返回中包含明文 token（默认 false）",
    },
  },
};

const EmptySchema = {
  type: "object",
  additionalProperties: false,
  properties: {},
};

const GetLinkParamsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    includeApiToken: {
      type: "boolean",
      description: "是否在返回中包含明文 token（默认 false）",
    },
  },
};

const ApplyScheduleParamsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    workspacePath: {
      type: "string",
      description: "workspace 路径，默认读取插件配置 workspacePath",
    },
    morningCommand: {
      type: "string",
      description: "早报命令，默认 /daily:morning 早报",
    },
    nightlyCommand: {
      type: "string",
      description: "晚间命令，默认 /daily:tracker 晚间日记提醒",
    },
    dryRun: {
      type: "boolean",
      description: "只预览不写文件",
    },
  },
};

const SelfCheckParamsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    workspacePath: {
      type: "string",
      description: "workspace 路径，默认读取插件配置 workspacePath",
    },
    boardPath: {
      type: "string",
      description: "白板任务文件路径，默认读取插件配置 boardPath",
    },
    autoFix: {
      type: "boolean",
      description: "是否自动修复可修复项（HEARTBEAT 与白板文件）",
    },
  },
};

const BoardPublishParamsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", description: "任务标题" },
    description: { type: "string", description: "任务详情" },
    source: { type: "string", description: "任务来源，例如 daily-reflection" },
    priority: { type: "string", enum: ["low", "medium", "high"], description: "任务优先级" },
    dueAt: { type: "string", description: "到期时间，ISO 时间字符串" },
    suggestedAgent: { type: "string", description: "建议领取该任务的 agentId" },
    payload: { type: "object", description: "附加结构化数据" },
    createdBy: { type: "string", description: "发布者 agentId" },
  },
  required: ["title"],
};

const BoardListParamsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: {
      type: "string",
      enum: ["all", "new", "claimed", "done", "failed"],
      description: "按状态筛选，默认 all",
    },
    limit: {
      type: "number",
      description: "返回数量限制，默认 20",
    },
  },
};

const BoardClaimParamsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    taskId: { type: "string", description: "任务 ID" },
    agentId: { type: "string", description: "领取任务的 agentId" },
  },
  required: ["taskId", "agentId"],
};

const BoardCompleteParamsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    taskId: { type: "string", description: "任务 ID" },
    agentId: { type: "string", description: "完成任务的 agentId" },
    resultNote: { type: "string", description: "完成说明或结果摘要" },
    success: { type: "boolean", description: "是否成功完成（默认 true）" },
  },
  required: ["taskId", "agentId"],
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
      workspacePath: { type: "string" },
      boardPath: { type: "string", default: "/tmp/daily-system-board/tasks.json" },
    },
  },

  register(api: any) {
    const logger = api.logger;
    const raw: DailyPluginConfig = api.config?.plugins?.entries?.["daily-system"]?.config ?? {};

    resolvedConfig = {
      enabled: raw.enabled ?? true,
      systemRoot: raw.systemRoot ?? path.resolve(__dirname, ".."),
      defaultExposeMode: raw.defaultExposeMode ?? "local",
      workspacePath: raw.workspacePath ?? "",
      boardPath: raw.boardPath ?? "/tmp/daily-system-board/tasks.json",
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
              hasApiToken: Boolean(runtime.API_TOKEN),
              apiToken: params.returnApiToken ? runtime.API_TOKEN || "" : "",
              apiTokenMasked: runtime.API_TOKEN ? maskToken(runtime.API_TOKEN) : "",
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
          parameters: GetLinkParamsSchema,
          async execute(_id: string, params: GetLinkParams) {
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
              hasApiToken: Boolean(runtime.API_TOKEN),
              apiToken: params.includeApiToken ? runtime.API_TOKEN || "" : "",
              apiTokenMasked: runtime.API_TOKEN ? maskToken(runtime.API_TOKEN) : "",
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

      api.registerTool(
        {
          name: "daily_apply_schedule",
          description:
            "Read workspace config.json and generate/update HEARTBEAT.md for daily morning/nightly schedule.",
          parameters: ApplyScheduleParamsSchema,
          async execute(_id: string, params: ApplyScheduleParams) {
            const workspacePathRaw = params.workspacePath || resolvedConfig.workspacePath;
            if (!workspacePathRaw) {
              return toError("workspacePath is required (pass param or set plugin config.workspacePath)");
            }
            const morningCommand = params.morningCommand || "/daily:morning 早报";
            const nightlyCommand = params.nightlyCommand || "/daily:tracker 晚间日记提醒";
            let heartbeatData: HeartbeatBuildResult;
            try {
              heartbeatData = prepareHeartbeatData(workspacePathRaw, morningCommand, nightlyCommand);
            } catch (e) {
              return toError("failed to build heartbeat content", {
                workspacePath: workspacePathRaw,
                error: String(e),
              });
            }

            if (!params.dryRun) {
              fs.mkdirSync(heartbeatData.workspacePath, { recursive: true });
              fs.writeFileSync(heartbeatData.heartbeatPath, heartbeatData.content, "utf8");
            }

            return toResult({
              ok: true,
              workspacePath: heartbeatData.workspacePath,
              configPath: heartbeatData.configPath,
              heartbeatPath: heartbeatData.heartbeatPath,
              written: !params.dryRun,
              content: heartbeatData.content,
            });
          },
        },
        { optional: false }
      );

      api.registerTool(
        {
          name: "daily_self_check",
          description:
            "Run one-click self check for scripts/workspace/heartbeat/board/runtime. Supports auto-fix for heartbeat and board file.",
          parameters: SelfCheckParamsSchema,
          async execute(_id: string, params: SelfCheckParams) {
            const checks: Array<{
              name: string;
              ok: boolean;
              level: "error" | "warn";
              details: unknown;
            }> = [];
            const addCheck = (name: string, ok: boolean, details: unknown, level: "error" | "warn" = "error") => {
              checks.push({ name, ok, level, details });
            };
            const autoFix = params.autoFix === true;

            const scripts = [
              { key: "start", p: startScript },
              { key: "status", p: statusScript },
              { key: "stop", p: stopScript },
            ];
            for (const script of scripts) {
              const exists = fs.existsSync(script.p);
              let executable = false;
              if (exists) {
                try {
                  fs.accessSync(script.p, fs.constants.X_OK);
                  executable = true;
                } catch {
                  executable = false;
                }
              }
              addCheck(`script_${script.key}`, exists && executable, { path: script.p, exists, executable });
            }

            const statusRun = runBash(statusScript);
            addCheck(
              "status_command",
              statusRun.status === 0,
              {
                exitCode: statusRun.status,
                output: (statusRun.stdout || "").trim(),
                stderr: (statusRun.stderr || "").trim(),
              }
            );

            const workspacePathRaw = params.workspacePath || resolvedConfig.workspacePath;
            let heartbeatData: HeartbeatBuildResult | null = null;
            if (!workspacePathRaw) {
              addCheck(
                "workspace_path_config",
                false,
                { message: "workspacePath not configured (param or plugin config.workspacePath required)" },
                "warn"
              );
            } else {
              try {
                heartbeatData = prepareHeartbeatData(
                  workspacePathRaw,
                  "/daily:morning 早报",
                  "/daily:tracker 晚间日记提醒"
                );
                addCheck("workspace_config", true, {
                  workspacePath: heartbeatData.workspacePath,
                  configPath: heartbeatData.configPath,
                  morningTime: heartbeatData.morningTime,
                  nightlyTime: heartbeatData.nightlyTime,
                });
              } catch (e) {
                addCheck("workspace_config", false, { workspacePath: workspacePathRaw, error: String(e) });
              }
            }

            if (heartbeatData) {
              const heartbeatExists = fs.existsSync(heartbeatData.heartbeatPath);
              if (!heartbeatExists && autoFix) {
                fs.mkdirSync(path.dirname(heartbeatData.heartbeatPath), { recursive: true });
                fs.writeFileSync(heartbeatData.heartbeatPath, heartbeatData.content, "utf8");
                addCheck("heartbeat_file", true, {
                  heartbeatPath: heartbeatData.heartbeatPath,
                  fixed: true,
                  reason: "file created",
                });
              } else {
                addCheck("heartbeat_file", heartbeatExists, { heartbeatPath: heartbeatData.heartbeatPath }, "warn");
              }

              if (fs.existsSync(heartbeatData.heartbeatPath)) {
                const current = fs.readFileSync(heartbeatData.heartbeatPath, "utf8").trim();
                const expected = heartbeatData.content.trim();
                const matched = current === expected;
                if (!matched && autoFix) {
                  fs.writeFileSync(heartbeatData.heartbeatPath, heartbeatData.content, "utf8");
                  addCheck("heartbeat_content", true, {
                    heartbeatPath: heartbeatData.heartbeatPath,
                    fixed: true,
                    reason: "content updated",
                  });
                } else {
                  addCheck("heartbeat_content", matched, { heartbeatPath: heartbeatData.heartbeatPath }, "warn");
                }
              }
            }

            const boardPaths = getBoardPaths(params.boardPath);
            const boardDir = path.dirname(boardPaths.tasksFile);
            let boardDirWritable = false;
            try {
              fs.mkdirSync(boardDir, { recursive: true });
              const probe = path.join(boardDir, `.probe_${Date.now()}`);
              fs.writeFileSync(probe, "ok", "utf8");
              fs.rmSync(probe);
              boardDirWritable = true;
              addCheck("board_dir_write", true, { boardDir });
            } catch (e) {
              addCheck("board_dir_write", false, { boardDir, error: String(e) });
            }

            if (boardDirWritable) {
              if (!fs.existsSync(boardPaths.tasksFile) && autoFix) {
                fs.writeFileSync(boardPaths.tasksFile, "[]\n", "utf8");
                addCheck("board_file", true, { boardPath: boardPaths.tasksFile, fixed: true, reason: "file created" });
              } else if (!fs.existsSync(boardPaths.tasksFile)) {
                addCheck("board_file", false, { boardPath: boardPaths.tasksFile }, "warn");
              } else {
                try {
                  const parsed = JSON.parse(fs.readFileSync(boardPaths.tasksFile, "utf8"));
                  addCheck("board_file", Array.isArray(parsed), {
                    boardPath: boardPaths.tasksFile,
                    isArray: Array.isArray(parsed),
                    count: Array.isArray(parsed) ? parsed.length : null,
                  });
                } catch (e) {
                  addCheck("board_file", false, { boardPath: boardPaths.tasksFile, error: String(e) });
                }
              }
            }

            const runtime = parseRuntimeEnv();
            addCheck(
              "runtime_metadata",
              Object.keys(runtime).length > 0,
              {
                runtimeFile,
                mode: runtime.EXPOSE_MODE || null,
                url: runtime.URL || null,
              },
              "warn"
            );

            const failed = checks.filter((c) => !c.ok && c.level === "error").length;
            const warned = checks.filter((c) => !c.ok && c.level === "warn").length;

            return toResult({
              ok: failed === 0,
              autoFix,
              summary: {
                total: checks.length,
                failed,
                warned,
              },
              paths: {
                systemRoot: resolvedConfig.systemRoot,
                workspacePath: workspacePathRaw || null,
                boardPath: boardPaths.tasksFile,
              },
              checks,
            });
          },
        },
        { optional: false }
      );

      api.registerTool(
        {
          name: "daily_board_publish",
          description: "Publish a task into the shared daily board for multi-agent consumption.",
          parameters: BoardPublishParamsSchema,
          async execute(_id: string, params: BoardPublishParams) {
            if (!params.title?.trim()) {
              return toError("title is required");
            }

            const paths = getBoardPaths();
            const tasks = loadBoardTasks(paths);
            const now = nowIso();
            const task: BoardTask = {
              id: `task_${Date.now()}_${randomUUID().slice(0, 8)}`,
              title: params.title.trim(),
              description: (params.description || "").trim(),
              source: (params.source || "daily-system").trim(),
              status: "new",
              priority: params.priority || "medium",
              dueAt: params.dueAt || null,
              suggestedAgent: params.suggestedAgent || null,
              createdBy: params.createdBy || "daily-system",
              createdAt: now,
              updatedAt: now,
              claimedBy: null,
              claimedAt: null,
              completedBy: null,
              completedAt: null,
              resultNote: null,
              payload: params.payload ?? {},
            };

            tasks.push(task);
            saveBoardTasks(paths, tasks);
            appendBoardEvent(paths, {
              type: "task_published",
              at: now,
              taskId: task.id,
              title: task.title,
              source: task.source,
              createdBy: task.createdBy,
            });

            return toResult({
              ok: true,
              boardPath: paths.tasksFile,
              task,
            });
          },
        },
        { optional: false }
      );

      api.registerTool(
        {
          name: "daily_board_list",
          description: "List tasks from the shared daily board.",
          parameters: BoardListParamsSchema,
          async execute(_id: string, params: BoardListParams) {
            const paths = getBoardPaths();
            const status = params.status || "all";
            const limit = Math.max(1, Math.min(200, Math.floor(params.limit || 20)));
            const tasks = loadBoardTasks(paths)
              .filter((t) => (status === "all" ? true : t.status === status))
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .slice(0, limit);
            return toResult({
              ok: true,
              boardPath: paths.tasksFile,
              total: tasks.length,
              tasks,
            });
          },
        },
        { optional: false }
      );

      api.registerTool(
        {
          name: "daily_board_claim",
          description: "Claim a board task for one agent.",
          parameters: BoardClaimParamsSchema,
          async execute(_id: string, params: BoardClaimParams) {
            const paths = getBoardPaths();
            const tasks = loadBoardTasks(paths);
            const idx = tasks.findIndex((t) => t.id === params.taskId);
            if (idx < 0) {
              return toError("task not found", { taskId: params.taskId });
            }
            const task = tasks[idx];
            if (task.status !== "new") {
              return toError("task is not claimable", {
                taskId: task.id,
                status: task.status,
                claimedBy: task.claimedBy,
              });
            }
            const now = nowIso();
            task.status = "claimed";
            task.claimedBy = params.agentId;
            task.claimedAt = now;
            task.updatedAt = now;

            saveBoardTasks(paths, tasks);
            appendBoardEvent(paths, {
              type: "task_claimed",
              at: now,
              taskId: task.id,
              agentId: params.agentId,
            });

            return toResult({
              ok: true,
              task,
            });
          },
        },
        { optional: false }
      );

      api.registerTool(
        {
          name: "daily_board_complete",
          description: "Complete or fail a claimed board task.",
          parameters: BoardCompleteParamsSchema,
          async execute(_id: string, params: BoardCompleteParams) {
            const paths = getBoardPaths();
            const tasks = loadBoardTasks(paths);
            const idx = tasks.findIndex((t) => t.id === params.taskId);
            if (idx < 0) {
              return toError("task not found", { taskId: params.taskId });
            }
            const task = tasks[idx];
            if (task.status !== "claimed") {
              return toError("task is not in claimed status", {
                taskId: task.id,
                status: task.status,
              });
            }
            if (task.claimedBy && task.claimedBy !== params.agentId) {
              return toError("task claimed by another agent", {
                taskId: task.id,
                claimedBy: task.claimedBy,
              });
            }

            const now = nowIso();
            const success = params.success !== false;
            task.status = success ? "done" : "failed";
            task.completedBy = params.agentId;
            task.completedAt = now;
            task.resultNote = (params.resultNote || "").trim() || null;
            task.updatedAt = now;

            saveBoardTasks(paths, tasks);
            appendBoardEvent(paths, {
              type: success ? "task_done" : "task_failed",
              at: now,
              taskId: task.id,
              agentId: params.agentId,
              resultNote: task.resultNote,
            });

            return toResult({
              ok: true,
              task,
            });
          },
        },
        { optional: false }
      );

      logger.info(
        "[daily-system] tools registered: daily_start_service, daily_status, daily_get_link, daily_stop_service, daily_apply_schedule, daily_self_check, daily_board_publish, daily_board_list, daily_board_claim, daily_board_complete"
      );
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
