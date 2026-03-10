# 部署操作文档

## 快速启动（推荐，local-first）

```bash
bash {install_path}/deploy/start.sh
```

自动完成：
- 启动 Node.js 服务器（端口 8888）
- 默认仅本地访问（`http://127.0.0.1:8888`）
- 输出运行状态、日志路径和停止命令

终端会输出类似：
```
✅ 启动完成
MODE: local
本地地址: http://127.0.0.1:8888
访问地址: http://127.0.0.1:8888
```

---

## 外网模式（可选）

```bash
EXPOSE_MODE=tunnel bash {install_path}/deploy/start.sh
```

需要已安装 `cloudflared`。

---

## 停止服务

```bash
bash {install_path}/deploy/stop.sh
```

---

## 查看状态

```bash
bash {install_path}/deploy/status.sh
```

---

## 鉴权配置（可选）

```bash
REQUIRE_API_AUTH=1 API_TOKEN=your-token bash {install_path}/deploy/start.sh
```

启用后，`/api/*` 需要 `Authorization: Bearer <token>`。

---

## 常见问题

| 问题 | 解决方式 |
|------|----------|
| 端口 8888 被占用 | 修改 `server/server.js` 中 `CONFIG.port` |
| 外网链接不出现 | 等待 15 秒，cloudflared 初始化较慢 |
| 服务器启动失败 | 查看 `/tmp/daily-system/server.log` |
| Node.js 未安装 | `brew install node` 或访问 nodejs.org |
