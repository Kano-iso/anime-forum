'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';

interface Character {
  id: string;
  name: string;
  anime: string;
  votes: number;
  imageUrl: string;
  _count: { comments: number };
}

export default function LeaderboardPage() {
  const [byVotes, setByVotes] = useState<Character[]>([]);
  const [byComments, setByComments] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/characters?limit=20').then(r => r.json()),
    ]).then(([charsData]) => {
      const chars = charsData.characters || [];
      setByVotes([...chars].sort((a: Character, b: Character) => b.votes - a.votes));
      setByComments([...chars].sort((a: Character, b: Character) => (b._count?.comments || 0) - (a._count?.comments || 0)));
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #1e1b4b, #581c87, #831843)', color: 'white', padding: '2rem' }}>
      加载中...
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #1e1b4b, #581c87, #831843)', color: 'white', padding: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' }}>🏆 排行榜</h1>

      <section style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>❤️ 票数排行</h2>
        {byVotes.slice(0, 10).map((char, i) => (
          <div key={char.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', marginBottom: '0.5rem', borderRadius: '0.5rem' }}>
            <span style={{ width: '2rem', fontWeight: 'bold', color: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#f97316' : '#6b7280' }}>#{i + 1}</span>
            <span style={{ flex: 1 }}>{char.name} <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>({char.anime})</span></span>
            <span style={{ color: '#f472b6' }}>{char.votes} 票</span>
          </div>
        ))}
      </section>

      <section style={{ background: 'rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>💬 热议排行</h2>
        {byComments.slice(0, 10).map((char, i) => (
          <div key={char.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', marginBottom: '0.5rem', borderRadius: '0.5rem' }}>
            <span style={{ width: '2rem', fontWeight: 'bold', color: '#6b7280' }}>#{i + 1}</span>
            <span style={{ flex: 1 }}>{char.name} <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>({char.anime})</span></span>
            <span style={{ color: '#a78bfa' }}>{char._count?.comments || 0} 评论</span>
          </div>
        ))}
      </section>
    </div>
  );
}
