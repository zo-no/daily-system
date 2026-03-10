---
name: daily-tracker
description: 日记系统收集层。负责定时问卡、提供打卡入口、接收数据并存入 workspace。是整套日记流程的唯一入口。
---

# daily-tracker（日记收集）

## 职责

只做一件事：**把今天发生的事收集进来**。

整理交给 diary-builder，分析交给 day-reflection。

---

## 定时任务

Agent 在 heartbeat 时检查当前时间，按以下节点主动触发：

| 时间 | 动作 |
|------|------|
| 09:00 | 发早安卡：「今天 TOP 3 目标是什么？」 |
| 12:00 | 发午安卡：「上午完成得怎样？有没有卡住？」 |
| 15:00 | 发下午卡：「现在在做什么？遇到什么阻碍？」 |
| 21:00 | 晚间汇总：检查今天是否有打卡数据，触发整理+分析流程 |

**每个节点只触发一次**（当天已触发过则跳过）。触发状态记录在 `{workspace}/diary/YYYY/MM/YYYY-MM-DD_state.json`。

---

## 打卡入口

用户发送 `/diary-link` 时：

1. 检查 server 是否运行：`curl -s http://localhost:8888`
2. 未运行则启动：`cd {daily-system目录} && node server/server.js &`
3. 若需外网访问，启动 ngrok/cloudflare tunnel
4. 返回链接给用户

打卡网页是三步式流程：
- **Step 1** `/`：填写时间线
- **Step 2** `/review.html`：自动追问补全（diary-builder 规则）
- **Step 3** `/report.html?date=YYYY-MM-DD`：展示分析结果

---

## 数据接收

用户提交后，server 将数据存入 `{daily-system}/data/diary/YYYY-MM-DD.json`。

Agent 在 21:00 晚间汇总时：
1. 读取 `{daily-system}/data/diary/YYYY-MM-DD.json`
2. 写入 `{workspace}/diary/YYYY/MM/YYYY-MM-DD.json`
3. 路径首次使用时记入 MEMORY.md

**数据格式**：
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

## 晚间汇总流程（21:00）

```
1. 从 data/diary/ 读取今日数据 → 写入 workspace
2. 调用 diary-builder（可选，用户未在网页完善时）
3. 调用 day-reflection → 生成复盘报告
4. 将复盘摘要发送给用户
```

若今天没有打卡数据，提醒用户填写，发送打卡链接。

---

## 命令

| 命令 | 功能 |
|------|------|
| `/diary-link` | 获取打卡链接 |
| `/today` | 查看今天日记原始数据 |
| `/yesterday` | 查看昨天日记 |
| `/diary YYYY-MM-DD` | 查看指定日期 |
| `/nightly` | 手动触发晚间汇总 |
