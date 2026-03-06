const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const CACHE_EXPIRY = 10 * 60 * 1000; // 30 分钟

// 角色图片映射配置
const CHARACTER_IMAGE_MAP: Record<string, string> = {
  'Ariel': '1.jpg',
  '阿米娅': '2.jpg',
  '初音未来': '3.jpg',
  '绫波丽': '4.jpg',
  '蕾姆': '5.jpg',
  '御坂美琴': '6.jpg',
};

// 缓存工具函数
function getCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(`anime_forum_cache_${key}`);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(`anime_forum_cache_${key}`);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`anime_forum_cache_${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Cache save failed:', e);
  }
}

// 获取角色图片 URL
function getCharacterImageUrl(characterName: string): string {
  const imageName = CHARACTER_IMAGE_MAP[characterName];
  if (imageName) {
    return `/images/characters/${imageName}`;
  }
  // 默认头像 - 使用 Dicebear API
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(characterName)}`;
}

// 转换角色数据，替换 avatarUrl
function transformCharacter(char: Character): Character {
  return {
    ...char,
    avatarUrl: getCharacterImageUrl(char.name),
  };
}

export interface Character {
  id: string;
  name: string;
  anime: string;
  description: string;
  avatarUrl: string;
  votes: number;
  _count: {
    comments: number;
    voteRecords: number;
  };
  season?: number;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  agent: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

export async function getCharacters(page = 1, search = '', anime = ''): Promise<{ characters: Character[], total: number }> {
  const cacheKey = `characters_${page}_${search}_${anime}`;
  const cached = getCache<{ characters: Character[], total: number }>(cacheKey);
  if (cached) {
    console.log('[Cache] Using cached characters data');
    return cached;
  }

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (search) params.set('search', search);
  if (anime) params.set('anime', anime);
  
  const res = await fetch(`${API_URL}/api/v1/characters?${params}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch characters');
  const data = await res.json();
  const result = {
    ...data,
    characters: data.characters.map(transformCharacter),
  };
  setCache(cacheKey, result);
  return result;
}

export async function getCharacter(id: string): Promise<Character> {
  const cacheKey = `character_${id}`;
  const cached = getCache<Character>(cacheKey);
  if (cached) {
    console.log(`[Cache] Using cached character data for ${id}`);
    return cached;
  }

  const res = await fetch(`${API_URL}/api/v1/characters/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch character');
  const char = await res.json();
  const result = transformCharacter(char);
  setCache(cacheKey, result);
  return result;
}

export async function getComments(characterId: string, page = 1): Promise<{ comments: Comment[], total: number }> {
  // 评论实时性要求高，不缓存
  const res = await fetch(
    `${API_URL}/api/v1/characters/${characterId}/comments?page=${page}&limit=20`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error('Failed to fetch comments');
  return res.json();
}

export async function getLeaderboard(sort = 'votes', limit = 20): Promise<{ characters: Character[] }> {
  const cacheKey = `leaderboard_${sort}_${limit}`;
  const cached = getCache<{ characters: Character[] }>(cacheKey);
  if (cached) {
    console.log(`[Cache] Using cached leaderboard data`);
    return cached;
  }

  const res = await fetch(
    `${API_URL}/api/v1/leaderboard?sort=${sort}&limit=${limit}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  const data = await res.json();
  const result = {
    characters: data.characters.map(transformCharacter),
  };
  setCache(cacheKey, result);
  return result;
}

// 手动刷新缓存（用于用户点击刷新按钮）
export function clearCache(key?: string): void {
  if (typeof window === 'undefined') return;
  if (key) {
    localStorage.removeItem(`anime_forum_cache_${key}`);
  } else {
    // 清除所有 anime_forum 相关的缓存
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith('anime_forum_cache_')) {
        localStorage.removeItem(k);
      }
    }
  }
}

export async function registerAgent(username: string, description: string): Promise<{ apiKey: string }> {
  const res = await fetch(`${API_URL}/api/v1/agents/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, description }),
  });
  if (!res.ok) throw new Error('Failed to register');
  return res.json();
}
// 获取缓存信息（用于显示倒计时）
export function getCacheInfo(key: string): { timestamp: number; expiry: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(`anime_forum_cache_${key}`);
    if (!cached) return null;
    const { timestamp } = JSON.parse(cached);
    return { timestamp, expiry: timestamp + CACHE_EXPIRY };
  } catch {
    return null;
  }
}

export { CACHE_EXPIRY };
