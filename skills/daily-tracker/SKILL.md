---
name: daily-tracker
description: 日记系统收集层。负责晚间提醒、轮询等待用户提交日记、接收数据并触发整理+分析流程。
---

# daily-tracker（日记收集）

## 职责

只做一件事：**确保今天的日记被记录下来**。

整理交给 diary-builder，分析交给 day-reflection，早报交给 daily-morning。

---

## 晚间触发流程

在 `config.nightly_time`（默认 22:30）触发，执行以下流程：

```
1. 发送晚间提醒 + 打卡链接
2. 等待 config.poll_interval（默认 30 分钟）
3. 检查今日是否已有提交数据
   ├── 已提交 → 立即进入「数据处理流程」
   └── 未提交 → 再次发提醒，重复等待
4. 超过 config.give_up_time（默认 01:00）→ 停止轮询
   └── 记录「今日未记录」状态，次日早报时补充提示
```

**每日只触发一次**。触发状态记录在 `{workspace}/diary/YYYY/MM/YYYY-MM-DD_state.json`。

### 提醒话术

首次提醒：
```
今天过得怎么样？来记一下今天的流水账吧 →
[打卡链接]
```

轮询催促（第 N 次）：
```
还没记哦，花 5 分钟写一下？→ [打卡链接]
```

放弃时：
```
今天先跳过，明天继续。
```

---

## 数据处理流程（用户提交后立即执行）

```
1. 读取 {install_path}/data/diary/YYYY-MM-DD.json
2. 写入 {workspace}/diary/YYYY/MM/YYYY-MM-DD.json
3. 路径首次使用时记入 MEMORY.md
4. 检查数据中是否已有网页追问补全（存在 supplement: true 的条目）
   ├── 有补充条目 → 跳过 /daily:builder，直接进入第 5 步
   └── 无补充条目 → 调用 /daily:builder 进行 AI 追问
5. builder 完成后（或跳过后）立即调用 /daily:reflect 生成复盘
6. 将复盘摘要发送给用户
```

---

## 打卡入口

用户发送「打卡链接」时：

1. 检查 server 是否运行：`curl -s http://localhost:8888`
2. 未运行则启动：`cd {install_path} && node server/server.js &`
3. 若需外网访问，启动 cloudflare tunnel
4. 返回链接给用户

打卡网页是三步式流程：
- **Step 1** `/`：填写时间线
- **Step 2** `/review.html`：自动追问补全（diary-builder 规则）
- **Step 3** `/report.html?date=YYYY-MM-DD`：展示分析结果

---

## 数据格式

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

## 命令

| 命令 | 功能 |
|------|------|
| 「打卡链接」 | 获取打卡链接 |
| 「今天日记」 | 查看今天日记原始数据 |
| 「昨天日记」 | 查看昨天日记 |
| 「复盘」 | 手动触发晚间汇总流程 |

---

## 反馈与迭代

每次运行结束后询问用户：
「这次的收集有没有哪里不对劲？」

收到反馈后：
- 小调整（措辞/时间节点）→ 直接修改本 SKILL.md
- 功能新增 → 追加「待迭代」章节，用户确认后实施
- 记录到 MEMORY.md：日期 + 改了什么 + 为什么
