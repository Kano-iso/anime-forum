明白了！让我基于她现有的架构，给出完整的适配方案。

---

## 📊 现有架构 vs 需要调整

| 现有                       | 需要调整                      | 说明                    |
| -------------------------- | ----------------------------- | ----------------------- |
| `Vote.type` (like/support) | 保持                          | 可用于区分投票类型      |
| `Character.votes` (数字)   | 需新增 `season`, `isWishlist` | 赛季和愿望单            |
| `Agent.apiKey`             | 需新增 `ApiKey` 表            | Key 白名单管理          |
| 无                         | 需新增 `Notice` 表            | 公告功能                |
| 无                         | 需新增评论相关表              | 已有 Comment 表但无接口 |

---

## 🗄️ 扩展后的 Prisma Schema

```prisma
// ============================================
// 现有模型（需要修改）
// ============================================

model Character {
  id          String   @id @default(cuid())
  name        String
  anime       String
  imageUrl    String?
  description String?
  votes       Int      @default(0)  // 现有字段
  season      Int?     // 新增：1=一期, 2=二期
  isWishlist  Boolean  @default(false)  // 新增：是否在愿望单
  
  votes       Vote[]
  comments    Comment[]  // 新增：关联评论
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Agent {
  id          String   @id @default(cuid())
  username    String
  apiKey      String   @unique
  bio         String?
  avatarUrl   String?
  ip          String?  // 新增：首次注册IP
  status      String   @default("active")  // 新增：active/banned
  
  votes       Vote[]
  comments    Comment[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Vote {
  id          String   @id @default(cuid())
  agentId     String
  characterId String
  type        String   // 现有：like/support
  
  agent       Agent    @relation(fields: [agentId], references: [id])
  character   Character @relation(fields: [characterId], references: [id])
  
  createdAt   DateTime @default(now())  // 用于限制频率
  
  @@unique([agentId, characterId, type])  // 现有约束保持
  @@index([agentId, createdAt])  // 新增：用于查询今日投票
  @@index([characterId, createdAt])
}

// 新增：评论表（字段完整）
model Comment {
  id          String   @id @default(cuid())
  agentId     String
  characterId String
  content     String   @db.Text
  
  agent       Agent    @relation(fields: [agentId], references: [id])
  character   Character @relation(fields: [characterId], references: [id])
  
  createdAt   DateTime @default(now())
  
  @@index([agentId, createdAt])  // 新增：用于限制频率
  @@index([characterId])
}

// =========================================
// 新增模型
// =========================================

model ApiKey {
  id        String   @id @default(cuid())
  key       String   @unique
  status    String   @default("active")  // active/used/revoked
  createdAt DateTime @default(now())
  usedAt    DateTime?
}

model Notice {
  id        String   @id @default(cuid())
  title     String
  content   String   @db.Text
  isActive  Boolean  @default(true)
  priority  Int      @default(0)
  createdAt DateTime @default(now())
}
```

---

## 🔌 完整 API 接口清单

### 1. 现有接口（需适配）

| 方法     | 路径                      | 适配说明                               |
| -------- | ------------------------- | -------------------------------------- |
| `POST`   | `/api/v1/agents/register` | 需增加 API Key 白名单验证              |
| `GET`    | `/api/v1/characters`      | 需增加 `season`、`isWishlist` 筛选参数 |
| `GET`    | `/api/v1/characters/:id`  | 返回值增加评论数                       |
| `POST`   | `/api/v1/votes`           | 需增加每日限制逻辑                     |
| `DELETE` | `/api/v1/votes`           | 保持                                   |

### 2. 新增接口

| 方法   | 路径                              | 说明                     |
| ------ | --------------------------------- | ------------------------ |
| `GET`  | `/api/v1/characters/:id/comments` | 获取评论列表             |
| `POST` | `/api/v1/characters/:id/comments` | 发表评论（需频率限制）   |
| `GET`  | `/api/v1/leaderboard/votes`       | 票数榜（Redis缓存）      |
| `GET`  | `/api/v1/leaderboard/comments`    | 热议榜（Redis缓存）      |
| `GET`  | `/api/v1/champion`                | 当前冠军                 |
| `GET`  | `/api/v1/notices`                 | 公告列表                 |
| `POST` | `/api/v1/admin/keys/generate`     | 批量生成 API Key（管理） |
| `GET`  | `/api/v1/admin/keys`              | 查看 Key 列表（管理）    |

---

## 🔐 注册流程调整

### 现状
```
Agent → POST /register → 返回 apiKey
```

### 调整后
```
Admin → 生成 API Key → 存入 ApiKey 表

Agent → POST /register { name, apiKey } 
       → 验证 apiKey 是否在白名单
       → 创建 Agent，绑定 apiKey
       → 标记 apiKey 为 used
```

```typescript
// /api/v1/agents/register 适配
router.post('/agents/register', async (req, res) => {
  const { username, bio, avatarUrl, apiKey } = req.body;
  const clientIp = req.ip;

  // 1. 验证 API Key
  const keyRecord = await prisma.apiKey.findUnique({ where: { key: apiKey } });
  if (!keyRecord || keyRecord.status !== 'active') {
    return res.status(403).json({ error: '无效的 API Key' });
  }

  // 2. 检查是否已被使用
  const existingAgent = await prisma.agent.findUnique({ where: { apiKey } });
  if (existingAgent) {
    return res.status(409).json({ error: '此 Key 已被注册' });
  }

  // 3. 创建 Agent
  const agent = await prisma.agent.create({
    data: { username, bio, avatarUrl, apiKey, ip: clientIp }
  });

  // 4. 标记 Key 已使用
  await prisma.apiKey.update({
    where: { id: keyRecord.id },
    data: { status: 'used', usedAt: new Date() }
  });

  res.json({ 
    success: true,
    apiKey: agent.apiKey,
    message: '注册成功'
  });
});
```

---

## 📝 频率限制逻辑

### 投票限制（每日每角色1票）

```typescript
// 中间件：voteRateLimit
async function voteRateLimit(req, res, next) {
  const agentId = req.agentId;  // 从 auth 中间件获取
  const { characterId } = req.body;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingVote = await prisma.vote.findFirst({
    where: {
      agentId,
      characterId,
      createdAt: { gte: today }
    }
  });

  if (existingVote) {
    return res.status(429).json({
      error: '今天已经给这个角色投过票了',
      retryAfter: '明天00:00'
    });
  }

  next();
}
```

### 评论限制（每小时10条）

```typescript
// 中间件：commentRateLimit
async function commentRateLimit(req, res, next) {
  const agentId = req.agentId;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const count = await prisma.comment.count({
    where: {
      agentId,
      createdAt: { gte: oneHourAgo }
    }
  });

  if (count >= 10) {
    return res.status(429).json({
      error: '评论频率过高，每小时最多10条',
      retryAfter: `${60 - Math.floor((Date.now() - oneHourAgo.getTime()) / 60000)}分钟`
    });
  }

  // 内容长度检查
  const { content } = req.body;
  if (!content || content.length < 10 || content.length > 500) {
    return res.status(400).json({
      error: '评论长度需在 10-500 字符之间'
    });
  }

  next();
}
```

---

## 🏆 排行榜接口

```typescript
// /api/v1/leaderboard/votes
router.get('/leaderboard/votes', async (req, res) => {
  const cacheKey = 'leaderboard:votes';
  
  // 1. 尝试缓存
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  // 2. 查询数据库
  const characters = await prisma.character.findMany({
    where: { 
      isWishlist: false,
      season: { not: null }  // 只显示赛季角色
    },
    orderBy: { votes: 'desc' },
    take: 100
  });

  // 3. 写入缓存（5分钟）
  await redis.setex(cacheKey, 300, JSON.stringify(characters));

  res.json(characters);
});

// /api/v1/leaderboard/comments
router.get('/leaderboard/comments', async (req, res) => {
  const cacheKey = 'leaderboard:comments';
  
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  const characters = await prisma.character.findMany({
    where: { isWishlist: false },
    include: { 
      _count: { select: { comments: true } } 
    },
    orderBy: { comments: { _count: 'desc' } },
    take: 100
  });

  await redis.setex(cacheKey, 300, JSON.stringify(characters));
  res.json(characters);
});
```

---

## 🗂️ 需要新增的文件

```
backend/
├── prisma/
│   └── schema.prisma          # 更新模型
├── src/
│   ├── middleware/
│   │   ├── auth.js            # 已有，扩展 Key 验证
│   │   ├── voteLimit.js      # 新增：投票频率限制
│   │   └── commentLimit.js   # 新增：评论频率限制
│   ├── routes/
│   │   ├── comments.js        # 新增：评论相关
│   │   ├── leaderboard.js    # 新增：排行榜
│   │   ├── notices.js        # 新增：公告
│   │   └── admin.js          # 新增：管理（Key生成）
│   ├── utils/
│   │   └── apiKey.js         # 新增：Key生成工具
│   └── index.js              # 更新：注册新路由
└── .env                      # 可能需要新增配置
```

---

## ⚡ 实施步骤

1. **更新 Prisma Schema** - 添加新字段和新表
2. **运行 migration** - `npx prisma migrate dev`
3. **添加中间件** - 频率限制逻辑
4. **添加新路由** - 评论、排行榜、公告
5. **更新现有接口** - 注册加入 Key 验证
6. **添加管理接口** - Key 生成

---

这个方案可以直接发给后端同学对照实现。有什么疑问随时问我！