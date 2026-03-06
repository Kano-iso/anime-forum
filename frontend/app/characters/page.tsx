import { getCharacters, Character } from '@/lib/api';
import CharactersClient from './CharactersClient';

export const dynamic = 'force-dynamic';

export default async function CharactersPage() {
  let characters: Character[] = [];
  
  try {
    const data = await getCharacters(1, '', '');
    characters = data.characters || [];
  } catch (err) {
    console.error('Failed to fetch characters:', err);
  }
  
  return <CharactersClient initialCharacters={characters} />;
}
