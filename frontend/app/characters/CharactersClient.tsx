'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import NoticeBar from '@/components/NoticeBar';
import { Character } from '@/lib/api';

interface CharactersClientProps {
  initialCharacters: Character[];
}

const WISHLIST: { name: string }[] = [
  { name: "灶门祢豆子" },
  { name: "血小板" },
  { name: "薇尔莉特" },
];

type TabType = 'season1' | 'season2' | 'wishlist';

// 一期角色 ID 列表（根据实际数据调整）
const SEASON1_IDS = ['cmme0f04j0000m5b8tvhzzdf7', 'cmme0f04m0001m5b8nex42y8h', 'cmme0f04o0002m5b8awo6ack0'];
// 二期角色 ID 列表
const SEASON2_IDS = ['cmme0f04r0003m5b8tiq2qrcl', 'cmme0f04t0004m5b8lfenidh0', 'cmme0f04v0005m5b8wnukkd3o'];

export default function CharactersClient({ initialCharacters }: CharactersClientProps) {
  const [characters] = useState<Character[]>(initialCharacters);
  const [activeTab, setActiveTab] = useState<TabType>('season1');

  const champion = characters.length > 0 
    ? [...characters].sort((a, b) => b.votes - a.votes)[0]
    : undefined;

  // 根据标签筛选角色
  const filteredCharacters = activeTab === 'wishlist' 
    ? [] 
    : activeTab === 'season1'
      ? characters.filter(c => SEASON1_IDS.includes(c.id))
      : characters.filter(c => SEASON2_IDS.includes(c.id));

  const tabs = [
    { key: 'season1', label: '一期角色', icon: '⭐' },
    { key: 'season2', label: '二期角色', icon: '🌟' },
    { key: 'wishlist', label: '愿望单', icon: '💫' },
  ] as const;

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
            <span className="text-gradient">全部角色</span>
          </h1>
          
          <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
            选择角色分期，查看对应的角色列表
          </p>
        </motion.header>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center gap-2 mb-8"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-5 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center gap-2
                ${activeTab === tab.key 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700/50'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </motion.div>

        {activeTab === 'wishlist' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md mx-auto"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center">
                <span className="text-4xl">💫</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">愿望单排行榜</h2>
              <p className="text-slate-400 text-sm">期待更多角色加入投票吗？</p>
            </div>
            
            <div className="space-y-3">
              {WISHLIST.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-card rounded-xl border border-slate-700/50"
                >
                  <div className={`
                    w-8 h-8 flex items-center justify-center text-sm font-bold rounded-lg
                    ${index === 0 ? 'bg-amber-500/20 text-amber-400' : 
                      index === 1 ? 'bg-slate-400/20 text-slate-300' : 'bg-orange-500/20 text-orange-400'}
                  `}>
                    {index + 1}
                  </div>
                  <span className="text-lg font-semibold text-white">{item.name}</span>
                </motion.div>
              ))}
            </div>
            
            <p className="text-center text-slate-500 text-sm mt-4">其余待展示</p>
          </motion.div>
        ) : (
          <>
            {filteredCharacters.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              >
                {filteredCharacters.map((char, index) => (
                  <CharacterCard key={char.id} character={char} index={index} />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-20">
                <p className="text-slate-400 text-xl">
                  {activeTab === 'season1' ? '一期角色数据加载中...' : '二期角色数据加载中...'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CharacterCard({ character, index }: { character: Character; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/characters/${character.id}`}>
        <div className="group relative bg-card rounded-2xl border border-slate-700/50 overflow-hidden hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/10 transition-all">
          <div className="relative h-32 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-20 h-20">
                <Image
                  src={character.avatarUrl}
                  alt={character.name}
                  fill
                  className="rounded-full object-cover border-3 border-slate-700 group-hover:border-blue-500/50 transition-all"
                />
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors mb-1">
              {character.name}
            </h3>
            <p className="text-sm text-slate-400 mb-3">{character.anime}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <span className="text-pink-400 text-sm font-medium">❤️ {character.votes}</span>
                <span className="text-slate-500 text-sm">💬 {character._count?.comments || 0}</span>
              </div>
              <span className="text-blue-400 text-sm group-hover:translate-x-1 transition-transform">
                查看 →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
