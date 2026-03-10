#!/bin/bash
# daily-reminder 执行脚本
# 根据 reminders.json 中的设置执行提醒

WORKSPACE="$1"
REMINDER_FILE="${WORKSPACE}/diary/reminders.json"

if [ ! -f "$REMINDER_FILE" ]; then
    echo "No reminders found"
    exit 0
fi

# 读取当前时间
CURRENT_TIME=$(date +%H:%M)

# 简单的提醒检查（可以替换为更复杂的调度系统）
# 这里演示：检查是否有当前时间的提醒

MESSAGE=$(cat "$REMINDER_FILE" | jq -r ".reminders[] | select(.time == \"$CURRENT_TIME\" and .enabled == true) | .message" 2>/dev/null)

if [ -n "$MESSAGE" ]; then
    echo "🔔 $MESSAGE"
    say "$MESSAGE"
fi
