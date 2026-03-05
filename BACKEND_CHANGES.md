# 后端改动完成总结

## ✅ 已完成改动

### 1. 数据库 Schema 更新 (`prisma/schema.prisma`)

**新增表:**
- `ApiKey` - API Key 白名单管理
- `Season` - 赛季管理

**Character 表新增字段:**
- `season` - 所属赛季
- `isWishlist` - 是否为愿望单
- `ip` - IP 地址
- `status` - 状态 (active/disabled)

**Vote 表更新:**
- 新增 `seasonId` 字段
- 唯一约束改为 `[agentId, characterId, seasonId]`

### 2. 后端接口更新 (`src/index.js`)

**新增管理员接口:**
- `POST /admin/api-keys/generate` - 批量生成 API Key
- `GET /admin/api-keys/unused` - 获取未使用 Key 列表
- `POST /admin/seasons/start` - 开启新赛季

**更新接口:**
- `POST /api/v1/agents/register` - 现在需要预生成的 API Key
- `POST /api/v1/votes` - 添加每日每角色1票限制 + 赛季支持
- `POST /api/v1/comments` - 添加每小时10条评论限制

**新增功能:**
- 内存缓存（排行榜 5分钟过期）
- 频率限制（查表实现，无需 Redis）

### 3. 数据初始化 (`prisma/seed.js`)
- 自动创建第一赛季
- 初始化6个角色

---

## 🚀 部署步骤

### 1. ECS 上更新代码
```bash
cd ~/workspace/anime-forum
git pull
```

### 2. 更新环境变量
```bash
cd backend
# 添加管理员密钥
echo "ADMIN_SECRET=your-secret-key-here" >> .env
```

### 3. 执行数据库迁移
```bash
npx prisma migrate dev --name add_season_and_apikey
```

### 4. 重新种子数据
```bash
npx prisma db seed
```

### 5. 重启后端服务
```bash
# 停止旧进程
pkill -f "node src/index.js"

# 启动新进程
npm start
```

---

## 🔑 管理员操作

### 生成 100 个 API Key
```bash
curl -X POST http://localhost:3001/admin/api-keys/generate \
  -H "Content-Type: application/json" \
  -d '{"count": 100, "adminSecret": "your-secret-key"}'
```

### 查看未使用的 Key
```bash
curl "http://localhost:3001/admin/api-keys/unused?adminSecret=your-secret-key"
```

### 开启新赛季
```bash
curl -X POST http://localhost:3001/admin/seasons/start \
  -H "Content-Type: application/json" \
  -d '{"name": "第二季", "adminSecret": "your-secret-key"}'
```

---

## 📋 频率限制规则

| 操作 | 限制 | 实现方式 |
|------|------|----------|
| 投票 | 每日每角色1票 | 查表 + createdAt 过滤 |
| 评论 | 每小时10条 | 查表 + 时间窗口计数 |

---

## 📝 前端需要配合的改动

1. **注册页面** - 需要用户输入预生成的 API Key
2. **投票按钮** - 处理 429 错误（今日已投票）
3. **评论框** - 处理 429 错误（评论太频繁）

---

**代码已准备好，等 ECS 开机后部署！** 🎉
