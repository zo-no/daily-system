# 开发者迭代指南

> 本文件面向 agent。当开发者（用户）说「我想改 X」或「加一个功能 Y」时，按本文件流程执行。

---

## 迭代流程

```
1. 理解需求 → 确认影响范围
2. 修改对应文件
3. 更新版本号
4. 写 CHANGELOG 条目
5. 提交并推送
```

---

## Step 1：确认影响范围

收到需求后，先判断改动涉及哪一层：

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

跨层改动时，把所有涉及文件列出来，逐一修改，最后做一致性检查。

---

## Step 2：修改文件

### 改 SKILL.md

- 只改需要改的章节，不重写整个文件
- 如果是新增功能，在文件末尾追加「待迭代」章节草稿，等开发者确认后正式写入
- 改完后检查：调用命令是否和 `plugin.json` 一致？文件路径占位符是否用 `{install_path}` / `{workspace}`？

### 改网页文件

- `web/index.html`：Step 1，填写时间线
- `web/review.html`：Step 2，追问补全
- `web/report.html`：Step 3，展示分析

改完后在本地验证：启动 server，打开网页，走完三步流程，确认数据正确写入 `data/diary/`。

### 改 server.js

改动后检查：
- API 路径是否变化（若变化，同步更新 SKILL.md 里的引用）
- 数据格式是否兼容旧数据

---

## Step 3：更新版本号

版本号在 `plugin.json` 的 `version` 字段，遵循语义化版本：

| 改动类型 | 版本号变化 | 示例 |
|---------|----------|------|
| Bug 修复、措辞调整 | patch +1 | 1.1.0 → 1.1.1 |
| 新增功能（向后兼容） | minor +1 | 1.1.0 → 1.2.0 |
| 破坏性改动（数据格式变化、流程重构） | major +1 | 1.1.0 → 2.0.0 |

---

## Step 4：写 CHANGELOG 条目

在 `CHANGELOG.md`（本文件同目录）追加，格式：

```markdown
## [版本号] - YYYY-MM-DD

### 新增
- 功能描述

### 修改
- 改动描述

### 修复
- Bug 描述
```

---

## Step 5：提交并推送

```bash
git add <改动的文件>
git commit -m "类型: 简短描述"
git push origin master
```

提交类型：
- `feat:` 新功能
- `fix:` Bug 修复
- `refactor:` 重构（不影响功能）
- `docs:` 文档更新

---

## 一致性检查清单

每次迭代完成后过一遍：

- [ ] SKILL.md 里的调用命令与 `plugin.json` 注册的一致
- [ ] 所有文件路径使用 `{install_path}` / `{workspace}`，无硬编码路径
- [ ] `config.json` 字段名在所有 SKILL.md 里拼写一致
- [ ] `plugin.json` 版本号已更新
- [ ] `CHANGELOG.md` 已追加条目
- [ ] 已推送到远端

---

## 回滚

如果改坏了：

```bash
git log --oneline -10        # 找到上一个好的 commit
git revert HEAD              # 撤销最近一次提交（生成新 commit）
git push origin master
```
