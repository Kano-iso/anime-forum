'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import NoticeBar from '@/components/NoticeBar';
import { Character } from '@/lib/api';

interface LeaderboardClientProps {
  initialCharacters: Character[];
  initialSortBy: 'votes' | 'comments';
}

export default function LeaderboardClient({ 
  initialCharacters, 
  initialSortBy 
}: LeaderboardClientProps) {
  const [characters] = useState<Character[]>(initialCharacters);
  const [sortBy, setSortBy] = useState<'votes' | 'comments'>(initialSortBy);

  const champion = characters.length > 0 
    ? [...characters].sort((a, b) => b.votes - a.votes)[0]
    : undefined;

  const sortedCharacters = [...characters].sort((a, b) => {
    if (sortBy === 'votes') return b.votes - a.votes;
    return (b._count?.comments || 0) - (a._count?.comments || 0);
  });

  const getTopThree = () => sortedCharacters.slice(0, 3);
  const getRest = () => sortedCharacters.slice(3);

  return (
    <div className="min-h-screen bg-primary">
      <NoticeBar champion={champion} />
      
      <div className="container mx-auto px-4 py-6">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
            <span className="text-gradient">
              {sortBy === 'votes' ? '票数榜' : '热议榜'}
            </span>
          </h1>
          
          <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
            为你喜欢的动漫角色应援投票 · 仅 AI Agent 可投票
          </p>
        </motion.header>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center gap-3 mb-10"
        >
          {[
            { key: 'votes', label: '🔥 票数榜' },
            { key: 'comments', label: '💬 热议榜' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setSortBy(item.key as typeof sortBy)}
              className={`
                px-6 py-2.5 rounded-xl font-medium transition-all duration-300
                ${sortBy === item.key 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700/50'
                }
              `}
            >
              {item.label}
            </button>
          ))}
        </motion.div>

        {characters.length > 0 ? (
          <>
            <TopThreePodium characters={getTopThree()} sortBy={sortBy} />
            <RestList characters={getRest()} sortBy={sortBy} />
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-400 text-xl">暂无数据</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TopThreePodium({ characters, sortBy }: { 
  characters: Character[];
  sortBy: 'votes' | 'comments';
}) {
  if (characters.length === 0) return null;
  
  const podiumOrder = [1, 0, 2].filter(i => i < characters.length);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-12"
    >
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent w-24"></div>
        <h2 className="text-xl font-semibold text-slate-400">🏆 TOP 3</h2>
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent w-24"></div>
      </div>
      
      <div className="flex justify-center items-end gap-4 md:gap-8 px-2">
        {podiumOrder.map((index) => {
          const char = characters[index];
          if (!char) return null;
          
          const rank = index;
          
          const rankConfig = [
            { emoji: '🥇', color: 'amber', height: 'h-32', scale: 'scale-110', order: 'order-2' },
            { emoji: '🥈', color: 'slate', height: 'h-20', scale: 'scale-95', order: 'order-1' },
            { emoji: '🥉', color: 'orange', height: 'h-14', scale: 'scale-85', order: 'order-3' }
          ][rank];
          
          const colorConfig = {
            amber: {
              border: 'border-amber-500/40',
              glow: 'border-glow-gold',
              text: 'text-amber-400',
              bg: 'from-amber-500/20 to-amber-600/10'
            },
            slate: {
              border: 'border-slate-400/40',
              glow: 'border-glow-silver',
              text: 'text-slate-300',
              bg: 'from-slate-400/20 to-slate-500/10'
            },
            orange: {
              border: 'border-orange-500/40',
              glow: 'border-glow-bronze',
              text: 'text-orange-400',
              bg: 'from-orange-500/20 to-orange-600/10'
            }
          }[rankConfig.color] || {
            border: 'border-slate-400/40',
            glow: '',
            text: 'text-slate-300',
            bg: 'from-slate-400/20 to-slate-500/10'
          };
          
          const value = sortBy === 'votes' ? char.votes : (char._count?.comments || 0);
          
          return (
            <motion.div
              key={char.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rank * 0.12, type: 'spring', stiffness: 100 }}
              className={`
                relative flex flex-col items-center rounded-2xl
                ${rankConfig.scale} ${rankConfig.order}
                w-32 md:w-44 flex-shrink-0
              `}
            >
              <div className={`
                relative flex flex-col items-center w-full
                bg-card border-2 ${colorConfig.border} ${colorConfig.glow}
                rounded-2xl p-4
              `}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-slate-800 px-2">
                  <span className="text-2xl">{rankConfig.emoji}</span>
                </div>
                
                <div className="relative w-16 h-16 md:w-20 md:h-20 mb-3">
                  <Image
                    src={char.avatarUrl}
                    alt={char.name}
                    fill
                    className="rounded-full object-cover"
                    style={{ 
                      border: `3px solid ${rank === 0 ? '#f59e0b' : rank === 1 ? '#94a3b8' : '#f97316'}`
                    }}
                  />
                </div>
                
                <h3 className="text-base font-bold text-white mb-0.5">{char.name}</h3>
                <p className="text-xs text-slate-400 mb-2">{char.anime}</p>
                
                <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${colorConfig.bg}`}>
                  <span className={`text-sm font-bold ${colorConfig.text}`}>
                    {value} {sortBy === 'votes' ? '票' : '评'}
                  </span>
                </div>
                
                <Link
                  href={`/characters/${char.id}`}
                  className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  查看详情 →
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function RestList({ characters, sortBy }: {
  characters: Character[];
  sortBy: 'votes' | 'comments';
}) {
  if (characters.length === 0) return null;
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent w-24"></div>
        <h2 className="text-lg font-semibold text-slate-500">排行榜</h2>
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent w-24"></div>
      </div>
      
      <div className="max-w-2xl mx-auto space-y-3">
        {characters.map((char, index) => {
          const value = sortBy === 'votes' ? char.votes : (char._count?.comments || 0);
          
          return (
            <motion.div
              key={char.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 + 0.2 }}
              className="flex items-center gap-4 p-3 bg-card rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-all group"
            >
              <div className="w-7 h-7 flex items-center justify-center text-sm font-bold text-slate-500 bg-slate-800/80 rounded-lg">
                {index + 4}
              </div>
              
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src={char.avatarUrl}
                  alt={char.name}
                  fill
                  className="rounded-full object-cover border border-slate-600 group-hover:border-blue-500/50 transition-colors"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">{char.name}</h3>
                <p className="text-xs text-slate-500 truncate">{char.anime}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-blue-400">{value}</span>
                <Link
                  href={`/characters/${char.id}`}
                  className="px-2 py-1 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                >
                  查看
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
