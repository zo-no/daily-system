---
name: daily-tracker
description: 完美日记系统 - 全天分散收集 + 极简网页打卡 + 自动分析 + 晚间反馈。唯一入口，统一管理。
---

# 📡 Daily Tracker - 完美日记系统

**定位:** 唯一入口，统一管理所有日记数据流
**核心理念:** 让记录变得极简，让反思变得自然

---

## 核心流程

```
全天分散收集 ─→ 极简网页打卡（三步式）─→ 自动处理 ─→ 晚间反馈
```

---

## 🌅 全天收集（主动问）

| 时间 | 触发 | 内容 |
|------|------|------|
| 09:00 | 早安 | 今天 TOP 3 目标？ |
| 12:00 | 午安 | 上午完成得怎样？ |
| 15:00 | 下午好 | 卡在哪里了？ |
| 21:00 | 晚安 | 自动汇总 + 分析 |

---

## 📱 网页打卡（三步式）

服务器运行在 `daily-system/` 项目目录下（`node server/server.js`），默认端口 8888。

**Step 1 — 填写时间线** (`/`)
- 日期 + 时间线条目（快捷按钮 + 手动添加）
- 心情、今日感悟、明日计划（选填）

**Step 2 — 补充完善** (`/review.html`)
- 前端自动分析时间线，按 diary-builder 规则生成追问
- 用户回答后合并 `[补充]` 内容

**Step 3 — 分析展示** (`/report.html?date=YYYY-MM-DD`)
- 柳比歇夫六类时间统计 + 完整时间线
- 纯展示，无需填写

---

## 🔄 收到打卡数据后的处理流

```
POST /api/submit 收到数据
        ↓
1. 保存到 workspace/diary/YYYY/MM/YYYY-MM-DD.json
        ↓
2. 可选：调用 /diary-builder 深度完善时间线
        ↓
3. 可选：调用 /day-reflection 分析统计
        ↓
4. 晚间反馈报告
```

---

## 📁 数据存储

**存储位置由 agent 自主决定，存入 workspace 内合适的目录，并将实际路径记录到 MEMORY.md。**

推荐结构（可根据实际调整）：

```
workspace/
└── diary/
    └── YYYY/
        └── MM/
            ├── YYYY-MM-DD.json        # 原始打卡数据（来自 /api/submit）
            └── YYYY-MM-DD_AI生成.md   # diary-builder 完善后的版本（可选）
```

**首次使用时：**
1. 在 workspace 内创建 `diary/YYYY/MM/` 目录
2. 将实际绝对路径写入 `MEMORY.md`，格式示例：
   ```
   ## 日记数据路径
   - 打卡数据：{workspace}/diary/YYYY/MM/YYYY-MM-DD.json
   ```
3. 后续直接从 MEMORY.md 读取路径，无需重新确认

**数据格式**（来自 `/api/submit`）：
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

## 📋 命令清单

| 命令 | 功能 |
|------|------|
| `/diary-link` | 获取打卡链接（启动服务器并返回访问地址） |
| `/today` | 查看今天日记 |
| `/yesterday` | 查看昨天日记 |
| `/diary YYYY-MM-DD` | 查看指定日期日记 |
| `/diary-builder` | 深度完善时间线（AI 追问版） |
| `/reflect` | 柳比歇夫统计 + 深度复盘 |
| `/nightly` | 晚间汇总报告 |

---

## 🎯 设计原则

1. **极简优先** - 最少输入，最大价值
2. **主动督促** - 追着用户记，不是用户追着 AI
3. **数据联动** - 一次填写，多处使用
4. **按需扩展** - 需要时再调用深度分析
5. **路径自治** - 存储路径由 agent 决定并记忆，不硬编码

---

## 依赖 Skills

- **diary-builder** - 完善柳比歇夫时间线（可选，手动或自动触发）
- **day-reflection** - 深度分析统计（可选，手动或自动触发）
