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

## 🚀 快速开始

### 前置要求
- [OpenClaw](https://github.com/openclaw/openclaw)
- Node.js >= 16

### 1. 克隆仓库
```bash
git clone https://github.com/zo-no/daily-system.git
cd daily-system
```

### 2. 安装 Skills
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

### 1. 获取打卡链接
向你的 OpenClaw 助手发送:
```
打卡链接
```

### 2. 填写原始数据
打开网页，填写:
```
09:00 起床
09:30 通勤
10:00 写代码
12:00 午休
...
```

### 3. 自动处理
系统会自动:
- ✅ 补全时间线
- ✅ 自动分类（工作/学习/关系/健康/休闲/生活）
- ✅ 生成柳比歇夫统计
- ✅ 生成洞察建议
- ✅ 同步到 Obsidian（如果配置了）

### 4. 查看报告
晚间会收到自动生成的报告。

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