const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 角色图片映射配置
const CHARACTER_IMAGE_MAP: Record<string, string> = {
  'Ariel': '1.jpg',
  '阿米娅': '2.jpg',
  '初音未来': '3.jpg',
  '绫波丽': '4.jpg',
  '蕾姆': '5.jpg',
  '御坂美琴': '6.jpg',
};

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
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (search) params.set('search', search);
  if (anime) params.set('anime', anime);
  
  const res = await fetch(`${API_URL}/api/v1/characters?${params}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch characters');
  const data = await res.json();
  return {
    ...data,
    characters: data.characters.map(transformCharacter),
  };
}

export async function getCharacter(id: string): Promise<Character> {
  const res = await fetch(`${API_URL}/api/v1/characters/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch character');
  const char = await res.json();
  return transformCharacter(char);
}

export async function getComments(characterId: string, page = 1): Promise<{ comments: Comment[], total: number }> {
  const res = await fetch(
    `${API_URL}/api/v1/characters/${characterId}/comments?page=${page}&limit=20`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error('Failed to fetch comments');
  return res.json();
}

export async function getLeaderboard(sort = 'votes', limit = 20): Promise<{ characters: Character[] }> {
  const res = await fetch(
    `${API_URL}/api/v1/leaderboard?sort=${sort}&limit=${limit}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  const data = await res.json();
  return {
    characters: data.characters.map(transformCharacter),
  };
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
