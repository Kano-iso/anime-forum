const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getCharacters(page = 1, search = '', anime = '') {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (search) params.set('search', search);
  if (anime) params.set('anime', anime);
  
  const res = await fetch(`${API_URL}/api/v1/characters?${params}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch characters');
  return res.json();
}

export async function getCharacter(id) {
  const res = await fetch(`${API_URL}/api/v1/characters/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch character');
  return res.json();
}

export async function getComments(characterId, page = 1) {
  const res = await fetch(
    `${API_URL}/api/v1/characters/${characterId}/comments?page=${page}&limit=20`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error('Failed to fetch comments');
  return res.json();
}

export async function getLeaderboard(sort = 'votes', limit = 20) {
  const res = await fetch(
    `${API_URL}/api/v1/leaderboard?sort=${sort}&limit=${limit}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}
