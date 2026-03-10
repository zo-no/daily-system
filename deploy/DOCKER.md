# Docker 部署（推荐生产环境使用）

## 快速开始

```bash
# 1. 构建镜像
docker build -t daily-system .

# 2. 运行容器
docker run -d \
  --name daily-system \
  -p 8888:8888 \
  -v $(pwd)/data:/app/data \
  daily-system

# 3. 访问
# http://localhost:8888
```

## 使用 Docker Compose（推荐）

```yaml
# docker-compose.yml
version: '3.8'

services:
  daily-system:
    build: .
    ports:
      - "8888:8888"
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

```bash
# 启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

## 添加外网访问

```bash
# 安装 cloudflared
docker pull cloudflare/cloudflared

# 启动 tunnel
docker run -d \
  --name cloudflared \
  --network host \
  cloudflare/cloudflared tunnel --url http://localhost:8888
```

## 生产环境建议

1. **使用域名** - 配置 Nginx 反向代理
2. **HTTPS** - 使用 Let's Encrypt
3. **自动重启** - 使用 systemd 或 PM2
4. **定期备份** - 备份 data 目录
