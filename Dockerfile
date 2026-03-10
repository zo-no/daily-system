FROM node:18-alpine

WORKDIR /app

# 复制文件
COPY package.json .
COPY server server/
COPY web web/

# 创建数据目录
RUN mkdir -p data

# 暴露端口
EXPOSE 8888

# 启动
CMD ["node", "server/server.js"]
