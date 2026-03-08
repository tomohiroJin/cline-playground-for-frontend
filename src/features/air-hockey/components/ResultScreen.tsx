import React, { useState, useEffect, useRef } from 'react';
import { ShareButton } from '../../../components/molecules/ShareButton';
import { MenuCard, GameTitle, StartButton } from '../styles';
import { MatchStats, Difficulty } from '../core/types';
import { Achievement } from '../core/achievements';
import { DIFFICULTY_LABELS } from '../core/config';

type ResultScreenProps = {
  winner: string | null;
  scores: { p: number; c: number };
  onBackToMenu: () => void;
  onReplay?: () => void;
  stats?: MatchStats;
  newAchievements?: Achievement[];
  suggestedDifficulty?: Difficulty;
  onAcceptDifficulty?: (d: Difficulty) => void;
  /** ストーリーモード用: ステージ選択に戻る */
  onBackToStageSelect?: () => void;
  /** ストーリーモード用: 次のステージへ */
  onNextStage?: () => void;
};

// カウントアップアニメーション用フック
const useCountUp = (target: number, duration = 800): number => {
  const [current, setCurrent] = useState(0);
  const startTime = useRef(0);
  const animIdRef = useRef(0);

  useEffect(() => {
    if (target === 0) return;
    startTime.current = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // イージング（ease-out）
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(target * eased));
      if (progress < 1) {
        animIdRef.current = requestAnimationFrame(animate);
      }
    };
    animIdRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animIdRef.current);
  }, [target, duration]);

  return current;
};

// MVP カテゴリ判定
const getMvpCategory = (stats: MatchStats): { label: string; value: string } | undefined => {
  const candidates = [
    { label: 'Most Hits', value: `${stats.playerHits}`, score: stats.playerHits },
    { label: 'Best Saves', value: `${stats.playerSaves}`, score: stats.playerSaves * 2 },
    { label: 'Top Speed', value: stats.maxPuckSpeed.toFixed(1), score: stats.maxPuckSpeed },
  ];
  const best = candidates.reduce((a, b) => a.score > b.score ? a : b);
  if (best.score === 0) return undefined;
  return { label: best.label, value: best.value };
};

// 統計の行コンポーネント
const StatRow: React.FC<{ label: string; playerValue: string | number; cpuValue: string | number }> = ({ label, playerValue, cpuValue }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
    <span style={{ color: '#3498db', fontWeight: 'bold', width: '60px', textAlign: 'right' }}>{playerValue}</span>
    <span style={{ color: '#888', fontSize: '0.85rem' }}>{label}</span>
    <span style={{ color: '#e74c3c', fontWeight: 'bold', width: '60px', textAlign: 'left' }}>{cpuValue}</span>
  </div>
);

// 紙吹雪パーティクル
type ConfettiParticle = { x: number; y: number; vx: number; vy: number; color: string; rotation: number; size: number };

const ConfettiOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 450;
    canvas.height = 600;

    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bcb', '#c76bff'];
    // パーティクル初期化
    particlesRef.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      size: Math.random() * 8 + 4,
    }));

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.rotation += p.vx * 2;
        // 画面外に出たら上からリスポーン
        if (p.y > canvas.height + 20) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
          p.vy = Math.random() * 3 + 1;
        }
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
};

export const ResultScreen: React.FC<ResultScreenProps> = ({
  winner, scores, onBackToMenu, onReplay, stats, newAchievements,
  suggestedDifficulty, onAcceptDifficulty,
  onBackToStageSelect, onNextStage,
}) => {
  const isWin = winner === 'player';

  // カウントアップアニメーション
  const animHits = useCountUp(stats?.playerHits ?? 0);
  const animCpuHits = useCountUp(stats?.cpuHits ?? 0);
  const animSaves = useCountUp(stats?.playerSaves ?? 0);
  const animCpuSaves = useCountUp(stats?.cpuSaves ?? 0);
  const animPlayerItems = useCountUp(stats?.playerItemsCollected ?? 0);
  const animCpuItems = useCountUp(stats?.cpuItemsCollected ?? 0);

  const mvp = stats ? getMvpCategory(stats) : undefined;

  // 試合時間のフォーマット
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <MenuCard style={{ position: 'relative', overflow: 'hidden' }}>
      {isWin && <ConfettiOverlay />}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          {isWin ? '🎉' : '😢'}
        </div>
        <GameTitle style={{ color: isWin ? 'var(--accent-color)' : '#ff4444' }}>
          {isWin ? 'YOU WIN!' : 'YOU LOSE'}
        </GameTitle>
        <p style={{ fontSize: '2rem', color: 'white', fontWeight: 'bold', marginBottom: '20px' }}>
          {scores.p} - {scores.c}
        </p>

        {/* MVP ハイライト */}
        {mvp && isWin && (
          <div style={{
            marginBottom: '1rem',
            padding: '8px 20px',
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.2))',
            borderRadius: '20px',
            border: '1px solid rgba(255, 215, 0, 0.4)',
          }}>
            <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '0.85rem' }}>
              MVP: {mvp.label} - {mvp.value}
            </span>
          </div>
        )}

        {/* 統計（カウントアップアニメーション付き） */}
        {stats && (
          <div style={{ width: '100%', marginBottom: '1.5rem', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
            <p style={{ color: '#aaa', fontSize: '0.8rem', textAlign: 'center', marginBottom: '8px', fontWeight: 'bold' }}>MATCH STATS</p>
            <StatRow label="Hits" playerValue={animHits} cpuValue={animCpuHits} />
            <StatRow label="Saves" playerValue={animSaves} cpuValue={animCpuSaves} />
            <StatRow label="Items" playerValue={animPlayerItems} cpuValue={animCpuItems} />
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '8px', color: '#aaa', fontSize: '0.8rem' }}>
              <span>Max Speed: {stats.maxPuckSpeed.toFixed(1)}</span>
              <span>Time: {formatTime(stats.matchDuration)}</span>
            </div>
          </div>
        )}

        {/* 新規実績 */}
        {newAchievements && newAchievements.length > 0 && (
          <div style={{ width: '100%', marginBottom: '1rem' }}>
            <p style={{ color: '#ffd700', fontSize: '0.8rem', textAlign: 'center', marginBottom: '8px', fontWeight: 'bold' }}>
              NEW ACHIEVEMENTS!
            </p>
            {newAchievements.map(a => (
              <div key={a.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                marginBottom: '4px',
                background: 'rgba(255, 215, 0, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 215, 0, 0.3)',
              }}>
                <span style={{ fontSize: '1.2rem' }}>{a.icon}</span>
                <div>
                  <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '0.85rem' }}>{a.name}</span>
                  <span style={{ color: '#aaa', fontSize: '0.75rem', marginLeft: '8px' }}>{a.description}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <ShareButton
            text={`Air Hockeyで${isWin ? '勝利' : '敗北'}！ スコア: ${scores.p} - ${scores.c}`}
            hashtags={['AirHockey', 'GamePlatform']}
          />
        </div>

        {/* 難易度提案 */}
        {suggestedDifficulty && onAcceptDifficulty && (
          <div style={{
            width: '100%',
            marginBottom: '1rem',
            padding: '12px',
            background: 'rgba(255, 165, 0, 0.15)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 165, 0, 0.3)',
            textAlign: 'center',
          }}>
            <p style={{ color: '#ffa500', fontSize: '0.85rem', marginBottom: '8px' }}>
              {isWin ? '連勝中！難易度を上げてみませんか？' : '難易度を下げてみませんか？'}
            </p>
            <button
              onClick={() => onAcceptDifficulty(suggestedDifficulty)}
              style={{
                padding: '6px 16px',
                borderRadius: '16px',
                border: '1px solid #ffa500',
                background: 'rgba(255, 165, 0, 0.2)',
                color: '#ffa500',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 'bold',
              }}
            >
              {DIFFICULTY_LABELS[suggestedDifficulty]} に変更
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {onReplay && (
            <StartButton onClick={onReplay} style={{ background: 'linear-gradient(135deg, #00ff88, #00cc66)' }}>
              REPLAY
            </StartButton>
          )}
          {onNextStage && isWin && (
            <StartButton onClick={onNextStage} style={{ background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)' }}>
              次のステージへ
            </StartButton>
          )}
          {onBackToStageSelect && (
            <StartButton onClick={onBackToStageSelect} style={{ background: 'linear-gradient(135deg, #a55eea, #8854d0)' }}>
              ステージ選択
            </StartButton>
          )}
          <StartButton onClick={onBackToMenu}>BACK TO MENU</StartButton>
        </div>
      </div>
    </MenuCard>
  );
};

