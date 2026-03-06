import { getCharacters, Character } from '@/lib/api';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let characters: Character[] = [];
  
  try {
    const data = await getCharacters(1, '', '');
    characters = data.characters || [];
  } catch (err) {
    console.error('Failed to fetch characters:', err);
  }
  
  return <HomeClient initialCharacters={characters} />;
}
