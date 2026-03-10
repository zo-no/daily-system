---
name: daily-reminder
description: 根据每日分析结果，自动设置行为规范提醒。分析复盘报告，提取需要改进的行为，设置定时提醒（如早睡、运动、学习等）。
---

# daily-reminder（行为规范提醒）

## 定位

根据每日/每周复盘分析，自动识别需要规范的行为，创建定时提醒，帮助人类养成好习惯。

## 核心功能

1. **分析复盘** - 读取复盘报告，识别需要改进的行为
2. **设置提醒** - 根据分析结果设置定时提醒
3. **执行提醒** - 到时间自动执行提醒（say 命令）
4. **跟踪效果** - 记录提醒执行情况

## 工作流程

```
1. 触发：每日复盘后（或手动）
2. 分析：读取复盘报告，提取"明日行动"项
3. 判断：哪些需要设置定时提醒
4. 设置：更新 config.json 中的 reminders
5. 执行：到时间自动 say 提醒
```

---

## 配置管理

### 读取配置

所有配置从 `{workspace}/config.json` 读取：

```json
{
  "morning_time": "08:00",
  "nightly_time": "23:30",
  "reminders": [
    {
      "id": "sleep_001",
      "type": "sleep",
      "time": "23:30",
      "message": "指挥官，该睡觉了！",
      "enabled": true,
      "created": "2026-03-10",
      "reason": "今日复盘：凌晨2点才睡，需要规范睡眠"
    }
  ],
  "reminder_config": {
    "enabled": true,
    "check_interval_minutes": 5,
    "sound_enabled": true,
    "default_voice": "Samantha"
  }
}
```

### reminder_config 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `enabled` | boolean | 是否启用提醒功能 |
| `check_interval_minutes` | integer | 检查提醒的间隔（分钟） |
| `sound_enabled` | boolean | 是否启用语音 |
| `default_voice` | string | TTS 语音（Mac say 可用语音） |

### reminder 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一标识 |
| `type` | string | 类型：sleep/study/exercise/rest/work |
| `time` | string | 提醒时间（HH:MM） |
| `message` | string | 提醒内容 |
| `enabled` | boolean | 是否启用 |
| `created` | string | 创建日期 |
| `reason` | string | 设置原因（从复盘分析得出） |

---

## 分析规则

根据复盘 L3/L4 内容识别需要提醒的行为：

| 行为类型 | 关键词 | 提醒示例 |
|----------|--------|----------|
| 睡眠 | "早点睡"、"23:00"、"睡眠不足"、"凌晨" | "该睡觉了" |
| 学习 | "学习时间"、"输入不够"、"阅读" | "今天学习了吗" |
| 运动 | "运动"、"锻炼"、"身体" | "该运动了" |
| 休息 | "休息"、"放松"、"别太累" | "休息一下吧" |
| 工作 | "超时"、"太晚"、"通宵" | "该休息了" |

---

## 设置提醒流程

### 1. 分析复盘

读取 `{workspace}/diary/YYYY/MM/YYYY-MM-DD_复盘.md`，提取 L4 "明日行动" 项。

### 2. 判断是否需要提醒

根据关键词判断该行为是否需要定时提醒。

### 3. 生成提醒配置

```json
{
  "id": "{type}_{timestamp}",
  "type": "sleep",
  "time": "23:30",
  "message": "指挥官，该睡觉了！",
  "enabled": true,
  "created": "2026-03-10",
  "reason": "复盘显示：凌晨2点才睡"
}
```

### 4. 更新 config.json

读取 → 修改 → 写入：

```bash
# 读取
jq ".reminders += [new_reminder]" config.json > tmp.json && mv tmp.json config.json
```

---

## 执行提醒

### 检查机制

定时检查当前时间是否有需要执行的提醒：

```bash
# 读取 config.json
CURRENT_TIME=$(date +%H:%M)
MESSAGE=$(jq -r ".reminders[] | select(.time == \"$CURRENT_TIME\" and .enabled == true) | .message" config.json)

if [ -n "$MESSAGE" ]; then
    say "$MESSAGE"
fi
```

### 语音提醒

使用 Mac 的 say 命令：

```bash
say "指挥官，该睡觉了！"
```

可选语音（通过 `say -v ?` 查看）：

```bash
say -v Samantha "指挥官，该睡觉了！"
say -v Ting-Ting "该休息了"
```

---

## 调用方式

```
/daily:reminder              # 分析今日复盘，设置提醒
/daily:reminder list         # 列出当前所有提醒
/daily:reminder add [type] [time] [message]  # 手动添加提醒
/daily:reminder delete [id]  # 删除提醒
/daily:reminder enable [id]  # 启用提醒
/daily:reminder disable [id]  # 禁用提醒
/daily:reminder test          # 测试语音
```

---

## 输出示例

### 设置提醒

```
✅ 已设置睡眠提醒
- 类型：sleep
- 时间：23:30
- 内容："指挥官，该睡觉了！"
- 原因：复盘显示凌晨2点才睡，需要规范睡眠
```

### 列出提醒

```
📌 当前提醒：
1. sleep_001 | 23:30 | "该睡觉了" | ✅ 启用
2. study_001 | 08:30 | "今天学习了吗" | ✅ 启用
```

---

## 文件位置

| 文件 | 用途 |
|------|------|
| `{workspace}/config.json` | 主配置（含 reminders 数组） |
| `{workspace}/diary/` | 日记数据目录 |
| `/tmp/diary-reminder.log` | 执行日志 |

---

## 依赖

- Mac 的 `say` 命令（或使用 TTS API）
- `jq` 命令（处理 JSON）
- 定时执行机制（cron / schedule / agent heartbeat）

---

## 待迭代

- [ ] 支持自定义提醒声音
- [ ] 支持多次提醒（提醒前 + 正式提醒）
- [ ] 周报汇总提醒执行效果
- [ ] 根据执行率自动调整提醒策略
- [ ] 支持其他 TTS（云端 API）
