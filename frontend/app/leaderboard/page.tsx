import { getCharacters, getLeaderboard, Character } from '@/lib/api';
import LeaderboardClient from './LeaderboardClient';

export const dynamic = 'force-dynamic';

export default async function Leaderboard({ searchParams }: { searchParams: { type?: string } }) {
  const sortBy = searchParams.type === 'comments' ? 'comments' : 'votes';
  let characters: Character[] = [];
  
  try {
    // 使用 leaderboard API 获取排序后的数据
    const data = await getLeaderboard(sortBy, 20);
    characters = data.characters || [];
  } catch (err) {
    console.error('Failed to fetch leaderboard:', err);
    // 降级使用普通角色列表
    try {
      const data = await getCharacters(1, '', '');
      characters = data.characters || [];
    } catch (e) {
      console.error('Failed to fetch characters:', e);
    }
  }
  
  return <LeaderboardClient initialCharacters={characters} initialSortBy={sortBy} />;
}
