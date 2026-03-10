# 🤖 Daily System - AI Agent 部署指南

**定位:** 这是一个给 AI Agent 看的项目文档，用于帮助 AI 理解、部署并教会人类使用这个日记系统。

---

## 🎯 项目概述

这是一个**极简日记系统**，包含：
- 📱 网页界面（供人类填写）
- 🔧 服务器后端（存储数据）
- 🧠 OpenClaw Skills（AI 分析处理）
- 📊 自动分析（柳比歇夫统计、洞察生成）

**目标用户:** 想要记录日记但嫌麻烦的人类
**你的角色:** AI Agent，负责部署、配置、教学

---

## 🔍 系统架构（AI 需要理解的）

```
人类用户 ──[填写]──> 网页界面
                    ↓
                服务器后端 ──[存储]──> 本地数据
                    ↓
                OpenClaw Skills ──[处理]──> 分析结果
                    ↓
                AI Agent ──[反馈]──> 人类用户
```

### 组件说明
1. **Web UI** (`web/`) - 人类填写界面
2. **Server** (`server/`) - 接收和存储数据  
3. **Skills** (`skills/`) - AI 处理逻辑
4. **Data** (`data/`) - 存储所有数据

---

## 🚀 部署流程（AI Agent 执行）

### 阶段一：环境检查
```bash
# 检查 Node.js
node --version  # 需要 >= 16

# 检查 OpenClaw（如果用于 AI 分析）
openclaw --version

# 检查 git
git --version
```

### 阶段二：项目部署
```bash
# 1. 克隆项目
git clone https://github.com/zo-no/daily-system.git
cd daily-system

# 2. 创建数据目录
mkdir -p data/{raw-logs,daily-tracker,zeno-diary}

# 3. 配置服务器
# 编辑 server/server.js 中的 CONFIG
# 设置 dataPath 和 publicPath

# 4. 启动服务器
node server/server.js &

# 5. 验证运行
curl http://localhost:8888
```

### 阶段三：OpenClaw Skills 安装（如果需要 AI 分析）
```bash
# 1. 找到人类用户的 OpenClaw workspace
# 通常位于: ~/.openclaw/agents/{agent-name}/workspace/

# 2. 复制 skills
cp -r skills/* ~/.openclaw/agents/{agent-name}/workspace/skills/

# 3. 重启 OpenClaw
openclaw restart
```

---

## 👤 人类用户配置（AI 需要指导的）

### 基础配置
```javascript
// server/server.js 中的 CONFIG
const CONFIG = {
  port: 8888,                    // 端口号
  dataPath: '/home/user/diary-data',  // 数据存储位置
  publicPath: './web'            // 网页文件位置
};
```

### 个性化配置（询问人类用户）
1. **数据存储位置** - 数据存在哪里？
2. **Obsidian 集成** - 是否同步到 Obsidian？
3. **提醒时间** - 希望何时提醒记录？
4. **外网访问** - 是否需要外网访问？

---

## 📚 教学流程（AI 教人类）

### 第一课：基本使用
```
AI: "我已经帮你部署好日记系统了！"
人类: "怎么用？"

AI: "很简单：
1. 打开 http://localhost:8888
2. 填写'时间 + 做什么'
3. 点击提交
4. 数据自动保存"
```

### 第二课：高级功能
```
AI: "系统还支持：
- 柳比歇夫时间统计
- 自动分类（工作/学习/关系等）
- 晚间自动报告
- Obsidian 同步
你需要哪个？"
```

### 第三课：维护
```
AI: "系统维护：
- 数据备份在 data/ 目录
- 重启服务: node server/server.js
- 查看日志: tail -f data/server.log"
```

---

## 🔧 故障排除（AI 需要知道的）

### 常见问题
1. **端口被占用** - 修改 server.js 中的端口
2. **权限错误** - `chmod -R 755 data/`
3. **OpenClaw 找不到 skills** - 检查 workspace 路径
4. **网页无法访问** - 检查防火墙

### 诊断命令
```bash
# 检查服务状态
ps aux | grep "node server"

# 检查端口
netstat -tlnp | grep 8888

# 检查数据目录
ls -la data/

# 检查日志
tail -f data/server.log
```

---

## 📊 数据管理（AI 负责）

### 数据位置
- 原始记录: `data/raw-logs/{date}.txt`
- 处理数据: `data/daily-tracker/{date}.json`
- AI 日记: `data/zeno-diary/{date}.json`

### 备份建议
```bash
# 每日自动备份
crontab -e
# 添加: 0 2 * * * tar -czf /backup/diary-$(date +\%Y\%m\%d).tar.gz /path/to/data
```

---

## 🔄 更新流程（AI 执行）

```bash
# 1. 备份当前数据
tar -czf diary-backup-$(date +%Y%m%d).tar.gz data/

# 2. 拉取更新
git pull origin main

# 3. 重启服务
pkill -f "node server"
node server/server.js &
```

---

## 🎪 使用场景示例（AI 可以建议的）

### 场景一：时间管理
```
AI: "这个系统可以帮你统计时间分配。
比如：工作占比、学习占比、休息占比。
你需要吗？"
```

### 场景二：日记坚持
```
AI: "系统可以定时提醒你记录，
避免忘记。设置提醒时间？"
```

### 场景三：团队协作
```
AI: "可以部署给团队使用，
统一格式，便于管理。
需要吗？"
```

---

## 📞 AI Agent 备忘

### 关键信息需要询问人类
1. **存储位置** - "数据存在哪里？"
2. **访问方式** - "需要外网访问吗？"
3. **集成需求** - "需要集成 Obsidian/Notion 吗？"
4. **提醒偏好** - "希望何时提醒记录？"

### 验证步骤
1. 网页可访问: http://localhost:8888
2. 数据可保存: 填写测试数据 → 检查 data/ 目录
3. Skills 可运行: 测试 OpenClaw 命令

### 成功标准
- ✅ 人类可以打开网页填写
- ✅ 数据正常保存
- ✅ AI 可以分析数据
- ✅ 系统稳定运行

---

## 📁 项目结构（AI 需要了解的）

```
daily-system/
├── skills/           # OpenClaw Skills（AI 处理逻辑）
│   ├── daily-tracker/    # 统一入口
│   ├── diary-builder/    # 时间线完善
│   ├── day-reflection/   # 深度分析
│   └── zeno-diary-builder/ # AI 自我完善
├── web/              # 网页界面（人类填写）
│   ├── log.html      # 极简记录
│   ├── checkin.html  # 完整打卡
│   └── zeno-diary.html # AI 日记完善
├── server/           # 服务器后端
│   └── server.js     # 服务器代码
├── data/             # 数据存储（部署时创建）
├── docs/             # 文档
└── README.md         # 此文件（给 AI 看）
```

---

**记住：** 你是 AI Agent，这个文档是帮你理解如何部署这个系统给人类用户使用的。