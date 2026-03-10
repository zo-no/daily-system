# Daily System — 项目概览文档

> 本文档面向 AI 编程工具（如 Claude Code、Cursor、Copilot）快速理解项目结构与目标。

---

## 项目定位

**Daily System** 是一个极简个人日记与时间管理系统，核心理念是：

- **极简收集**：30 秒完成一次打卡，降低记录门槛
- **AI 主动督促**：AI 按时追着用户记录，而不是用户追着 AI
- **深度反思**：柳比歇夫式时间统计 + 身份检查 + 洞察分析
- **数据闭环**：收集 → 处理 → 分析 → 反馈，形成完整闭环

---

## 目录结构

```
daily-system/
├── README.md                    # AI Agent 部署指南
├── PROJECT.md                   # 本文档（项目概览）
├── package.json                 # 项目配置（零外部依赖）
│
├── server/
│   └── server.js                # Node.js 后端服务（原生 HTTP）
│
├── web/                         # 前端网页（纯 HTML/CSS/JS）
│   ├── index.html               # 统一入口，重定向到 log.html
│   ├── log.html                 # 极简日志记录界面（主入口）
│   ├── daily-checkin.html       # 完整日记打卡表单
│   └── zeno-diary.html          # AI 自我日记完善表单
│
├── skills/                      # AI Skill 模块（OpenClaw Skills）
│   ├── daily-tracker/
│   │   ├── SKILL.md             # 唯一日记入口 Skill（主控模块）
│   │   └── ARCHITECTURE.md      # 系统架构设计文档
│   ├── diary-builder/
│   │   └── SKILL.md             # 时间线完善 Skill
│   ├── day-reflection/
│   │   └── SKILL.md             # 柳比歇夫统计与反思 Skill
│   └── zeno-diary-builder/
│       └── SKILL.md             # AI 自我日记完善 Skill
│
├── docs/
│   └── DEPLOYMENT.md            # 完整部署指南
│
└── data/                        # 运行时数据目录（部署后自动创建）
    ├── raw-logs/                 # 原始日志（.txt）
    ├── daily-tracker/            # 处理后的日记（.json）
    └── zeno-diary/               # AI 日记（.json）
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js >= 16，原生 `http` 模块，无第三方依赖 |
| 前端 | 纯 HTML5 + CSS3 + Vanilla JS，GitHub Dark 风格 |
| 数据存储 | 本地文件系统（JSON / TXT） |
| 进程管理 | PM2（生产）/ 直接 node 运行（开发） |
| 容器化 | Docker（可选） |
| 外网访问 | Cloudflare Tunnel / Ngrok（可选） |
| AI 处理 | OpenClaw Skills 系统 |

---

## 后端服务（server/server.js）

服务器运行在 **端口 8888**，提供：

### API 端点

| 方法 | 路径 | 功能 |
|------|------|------|
| `POST` | `/api/log` | 接收原始日志记录 |
| `POST` | `/api/diary` | 接收完整打卡日记 |
| `POST` | `/api/zeno-diary` | 接收 AI 自我日记 |
| `GET` | `/*` | 静态文件服务（web/ 目录） |

### 配置常量

```javascript
const CONFIG = {
  port: 8888,
  dataPath: './data',     // 数据存储根目录
  publicPath: './web'     // 静态文件目录
};
```

数据按日期保存为独立文件，服务器启动时自动创建所需目录。

---

## 前端页面（web/）

### log.html（主要使用界面）
- 极简两字段：**时间点 + 做了什么**
- 目标：30 秒完成一条记录
- 调用 `POST /api/log`

### daily-checkin.html（完整打卡）
- 字段：时间线、分类（工作/学习/关系/健康/休闲/生活）、最有价值的事、身体情绪信号、人生目标关联、心情、明日目标
- 调用 `POST /api/diary`

### zeno-diary.html（AI 日记）
- 供 AI（Zeno）填写自己的日记
- 字段：补充时间线、今日洞察、今日成就、遇到困难、明天行动
- 调用 `POST /api/zeno-diary`

---

## Skill 模块（skills/）

Skill 是 AI 处理模块，由 OpenClaw 系统调用。每个 Skill 有对应的 `SKILL.md` 定义其行为。

### daily-tracker（主控模块）
- **职责**：统一入口，协调所有日记数据
- **定时触发**：09:00 早安卡 / 12:00 午安卡 / 15:00 下午卡 / 21:00 晚安卡
- **数据输出**：`data/daily-tracker/{date}.json` + Obsidian 格式日记
- **触发命令**：`/today`、`/yesterday`、`/diary-link`、`/nightly`

### diary-builder（时间线完善）
- **职责**：将零散记录补全为小时级粒度的完整时间线
- **核心原则**：原始记录一字不改（神圣性），补充内容标记 `[补充]`
- **输出规范**：原文件 `YYYY_MM_DD.md` 不动，生成新文件 `YYYY_MM_DD_AI生成.md`
- **触发命令**：`/diary-builder`

### day-reflection（深度反思）
- **职责**：柳比歇夫式时间统计 + 模式洞察 + 身份检查 + 明日行动
- **输出四层**：
  - L1 时间统计（6 类分类 + 可视化时间线）
  - L2 模式洞察（高效时段、黑洞识别、能量曲线）
  - L3 身份检查（对比人生目标，检查行动错位）
  - L4 明日行动（一个可立即执行的小改变）
- **时间分类**：🟢 核心工作 / 🔵 个人发展 / 🟡 生活管理 / 🟠 社交娱乐 / ⚪ 休息 / 🔴 消耗黑洞
- **触发命令**：`/reflect`、`/day-reflection`

### zeno-diary-builder（AI 自我日记）
- **职责**：帮 AI（Zeno）完善自己的日记
- **分析维度**：时间线、洞察、成就、卡点、学习
- **触发命令**：`/zeno-diary`

---

## 数据流

```
用户操作 / AI 定时触发
        ↓
  网页打卡 (web/)
        ↓
  server.js 接收 → 按日期写入 data/
        ↓
  daily-tracker Skill 处理
        ↓
  ┌─────────────────────────────┐
  │  diary-builder   （可选）   │  ← 完善时间线
  │  day-reflection  （可选）   │  ← 深度反思
  │  zeno-diary-builder（可选） │  ← AI 日记
  └─────────────────────────────┘
        ↓
  Obsidian / 晚间报告
```

---

## 启动方式

```bash
# 开发模式
node server/server.js

# 生产模式（PM2）
pm2 start server/server.js --name daily-system

# 访问地址
http://localhost:8888
```

---

## 设计原则

1. **零外部依赖** — `package.json` 无任何第三方包，纯 Node.js 原生
2. **极简优先** — 最少输入，最大价值
3. **原始数据神圣** — AI 补充内容永远标记，不覆盖原始记录
4. **本地优先** — 数据存本地文件，完全控制隐私
5. **模块化扩展** — Skill 模块独立，按需调用，不强制执行
6. **犀利风格** — 反思反馈直指问题，不给模糊安慰

---

## 关键文件速查

| 文件 | 作用 |
|------|------|
| `server/server.js` | 后端入口，API + 静态服务 |
| `web/log.html` | 用户最常用的记录界面 |
| `skills/daily-tracker/SKILL.md` | 系统主控逻辑 |
| `skills/daily-tracker/ARCHITECTURE.md` | 完整架构设计 |
| `docs/DEPLOYMENT.md` | 部署配置指南 |
