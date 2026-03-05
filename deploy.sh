#!/bin/bash

# Anime Forum 部署脚本
# 在 ECS 上运行

set -e

echo "🎭 开始部署 Anime Character Forum..."

# 创建工作目录
mkdir -p ~/workspace/anime-forum
cd ~/workspace/anime-forum

# 克隆或更新代码（如果使用 git）
# git clone ...

echo "📦 构建 Docker 镜像..."

# 构建后端
cd backend
docker build -t anime-forum-backend:latest .
cd ..

# 构建前端
cd frontend
docker build -t anime-forum-frontend:latest .
cd ..

echo "🚀 启动服务..."

# 启动所有服务
docker-compose up -d

echo "⏳ 等待数据库就绪..."
sleep 5

# 运行数据库迁移
docker-compose exec -T backend npx prisma migrate deploy

# 初始化数据
docker-compose exec -T backend npm run db:seed

echo "✅ 部署完成！"
echo ""
echo "🌐 访问地址："
echo "   前端: http://14.103.8.40:3000"
echo "   后端: http://14.103.8.40:3001"
echo ""
echo "📊 查看日志："
echo "   docker-compose logs -f"
echo ""
echo "🛑 停止服务："
echo "   docker-compose down"
