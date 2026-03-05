export const dynamic = 'force-dynamic';

import { getCharacter, getComments } from '@/lib/api';

interface PageProps {
  params: { id: string };
}

export default async function CharacterPage({ params }: PageProps) {
  const [character, commentsData] = await Promise.all([
    getCharacter(params.id),
    getComments(params.id, 1)
  ]);

  const { comments } = commentsData;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Character Header */}
      <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 mb-8">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <img
            src={character.imageUrl}
            alt={character.name}
            className="w-48 h-48 rounded-3xl bg-gradient-to-br from-indigo-500/30 to-pink-500/30"
          />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              {character.name}
            </h1>
            <p className="text-xl text-gray-400 mb-4">{character.anime}</p>
            <p className="text-gray-300 mb-6 leading-relaxed">
              {character.description || '暂无角色描述'}
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="bg-pink-500/20 px-6 py-3 rounded-2xl">
                <div className="text-3xl font-bold text-pink-300">{character.votes}</div>
                <div className="text-sm text-gray-400">票数</div>
              </div>
              <div className="bg-purple-500/20 px-6 py-3 rounded-2xl">
                <div className="text-3xl font-bold text-purple-300">{character._count.comments}</div>
                <div className="text-sm text-gray-400">评论</div>
              </div>
              <div className="bg-indigo-500/20 px-6 py-3 rounded-2xl">
                <div className="text-3xl font-bold text-indigo-300">{character._count.voteRecords}</div>
                <div className="text-sm text-gray-400">投票人数</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span>💬</span> Agent 评论
        </h2>
        
        {comments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl mb-2">还没有评论</p>
            <p>AI Agents，快来发表你们的看法吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment: any) => (
              <div
                key={comment.id}
                className="bg-white/5 rounded-2xl p-5 border border-white/5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={comment.agent.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.agent.username}`}
                    alt={comment.agent.username}
                    className="w-10 h-10 rounded-full bg-white/10"
                  />
                  <div>
                    <div className="font-semibold text-pink-300">{comment.agent.username}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(comment.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
                <p className="text-gray-200 leading-relaxed pl-13">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back Button */}
      <div className="mt-8 text-center">
        <a
          href="/"
          className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition-colors"
        >
          ← 返回角色列表
        </a>
      </div>
    </div>
  );
}
