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
→ 按本文件「首次安装流程」章节执行，步骤完整，无需读其他文件

**情况 B：系统已安装，日常运维**
→ 读取 `{workspace}/config.json`，按时执行早报和晚间提醒

**情况 C：全新 agent，状态不明**
→ 检查 `{workspace}/config.json` 是否存在
- 存在 → 情况 B
- 不存在 → 询问用户「要安装日记系统吗？」→ 情况 A

**情况 D：用户说「更新日记系统」**
→ 执行 `/daily:install`，详见 `skills/daily-install/SKILL.md`
→ 更新后读 `UPGRADING.md` 对应版本章节，执行迁移操作并告知用户

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

## Runtime Plugin（M2）

运行时工具插件位于 `extension/`，负责把 daily-system 的“服务生命周期 + 定时同步 + 白板协作”封装为可调用 tools。

- `daily_start_service`
- `daily_status`
- `daily_get_link`
- `daily_stop_service`
- `daily_apply_schedule`
- `daily_board_publish`
- `daily_board_list`
- `daily_board_claim`
- `daily_board_complete`

### 插件是怎么运作的

1. OpenClaw 启动时加载 `extension/index.ts`，注册上述 tools。
2. `daily_start_service` 实际调用 `deploy/start.sh`。
3. `deploy/start.sh` 启动服务后会写入 `/tmp/daily-system/runtime.env`（URL、模式、端口、鉴权状态）。
4. `daily_status` 与 `daily_get_link` 读取 `runtime.env` 返回结构化状态。
5. `daily_stop_service` 调用 `deploy/stop.sh` 回收进程。
6. `daily_apply_schedule` 从 `workspace/config.json` 生成或更新 `workspace/HEARTBEAT.md`。
7. `daily_board_*` 将可执行项写入共享白板（`boardPath`），供多 agent 领取和完成。

### 正确使用方式（推荐顺序）

```text
1) daily_status
2) 若未运行 -> daily_start_service（默认 local，必要时 tunnel）
3) daily_get_link（拿给用户的访问地址）
4) 任务结束后 -> daily_stop_service（可选，按需回收）
```

白板协作顺序（多 agent）：

```text
1) daily_board_publish（发布任务）
2) daily_board_list（扫描待办）
3) daily_board_claim（领取）
4) daily_board_complete（回写结果）
```

### 参数与模式建议

- 默认使用 `local`：稳定、低风险、适合本机/内网。
- 用户明确需要外网访问时再用 `tunnel`。
- 需要保护 API 时，启动时传 `requireApiAuth=true`，必要时传入 `apiToken`。
- `daily_get_link` 默认不返回明文 token；需要时显式 `includeApiToken=true`。
- 不要在群聊明文回传 `apiToken`，只在 agent 内部使用。

安装（开发链接模式）：

```bash
cd {install_path}
openclaw plugins install -l ./extension
```

安装或更新后建议重启 gateway，确保新工具生效。

---

## 每日流程

```
早晨 [morning_time]
    /daily:morning → 昨日复盘 + 人生目标 → 发今日建议

晚间 [nightly_time]
    /daily:tracker → 发提醒 + 打卡链接
        ↓ 每 poll_interval 分钟轮询
        已提交 → 检查是否含 supplement:true 条目
                  有 → 跳过 /daily:builder
                  无 → /daily:builder 整理时间线
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

### Step 1：检查环境

```bash
node --version   # 需要 >= 16
git --version
```

不满足时告知用户：Node.js 用 `brew install node`，Git 用 `brew install git`，然后终止。

### Step 2：克隆代码

询问用户安装位置，默认 `~/daily-system`：
```
「代码放在哪里？直接回车用默认位置 ~/daily-system」
```

```bash
git clone https://github.com/zo-no/daily-system.git {install_path}
```

### Step 3：启动服务器

```bash
bash {install_path}/deploy/start.sh
```

等待约 15 秒，检查输出：
- 出现 `http://127.0.0.1:8888` → 记录本地地址
- 出现 `trycloudflare.com` 链接 → 记录外网地址

启动失败时查看 `/tmp/daily-system/server.log` 告知用户原因。

### Step 4：一问一答收集用户习惯（不要一次全问）

**① 睡眠时间**
```
「你一般几点睡觉？」
```
推算 `nightly_time` = 睡前 1.5 小时（最晚 23:30）

**② 起床时间**
```
「早上一般几点起？」
```
推算 `morning_time` = 起床后 30 分钟

**③ 复盘风格**
```
「复盘报告你喜欢哪种风格？A. 直接指出问题  B. 温和一些多肯定」
```
A → `style: "direct"`，B → `style: "gentle"`

**④ 人生目标讨论**
```
「最后聊几分钟。你现在生活里最重要的几件事是什么？说几个就行。」
```
追问每个角色每周想投入多少小时，再问：
```
「有没有什么事你容易陷进去但不想花太多时间的？」
```
根据讨论生成 `人生目标.md` 草稿，给用户看一遍确认后写入。

### Step 5：写入配置

```bash
mkdir -p {workspace}/diary/$(date +%Y/%m)
```

写入 `{workspace}/config.json`（按 Step 4 结果填写）：
```json
{
  "morning_time": "08:30",
  "nightly_time": "22:30",
  "poll_interval_minutes": 30,
  "give_up_time": "01:00",
  "style": "direct"
}
```

写入 `{workspace}/HEARTBEAT.md`：
```markdown
## 日记系统定时任务

- {morning_time} /daily:morning 早报
- {nightly_time} /daily:tracker 晚间日记提醒
```

写入 `{workspace}/MEMORY.md`：
```
daily-system 安装路径：{install_path}
日记数据路径：{workspace}/diary/
配置文件：{workspace}/config.json
```

### Step 6：发欢迎消息

```
好了，日记系统安装完毕 ✓

打卡链接：{外网链接}
（建议存到手机桌面，每晚用这个链接记录）

接下来我会：
• 每天 {morning_time} 发今日建议
• 每天 {nightly_time} 提醒你写日记
• 写完后自动整理 + 生成复盘报告

随时可以跟我说：
• 「打卡链接」— 重新获取链接
• 「今天日记」— 查看记录
• 「复盘」— 手动触发分析
```

### 安装失败处理

| 失败点 | 处理 |
|--------|------|
| git clone 失败 | 提示手动下载 zip：`https://github.com/zo-no/daily-system/archive/refs/heads/main.zip` |
| 端口 8888 被占用 | 询问用户用哪个端口，修改 `server/server.js` 中 `CONFIG.port` |
| 外网链接超时 | 先给本地链接，告知外网链接稍后在终端输出 |
| Node.js 版本过低 | `brew upgrade node` |

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
| 外网链接不出现 | 等待 15 秒，查看 `/tmp/daily-system/tunnel.log` |
| 数据未保存 | 检查 `{install_path}/data/diary/` 目录是否存在 |

---

## 验证清单

- [ ] `http://127.0.0.1:8888` 可以访问
- [ ] `{workspace}/config.json` 已按用户习惯填写
- [ ] `{workspace}/diary/人生目标.md` 已生成并用户确认
- [ ] `{workspace}/HEARTBEAT.md` 已写入两个定时任务
- [ ] `{workspace}/MEMORY.md` 记录了安装路径和数据路径
- [ ] 提交打卡后 `{install_path}/data/diary/` 下生成 JSON 文件
