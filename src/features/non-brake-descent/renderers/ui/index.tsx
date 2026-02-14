import React from 'react';
import { GameState } from '../../constants';
import { ScoringDomain } from '../../domains/scoring-domain';
import { SpeedDomain } from '../../domains/speed-domain';
import {
  ClearAnim,
  EffectState,
  GameStateValue,
  Player,
  TouchKeys,
} from '../../types';

// コンボ表示コンポーネント
const ComboDisplay: React.FC<{ combo: number; timer: number }> = ({ combo, timer }) =>
  combo <= 1 || timer <= 0 ? (
    <></>
  ) : (
    <div
      style={{
        position: 'absolute',
        top: 70,
        left: '50%',
        transform: `translateX(-50%) scale(${1 + Math.sin(timer * 0.2) * 0.1})`,
        color: ['#fff', '#ffcc00', '#ff8800', '#ff4400', '#ff00ff'][Math.min(combo - 1, 4)],
        fontSize: 20,
        fontWeight: 'bold',
        textShadow: '0 0 10px currentColor',
      }}
    >
      {combo}x COMBO!
    </div>
  );

// ステージインジケーターコンポーネント
const StageIndicator: React.FC<{ rampIndex: number; total: number }> = ({ rampIndex, total }) => {
  const progress = rampIndex / total;
  const cfg =
    progress < 0.33
      ? { z: 'ZONE 1', c: '#44aaff' }
      : progress < 0.66
        ? { z: 'ZONE 2', c: '#ffaa44' }
        : { z: 'FINAL ZONE', c: '#ff4444' };
  return (
    <div
      style={{
        position: 'absolute',
        top: 50,
        left: 10,
        color: cfg.c,
        fontSize: 10,
        fontWeight: 'bold',
        opacity: 0.8,
      }}
    >
      {cfg.z}
    </div>
  );
};

// スピードメーターコンポーネント
const SpeedMeter: React.FC<{ speed: number }> = ({ speed }) => {
  const col = SpeedDomain.getColor(speed);
  const pct = SpeedDomain.getNormalized(speed) * 100;
  return (
    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: '#aaa', fontSize: 10 }}>SPEED</span>
      <div style={{ width: 60, height: 8, background: '#222', borderRadius: 4, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: `linear-gradient(90deg, #00aa44, ${col})`,
            transition: 'all 0.1s',
          }}
        />
      </div>
    </div>
  );
};

// プログレスバーコンポーネント
const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 12,
      left: 10,
      width: 90,
      height: 6,
      background: '#222',
      borderRadius: 3,
    }}
  >
    <div
      style={{
        width: `${(current / total) * 100}%`,
        height: '100%',
        background: 'linear-gradient(90deg, #00ddff, #44ffaa)',
        borderRadius: 3,
      }}
    />
  </div>
);

// UIオーバーレイコンポーネント
export const UIOverlay: React.FC<{
  score: number;
  speed: number;
  player: Player;
  effect: EffectState;
  total: number;
  speedBonus: number;
  combo: number;
  comboTimer: number;
  nearMissCount: number;
}> = ({ score, speed, player, effect, total, speedBonus, combo, comboTimer, nearMissCount }) => (
  <>
    <div style={{ position: 'absolute', top: 10, left: 10, color: '#fff', fontSize: 15, fontWeight: 'bold', textShadow: '0 0 8px #000' }}>
      SCORE: {score}
    </div>
    {speedBonus > 0 ? (
      <div style={{ position: 'absolute', top: 28, left: 10, color: '#ffaa00', fontSize: 11 }}>
        SPEED BONUS: +{speedBonus}
      </div>
    ) : undefined}
    {nearMissCount > 0 ? (
      <div style={{ position: 'absolute', top: 42, left: 10, color: '#44ffaa', fontSize: 10 }}>
        NEAR MISS: x{nearMissCount}
      </div>
    ) : undefined}
    <ComboDisplay combo={combo} timer={comboTimer} />
    <StageIndicator rampIndex={player.ramp} total={total} />
    <SpeedMeter speed={speed} />
    <div style={{ position: 'absolute', top: 32, right: 10, color: '#888', fontSize: 11 }}>
      {player.ramp + 1} / {total}
    </div>
    <ProgressBar current={player.ramp} total={total} />
    {effect.type ? (
      <div
        style={{
          position: 'absolute',
          top: 65,
          right: 10,
          padding: '3px 8px',
          background: effect.type === 'reverse' ? 'rgba(150,50,255,0.85)' : 'rgba(50,130,255,0.85)',
          borderRadius: 4,
          color: '#fff',
          fontSize: 10,
          fontWeight: 'bold',
        }}
      >
        {effect.type === 'reverse' ? '↺ REVERSE!' : '⇡ AUTO-JUMP!'}
      </div>
    ) : undefined}
  </>
);

// カウントダウンオーバーレイコンポーネント
export const CountdownOverlay: React.FC<{ count: number }> = ({ count }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
      zIndex: 30,
    }}
  >
    <div
      style={{
        fontSize: 80,
        color: count === 0 ? '#44ffaa' : '#fff',
        fontWeight: 'bold',
        textShadow: `0 0 30px ${count === 0 ? '#44ffaa' : '#00eeff'}`,
      }}
    >
      {count === 0 ? 'GO!' : count}
    </div>
  </div>
);

// ランク表示コンポーネント
const RankDisplay: React.FC<{ score: number; frame: number }> = ({ score, frame }) => {
  const rank = ScoringDomain.getRankData(score);
  const pulse = 1 + Math.sin(frame * 0.1) * 0.05;
  return (
    <div style={{ marginBottom: 15, textAlign: 'center' }}>
      <div style={{ fontSize: 14, color: '#aaa', marginBottom: 5 }}>{rank.message}</div>
      <div
        style={{
          fontSize: 64,
          fontWeight: 'bold',
          color: rank.color,
          textShadow: `0 0 20px ${rank.color}`,
          transform: `scale(${pulse})`,
        }}
      >
        {rank.rank}
      </div>
    </div>
  );
};

// スクリーンオーバーレイコンポーネント（タイトル、ゲームオーバー、クリア画面）
export const ScreenOverlay: React.FC<{
  type: GameStateValue;
  score: number;
  hiScore: number;
  reachedRamp: number;
  totalRamps: number;
  isNewHighScore: boolean;
  clearAnim: ClearAnim;
  isMobile: boolean;
}> = ({ type, score, hiScore, reachedRamp, totalRamps, isNewHighScore, clearAnim, isMobile }) => {
  const frame = clearAnim.frame;
  const phase = clearAnim.phase;
  const base = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  } as const;
  const style = (bg: string) => ({ ...base, background: bg });
  if (type === GameState.TITLE)
    return (
      <div style={style('radial-gradient(ellipse at center, rgba(20,40,80,0.95) 0%, rgba(5,5,20,0.99) 100%)')}>
        <div
          style={{
            fontSize: isMobile ? 24 : 28,
            color: '#00eeff',
            textShadow: '0 0 25px #00eeff',
            marginBottom: 6,
            fontWeight: 'bold',
            letterSpacing: 3,
          }}
        >
          NON-BRAKE
        </div>
        <div
          style={{
            fontSize: isMobile ? 20 : 24,
            color: '#00eeff',
            textShadow: '0 0 25px #00eeff',
            marginBottom: 20,
            fontWeight: 'bold',
            letterSpacing: 3,
          }}
        >
          DESCENT
        </div>
        <div style={{ fontSize: isMobile ? 11 : 13, color: '#99bbdd', marginBottom: 25 }}>「止まるために、走り続けろ。」</div>
        {!isMobile ? (
          <div
            style={{
              background: 'rgba(0,150,200,0.12)',
              padding: '12px 20px',
              borderRadius: 8,
              border: '1px solid rgba(0,200,255,0.25)',
              marginBottom: 20,
              fontSize: 12,
              color: '#aaccdd',
            }}
          >
            ← → 移動 / Z 加速 / X ジャンプ
          </div>
        ) : undefined}
        {!isMobile ? <div style={{ fontSize: 16, color: '#44ffaa' }}>PRESS SPACE</div> : undefined}
        {hiScore > 0 ? <div style={{ marginTop: 15, color: '#ffdd44', fontSize: 14 }}>HIGH SCORE: {hiScore}</div> : undefined}
      </div>
    );
  if (type === GameState.OVER)
    return (
      <div style={style('radial-gradient(ellipse at center, rgba(80,20,20,0.95) 0%, rgba(10,0,0,0.99) 100%)')}>
        <div
          style={{
            fontSize: isMobile ? 28 : 32,
            color: '#ff4444',
            textShadow: '0 0 25px #ff4444',
            marginBottom: 15,
            fontWeight: 'bold',
          }}
        >
          GAME OVER
        </div>
        <div style={{ fontSize: 14, color: '#aaa', marginBottom: 8 }}>
          STAGE: {reachedRamp} / {totalRamps}
        </div>
        <RankDisplay score={score} frame={frame} />
        <div style={{ fontSize: 20, color: '#fff', marginBottom: 12 }}>SCORE: {score}</div>
        {isNewHighScore ? (
          <div
            style={{
              fontSize: 18,
              color: `hsl(${(frame * 5) % 360}, 100%, 60%)`,
              marginBottom: 20,
              textShadow: '0 0 20px currentColor',
              fontWeight: 'bold',
            }}
          >
            ★ NEW HIGH SCORE! ★
          </div>
        ) : (
          <div style={{ fontSize: 14, color: '#ffdd44', marginBottom: 20 }}>HIGH SCORE: {hiScore}</div>
        )}
        {!isMobile ? (
          <>
            <div style={{ fontSize: 14, color: '#44ffaa', marginBottom: 8 }}>SPACE: リトライ</div>
            <div style={{ fontSize: 12, color: '#888' }}>T: タイトルへ</div>
          </>
        ) : undefined}
      </div>
    );
  if (type === GameState.CLEAR) {
    if (phase === 1)
      return (
        <div
          style={{
            ...style('linear-gradient(180deg, rgba(20,80,50,0.3) 0%, rgba(0,30,15,0.5) 100%)'),
            justifyContent: 'flex-start',
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 400 700" style={{ position: 'absolute', top: 0, left: 0 }}>
            {Array.from({ length: 15 }, (_, index) => (
              <line
                key={index}
                x1={400}
                y1={50 + index * 40}
                x2={400 - frame * 20 - index * 25}
                y2={50 + index * 40}
                stroke={`rgba(0, 255, 150, ${0.4 - index * 0.02})`}
                strokeWidth="3"
              />
            ))}
            <g transform={`translate(${200 + frame * 10}, ${300 + Math.sin(frame * 0.5) * 5})`}>
              <ellipse cx={-frame * 3} cy={0} rx={Math.min(frame * 4, 100)} ry={5} fill="#00ff88" opacity="0.6" />
              <rect x={-12} y={-15} width={24} height={20} fill="#00ff88" stroke="#fff" strokeWidth="2" rx="4" />
              <circle cx={-4} cy={-8} r="3" fill="#fff" />
              <circle cx={6} cy={-8} r="3" fill="#fff" />
            </g>
          </svg>
          <div
            style={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 28,
              color: '#44ffaa',
              textShadow: '0 0 30px #44ffaa',
              fontWeight: 'bold',
              opacity: Math.min(1, frame / 20),
            }}
          >
            ESCAPE SUCCESS!
          </div>
        </div>
      );
    return (
      <div style={style('radial-gradient(ellipse at center, rgba(20,80,50,0.95) 0%, rgba(0,10,5,0.99) 100%)')}>
        <div
          style={{
            fontSize: 32,
            color: '#44ffaa',
            textShadow: '0 0 30px #44ffaa',
            marginBottom: 15,
            fontWeight: 'bold',
          }}
        >
          ★ ESCAPE SUCCESS! ★
        </div>
        <RankDisplay score={score} frame={frame} />
        <div style={{ fontSize: 20, color: '#fff', marginBottom: 8 }}>FINAL SCORE</div>
        <div style={{ fontSize: 36, color: '#fff', marginBottom: 15, textShadow: '0 0 20px #44ffaa' }}>{score}</div>
        {isNewHighScore ? (
          <div
            style={{
              fontSize: 18,
              color: `hsl(${(frame * 5) % 360}, 100%, 60%)`,
              marginBottom: 20,
              fontWeight: 'bold',
            }}
          >
            ★ NEW HIGH SCORE! ★
          </div>
        ) : (
          <div style={{ fontSize: 14, color: '#ffdd44', marginBottom: 20 }}>HIGH SCORE: {hiScore}</div>
        )}
        {!isMobile ? (
          <>
            <div style={{ fontSize: 14, color: '#44ffaa', marginBottom: 8 }}>SPACE: もう一度プレイ</div>
            <div style={{ fontSize: 12, color: '#888' }}>T: タイトルへ</div>
          </>
        ) : undefined}
      </div>
    );
  }
  return <></>;
};

// タッチボタンコンポーネント
export const TouchButton: React.FC<{
  onTouchStart: (event: React.TouchEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => void;
  onTouchEnd: (event: React.TouchEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => void;
  style: React.CSSProperties;
  children: React.ReactNode;
}> = ({ onTouchStart, onTouchEnd, style, children }) => (
  <button
    onTouchStart={onTouchStart}
    onTouchEnd={onTouchEnd}
    onMouseDown={onTouchStart}
    onMouseUp={onTouchEnd}
    onMouseLeave={onTouchEnd}
    style={style}
  >
    {children}
  </button>
);

// モバイルコントロールコンポーネント
export const MobileControls: React.FC<{
  touchKeys: React.MutableRefObject<TouchKeys>;
  onTouch: (key: keyof TouchKeys, value: boolean) => (event: React.TouchEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => void;
}> = ({ touchKeys, onTouch }) => {
  const base = (active: boolean, colors: { bg: string; border: string }): React.CSSProperties => ({
    width: 65,
    height: 65,
    borderRadius: 12,
    background: active ? '#00aaff' : `linear-gradient(180deg, ${colors.bg} 0%, #222 100%)`,
    border: `2px solid ${colors.border}`,
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'none',
    cursor: 'pointer',
  });
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 400,
        marginTop: 10,
        padding: '0 10px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', gap: 8 }}>
        <TouchButton
          onTouchStart={onTouch('left', true)}
          onTouchEnd={onTouch('left', false)}
          style={base(touchKeys.current.left, { bg: '#334', border: '#556' })}
        >
          ◀
        </TouchButton>
        <TouchButton
          onTouchStart={onTouch('right', true)}
          onTouchEnd={onTouch('right', false)}
          style={base(touchKeys.current.right, { bg: '#334', border: '#556' })}
        >
          ▶
        </TouchButton>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <TouchButton
          onTouchStart={onTouch('jump', true)}
          onTouchEnd={onTouch('jump', false)}
          style={{ ...base(touchKeys.current.jump, { bg: '#363', border: '#4a4' }), borderRadius: '50%', fontSize: 12 }}
        >
          JUMP
        </TouchButton>
        <TouchButton
          onTouchStart={onTouch('accel', true)}
          onTouchEnd={onTouch('accel', false)}
          style={{ ...base(touchKeys.current.accel, { bg: '#643', border: '#a64' }), borderRadius: '50%', fontSize: 11 }}
        >
          ACCEL
        </TouchButton>
      </div>
    </div>
  );
};
