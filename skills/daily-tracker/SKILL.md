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
1. 优先读取 `{install_path}/data/diary/YYYY/MM/YYYY-MM-DD_record.json`（不存在时回退 `.../YYYY-MM-DD.json`）
2. 写入 `{workspace}/diary/YYYY/MM/YYYY-MM-DD.json`
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

1. **优先调用工具** `daily_status`
2. 若未运行：
   - 默认调用 `daily_start_service`（`exposeMode=local`）
   - 用户明确要求外网链接时，调用 `daily_start_service`（`exposeMode=tunnel`）
3. 调用 `daily_get_link` 获取最终链接
4. 将链接发给用户（若 `requireApiAuth=true`，内部流程保留 token，不在群聊明文暴露）
5. 若 tool 层不可用，再回退到 shell 脚本方式（见下方兜底）

打卡网页是三步式流程：
- **Step 1** `/`：自由输入原文（时间线可选）
- **Step 2** `/review.html`：自动解析 + 追问补全（diary-builder 规则）
- **Step 3** `/report.html?date=YYYY-MM-DD`：展示分析结果

### 工具优先执行规范（M2）

严格按以下顺序：

```text
A. daily_status
   -> running: true  => B
   -> running: false => daily_start_service -> B

B. daily_get_link
   -> 返回 url/localUrl/mode/requireApiAuth
   -> 把用户可访问链接发出
```

工具调用参数建议：

- 本地默认：
  - `daily_start_service({ "exposeMode": "local" })`
- 用户要求手机外网可访问时：
  - `daily_start_service({ "exposeMode": "tunnel" })`

### 失败回退（仅兜底）

仅当以下任一条件成立时使用 shell：

- `daily_*` 工具不存在（runtime plugin 未安装）
- 工具调用连续失败 2 次
- 网关工具层不可用

兜底命令：

```bash
cd {install_path}
bash deploy/start.sh
# 外网模式：EXPOSE_MODE=tunnel bash deploy/start.sh
bash deploy/status.sh
```

---

## 数据格式

```json
{
  "date": "2026-03-10",
  "raw": {
    "text": "原始自由文本..."
  },
  "parsed": {
    "parserVersion": "freeform-v1"
  },
  "timeline": [
    { "time": "09:00", "text": "起床", "tag": "生活", "supplement": false },
    { "time": "09:00–10:00", "text": "通勤", "tag": "生活", "supplement": true }
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
