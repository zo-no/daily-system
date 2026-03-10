---
name: daily-install
description: 日记系统一键安装。从 clone 代码到 workspace 初始化全流程，安装完成后系统立即可用。
---

# daily-install（一键安装）

## 触发条件

用户说以下任意一句时执行本 skill：
- 「帮我安装日记系统」
- 「安装 daily system」
- 「去 https://github.com/zo-no/daily-system.git 下载并安装」
- 「部署日记系统」

---

## 安装流程

按顺序执行，每步完成后告知用户进度。

---

### Step 1：检查环境

```bash
node --version   # 需要 >= 16
git --version
```

任一不满足时，告知用户安装方式后终止：
- Node.js：`brew install node` 或访问 https://nodejs.org
- Git：`brew install git`

---

### Step 2：克隆代码

```bash
git clone https://github.com/zo-no/daily-system.git
```

询问用户安装位置，默认 `~/daily-system`：
```
「代码放在哪里？直接回车用默认位置 ~/daily-system」
```

记录安装路径到 MEMORY.md：
```
daily-system 安装路径：{install_path}
```

---

### Step 3：启动服务器

```bash
bash {install_path}/deploy/start.sh
```

等待约 15 秒，检查输出：
- 出现本地地址 → 记录 `http://localhost:8888`
- 出现外网链接（`trycloudflare.com`）→ 记录外网地址

若启动失败，查看 `cat /tmp/diary-server.log` 并告知用户错误原因。

---

### Step 4：了解用户习惯（一问一答，不要一次全问）

**① 睡眠时间**
```
「你一般几点睡觉？」
```
根据回答推算 `nightly_time` = 睡前 1.5 小时（最晚不超过 23:30）。

**② 起床时间**
```
「早上一般几点起？」
```
根据回答推算 `morning_time` = 起床后 30 分钟。

**③ 复盘风格**
```
「复盘报告你喜欢哪种风格？
  A. 直接指出问题，不客气
  B. 温和一些，多肯定」
```
A → `style: "direct"`，B → `style: "gentle"`

**④ 人生目标讨论**
```
「最后聊几分钟。你现在生活里最重要的几件事是什么？
  比如工作、学习、健康、家庭……说几个就行。」
```
用户说完后追问每个角色每周大概想投入多少小时。再问：
```
「有没有什么事是你知道自己容易陷进去、但不想花太多时间的？」
```

---

### Step 5：写入配置文件

根据 Step 4 的讨论结果，写入 `{workspace}/config.json`：

```json
{
  "morning_time": "08:30",
  "nightly_time": "22:30",
  "poll_interval_minutes": 30,
  "give_up_time": "01:00",
  "style": "direct"
}
```

写入 `{workspace}/diary/人生目标.md`（基于讨论内容生成，给用户看一遍确认）。

---

### Step 6：初始化 workspace 目录

```bash
mkdir -p {workspace}/diary/$(date +%Y/%m)
```

写入 `{workspace}/HEARTBEAT.md`：
```markdown
## 日记系统定时任务

- {morning_time} /daily:morning 早报
- {nightly_time} /daily:tracker 晚间日记提醒
```

写入 MEMORY.md：
```
daily-system 安装路径：{install_path}
日记数据路径：{workspace}/diary/
配置文件：{workspace}/config.json
```

---

### Step 7：发送欢迎消息

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

---

## 安装失败处理

| 失败点 | 处理 |
|--------|------|
| git clone 失败 | 检查网络，提示手动下载 zip：https://github.com/zo-no/daily-system/archive/refs/heads/main.zip |
| 端口 8888 被占用 | 询问用户用哪个端口，修改 `server/server.js` 中 `CONFIG.port` |
| cloudflared 获取外网链接超时 | 先给本地链接，告知外网链接稍后在终端输出 |
| Node.js 版本过低 | 提示升级：`brew upgrade node` |

---

## 重新安装 / 更新

用户说「更新日记系统」时：

```bash
cd {install_path}
git pull
```

不重新走配置流程，保留现有 `config.json` 和 `人生目标.md`。
