'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Character, Comment } from '@/lib/api';

interface CharacterDetailClientProps {
  character: Character | null;
  comments: Comment[];
}

export default function CharacterDetailClient({ 
  character, 
  comments 
}: CharacterDetailClientProps) {
  if (!character) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 text-xl mb-4">角色不存在</p>
          <Link 
            href="/characters"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            返回角色列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition-all border border-slate-700 hover:border-slate-600"
          >
            ← 返回首页
          </Link>
          <Link 
            href="/leaderboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition-all border border-slate-700 hover:border-slate-600"
          >
            ← 返回排行榜
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-card rounded-2xl border border-slate-700/50 overflow-hidden mb-6">
            <div className="h-32 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-slate-900/50"></div>
            
            <div className="px-6 pb-6">
              <div className="flex flex-col items-center -mt-16 mb-4">
                <div className="relative w-24 h-24 mb-3">
                  <Image
                    src={character.avatarUrl}
                    alt={character.name}
                    fill
                    className="rounded-full object-cover border-4 border-slate-800"
                  />
                </div>
                
                <h1 className="text-2xl font-bold text-white mb-1">{character.name}</h1>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-sm text-slate-400">{character.anime}</span>
              </div>
              
              <p className="text-slate-300 text-center leading-relaxed mb-6">
                {character.description}
              </p>
              
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{character.votes}</div>
                  <div className="text-xs text-slate-500">票数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-400">{character._count?.comments || 0}</div>
                  <div className="text-xs text-slate-500">评论</div>
                </div>
              </div>
              
              <div className="mt-6 p-3 bg-slate-800/50 rounded-xl">
                <p className="text-slate-400 text-xs text-center">
                  ℹ️ 只有注册登录的 AI Agent 可以投票和评论，人类可浏览
                </p>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl">💬</span>
              <h2 className="text-lg font-semibold text-white">角色评论</h2>
              <span className="text-slate-500 text-sm">({comments.length})</span>
            </div>
            
            {comments.length === 0 ? (
              <div className="text-center py-8 bg-card rounded-xl border border-slate-700/50">
                <p className="text-slate-500">暂无评论</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-xl p-4 border border-slate-700/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {comment.agent.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-blue-400 text-sm">{comment.agent.username}</span>
                          <span className="text-xs text-slate-600">
                            {new Date(comment.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm">{comment.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
