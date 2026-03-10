# CHANGELOG

## [1.4.0] - 2026-03-11

### 新增
- Runtime 插件新增 `daily_apply_schedule`：从 `workspace/config.json` 生成/更新 `HEARTBEAT.md`
- Runtime 插件新增白板工具：`daily_board_publish`、`daily_board_list`、`daily_board_claim`、`daily_board_complete`
- 支持多 agent 协作任务板（默认白板路径可配置）

### 修改
- `daily_get_link` 默认不返回明文 token，需显式请求
- README 与 extension 文档补充插件运作机制、调用顺序与白板协作流程

## [1.3.0] - 2026-03-11

### 新增
- M1 安全与运维加固：`server` 鉴权/路径安全/body 限制 + `deploy` 启停状态脚本 + smoke test
- M2 Runtime 插件首版：`daily_start_service`、`daily_status`、`daily_get_link`、`daily_stop_service`
- 架构文档：`docs/ARCHITECTURE.md` 与 `docs/M1-TODO.md`

### 修改
- `daily-tracker`、`daily-morning`、`daily-reminder` 切换为 tool-first 工作流
- `daily-install` 在更新/重装时同步执行 `openclaw plugins install -l ./extension`

## [1.2.0] - 2026-03-10

### 新增
- 网页打卡 Step 1 支持粘贴流水账：贴入带时间点的文本，自动解析为时间线条目
- `UPGRADING.md`：agent 执行更新时的版本迁移说明
- `CONTRIBUTING.md`：开发者迭代流程规范
- `CHANGELOG.md`：版本变更记录

## [1.1.0] - 2026-03-10

### 新增
- `/daily:morning` 早报 Skill：基于昨日复盘推荐今日待办
- `/daily:install` Skill：系统更新和重装（首次安装流程内联至 README）
- `plugin.json` 新增 `repository` 和 `install` 字段
- `workspace-template/config.json` 新增 `_schema` 字段说明

### 修改
- 移除白天四次打卡，改为仅晚间一次记录
- 晚间触发改为轮询机制（每 `poll_interval_minutes` 分钟检查，超过 `give_up_time` 放弃）
- README 合并为人类 + Agent 双视角单文件
- 所有时间点改为从 `workspace/config.json` 读取

### 修复
- tracker 数据路径补全为 `{install_path}/data/diary/YYYY-MM-DD.json`
- daily-morning 跨月路径解析（YYYY/MM 取自 YESTERDAY 本身）
- 移除 day-reflection 中不存在的 `/weekly-review` 引用
- 统一所有路径占位符为 `{install_path}` / `{workspace}`

## [1.0.0] - 2026-03-01

### 新增
- 初始版本：daily-tracker、diary-builder、day-reflection 三个 Skill
- 网页打卡三步式流程
- `plugin.json` Plugin 清单
- `deploy/start.sh` 一键启动脚本
