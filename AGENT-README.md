# Daily System — AI Agent 操作手册

**定位:** 给 AI Agent 看的项目文档，帮助 Agent 理解、部署并运维这个日记系统。

---

## 项目概述

这是一个 **OpenClaw Plugin**，命名空间 `daily`，包含四个 Skill：

| 命令 | 职责 |
|------|------|
| `/daily:install` | 安装层：一键安装，从 clone 到 workspace 初始化全流程 |
| `/daily:tracker` | 收集层：晚间提醒、轮询等待、数据存储、触发后续流程 |
| `/daily:builder` | 整理层：时间线补全、追问细节 |
| `/daily:reflect` | 分析层：柳比歇夫统计、模式洞察、行动建议 |
| `/daily:morning` | 早报层：基于昨日复盘，推荐今日待办 |

系统组成：
- **网页界面**（三步式打卡，供用户填写）
- **Node.js 服务器**（接收并临时存储数据）
- **OpenClaw Plugin**（AI 分析处理，数据最终存入 agent workspace）

---

## 每日流程

```
[早晨 config.morning_time，默认 08:00]
    /daily:morning 发送早报
    └── 基于昨日复盘 + 人生目标，推荐今日待办

[白天无打卡，用户自由活动]

[晚间 config.nightly_time，默认 22:30]
    /daily:tracker 发送提醒 + 打卡链接
        ↓ 每 config.poll_interval 分钟检查一次
        ├── 已提交 → /daily:builder 整理时间线
        │               ↓ 完成后立即
        │           /daily:reflect 生成复盘报告
        │               ↓
        │           发送复盘摘要给用户
        └── 超过 config.give_up_time（默认 01:00）→ 停止轮询，记录「今日未记录」
```

---

## 文件结构

```
daily-system/
├── plugin.json                      # Plugin 清单
├── skills/
│   ├── daily-tracker/SKILL.md       # /daily:tracker
│   ├── diary-builder/SKILL.md       # /daily:builder
│   ├── day-reflection/SKILL.md      # /daily:reflect
│   └── daily-morning/SKILL.md       # /daily:morning
├── server/server.js                 # 后端：接收打卡数据
├── web/
│   ├── index.html                   # Step 1：填写时间线
│   ├── review.html                  # Step 2：追问补全
│   └── report.html                  # Step 3：展示分析
├── workspace-template/              # 首次部署模板，按说明复制到用户 workspace
│   ├── config.json                  # 用户配置模板（含字段说明）
│   └── diary/
│       └── 人生目标.md              # 角色定义模板
├── data/                            # server 临时存储（自动创建）
└── deploy/
    ├── README.md                    # 部署操作入口
    ├── start.sh                     # 一键启动
    ├── cloudflared.sh               # 仅外网 tunnel
    └── DOCKER.md                    # Docker 部署
```

**workspace 运行时结构**（agent 维护）：

```
{workspace}/
├── config.json                      # 用户配置
├── diary/
│   ├── 人生目标.md                  # 动态更新的参照系
│   └── YYYY/MM/
│       ├── YYYY-MM-DD.json          # 原始打卡数据
│       ├── YYYY-MM-DD_AI生成.md     # diary-builder 补全结果
│       ├── YYYY-MM-DD_复盘.md       # day-reflection 复盘报告
│       └── YYYY-MM-DD_state.json    # 当日触发状态
```

---

## 首次部署流程

### 第一步：启动服务器

```bash
bash deploy/start.sh
# 等待约 10 秒，输出外网链接
```

### 第二步：和用户讨论配置（必做）

按顺序询问用户以下问题，**不要一次性全问**，一问一答：

**① 时间偏好**
```
「你一般几点睡觉？我来决定几点提醒你写日记。」
「早上几点起床？我来决定几点发早报。」
```
根据回答推算：
- `nightly_time` = 睡前 1.5 小时
- `morning_time` = 起床后 30 分钟

**② 风格偏好**
```
「复盘报告你喜欢什么风格？
  A. 犀利直接，直接指出问题
  B. 温和鼓励，多肯定少批评」
```
写入 `config.style`：`direct` 或 `gentle`

**③ 人生目标讨论**
```
「现在聊几分钟，帮你建一个时间参照系。
  你现在生活里最重要的几件事是什么？
  比如工作、学习、健康、家庭……」
```
引导用户说出 3-5 个角色，追问每个角色每周大概想投入多少时间。

然后问：
```
「有没有什么事是你知道自己容易陷进去、但不想花太多时间的？」
```

根据讨论结果，生成并写入 `{workspace}/diary/人生目标.md`，给用户看一遍确认。

### 第三步：初始化 workspace

```bash
# 复制模板
cp workspace-template/config.json {workspace}/config.json
cp workspace-template/diary/人生目标.md {workspace}/diary/人生目标.md
mkdir -p {workspace}/diary/$(date +%Y/%m)
```

按讨论结果填写 `{workspace}/config.json`（删除 `_schema` 字段，填入用户实际偏好），写入 `人生目标.md`。

根据 config 中的时间，写入 `{workspace}/HEARTBEAT.md`：
```markdown
## 日记系统定时任务

- {config.morning_time} /daily:morning 早报
- {config.nightly_time} /daily:tracker 晚间日记提醒
```

将路径记入 MEMORY.md：
```
日记数据路径：{workspace}/diary/
配置文件：{workspace}/config.json
```

### 第四步：发送欢迎消息

```
好了，日记系统已经部署完毕！

打卡链接：[外网链接]（建议存到手机桌面）

接下来：
• 每天 [morning_time] 我会发今日建议
• 每天 [nightly_time] 我会提醒你写日记
• 写完后我会自动整理 + 生成复盘

你也可以随时说：
• 「打卡链接」— 获取链接
• 「今天日记」— 查看记录
• 「复盘」— 手动触发分析
```

---

## 人生目标动态更新规则

- `/daily:reflect` 发现某类时间连续 14 天出现但不在目标中 → 建议新增角色
- `/daily:morning` 发现某个角色连续 7 天投入为 0 → 建议确认是否仍有效
- **所有修改需用户确认后才写入**，agent 不自动改动

---

## 迭代流程

收到用户反馈后：
- **小调整**（措辞/时间节点）→ 直接修改对应 SKILL.md + 更新 config.json
- **功能新增** → 追加「待迭代」章节，用户确认后实施
- **记录变更** → 写入 MEMORY.md：日期 + 改了什么 + 为什么

---

## API 说明

| 方法 | 路径 | 功能 |
|------|------|------|
| `POST` | `/api/submit` | 接收完整打卡数据 |
| `GET` | `/api/report/:date` | 返回指定日期分析数据 JSON |
| `GET` | `/api/dates` | 列出所有有记录的日期 |
| `GET` | `/*` | 静态文件（web/ 目录） |

---

## 故障排除

| 问题 | 解决方式 |
|------|----------|
| 端口 8888 被占用 | 修改 `server/server.js` 中 `CONFIG.port` |
| 网页无法访问 | `ps aux \| grep "node server"` |
| 数据未保存 | 检查 `data/diary/` 目录是否存在 |
| 外网链接不出现 | 等待 15 秒，查看 `cat /tmp/diary-server.log` |

---

## 验证清单

- [ ] `plugin.json` 存在，四个 skill 路径正确
- [ ] `http://localhost:8888` 可以访问
- [ ] `{workspace}/config.json` 已按用户习惯填写
- [ ] `{workspace}/diary/人生目标.md` 已生成并用户确认
- [ ] 填写时间线并提交，`data/diary/` 下生成 JSON 文件
- [ ] workspace/MEMORY.md 记录了日记数据路径
- [ ] workspace/HEARTBEAT.md 已写入早报和晚间两个定时任务
