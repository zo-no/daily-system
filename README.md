# Daily System — 极简 AI 日记助手

每晚 5 分钟记流水账，AI 自动整理时间线、生成柳比歇夫复盘、早上告诉你今天该做什么。

---

## 安装（复制这句话发给你的 AI）

```
去 https://github.com/zo-no/daily-system.git 下载并安装日记系统
```

AI 会自动完成所有步骤，途中问你几个问题（几点睡、几点起、生活里最重要的几件事），回答完就好了。

---

## 一天的流程

```
08:00  早报：「昨天核心工作 3h，今天建议先搞定项目文档」

       白天自由，不用打卡

22:30  AI 提醒写日记 → 打开链接填流水账（5 分钟）
                     → AI 整理时间线 + 生成复盘报告
```

## 常用命令（直接告诉 AI）

| 说什么 | 会发生什么 |
|--------|-----------|
| 「打卡链接」 | 获取打卡网页 |
| 「今天日记」 | 查看今天记录 |
| 「复盘」 | 手动触发复盘分析 |

---
---

# Agent 操作手册

> 以下内容面向 AI Agent。读完本节即可独立完成安装、运维和迭代。

## 你现在的职责

判断当前状态，执行对应操作：

**情况 A：用户让你安装**
→ 执行 `skills/daily-install/SKILL.md` 完整流程

**情况 B：系统已安装，日常运维**
→ 读取 `{workspace}/config.json`，按时执行早报和晚间提醒

**情况 C：全新 agent，状态不明**
→ 检查 `{workspace}/config.json` 是否存在
- 存在 → 情况 B
- 不存在 → 询问用户「要安装日记系统吗？」→ 情况 A

---

## 这是什么

OpenClaw Plugin，命名空间 `daily`，5 个 Skill：

| 命令 | 职责 |
|------|------|
| `/daily:install` | 一键安装：clone → 启动服务器 → 收集用户习惯 → 初始化 workspace |
| `/daily:tracker` | 晚间提醒、轮询等待、触发整理+分析 |
| `/daily:builder` | 时间线补全、追问细节 |
| `/daily:reflect` | 柳比歇夫统计、复盘报告 |
| `/daily:morning` | 早报、今日待办推荐 |

---

## 每日流程

```
早晨 [morning_time]
    /daily:morning → 昨日复盘 + 人生目标 → 发今日建议

晚间 [nightly_time]
    /daily:tracker → 发提醒 + 打卡链接
        ↓ 每 poll_interval 分钟轮询
        已提交 → /daily:builder 整理时间线
                     ↓
                 /daily:reflect 生成复盘
                     ↓
                 发复盘摘要给用户
        超过 give_up_time → 停止，次日早报补提示
```

---

## 文件结构

```
daily-system/
├── README.md                        # 本文件（人类 + Agent 双视角）
├── plugin.json                      # Plugin 清单
├── skills/
│   ├── daily-install/SKILL.md       # /daily:install
│   ├── daily-tracker/SKILL.md       # /daily:tracker
│   ├── diary-builder/SKILL.md       # /daily:builder
│   ├── day-reflection/SKILL.md      # /daily:reflect
│   └── daily-morning/SKILL.md       # /daily:morning
├── server/server.js                 # 后端：接收打卡数据（端口 8888）
├── web/
│   ├── index.html                   # Step 1：填写时间线
│   ├── review.html                  # Step 2：追问补全
│   └── report.html                  # Step 3：展示分析
├── workspace-template/
│   ├── config.json                  # 用户配置模板（含字段说明）
│   └── diary/人生目标.md            # 角色定义模板
└── deploy/
    ├── start.sh                     # 一键启动（server + cloudflared）
    └── README.md                    # 部署详情
```

workspace 运行时结构（agent 维护）：

```
{workspace}/
├── config.json                      # 用户配置
├── HEARTBEAT.md                     # 定时任务
└── diary/
    ├── 人生目标.md
    └── YYYY/MM/
        ├── YYYY-MM-DD.json          # 原始打卡数据
        ├── YYYY-MM-DD_AI生成.md     # builder 补全
        ├── YYYY-MM-DD_复盘.md       # reflect 输出
        └── YYYY-MM-DD_state.json    # 当日触发状态
```

---

## 首次安装流程

> 详细步骤见 `skills/daily-install/SKILL.md`，以下为概览。

**Step 1** 检查环境（node >= 16，git）

**Step 2** clone 代码
```bash
git clone https://github.com/zo-no/daily-system.git
```

**Step 3** 启动服务器
```bash
bash deploy/start.sh
# 等待约 15 秒，输出外网链接
```

**Step 4** 一问一答收集用户习惯（不要一次全问）
- 几点睡 → 推算 `nightly_time`（睡前 1.5h）
- 几点起 → 推算 `morning_time`（起床后 30min）
- 复盘风格 → `direct` 或 `gentle`
- 人生中最重要的几件事 → 生成 `人生目标.md`，给用户确认

**Step 5** 写入配置
```bash
mkdir -p {workspace}/diary/$(date +%Y/%m)
# 写入 config.json、人生目标.md、HEARTBEAT.md、MEMORY.md
```

HEARTBEAT.md 内容：
```markdown
## 日记系统定时任务

- {morning_time} /daily:morning 早报
- {nightly_time} /daily:tracker 晚间日记提醒
```

MEMORY.md 追加：
```
daily-system 安装路径：{install_path}
日记数据路径：{workspace}/diary/
配置文件：{workspace}/config.json
```

**Step 6** 发欢迎消息 + 打卡链接

---

## 人生目标动态更新

- `/daily:reflect`：某类时间连续 14 天出现但不在目标中 → 建议新增角色
- `/daily:morning`：某角色连续 7 天投入为 0 → 建议确认是否仍有效
- **所有修改需用户确认后才写入**，不自动改动

---

## 迭代流程

收到用户反馈后：
- 小调整 → 直接修改对应 SKILL.md + 更新 config.json
- 功能新增 → 追加「待迭代」章节，用户确认后实施
- 记录变更 → MEMORY.md：日期 + 改了什么 + 为什么

---

## 故障排除

| 问题 | 解决方式 |
|------|----------|
| 端口 8888 被占用 | 修改 `server/server.js` 中 `CONFIG.port` |
| 网页无法访问 | `ps aux \| grep "node server"` |
| 外网链接不出现 | 等待 15 秒，查看 `cat /tmp/diary-server.log` |
| 数据未保存 | 检查 `data/diary/` 目录是否存在 |

---

## 验证清单

- [ ] `http://localhost:8888` 可以访问
- [ ] `{workspace}/config.json` 已按用户习惯填写
- [ ] `{workspace}/diary/人生目标.md` 已生成并用户确认
- [ ] `{workspace}/HEARTBEAT.md` 已写入两个定时任务
- [ ] `{workspace}/MEMORY.md` 记录了安装路径和数据路径
- [ ] 提交打卡后 `data/diary/` 下生成 JSON 文件
