---
name: daily-install
description: 日记系统更新与重装。首次安装流程见 README.md，本 Skill 用于已安装后的更新和重装场景。
---

# daily-install（更新 / 重装）

> **首次安装**：流程完整写在 `README.md` 的「首次安装流程」章节，agent 读 README 即可执行，无需本文件。
>
> **本文件用途**：系统已安装后，用户说「更新日记系统」或「重装」时执行。

---

## 更新（保留配置）

用户说「更新日记系统」时：

```bash
cd {install_path}
git pull
```

**不重新走配置流程**，保留现有 `{workspace}/config.json` 和 `{workspace}/diary/人生目标.md`。

更新完成后告知用户：
```
日记系统已更新到最新版本 ✓
配置和数据保持不变。
```

---

## 重装（重置配置）

用户说「重装日记系统」或「重新配置」时：

1. 备份现有 workspace 配置：
```bash
cp {workspace}/config.json {workspace}/config.json.bak
cp {workspace}/diary/人生目标.md {workspace}/diary/人生目标.md.bak
```

2. 重新拉取代码：
```bash
cd {install_path} && git pull
```

3. 重新走 README.md「首次安装流程」的 Step 4–6（收集习惯 + 写入配置 + 欢迎消息）。

---

## 触发条件

- 「更新日记系统」
- 「重装日记系统」
- 「重新配置日记」
