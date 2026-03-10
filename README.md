# 📓 Daily System - 极简日记系统

**让记录变得极简，让反思变得自然**

一个基于 OpenClaw 的日记系统，提供全天分散收集、极简打卡、自动分析、晚间反馈等功能。

---

## ✨ 功能特性

- 🌅 **全天提醒** - 早上/中午/下午/晚上定时提醒
- 📱 **极简网页** - 只需填"时间 + 做什么"
- 🤖 **自动处理** - AI 自动补全、分类、统计、生成洞察
- 📊 **柳比歇夫统计** - 自动时间分类统计
- 📝 **多格式导出** - 支持 Obsidian 格式输出
- 🎯 **晚间反馈** - 自动生成每日复盘报告

---

## 👤 如果你是人，怎么用这个项目？

这个项目有两个部分：**网页界面** 和 **AI助手**。你可以只用网页，也可以搭配 AI 助手获得完整体验。

---

### 方案一：只用网页界面（最简单）

如果你只想用网页记录日记，不需要 AI 助手：

#### 1. 启动服务器
```bash
# 克隆项目
git clone https://github.com/zo-no/daily-system.git
cd daily-system

# 启动服务
node server/server.js
```

#### 2. 访问网页
打开浏览器访问: http://localhost:8888

#### 3. 开始记录
- **极简版** (`/log.html`) - 只记录"时间 + 做什么"
- **完整版** (`/checkin.html`) - 包含心情、感悟、明日计划

#### 4. 数据保存
你填的数据会保存在 `data/` 目录，可以自己查看或导入其他工具。

---

### 方案二：搭配 OpenClaw AI 助手（推荐）

如果你想获得**自动补全、统计、分析、晚间报告**等高级功能：

#### 1. 安装 OpenClaw
```bash
# 安装 OpenClaw
npm install -g openclaw
```

#### 2. 配置 AI 助手
将 `skills/` 目录下的技能复制到 OpenClaw:
```bash
cp -r skills/* ~/.openclaw/agents/your-agent/workspace/skills/
```

#### 3. 启动完整系统
```bash
# 启动网页服务器（后台）
node server/server.js &

# 启动 AI 助手
openclaw start --agent your-agent
```

#### 4. 使用流程
```
1. AI 助手会定时提醒你记录
2. 你打开网页填写
3. AI 自动分析、补全、生成报告
4. 晚间收到总结报告
```

---

### 方案三：集成到现有工作流

#### 与 Obsidian 集成
1. 在 skill 配置中设置 `obsidian_path` 为你的 Obsidian 日记目录
2. AI 会自动将日记同步到 Obsidian

#### 与 Notion 集成
1. 通过 Notion API 将数据同步到 Notion
2. 或导出 JSON 后手动导入

#### 与 GitHub 同步
1. 将 `data/` 目录设为 git 仓库
2. 自动同步到 GitHub 备份

---

## 🚀 快速开始（技术用户）

### 前置要求
- [OpenClaw](https://github.com/openclaw/openclaw)（可选）
- Node.js >= 16

### 1. 克隆仓库
```bash
git clone https://github.com/zo-no/daily-system.git
cd daily-system
```

### 2. 安装 Skills（如需 AI 助手）
将 `skills/` 目录下的所有 skill 复制到你的 OpenClaw workspace:
```bash
cp -r skills/* ~/.openclaw/agents/your-agent/workspace/skills/
```

### 3. 配置服务器
编辑 `server/server.js` 中的配置:
```javascript
const CONFIG = {
  port: 8888,
  dataPath: '/path/to/your/data',  // 数据存储路径
  publicPath: './web'              // 网页文件路径
};
```

### 4. 启动服务器
```bash
node server/server.js
```

### 5. 生成外网链接（可选）
使用 [cloudflared](https://github.com/cloudflare/cloudflared) 或 ngrok 暴露服务:
```bash
cloudflared tunnel --url http://localhost:8888
```

---

## 📖 Skills 介绍

| Skill | 功能 |
|-------|------|
| **daily-tracker** | 统一入口，管理所有日记流程 |
| **diary-builder** | 完善柳比歇夫时间线 |
| **day-reflection** | 深度分析统计 + 洞察 |
| **zeno-diary-builder** | 完善 AI 自己的日记 |

---

## 🎯 使用流程

### 只有网页版
```
1. 打开 http://localhost:8888/log.html
2. 填写"时间 + 做什么"
3. 点击提交
4. 数据保存到本地
```

### 搭配 AI 助手版
```
1. AI 定时提醒你（早上9点、中午12点等）
2. 你打开链接填写
3. AI 自动补全、分析、统计
4. AI 生成晚间报告发给你
```

### 具体步骤

#### 1. 获取打卡链接
向你的 OpenClaw 助手发送:
```
打卡链接
```
或
```
/diary-link
```

#### 2. 填写原始数据
打开网页，填写:
```
09:00 起床
09:30 通勤
10:00 写代码
12:00 午休
14:00 开会
18:00 运动
...
```

#### 3. 自动处理
系统会自动:
- ✅ **补全时间线** - 识别空白时段
- ✅ **自动分类** - 工作/学习/关系/健康/休闲/生活
- ✅ **柳比歇夫统计** - 各分类时间占比
- ✅ **生成洞察** - 基于数据生成感悟
- ✅ **同步到 Obsidian**（如果配置了）
- ✅ **晚间报告** - 总结一天

#### 4. 查看报告
晚间会收到类似这样的报告:
```
📊 今日报告
时间: 8h 工作, 1h 学习, 0.5h 运动
心情: 高效 🟢
成就: 完成了重要项目
建议: 明天记得多休息
```

---

## 🔧 配置说明

### 数据存储
- 原始数据: `{dataPath}/raw-logs/{date}.txt`
- 日记数据: `{dataPath}/daily-tracker/{date}.json`
- Zeno日记: `{dataPath}/zeno-diary/{date}.json`

### Obsidian 集成
在 skill 配置中设置 `obsidian_path` 指向你的 Obsidian 日记目录。

### 自动提醒时间
在 skill 配置中调整 `collect_times`:
```json
{
  "morning": "09:00",
  "noon": "12:00",
  "afternoon": "15:00",
  "evening": "21:00"
}
```

---

## 🌐 网页界面

提供三个网页界面:

| 页面 | 用途 | 地址 |
|------|------|------|
| **log.html** | 极简原始记录 | `/log.html` |
| **checkin.html** | 完整日记打卡 | `/checkin.html` |
| **zeno-diary.html** | 完善 AI 日记 | `/zeno-diary.html` |

---

## 🎪 常见使用场景

### 场景一：时间管理爱好者
**需求:** 想知道时间都去哪了  
**用法:** 记录每段时间做什么 → 获得柳比歇夫统计  
**效果:** 清晰看到时间分配，优化时间管理

### 场景二：日记困难户
**需求:** 想写日记但坚持不下去  
**用法:** 极简记录 → AI 帮你完善成完整日记  
**效果:** 30秒输入，得到完整日记

### 场景三：需要复盘总结
**需求:** 定期复盘，但不知道怎么写  
**用法:** 记录事实 → AI 生成洞察和建议  
**效果:** 自动获得深度复盘报告

### 场景四：团队管理
**需求:** 了解团队时间分配  
**用法:** 团队成员各自记录 → 汇总分析  
**效果:** 团队效率可视化

---

## ❓ 常见问题

### Q: 我不会编程，能用吗？
**A:** 可以！只需要会用浏览器就行。启动服务的命令我们会提供。

### Q: 数据安全吗？
**A:** 数据存在本地，不上传任何云端（除非你自己配置）。

### Q: 需要付费吗？
**A:** 完全免费开源。

### Q: 支持手机吗？
**A:** 网页适配手机，可以手机浏览器访问。

### Q: 能导出数据吗？
**A:** 支持导出 JSON、TXT、Markdown 格式。

### Q: 需要一直开着电脑吗？
**A:** 如果部署在服务器或云上，不需要。

---

## 📁 项目结构

```
daily-system/
├── skills/           # OpenClaw skills
│   ├── daily-tracker/
│   ├── diary-builder/
│   ├── day-reflection/
│   └── zeno-diary-builder/
├── web/              # 网页文件
│   ├── log.html      # 极简记录
│   ├── checkin.html  # 完整打卡  
│   └── zeno-diary.html
├── server/           # 后端服务
│   └── server.js     # 服务器代码
├── docs/             # 文档
├── package.json      # Node.js 配置
└── README.md         # 此文件
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License

---

## 🙏 致谢

- 灵感来自柳比歇夫时间记录法
- 基于 [OpenClaw](https://github.com/openclaw/openclaw) 构建
- 感谢所有贡献者

---

**让记录成为习惯，让反思成为力量**