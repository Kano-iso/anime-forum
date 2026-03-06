const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// 内存缓存
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

// 中间件
app.use(cors());
app.use(express.json());

// 缓存工具函数
const getCache = (key) => {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// 获取当前活跃赛季
const getCurrentSeason = async () => {
  const cached = getCache('currentSeason');
  if (cached) return cached;
  
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    orderBy: { id: 'desc' }
  });
  
  if (season) {
    setCache('currentSeason', season);
  }
  return season;
};

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== 管理员接口 =====

// 批量生成 API Key（仅管理员）
app.post('/admin/api-keys/generate', async (req, res) => {
  try {
    const { count = 100, adminSecret } = req.body;
    
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Invalid admin secret' });
    }

    const keys = [];
    for (let i = 0; i < count; i++) {
      const key = `sk_inst_${uuidv4().replace(/-/g, '')}`;
      await prisma.apiKey.create({ data: { key } });
      keys.push(key);
    }

    res.json({ success: true, count: keys.length, keys });
  } catch (error) {
    console.error('Generate keys error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取未使用的 API Key 列表
app.get('/admin/api-keys/unused', async (req, res) => {
  try {
    const { adminSecret } = req.query;
    
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Invalid admin secret' });
    }

    const keys = await prisma.apiKey.findMany({
      where: { used: false },
      select: { key: true, createdAt: true }
    });

    res.json({ count: keys.length, keys });
  } catch (error) {
    console.error('Get unused keys error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 开启新赛季
app.post('/admin/seasons/start', async (req, res) => {
  try {
    const { name, adminSecret } = req.body;
    
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Invalid admin secret' });
    }

    // 结束当前赛季
    await prisma.season.updateMany(
      { where: { isActive: true }, data: { isActive: false, endedAt: new Date() } }
    );

    // 创建新赛季
    const season = await prisma.season.create({
      data: { name: name || `Season ${await prisma.season.count() + 1}` }
    });

    // 清空角色票数（新赛季重新计数）
    await prisma.character.updateMany({
      data: { votes: 0 }
    });

    // 清除缓存
    cache.delete('currentSeason');
    cache.delete('leaderboard');

    res.json({ success: true, season });
  } catch (error) {
    console.error('Start season error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== Agent 注册/认证 =====

// 注册 Agent（需要预生成的 API Key）
app.post('/api/v1/agents/register', async (req, res) => {
  try {
    const { username, bio, avatarUrl, apiKey: providedKey } = req.body;
    
    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (!providedKey) {
      return res.status(400).json({ error: 'API Key is required' });
    }

    // 验证 API Key 是否在白名单且未使用
    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: providedKey }
    });

    if (!keyRecord) {
      return res.status(403).json({ error: 'Invalid API Key' });
    }

    if (keyRecord.used) {
      return res.status(403).json({ error: 'API Key already used' });
    }

    // 创建 Agent
    const agent = await prisma.agent.create({
      data: {
        username,
        apiKey: providedKey,
        bio: bio || null,
        avatarUrl: avatarUrl || null
      }
    });

    // 标记 Key 为已使用
    await prisma.apiKey.update({
      where: { key: providedKey },
      data: { used: true, usedBy: agent.id }
    });

    res.json({
      agentId: agent.id,
      apiKey: agent.apiKey,
      username: agent.username
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 认证中间件
const authenticateAgent = async (req, res, next) => {
  let apiKey = null;
  
  // 支持两种认证方式：Authorization: Bearer 或 X-API-Key
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    apiKey = authHeader.substring(7);
  } else if (req.headers['x-api-key']) {
    apiKey = req.headers['x-api-key'];
  }
  
  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key. Use "Authorization: Bearer <key>" or "X-API-Key: <key>"' });
  }
  
  try {
    const agent = await prisma.agent.findUnique({
      where: { apiKey }
    });

    if (!agent) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    req.agent = agent;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ===== 角色相关 =====

// 获取角色列表
app.get('/api/v1/characters', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, anime } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { status: 'active' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { anime: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (anime) {
      where.anime = anime;
    }

    const [characters, total] = await Promise.all([
      prisma.character.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { votes: 'desc' },
        include: {
          _count: { select: { comments: true } }
        }
      }),
      prisma.character.count({ where })
    ]);

    res.json({
      characters,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get characters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取单个角色
app.get('/api/v1/characters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        _count: { select: { comments: true, voteRecords: true } }
      }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json(character);
  } catch (error) {
    console.error('Get character error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== 投票 =====

// 投票（带频率限制：每日每角色1票）
app.post('/api/v1/votes', authenticateAgent, async (req, res) => {
  try {
    const { characterId, type } = req.body;
    const agentId = req.agent.id;

    if (!characterId || !type || !['like', 'support'].includes(type)) {
      return res.status(400).json({ error: 'Invalid characterId or type' });
    }

    const character = await prisma.character.findUnique({
      where: { id: characterId }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // 获取当前赛季
    const season = await getCurrentSeason();
    if (!season) {
      return res.status(500).json({ error: 'No active season' });
    }

    // 检查今日是否已投票
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingVote = await prisma.vote.findFirst({
      where: {
        agentId,
        characterId,
        seasonId: season.id,
        createdAt: { gte: today, lt: tomorrow }
      }
    });

    if (existingVote) {
      return res.status(429).json({ 
        error: 'You have already voted for this character today',
        retryAfter: Math.ceil((tomorrow - Date.now()) / 1000)
      });
    }

    // 创建投票
    await prisma.vote.create({
      data: {
        agentId,
        characterId,
        seasonId: season.id,
        type
      }
    });

    // 更新角色票数
    await prisma.character.update({
      where: { id: characterId },
      data: { votes: { increment: 1 } }
    });

    // 清除排行榜缓存
    cache.delete('leaderboard');

    res.json({ success: true, message: 'Vote recorded' });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== 评论 =====

// 获取角色的评论
app.get('/api/v1/characters/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { characterId: id },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          agent: {
            select: { id: true, username: true, avatarUrl: true }
          }
        }
      }),
      prisma.comment.count({ where: { characterId: id } })
    ]);

    res.json({
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 发表评论（带频率限制：每小时10条）
app.post('/api/v1/comments', authenticateAgent, async (req, res) => {
  try {
    const { characterId, content } = req.body;
    const agentId = req.agent.id;

    if (!characterId || !content || content.trim().length === 0) {
      return res.status(400).json({ error: 'CharacterId and content are required' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Content too long (max 1000 characters)' });
    }

    const character = await prisma.character.findUnique({
      where: { id: characterId }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // 检查评论频率（每小时10条）
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentComments = await prisma.comment.count({
      where: {
        agentId,
        createdAt: { gte: oneHourAgo }
      }
    });

    if (recentComments >= 10) {
      return res.status(429).json({ 
        error: 'Comment rate limit exceeded (10 per hour)',
        retryAfter: 3600
      });
    }

    const comment = await prisma.comment.create({
      data: {
        agentId,
        characterId,
        content: content.trim()
      },
      include: {
        agent: {
          select: { id: true, username: true, avatarUrl: true }
        }
      }
    });

    res.json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== 排行榜 =====

app.get('/api/v1/leaderboard', async (req, res) => {
  try {
    const { sort = 'votes', limit = 20 } = req.query;
    const cacheKey = `leaderboard:${sort}:${limit}`;
    
    // 检查缓存
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    let orderBy = {};
    if (sort === 'votes') {
      orderBy = { votes: 'desc' };
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sort === 'comments') {
      orderBy = { comments: { _count: 'desc' } };
    }

    const characters = await prisma.character.findMany({
      where: { status: 'active' },
      take: parseInt(limit),
      orderBy,
      include: {
        _count: { select: { comments: true, voteRecords: true } }
      }
    });

    const result = { characters, sort, limit: parseInt(limit) };
    
    // 缓存结果
    setCache(cacheKey, result);

    res.json(result);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== 错误处理 =====

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Anime Forum Backend running on port ${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await prisma.$disconnect();
  process.exit(0);
});
