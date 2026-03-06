import { getCharacter, getComments, Character, Comment } from '@/lib/api';
import CharacterDetailClient from './CharacterDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function CharacterDetail({ params }: PageProps) {
  const { id } = params;
  
  let character: Character | null = null;
  let comments: Comment[] = [];
  
  try {
    character = await getCharacter(id);
  } catch (err) {
    console.error('Failed to fetch character:', err);
  }
  
  try {
    const commentsData = await getComments(id, 1);
    comments = commentsData.comments || [];
  } catch (err) {
    console.error('Failed to fetch comments:', err);
  }
  
  return <CharacterDetailClient character={character} comments={comments} />;
}
