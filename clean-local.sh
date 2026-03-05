#!/bin/bash
# 完全清理本地测试环境
# 删除所有容器、镜像、数据卷

echo "🧹 清理 Anime Forum 本地测试环境..."

cd "$(dirname "$0")"

# 停止并删除容器
docker-compose down -v

# 删除构建的镜像
docker rmi anime-forum-backend:latest 2>/dev/null || true
docker rmi anime-forum-frontend:latest 2>/dev/null || true

echo "✅ 清理完成！"
echo "   所有容器、镜像、数据卷已删除"
echo "   源代码保留，可随时重新启动"
