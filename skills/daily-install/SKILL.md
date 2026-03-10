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
openclaw plugins install -l ./extension
```

**不重新走配置流程**，保留现有 `{workspace}/config.json` 和 `{workspace}/diary/人生目标.md`。

拉取完成后：

1. 读取 `{install_path}/UPGRADING.md`
2. 找到新版本号对应的章节（版本号在 `plugin.json` 的 `version` 字段）
3. 执行该章节的「迁移操作」
4. 将「告知用户」的话发给用户

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
cd {install_path} && openclaw plugins install -l ./extension
```

3. 重新走 README.md「首次安装流程」的 Step 4–6（收集习惯 + 写入配置 + 欢迎消息）。

---

## 触发条件

- 「更新日记系统」
- 「重装日记系统」
- 「重新配置日记」
