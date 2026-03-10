# Daily System — 项目概览

> 面向 AI Agent。进入本项目后请先读完本文件，再读 `AGENT-README.md`。

---

## 这个项目是什么

一个 **OpenClaw Plugin**，帮用户每天记录流水账、自动整理时间线、生成柳比歇夫式复盘报告。

Plugin 命名空间：`daily`，包含 5 个 Skill：

| Skill | 命令 | 职责 |
|-------|------|------|
| daily-install | `/daily:install` | 一键安装全流程 |
| daily-tracker | `/daily:tracker` | 晚间提醒、轮询等待、触发整理+分析 |
| diary-builder | `/daily:builder` | 时间线补全、追问细节 |
| day-reflection | `/daily:reflect` | 柳比歇夫统计、复盘报告 |
| daily-morning | `/daily:morning` | 早报、今日待办推荐 |

---

## 你现在的职责

**判断当前状态，执行对应操作：**

### 情况 A：用户让你安装这个系统

执行 `skills/daily-install/SKILL.md` 的完整流程。

### 情况 B：系统已安装，日常运维

每天两个定时任务（时间从 `{workspace}/config.json` 读取）：
- 早晨：执行 `/daily:morning`
- 晚间：执行 `/daily:tracker`（提醒 → 轮询 → 整理 → 复盘）

用户说「打卡链接」「今天日记」「复盘」等关键词时，对应执行相关 Skill。

### 情况 C：全新 agent，不确定状态

检查 `{workspace}/config.json` 是否存在：
- 存在 → 情况 B，读取配置后继续运维
- 不存在 → 询问用户「要安装日记系统吗？」，确认后执行情况 A

---

## 每日流程一览

```
早晨 [morning_time]
  /daily:morning → 读昨日复盘 + 人生目标 → 发今日建议

白天无操作

晚间 [nightly_time]
  /daily:tracker → 发提醒 + 打卡链接
      ↓ 每 30 分钟轮询
      用户提交后 → /daily:builder 整理时间线
                       ↓
                   /daily:reflect 生成复盘
                       ↓
                   发复盘摘要给用户
      超过 give_up_time → 停止，次日早报补提示
```

---

## 关键文件速查

| 需要了解什么 | 读哪里 |
|-------------|--------|
| 完整部署流程 | `AGENT-README.md` |
| 安装 Skill 详细步骤 | `skills/daily-install/SKILL.md` |
| 晚间收集逻辑 | `skills/daily-tracker/SKILL.md` |
| 时间线补全规则 | `skills/diary-builder/SKILL.md` |
| 复盘报告生成 | `skills/day-reflection/SKILL.md` |
| 早报生成逻辑 | `skills/daily-morning/SKILL.md` |
| 用户配置 | `{workspace}/config.json` |
| 人生目标参照系 | `{workspace}/diary/人生目标.md` |
| 启动服务器 | `deploy/README.md` |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js >= 16，原生 `http` 模块，零外部依赖 |
| 前端 | 纯 HTML/CSS/JS |
| 外网访问 | Cloudflare Tunnel（`deploy/start.sh` 自动启动） |
| AI 处理 | OpenClaw Plugin（本项目） |
