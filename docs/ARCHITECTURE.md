# Daily System 架构设计（讨论版 v1）

## 1. 系统定位

Daily System 是一个「个人日常操作系统」，不是单一日记工具。

目标闭环：

`capture -> reflect -> discover -> schedule -> remind -> review`

- capture：采集当天行为/时间线
- reflect：复盘分析
- discover：发现下一步计划候选（后续新增）
- schedule：将候选计划变成可执行安排
- remind：按时间与策略提醒
- review：执行结果回写，进入下一轮

## 2. 三层架构

### 2.1 Core（系统内核）

职责：

- 事件存储（event store）
- 状态存储（state store）
- 调度（scheduler）
- 策略执行（policy）

原则：

- 不直接写页面，不直接处理用户对话
- 只暴露可复用的数据与执行接口

### 2.2 Runtime Plugin（执行层）

职责：

- 向 OpenClaw 注册工具（tools）
- 执行系统动作：服务生命周期、数据读写、分析触发、提醒触发

原则：

- 稳定 I/O 契约（输入输出 schema）
- 可观测（结构化日志、错误码）
- 支持 local-first，隧道能力可选

### 2.3 Skills（策略层）

职责：

- 决策：什么时候调哪个工具
- 参数映射：把自然语言需求转成工具参数
- 失败回退：工具失败时如何降级与重试

原则：

- Skill 只做路由和策略，不写底层执行细节

## 3. 当前系统映射

当前仓库已有：

- `skills/*`：策略与流程（已有）
- `server/server.js + web/*`：采集与展示（已有）
- `deploy/start.sh`：启动能力（已有）

当前缺口：

- 缺少 `extension/`（真正 runtime plugin 代码层）
- 缺少统一事件层（event/state）
- 安全与运维能力不足（鉴权、stop/status、路径安全）

## 4. 目标目录结构（演进后）

```txt
daily-system/
├── plugin.json
├── skills/
├── extension/                # OpenClaw runtime plugin（新增）
│   ├── index.ts
│   ├── openclaw.plugin.json
│   └── src/
│       ├── tools/
│       │   ├── service/
│       │   ├── journal/
│       │   └── plan/
│       └── core-adapters/
├── core/                     # 系统内核（新增，先最小实现）
│   ├── event-store/
│   ├── state-store/
│   └── scheduler/
├── server/
├── web/
└── deploy/
```

## 5. 里程碑规划

## M1（先稳住）

目标：安全、可运维、可回归

- 修复静态文件路径穿越风险
- API 增加 token 鉴权（至少写接口）
- `start/stop/status` 脚本标准化
- 本地优先模式（local），隧道可选（tunnel）
- 增加最小 smoke test（start -> submit -> report -> stop）

交付标准：

- 任意机器可稳定启动和停止
- 未授权请求不能写入/读取敏感数据
- 关键链路有可重复回归脚本

## M2（插件化）

目标：把系统动作工具化

新增 `extension/`，最小工具集：

- `daily_start_service`
- `daily_status`
- `daily_get_link`
- `daily_stop_service`
- `daily_get_report`（可选）
- `daily_submit_entry`（可选）

交付标准：

- skills 改为优先调用 `daily_*` 工具
- 工具返回结构化 JSON，错误可定位

## M3（计划发现）

目标：新增 discover 能力，不破坏现有链路

- 从复盘结果生成候选计划
- 输出建议，不自动强制排程
- 用户确认后写入明日计划

交付标准：

- 计划发现可解释（来源与理由可追溯）
- 不影响原有 tracker/reflect/morning 闭环

## 6. 当前决策（本轮讨论结论）

- 要做成 plugin（不是只靠 skills）
- 采用「plugin + skills」混合模式
- 系统定位为“Daily System”，后续可扩展计划发现机制
- 优先顺序：`M1 -> M2 -> M3`

