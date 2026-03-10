# 开发者迭代指南

> 面向 agent。当开发者说「我想改 X」或「加一个功能 Y」时，按本文件流程执行。

---

## 迭代流程

```
1. 确认影响范围
2. 修改对应文件
3. 更新版本号（plugin.json）
4. 写 UPGRADING.md 新版本章节
5. 写 CHANGELOG.md 条目
6. 提交，等开发者 review 后再 push
```

---

## Step 1：确认影响范围

| 需求类型 | 主要改动文件 |
|---------|------------|
| 用户交互流程（提醒话术、时间点） | `skills/daily-tracker/SKILL.md` |
| 时间线补全规则 | `skills/diary-builder/SKILL.md` |
| 复盘报告格式/分析逻辑 | `skills/day-reflection/SKILL.md` |
| 早报内容/格式 | `skills/daily-morning/SKILL.md` |
| 安装/更新流程 | `skills/daily-install/SKILL.md` + `README.md` |
| 网页打卡界面 | `web/index.html` / `web/review.html` / `web/report.html` |
| 后端数据接收 | `server/server.js` |
| 用户配置项 | `workspace-template/config.json` + 相关 SKILL.md |
| Plugin 清单 | `plugin.json` |

---

## Step 2：修改文件

**改 SKILL.md**：只改需要的章节；调用命令必须与 `plugin.json` 一致；路径占位符统一用 `{install_path}` / `{workspace}`。

**改网页**：改完后本地验证，走完三步流程，确认数据正确写入 `data/diary/`。

**改 server.js**：若 API 路径变化，同步更新 SKILL.md 里的引用；确认数据格式兼容旧数据。

---

## Step 3：更新版本号

`plugin.json` 的 `version` 字段，遵循语义化版本：

| 改动类型 | 版本变化 |
|---------|---------|
| Bug 修复、措辞调整 | patch +1（1.1.0 → 1.1.1） |
| 新增功能（向后兼容） | minor +1（1.1.0 → 1.2.0） |
| 破坏性改动（数据格式、流程重构） | major +1（1.1.0 → 2.0.0） |

---

## Step 4：写 UPGRADING.md

在 `UPGRADING.md` 顶部（1.0.0 之上）插入新版本章节，格式：

```markdown
## X.Y.Z

**新增/变更**：一句话描述

**迁移操作**：无需迁移 / 具体步骤

**告知用户**：
\`\`\`
更新完成后发给用户的话
\`\`\`
```

迁移操作要具体可执行——agent 读完能直接操作，不需要再判断。

---

## Step 5：写 CHANGELOG.md

在 `CHANGELOG.md` 顶部追加：

```markdown
## [X.Y.Z] - YYYY-MM-DD

### 新增
- 功能描述

### 修改
- 改动描述

### 修复
- Bug 描述
```

---

## Step 6：提交

```bash
git add <改动的文件>
git commit -m "feat/fix/docs: 简短描述"
# 等开发者 review 后再 push
```

提交类型：`feat` 新功能 / `fix` Bug 修复 / `refactor` 重构 / `docs` 文档

---

## 一致性检查清单

- [ ] SKILL.md 调用命令与 `plugin.json` 一致
- [ ] 所有路径使用 `{install_path}` / `{workspace}`，无硬编码
- [ ] `plugin.json` 版本号已更新
- [ ] `UPGRADING.md` 已写新版本章节
- [ ] `CHANGELOG.md` 已追加条目
