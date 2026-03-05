#!/bin/bash
# 本地测试 Anime Forum 的启动脚本
# 使用 Docker Compose，关闭后自动清理，不影响宿主机

set -e

echo "🎭 启动 Anime Forum 本地测试环境..."
echo "   数据全部在 Docker 容器内，关闭后自动清理"
echo ""

# 进入项目目录
cd "$(dirname "$0")"

# 启动服务
docker-compose up -d

echo ""
echo "✅ 服务已启动！"
echo "   前端: http://localhost:3000"
echo "   后端: http://localhost:3001"
echo ""
echo "🛑 停止并清理（数据全删）:"
echo "   docker-compose down -v"
echo ""
echo "📊 查看日志:"
echo "   docker-compose logs -f"
