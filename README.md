# Daily System — AI Agent 部署指南

**定位:** 给 AI Agent 看的项目文档，帮助 Agent 理解、部署并运维这个日记系统。

---

## 项目概述

一个极简个人日记系统，包含：
- **网页界面**（三步式打卡，供用户填写）
- **Node.js 服务器**（接收并临时存储数据）
- **OpenClaw Skills**（AI 分析处理，数据最终存入 agent workspace）

---

## 系统架构

```
用户 ──[填写]──> web/index.html（Step1）
                    ↓
             web/review.html（Step2 diary-builder 追问）
                    ↓
             POST /api/submit
                    ↓
             server.js 存入 data/diary/YYYY-MM-DD.json
                    ↓
             Agent 读取 → 存入 workspace/diary/YYYY/MM/
                    ↓
             diary-builder / day-reflection 分析
                    ↓
             web/report.html 展示 + 晚间反馈给用户
```

### 文件结构

```
daily-system/
├── server/server.js          # 后端：接收打卡数据，提供分析 API
├── web/
│   ├── index.html            # Step 1：填写时间线
│   ├── review.html           # Step 2：diary-builder 追问补充
│   └── report.html           # Step 3：柳比歇夫统计展示
├── skills/
│   ├── daily-tracker/        # 主入口 skill（本系统核心）
│   ├── diary-builder/        # 时间线完善规则
│   └── day-reflection/       # 深度分析规则
├── data/                     # server 临时存储（部署时自动创建）
│   └── diary/                # 打卡数据 YYYY-MM-DD.json
└── docs/DEPLOYMENT.md        # 详细部署文档
```

---

## 部署流程

### 第一步：环境检查

```bash
node --version   # 需要 >= 16
git --version
```

### 第二步：启动服务器

```bash
git clone https://github.com/zo-no/daily-system.git
cd daily-system
node server/server.js
# 服务运行在 http://localhost:8888
```

服务器会自动创建 `data/diary/` 目录，无需手动创建。

### 第三步：安装 Skills 到 workspace

```bash
# 找到 agent 的 workspace 路径（通常在 ~/.openclaw/agents/{name}/workspace/）
# 将 skills 复制过去
cp -r skills/* {workspace}/skills/
```

### 第四步：初始化 workspace

Agent 首次部署时执行（详见 `skills/daily-tracker/ARCHITECTURE.md` 首次部署清单）：

1. 在 workspace 创建 `diary/YYYY/MM/` 目录
2. 将路径写入 MEMORY.md
3. 在 HEARTBEAT.md 中添加定时任务（09/12/15/21 点问卡）
4. 发打卡链接给用户，引导第一次打卡

**HEARTBEAT.md 配置**（复制到 `{workspace}/HEARTBEAT.md`）：
```markdown
## 日记系统定时任务

- 09:00 daily-tracker 早安卡：问今日 TOP3 目标
- 12:00 daily-tracker 午安卡：问上午进度
- 15:00 daily-tracker 下午卡：问当前状态
- 21:00 daily-tracker 晚间汇总：收集数据 → 整理 → 分析 → 反馈
```

---

## API 说明

| 方法 | 路径 | 功能 |
|------|------|------|
| `POST` | `/api/submit` | 接收完整打卡数据（含补充时间线） |
| `GET` | `/api/report/:date` | 返回指定日期的分析数据 JSON |
| `GET` | `/api/dates` | 列出所有有记录的日期 |
| `GET` | `/*` | 静态文件（web/ 目录） |

**数据格式**（`/api/submit` 接收 / `/api/report/:date` 返回）：

```json
{
  "date": "2026-03-10",
  "timeline": [
    { "time": "09:00", "text": "起床", "supplement": false },
    { "time": "09:00–10:00", "text": "通勤", "supplement": true }
  ],
  "mood": "high",
  "insight": "今天效率不错",
  "tomorrow": "完成项目文档"
}
```

---

## Agent 工作流

### 日常数据流转

```
1. 用户通过网页打卡 → server 存入 data/diary/YYYY-MM-DD.json
2. Agent 在晚间汇总时读取该文件
3. Agent 将数据存入 workspace/diary/YYYY/MM/YYYY-MM-DD.json
4. Agent 调用 diary-builder（可选）完善时间线
5. Agent 调用 day-reflection 生成分析
6. Agent 将复盘结果反馈给用户
```

### Skill 调用顺序

```
daily-tracker（入口）
    ↓
diary-builder（完善时间线，可选）
    ↓
day-reflection（统计分析）
```

### `/diary-link` 实现

Agent 收到此命令时：
1. 确认 server 是否在运行（`curl http://localhost:8888`）
2. 若未运行，执行 `node server/server.js &` 启动
3. 若需要外网访问，启动 ngrok/cloudflare tunnel 并获取公网地址
4. 将访问链接发送给用户

---

## 故障排除

| 问题 | 解决方式 |
|------|----------|
| 端口 8888 被占用 | 修改 `server/server.js` 中 `CONFIG.port` |
| 网页无法访问 | 检查 `ps aux \| grep "node server"` |
| 数据未保存 | 检查 `data/diary/` 目录是否存在 |
| Skills 找不到 | 检查 workspace/skills/ 路径是否正确 |

---

## 验证清单

- [ ] `http://localhost:8888` 可以访问
- [ ] 填写时间线并提交，`data/diary/` 下生成 JSON 文件
- [ ] `http://localhost:8888/report.html?date=今天日期` 可以展示分析
- [ ] workspace/skills/ 下有 daily-tracker、diary-builder、day-reflection
- [ ] workspace/MEMORY.md 记录了日记数据路径
