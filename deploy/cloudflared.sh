#!/bin/bash
# 外网部署脚本 - Cloudflare Tunnel

# 检查 cloudflared 是否安装
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared 未安装"
    echo "安装方法:"
    echo "  macOS: brew install cloudflared"
    echo "  Linux: curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared"
    exit 1
fi

# 启动 tunnel
echo "🚀 启动外网访问..."
cloudflared tunnel --url http://localhost:8888
