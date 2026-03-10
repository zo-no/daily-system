# 部署操作文档

## 快速启动（推荐）

```bash
bash deploy/start.sh
```

自动完成：
- 启动 Node.js 服务器（端口 8888）
- 启动 cloudflared tunnel（生成外网链接）
- 输出本地地址 + 外网链接

等待约 10 秒后，终端会输出类似：
```
✅ 服务器运行正常
📝 本地访问: http://localhost:8888
🌐 外网链接: https://xxxx.trycloudflare.com
```

将外网链接发给用户即可。

---

## 停止服务

```bash
# 停止服务器
kill $(cat /tmp/diary-server.pid)

# 或者直接找进程
pkill -f "node server/server.js"
```

---

## 其他部署方式

### 仅本地访问

```bash
node server/server.js
# 访问 http://localhost:8888
```

### 仅外网（需先启动 server）

```bash
bash deploy/cloudflared.sh
```

### Docker 部署

见 `deploy/DOCKER.md`

---

## 常见问题

| 问题 | 解决方式 |
|------|----------|
| 端口 8888 被占用 | 修改 `server/server.js` 中 `CONFIG.port` |
| 外网链接不出现 | 等待 15 秒，cloudflared 初始化较慢 |
| 服务器启动失败 | 查看 `cat /tmp/diary-server.log` |
| Node.js 未安装 | `brew install node` 或访问 nodejs.org |
