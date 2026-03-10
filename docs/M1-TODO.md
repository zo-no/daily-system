# M1 执行清单（安全与稳定性）

## 目标

在不重构业务流程的前提下，完成“可稳定运行”的底座改造。

## 任务 1：服务安全加固（server）

文件：`server/server.js`

1. 静态文件路由安全
- 对 `urlPath` 做 normalize
- 阻止 `..` 越界
- 只允许访问 `publicPath` 目录内文件

2. API 鉴权（最小版）
- 新增环境变量 `API_TOKEN`
- 对 `/api/submit`、`/api/report/*`、`/api/dates` 增加 Bearer Token 校验（可配置“开发模式关闭”）

3. 请求体限制
- `readBody` 增加大小上限（默认 1MB）
- 超限直接返回 413

4. 基础健康检查
- 新增 `/health` 返回 `status/port/dataPath`

## 任务 2：启动运维标准化（deploy）

文件：`deploy/start.sh`（重构）、新增 `deploy/stop.sh`、`deploy/status.sh`

1. start.sh
- 支持 `EXPOSE_MODE=local|tunnel`（默认 local）
- 记录 server/tunnel PID
- 写入日志路径和 URL 输出

2. stop.sh
- 按 PID 文件停止 server/tunnel
- 幂等：重复执行不报错

3. status.sh
- 显示运行状态、端口、PID、最近日志、访问 URL

## 任务 3：配置化（最小）

文件：`server/server.js`、`README.md`

- 支持 `PORT`、`DATA_DIR`、`PUBLIC_DIR`
- 文档同步更新为 local-first 用法

## 任务 4：回归脚本

新增：`scripts/m1-smoke-test.sh`

流程：

1. 启动 local 服务
2. 调 `/health`
3. POST `/api/submit`
4. GET `/api/report/{date}`
5. stop 并确认进程退出

## 验收

- 本地执行一条命令完成 smoke test
- 无鉴权或错误 token 时，受保护 API 返回 401
- `start/stop/status` 可连续执行，状态一致

