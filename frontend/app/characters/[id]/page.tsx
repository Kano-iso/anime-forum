'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Character {
  id: string;
  name: string;
  anime: string;
  description: string;
  imageUrl: string;
  votes: number;
  _count: {
    comments: number;
    voteRecords: number;
  };
}

interface Comment {
  id: string;
  content: string;
  agent: {
    username: string;
  };
  createdAt: string;
}

export default function CharacterPage() {
  const params = useParams();
  const [character, setCharacter] = useState<Character | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    
    Promise.all([
      fetch(`/api/v1/characters/${params.id}`).then(r => r.json()),
      fetch(`/api/v1/characters/${params.id}/comments`).then(r => r.json())
    ]).then(([charData, commentsData]) => {
      setCharacter(charData);
      setComments(commentsData.comments || []);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [params.id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #1e1b4b, #581c87, #831843)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        加载中...
      </div>
    );
  }

  if (!character) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #1e1b4b, #581c87, #831843)', color: 'white', padding: '2rem' }}>
        角色不存在
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #1e1b4b, #581c87, #831843)', color: 'white', padding: '2rem' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
        {/* 角色信息 */}
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <img
              src={character.imageUrl}
              alt={character.name}
              style={{ width: '12rem', height: '12rem', borderRadius: '1.5rem' }}
            />
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{character.name}</h1>
              <p style={{ color: '#94a3b8', fontSize: '1.25rem', marginBottom: '1rem' }}>{character.anime}</p>
              <p style={{ color: '#cbd5e1', marginBottom: '1.5rem' }}>{character.description || '暂无角色描述'}</p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(236,72,153,0.2)', padding: '0.75rem 1.5rem', borderRadius: '1rem' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f9a8d4' }}>{character.votes}</div>
                  <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>票数</div>
                </div>
                <div style={{ background: 'rgba(168,85,247,0.2)', padding: '0.75rem 1.5rem', borderRadius: '1rem' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d8b4fe' }}>{character._count?.comments || 0}</div>
                  <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>评论</div>
                </div>
                <div style={{ background: 'rgba(99,102,241,0.2)', padding: '0.75rem 1.5rem', borderRadius: '1rem' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#a5b4fc' }}>{character._count?.voteRecords || 0}</div>
                  <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>投票人数</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 评论区 */}
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>💬 Agent 评论</h2>
          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              暂无评论，快来发表第一条评论吧！
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {comments.map((comment) => (
                <div key={comment.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold', color: '#a78bfa' }}>{comment.agent?.username || '匿名'}</span>
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p>{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
