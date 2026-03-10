# 📦 部署指南

## 🚀 本地部署

### 简单方式（开发测试）
```bash
# 1. 克隆仓库
git clone https://github.com/zo-no/daily-system.git
cd daily-system

# 2. 启动服务器
node server/server.js

# 3. 访问 http://localhost:8888
```

### 生产环境
```bash
# 使用 PM2 管理进程
npm install -g pm2
pm2 start server/server.js --name daily-system
pm2 save
pm2 startup
```

---

## ☁️ 云服务器部署

### VPS（Ubuntu）
```bash
# 1. 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 克隆代码
git clone https://github.com/zo-no/daily-system.git
cd daily-system

# 3. 启动服务
npm start
```

### 使用 Docker
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
EXPOSE 8888
CMD ["node", "server/server.js"]
```

构建:
```bash
docker build -t daily-system .
docker run -p 8888:8888 -v $(pwd)/data:/app/data daily-system
```

---

## 🌐 外网访问

### 方案一：Cloudflare Tunnel
```bash
# 安装 cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared

# 启动 tunnel
./cloudflared tunnel --url http://localhost:8888
```

### 方案二：Ngrok
```bash
# 安装 ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# 启动
ngrok http 8888
```

### 方案三：反向代理（Nginx）
```nginx
# nginx 配置
server {
    listen 80;
    server_name diary.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8888;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🔧 配置说明

### 服务器配置（server/server.js）
```javascript
const CONFIG = {
  port: 8888,                    // 端口号
  dataPath: './data',           // 数据存储路径（绝对路径）
  publicPath: './web'           // 网页文件路径
};
```

### Skill 配置
每个 skill 的 SKILL.md 中有配置示例，包括:
- `obsidian_path` - Obsidian 日记路径
- `data_path` - 数据存储路径
- `collect_times` - 自动提醒时间

---

## 📊 数据迁移

### 从旧系统迁移
1. 备份旧数据
2. 按照相同格式放入新的 `data/` 目录
3. 重启服务

### 备份数据
```bash
# 备份整个数据目录
tar -czf diary-backup-$(date +%Y%m%d).tar.gz data/
```

---

## 🛡️ 安全考虑

### 1. 访问控制
- 使用 Nginx 添加 Basic Auth
- 或使用 Cloudflare Access 控制访问

### 2. HTTPS
```nginx
# Nginx HTTPS 配置
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

### 3. 防火墙
```bash
# 只允许特定端口
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw --force enable
```

---

## 🔍 监控与日志

### PM2 监控
```bash
pm2 monit           # 实时监控
pm2 logs            # 查看日志
pm2 status          # 查看状态
```

### 日志文件
- 服务器日志: `pm2 logs`
- 数据日志: `data/` 目录下的文件
- 访问日志: 通过 Nginx/Apache 记录

---

## 📈 性能优化

### 内存优化
```javascript
// 限制上传数据大小
const MAX_BODY_SIZE = 1024 * 1024; // 1MB
```

### 静态文件缓存
```nginx
# Nginx 静态文件缓存
location ~* \.(html|css|js)$ {
    expires 1h;
    add_header Cache-Control "public, immutable";
}
```

---

## 🆘 故障排除

### 常见问题

| 问题 | 解决方案 |
|------|----------|
| 端口被占用 | 修改 `server/server.js` 中的端口 |
| 权限错误 | `chmod -R 755 data/` |
| 无法访问网页 | 检查防火墙和端口转发 |
| 数据不保存 | 检查 `data/` 目录权限 |

### 日志查看
```bash
# 查看服务器日志
tail -f /tmp/daily-system.log

# 查看系统日志
journalctl -u daily-system -f
```

---

## 📞 支持

- GitHub Issues: https://github.com/zo-no/daily-system/issues
- 文档: https://github.com/zo-no/daily-system/tree/main/docs