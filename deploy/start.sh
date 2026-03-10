#!/bin/bash
# 一键启动脚本 - 同时启动服务器和外网访问

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

echo "🚀 启动日记系统..."

# 启动服务器（后台运行）
cd "$(dirname "$0")/.."
node server/server.js > /tmp/diary-server.log 2>&1 &
SERVER_PID=$!

echo $SERVER_PID > /tmp/diary-server.pid
echo "✅ 服务器已启动 (PID: $SERVER_PID)"
sleep 2

# 检查服务器
if curl -s http://localhost:8888 > /dev/null; then
    echo "✅ 服务器运行正常"
else
    echo "❌ 服务器启动失败"
    cat /tmp/diary-server.log
    exit 1
fi

# 启动外网访问
echo "🌐 启动外网访问..."
if command -v cloudflared &> /dev/null; then
    cloudflared tunnel --url http://localhost:8888 &
else
    # 使用 npm 安装 cloudflared
    echo "📦 安装 cloudflared..."
    npx -y cloudflared tunnel --url http://localhost:8888 &
fi

echo ""
echo "🎉 启动完成！"
echo "📝 本地访问: http://localhost:8888"
echo "🌐 外网链接: 查看上方输出"
echo ""
echo "停止服务: kill \$(cat /tmp/diary-server.pid)"
