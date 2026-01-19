import React from 'react';
import { useNavigate } from 'react-router-dom';

const GameMenuPage: React.FC = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: 'puzzle',
      title: 'パズルゲーム',
      desc: 'スライドパズルでお気に入りの画像を完成させよう！',
      path: '/puzzle',
      color: 'bg-blue-600',
      icon: '🧩',
    },
    {
      id: 'falling-block',
      title: '落ち物パズル',
      desc: 'ブロックを揃えて消すクラシックアクション！',
      path: '/falling-block',
      color: 'bg-purple-600',
      icon: '🧱',
    },
    {
      id: 'air-hockey',
      title: 'エアホッケー',
      desc: 'CPUと対戦！反射神経が試される！',
      path: '/air-hockey',
      color: 'bg-cyan-600',
      icon: '🏒',
    },
    {
      id: 'racing',
      title: 'レーシング',
      desc: 'トップを目指して疾走しろ！',
      path: '/racing',
      color: 'bg-red-600',
      icon: '🏎️',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono p-8 flex flex-col items-center">
      <h1
        className="text-4xl md:text-6xl font-bold mb-12 text-yellow-400 tracking-widest text-center"
        style={{ textShadow: '4px 4px 0 #d97706' }}
      >
        GAME CENTER
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {games.map(game => (
          <div
            key={game.id}
            onClick={() => navigate(game.path)}
            className={`
              relative group cursor-pointer 
              border-4 border-gray-700 bg-gray-800 
              hover:border-white hover:scale-105 transition-all duration-200
              rounded-xl overflow-hidden
            `}
          >
            <div className={`h-32 ${game.color} flex items-center justify-center text-6xl`}>
              {game.icon}
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2 text-yellow-300">{game.title}</h2>
              <p className="text-gray-400 text-sm leading-relaxed">{game.desc}</p>
              <div className="mt-4 text-right text-xs text-blink text-green-400">PUSH START</div>
            </div>

            {/* Scanlines Effect */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-20 pointer-events-none"
              style={{ backgroundSize: '100% 4px' }}
            />
          </div>
        ))}
      </div>

      <div className="mt-16 text-gray-500 text-center text-xs">© 2024 RETRO GAME COLLECTION</div>
    </div>
  );
};

export default GameMenuPage;
