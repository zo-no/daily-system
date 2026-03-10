# Daily System Runtime Plugin

为 `daily-system` 提供运行时工具（tool）层，供 skills 调用。

## 工具列表

- `daily_start_service`
- `daily_status`
- `daily_get_link`
- `daily_stop_service`
- `daily_apply_schedule`
- `daily_board_publish`
- `daily_board_list`
- `daily_board_claim`
- `daily_board_complete`

## 运作机制

1. 插件入口：`extension/index.ts`
2. 执行脚本：`deploy/start.sh`、`deploy/status.sh`、`deploy/stop.sh`
3. 运行时状态文件：`/tmp/daily-system/runtime.env`

`daily_start_service` 会启动服务并刷新 `runtime.env`。  
`daily_status`/`daily_get_link` 读取该文件返回结构化信息。  
`daily_stop_service` 用于回收 server/tunnel 进程。

## 安装（开发链接）

在仓库根目录执行：

```bash
openclaw plugins install -l ./extension
```

## 配置示例

在 `~/.openclaw/openclaw.json` 中：

```json
{
  "plugins": {
    "entries": {
      "daily-system": {
        "enabled": true,
        "config": {
          "systemRoot": "/Users/kualshown/Desktop/daily-system",
          "defaultExposeMode": "local",
          "workspacePath": "/Users/kualshown/.openclaw/agents/main/workspace",
          "boardPath": "/tmp/daily-system-board/tasks.json"
        }
      }
    }
  }
}
```

## 说明

- 插件默认读取 `/tmp/daily-system/runtime.env` 获取当前 URL/模式/token 信息。
- 白板默认路径：`/tmp/daily-system-board/tasks.json`（同目录写 `events.ndjson`）。
- 本插件负责执行层（service/schedule/board）。策略和路由由 `skills/` 决定。

## 推荐调用顺序

```text
daily_status
-> (not running) daily_start_service
-> daily_get_link
-> daily_stop_service (optional)
```

### 定时任务同步

```text
daily_apply_schedule
```

读取 `workspace/config.json` 的 `morning_time/nightly_time`，更新 `workspace/HEARTBEAT.md`。

### 白板协作

```text
daily_board_publish
-> daily_board_list
-> daily_board_claim
-> daily_board_complete
```

适用于多 agent 分发与领取可执行任务。

## 参数示例

本地模式：

```json
{
  "exposeMode": "local"
}
```

外网模式：

```json
{
  "exposeMode": "tunnel"
}
```

开启 API 鉴权：

```json
{
  "exposeMode": "local",
  "requireApiAuth": true,
  "apiToken": "your-token"
}
```

返回 token（仅内部调用）：

```json
{
  "includeApiToken": true
}
```
