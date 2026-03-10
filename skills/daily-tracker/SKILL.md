---
name: daily-tracker
description: 完美日记系统 - 全天分散收集 + 极简打卡 + 自动分析 + 晚间反馈。唯一入口，统一管理。
---

# 📡 Daily Tracker - 完美日记系统

**版本:** 2.0  
**定位:** 唯一入口，统一管理所有日记数据流  
**核心理念:** 让记录变得极简，让反思变得自然

---

## 核心流程

```
全天分散收集 ─→ 极简网页打卡 ─→ 自动处理 ─→ 晚间反馈
```

---

## 🌅 全天收集（我主动问你）

| 时间 | 触发 | 内容 | 记录到 |
|------|------|------|--------|
| 09:00 | 早安 | 今天 TOP 3 目标？ | morning_goals |
| 12:00 | 午安 | 上午完成得怎样？ | noon_progress |
| 15:00 | 下午好 | 卡在哪里了？ | afternoon_block |
| 21:00 | 晚安 | 自动汇总 + 分析 | evening_summary |

---

## 📱 极简网页打卡

**链接:** （通过 `/diary-link` 获取）

**字段:**
1. 日期（可选，默认今天）
2. 时间线 - 今天做了什么
3. 分类 - 📄工作 📖学习 👥关系 🔋健康 ☕休闲 🏠生活
4. 最有价值的事
5. 身体/情绪信号
6. 角色关联
7. 心情 - 🟢高效 🟡一般 🔴疲惫
8. 明日目标

**特点:**
- 外网可访问
- 30秒完成
- 自动保存
- 可填任意日期

---

## 🔄 自动处理流

```
1. 收到数据 → 存到 memory/daily-tracker/{date}.json
                 ↓
2. 生成 Obsidian 格式 → journal/日记/2026/{date}.md
                 ↓
3. 可选：调用 diary-builder 完善时间线
                 ↓
4. 可选：调用 day-reflection 分析
                 ↓
5. 晚间反馈报告
```

---

## 📋 命令清单

| 命令 | 功能 |
|------|------|
| `/diary-link` | 获取打卡链接 |
| `/today` | 查看今天日记 |
| `/yesterday` | 查看昨天日记 |
| `/diary 3月9日` | 查看指定日期 |
| `/diary-builder` | 完善时间线 |
| `/reflect` | 深度复盘分析 |
| `/zeno-diary` | 完善我的日记 |
| `/nightly` | 晚间报告 |

---

## 📁 数据存储

### 原始数据
`memory/daily-tracker/YYYY-MM-DD.json`

### Obsidian 日记
`{obsidian_path}/{YYYY_MM_DD}.md` (可在配置中设置)

### 我的日记
`{data_path}/{YYYY-MM-DD}.md` (可在配置中设置)

---

## ⚡ 快速开始

**1. 获取打卡链接**
```
发送: 打卡链接
```

**2. 每天填写**
- 打开链接
- 填完提交
- 我自动处理

**3. 晚间收反馈**
- 我会汇总分析
- 给你洞察报告

---

## 🎯 设计原则

1. **极简优先** - 最少输入，最大价值
2. **主动督促** - 我追着你，不是你追着我
3. **数据联动** - 一次填写，多处使用
4. **按需扩展** - 需要时再调用深度分析
5. **双向完善** - 完善你的 + 完善我的

---

## 🔧 配置

```json
{
  "enabled": true,
  "collect_times": {
    "morning": "09:00",
    "noon": "12:00",
    "afternoon": "15:00",
    "evening": "21:00"
  },
  "auto_analyze": true,
  "obsidian_path": "/path/to/your/obsidian/diary",
  "data_path": "/path/to/your/data/storage"
}
```

---

## 依赖 Skills

- **diary-builder** - 完善柳比歇夫时间线（可选）
- **day-reflection** - 深度分析统计（可选）
- **zeno-diary-builder** - 完善我的日记（可选）

这些是**模块**，由 daily-tracker 按需调用。
