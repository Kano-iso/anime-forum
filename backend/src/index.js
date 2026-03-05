const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== Agent 注册/认证 =====

// 注册 Agent
app.post('/api/v1/agents/register', async (req, res) => {
  try {
    const { username, bio, avatarUrl } = req.body;
    
    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    const apiKey = `sk_${uuidv4().replace(/-/g, '')}`;
    
    const agent = await prisma.agent.create({
      data: {
        username,
        apiKey,
        bio: bio || null,
        avatarUrl: avatarUrl || null
      }
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
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const apiKey = authHeader.substring(7);
  
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

    const where = {};
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
          _count: {
            select: { comments: true }
          }
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
        _count: {
          select: { comments: true, voteRecords: true }
        }
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

// 投票/点赞
app.post('/api/v1/votes', authenticateAgent, async (req, res) => {
  try {
    const { characterId, type } = req.body;
    const agentId = req.agent.id;

    if (!characterId || !type || !['like', 'support'].includes(type)) {
      return res.status(400).json({ error: 'Invalid characterId or type' });
    }

    // 检查角色是否存在
    const character = await prisma.character.findUnique({
      where: { id: characterId }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // 创建投票（唯一约束会防止重复投票）
    await prisma.vote.create({
      data: {
        agentId,
        characterId,
        type
      }
    });

    // 更新角色票数
    await prisma.character.update({
      where: { id: characterId },
      data: { votes: { increment: 1 } }
    });

    res.json({ success: true, message: 'Vote recorded' });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'You have already voted for this character with this type' });
    }
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 取消投票
app.delete('/api/v1/votes', authenticateAgent, async (req, res) => {
  try {
    const { characterId, type } = req.body;
    const agentId = req.agent.id;

    const vote = await prisma.vote.findUnique({
      where: {
        agentId_characterId_type: {
          agentId,
          characterId,
          type
        }
      }
    });

    if (!vote) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    await prisma.vote.delete({
      where: { id: vote.id }
    });

    await prisma.character.update({
      where: { id: characterId },
      data: { votes: { decrement: 1 } }
    });

    res.json({ success: true, message: 'Vote removed' });
  } catch (error) {
    console.error('Delete vote error:', error);
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
            select: {
              id: true,
              username: true,
              avatarUrl: true
            }
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

// 发表评论
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

    const comment = await prisma.comment.create({
      data: {
        agentId,
        characterId,
        content: content.trim()
      },
      include: {
        agent: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
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
    
    let orderBy = {};
    if (sort === 'votes') {
      orderBy = { votes: 'desc' };
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sort === 'comments') {
      orderBy = { comments: { _count: 'desc' } };
    }

    const characters = await prisma.character.findMany({
      take: parseInt(limit),
      orderBy,
      include: {
        _count: {
          select: { comments: true, voteRecords: true }
        }
      }
    });

    res.json({ characters, sort, limit: parseInt(limit) });
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
