import React, { useState, useEffect, useRef } from 'react';
import { ShareButton } from '../../../components/molecules/ShareButton';
import { MenuCard, GameTitle, StartButton } from '../styles';
import { MatchStats, Difficulty, Character } from '../core/types';
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
  /** 対戦キャラクター情報 */
  cpuCharacter?: Character;
  /** プレイヤーキャラクター情報 */
  playerCharacter?: Character;
  /** 新規アンロックされたキャラ名（通知用） */
  newlyUnlockedCharacterName?: string;
  /** 2P 対戦モードかどうか */
  is2PMode?: boolean;
  /** 2v2 ペアマッチモードかどうか */
  is2v2Mode?: boolean;
  /** 1P のキャラクター名（2P 対戦用） */
  player1CharacterName?: string;
  /** 2P のキャラクター名（2P 対戦用） */
  player2CharacterName?: string;
  /** キャラ選択に戻る（2P 対戦用） */
  onBackToCharacterSelect?: () => void;
  /** P2 味方キャラ（2v2 立ち絵表示用） */
  allyCharacter?: Character;
  /** P4 敵2キャラ（2v2 立ち絵表示用） */
  enemyCharacter2?: Character;
  /** チーム設定に戻る（2v2 用） */
  onBackToTeamSetup?: () => void;
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
    <span style={{ color: '#b4b4b4', fontSize: '0.85rem' }}>{label}</span>
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

// 立ち絵表示コンポーネント
const PORTRAIT_FADE_IN_MS = 300;

const CharacterPortrait: React.FC<{
  character: Character;
  expression: 'normal' | 'happy';
}> = ({ character, expression }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!character.portrait) return null;
  const src = character.portrait[expression];
  return (
    <img
      src={src}
      alt={character.name}
      onLoad={() => setIsLoaded(true)}
      style={{
        maxWidth: '150px',
        maxHeight: '200px',
        objectFit: 'contain',
        opacity: isLoaded ? 1 : 0,
        transition: `opacity ${PORTRAIT_FADE_IN_MS}ms ease-out`,
      }}
    />
  );
};

// アンロック通知バナー
const UNLOCK_DELAY_MS = 500;

const UNLOCK_BANNER_FADE_MS = 300;

const UnlockBanner: React.FC<{ characterName: string }> = ({ characterName }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), UNLOCK_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      width: '100%',
      marginBottom: '1rem',
      padding: '10px 16px',
      background: 'rgba(255, 215, 0, 0.15)',
      borderRadius: '8px',
      border: '2px solid #ffd700',
      textAlign: 'center',
      opacity: isVisible ? 1 : 0,
      transition: `opacity ${UNLOCK_BANNER_FADE_MS}ms ease-out`,
    }}>
      <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '0.9rem' }}>
        🔓 {characterName}が図鑑に追加されました！
      </span>
    </div>
  );
};

/** 勝者表示テキストを生成する */
function getWinnerText(
  is2PMode: boolean | undefined,
  is2v2Mode: boolean | undefined,
  isWin: boolean,
  player1Name?: string,
  player2Name?: string
): string {
  if (is2v2Mode) return isWin ? 'チーム1 WIN!' : 'チーム2 WIN!';
  if (!is2PMode) return isWin ? 'YOU WIN!' : 'YOU LOSE';
  if (isWin) return player1Name ? `${player1Name} Win!` : '1P Win!';
  return player2Name ? `${player2Name} Win!` : '2P Win!';
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  winner, scores, onBackToMenu, onReplay, stats, newAchievements,
  suggestedDifficulty, onAcceptDifficulty,
  onBackToStageSelect, onNextStage,
  cpuCharacter, playerCharacter, newlyUnlockedCharacterName,
  is2PMode, is2v2Mode, player1CharacterName, player2CharacterName, onBackToCharacterSelect,
  allyCharacter, enemyCharacter2, onBackToTeamSetup,
}) => {
  const isWin = winner === 'player';
  const isMultiPlayerMode = is2PMode || is2v2Mode;

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
      {(isMultiPlayerMode || isWin) && <ConfettiOverlay />}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          {isMultiPlayerMode ? '🎊' : isWin ? '🎉' : '😢'}
        </div>
        <GameTitle style={{ color: (isMultiPlayerMode || isWin) ? 'var(--accent-color)' : '#ff4444' }}>
          {getWinnerText(is2PMode, is2v2Mode, isWin, player1CharacterName, player2CharacterName)}
        </GameTitle>
        <p style={{ fontSize: '2rem', color: 'white', fontWeight: 'bold', marginBottom: '20px' }}>
          {scores.p} - {scores.c}
        </p>

        {/* キャラ立ち絵エリア */}
        {(() => {
          const portraitContainer = (gap: string) => ({
            display: 'flex' as const, justifyContent: 'center' as const,
            gap, marginBottom: '1rem', alignItems: 'flex-end' as const,
          });
          if (is2v2Mode && (playerCharacter || allyCharacter || cpuCharacter || enemyCharacter2)) {
            return (
              <div style={portraitContainer('24px')}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {playerCharacter && <CharacterPortrait character={playerCharacter} expression={isWin ? 'happy' : 'normal'} />}
                  {allyCharacter && <CharacterPortrait character={allyCharacter} expression={isWin ? 'happy' : 'normal'} />}
                </div>
                <span data-testid="team-separator" style={{ color: '#666', fontSize: '1.2rem', alignSelf: 'center' }}>⚡</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {cpuCharacter && <CharacterPortrait character={cpuCharacter} expression={isWin ? 'normal' : 'happy'} />}
                  {enemyCharacter2 && <CharacterPortrait character={enemyCharacter2} expression={isWin ? 'normal' : 'happy'} />}
                </div>
              </div>
            );
          }
          if (playerCharacter?.portrait || cpuCharacter?.portrait) {
            return (
              <div style={portraitContainer('20px')}>
                {playerCharacter && <CharacterPortrait character={playerCharacter} expression={isWin ? 'happy' : 'normal'} />}
                {cpuCharacter && <CharacterPortrait character={cpuCharacter} expression={isWin ? 'normal' : 'happy'} />}
              </div>
            );
          }
          return null;
        })()}

        {/* アンロック通知 */}
        {newlyUnlockedCharacterName && (
          <UnlockBanner characterName={newlyUnlockedCharacterName} />
        )}

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
            <p style={{ color: '#b4b4b4', fontSize: '0.8rem', textAlign: 'center', marginBottom: '8px', fontWeight: 'bold' }}>MATCH STATS</p>
            <StatRow label="Hits" playerValue={animHits} cpuValue={animCpuHits} />
            <StatRow label="Saves" playerValue={animSaves} cpuValue={animCpuSaves} />
            <StatRow label="Items" playerValue={animPlayerItems} cpuValue={animCpuItems} />
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '8px', color: '#b4b4b4', fontSize: '0.8rem' }}>
              <span>Max Speed: {stats.maxPuckSpeed.toFixed(1)}</span>
              <span>Time: {formatTime(stats.matchDuration)}</span>
            </div>
          </div>
        )}

        {/* 新規実績（マルチプレイヤー対戦では非表示） */}
        {!isMultiPlayerMode && newAchievements && newAchievements.length > 0 && (
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
                  <span style={{ color: '#b4b4b4', fontSize: '0.75rem', marginLeft: '8px' }}>{a.description}</span>
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
            <StartButton onClick={onReplay} style={{ background: 'linear-gradient(135deg, #00ff88, #00cc66)', marginTop: 0 }}>
              {is2v2Mode ? '同じ設定でリプレイ' : 'REPLAY'}
            </StartButton>
          )}
          {onNextStage && isWin && (
            <StartButton onClick={onNextStage} style={{ background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)', marginTop: 0 }}>
              次のステージへ
            </StartButton>
          )}
          {onBackToStageSelect && (
            <StartButton onClick={onBackToStageSelect} style={{ background: 'linear-gradient(135deg, #a55eea, #8854d0)', marginTop: 0 }}>
              ステージ選択
            </StartButton>
          )}
          {is2PMode && onBackToCharacterSelect && (
            <StartButton onClick={onBackToCharacterSelect} style={{ background: 'linear-gradient(135deg, #e67e22, #d35400)', marginTop: 0 }}>
              キャラ選択に戻る
            </StartButton>
          )}
          {is2v2Mode && onBackToTeamSetup && (
            <StartButton onClick={onBackToTeamSetup} style={{ background: 'linear-gradient(135deg, #e67e22, #d35400)', marginTop: 0 }}>
              チーム設定に戻る
            </StartButton>
          )}
          <StartButton onClick={onBackToMenu} style={{ marginTop: 0 }}>BACK TO MENU</StartButton>
        </div>
      </div>
    </MenuCard>
  );
};

