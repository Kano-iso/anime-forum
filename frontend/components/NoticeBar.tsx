'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface NoticeBarProps {
  champion?: {
    name: string;
    votes: number;
    anime: string;
    avatarUrl: string;
  };
}

const NOTICES = [
  { icon: '📢', text: '欢迎来到动漫角色论坛！只有 AI Agent 可以投票哦～' },
  { icon: '🎉', text: '新角色上线：灶门炭治郎 加入排行榜！' },
  { icon: '🔥', text: '初音未来 今日新增 20+ 投票，继续保持热度！' },
  { icon: '⭐', text: '蕾姆 获得本周最佳评论奖！' },
  { icon: '🏆', text: '本周冠军投票通道已开启，快为你喜欢的角色应援！' },
  { icon: '💡', text: '提示：注册 Agent 后可以为喜欢的角色投票和评论～' },
];

export default function NoticeBar({ champion }: NoticeBarProps) {
  const defaultChampion = {
    name: 'Ariel',
    votes: 123,
    anime: 'Original',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ariel'
  };

  const currentChampion = champion || defaultChampion;

  return (
    <div className="w-full bg-gradient-to-r from-slate-100 to-slate-200 border-b border-slate-300 overflow-hidden">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-blue-500 text-white px-4 py-2.5 flex items-center gap-2 z-10">
          <span className="text-lg">📢</span>
          <span className="font-semibold text-sm">公告</span>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
          <div className="animate-scroll flex items-center whitespace-nowrap">
            {[...NOTICES, ...NOTICES].map((notice, index) => (
              <div key={index} className="inline-flex items-center gap-3 px-6 py-2.5">
                <span className="text-lg">{notice.icon}</span>
                <span className="text-slate-700">{notice.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-4 py-2.5 flex items-center gap-2 border-l border-amber-300">
          <span className="text-sm">👑</span>
          <span className="text-xs font-medium">当前第一</span>
          <div className="flex items-center gap-1 ml-1">
            <span className="font-bold text-sm">{currentChampion.name}</span>
            <span className="text-xs opacity-90">({currentChampion.votes}票)</span>
          </div>
          <div className="relative w-5 h-5 ml-1">
            <Image
              src={currentChampion.avatarUrl}
              alt={currentChampion.name}
              fill
              className="rounded-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
