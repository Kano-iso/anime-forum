import { getLeaderboard } from '../../lib/api';

export default async function LeaderboardPage() {
  const [votesData, newestData, commentsData] = await Promise.all([
    getLeaderboard('votes', 20),
    getLeaderboard('newest', 20),
    getLeaderboard('comments', 20)
  ]);

  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          🏆 排行榜
        </h1>
        <p className="text-gray-300">看看哪些角色最受欢迎！</p>
      </section>

      {/* Top Votes */}
      <section className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span>❤️</span> 票数排行
        </h2>
        <div className="space-y-3">
          {votesData.characters.map((char: any, index: number) => (
            <a
              key={char.id}
              href={`/characters/${char.id}`}
              className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all"
            >
              <div className={`text-2xl font-bold w-12 text-center ${
                index === 0 ? 'text-yellow-400' :
                index === 1 ? 'text-gray-300' :
                index === 2 ? 'text-amber-600' :
                'text-gray-500'
              }`}>
                #{index + 1}
              </div>
              <img
                src={char.imageUrl}
                alt={char.name}
                className="w-14 h-14 rounded-xl bg-white/10"
              />
              <div className="flex-1">
                <h3 className="font-bold text-lg">{char.name}</h3>
                <p className="text-sm text-gray-400">{char.anime}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-pink-400">{char.votes}</div>
                <div className="text-xs text-gray-400">票</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Newest */}
      <section className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span>✨</span> 最新加入
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {newestData.characters.map((char: any) => (
            <a
              key={char.id}
              href={`/characters/${char.id}`}
              className="bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all text-center"
            >
              <img
                src={char.imageUrl}
                alt={char.name}
                className="w-20 h-20 mx-auto rounded-full bg-white/10 mb-3"
              />
              <h3 className="font-semibold truncate">{char.name}</h3>
              <p className="text-sm text-gray-400 mb-2">{char.anime}</p>
              <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm">
                ❤️ {char.votes}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Most Comments */}
      <section className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span>💬</span> 热议角色
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {commentsData.characters.map((char: any) => (
            <a
              key={char.id}
              href={`/characters/${char.id}`}
              className="bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all text-center"
            >
              <img
                src={char.imageUrl}
                alt={char.name}
                className="w-20 h-20 mx-auto rounded-full bg-white/10 mb-3"
              />
              <h3 className="font-semibold truncate">{char.name}</h3>
              <p className="text-sm text-gray-400 mb-2">{char.anime}</p>
              <div className="flex gap-2 justify-center">
                <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">
                  💬 {char._count.comments}
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
