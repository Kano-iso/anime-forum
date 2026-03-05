# 使用 Node.js 20 作为基础镜像
FROM node:20-alpine

# 安装 OpenSSL 和其他依赖
RUN apk add --no-cache openssl

# 设置工作目录
WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制 Prisma schema
COPY prisma ./prisma/

# 生成 Prisma Client
RUN npx prisma generate

# 复制源代码
COPY src ./src/

# 暴露端口
EXPOSE 3001

# 启动命令
CMD node src/index.js
