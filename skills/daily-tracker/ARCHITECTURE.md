# 日记系统架构

## 三层结构

```
收集层  daily-tracker   → 问卡、打卡入口、存数据
整理层  diary-builder   → 补全时间线空白
分析层  day-reflection  → 统计 + 洞察 + 行动建议
```

---

## 完整数据流

```
定时问卡（09/12/15/21点）
        ↓
用户打开网页打卡（三步式）
  Step1: 填写时间线
  Step2: review.html 自动追问（diary-builder 规则）
  Step3: report.html 展示
        ↓
POST /api/submit
        ↓
server 存入 {daily-system}/data/diary/YYYY-MM-DD.json
        ↓
21:00 agent 晚间汇总
  → 读取数据，写入 workspace/diary/YYYY/MM/
  → 调用 diary-builder（深度补全，可选）
  → 调用 day-reflection（统计分析）
  → 发送复盘摘要给用户
```

---

## 文件分布

```
{daily-system}/               ← 项目代码（git 管理）
├── server/server.js
├── web/index.html
├── web/review.html
├── web/report.html
└── data/diary/               ← server 临时存储

{workspace}/                  ← agent 工作区（长期存储）
└── diary/
    └── YYYY/
        └── MM/
            ├── YYYY-MM-DD.json          ← 原始打卡数据
            ├── YYYY-MM-DD_AI生成.md     ← diary-builder 输出（可选）
            ├── YYYY-MM-DD_复盘.md       ← day-reflection 输出
            └── YYYY-MM-DD_state.json    ← 当天问卡触发状态
```

---

## Heartbeat 配置

在 `{workspace}/HEARTBEAT.md` 中添加以下任务，agent 会在每次 heartbeat 时检查并按时触发：

```markdown
## 日记系统定时任务

- 09:00 daily-tracker 早安卡：问今日 TOP3 目标
- 12:00 daily-tracker 午安卡：问上午进度
- 15:00 daily-tracker 下午卡：问当前状态
- 21:00 daily-tracker 晚间汇总：收集数据 → 整理 → 分析 → 反馈
```

---

## 首次部署清单

Agent 首次部署时按顺序执行：

1. **启动 server**
   ```bash
   cd {daily-system目录}
   node server/server.js &
   ```

2. **初始化 workspace 目录**
   ```bash
   mkdir -p {workspace}/diary/$(date +%Y)/$(date +%m)
   ```

3. **记录路径到 MEMORY.md**
   ```
   ## 日记系统路径
   - daily-system 项目：{绝对路径}
   - 日记数据：{workspace}/diary/YYYY/MM/YYYY-MM-DD.json
   - 人生目标：{workspace}/docs/人生目标.md
   ```

4. **写入 HEARTBEAT.md**（见上方配置）

5. **发送打卡链接给用户**，引导完成第一次打卡
