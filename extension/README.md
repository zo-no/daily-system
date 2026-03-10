# Daily System Runtime Plugin

为 `daily-system` 提供运行时工具（tool）层，供 skills 调用。

## 工具列表

- `daily_start_service`
- `daily_status`
- `daily_get_link`
- `daily_stop_service`

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
          "defaultExposeMode": "local"
        }
      }
    }
  }
}
```

## 说明

- 插件默认读取 `/tmp/daily-system/runtime.env` 获取当前 URL/模式/token 信息。
- 本插件只负责生命周期工具。策略和路由仍由 `skills/` 决定。
