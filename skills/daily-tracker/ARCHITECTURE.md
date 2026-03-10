# 日记系统架构

## 三层结构

```
收集层  daily-tracker   → 晚间提醒、轮询等待、数据存储
整理层  diary-builder   → 补全时间线空白
分析层  day-reflection  → 统计 + 洞察 + 行动建议
早报层  daily-morning   → 基于昨日复盘推荐今日待办
```

---

## 完整数据流

```
晚间 [nightly_time，默认 22:30]
        ↓
  /daily:tracker 发提醒 + 打卡链接
        ↓ 每 30 分钟轮询检查
  用户打开网页打卡（三步式）
    Step1: 填写时间线（web/index.html）
    Step2: 自动追问补全（web/review.html）
    Step3: 展示分析结果（web/report.html）
        ↓
  POST /api/submit
        ↓
  server 存入 {daily-system}/data/diary/YYYY-MM-DD.json
        ↓
  检查是否有 supplement:true 条目
    有 → 跳过 diary-builder
    无 → 调用 /daily:builder 追问补全
        ↓
  调用 /daily:reflect 生成复盘报告
        ↓
  发送复盘摘要给用户

次日早晨 [morning_time，默认 08:00]
        ↓
  /daily:morning 读昨日复盘 + 人生目标
        ↓
  发今日待办建议
```

---

## 文件分布

```
{daily-system}/               ← 项目代码（git 管理）
├── plugin.json               ← Plugin 清单
├── server/server.js          ← 后端服务
├── web/                      ← 打卡网页
└── data/diary/               ← server 临时存储

{workspace}/                  ← agent 工作区（长期存储）
├── config.json               ← 用户配置（时间/风格）
├── HEARTBEAT.md              ← 定时任务配置
└── diary/
    ├── 人生目标.md            ← 动态更新的参照系
    └── YYYY/MM/
        ├── YYYY-MM-DD.json          ← 原始打卡数据
        ├── YYYY-MM-DD_AI生成.md     ← diary-builder 输出（可选）
        ├── YYYY-MM-DD_复盘.md       ← day-reflection 输出
        └── YYYY-MM-DD_state.json    ← 当天触发状态
```

---

## Heartbeat 配置

安装时由 `/daily:install` 写入 `{workspace}/HEARTBEAT.md`，时间从 config.json 读取：

```markdown
## 日记系统定时任务

- {morning_time} /daily:morning 早报
- {nightly_time} /daily:tracker 晚间日记提醒
```
