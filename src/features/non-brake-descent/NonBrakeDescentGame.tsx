/**
 * Non-Brake Descent ゲーム - メインコンテナコンポーネント
 *
 * ゲームの状態管理は useGameEngine フックに委譲し、
 * gameState に応じて TitleScreen / PlayScreen / ResultScreen を切り替える。
 */
import React, { useMemo } from 'react';
import { Config } from './config';
import { GameState } from './constants';
import { GeometryDomain } from './domains/geometry-domain';
import { MathUtils } from './domains/math-utils';
import { MobileControls } from './renderers';
import { useGameEngine } from './presentation/hooks';
import { TitleScreen } from './presentation/screens/TitleScreen';
import { PlayScreen } from './presentation/screens/PlayScreen';
import { ResultScreen } from './presentation/screens/ResultScreen';

type NonBrakeDescentGameProps = {
  onScoreChange?: (score: number) => void;
};

export const NonBrakeDescentGame: React.FC<NonBrakeDescentGameProps> = ({ onScoreChange }) => {
  const { width: W, height: H } = Config.screen;
  const { total: TOTAL } = Config.ramp;
  const engine = useGameEngine(onScoreChange);
  const { gameState, player, ramps, shake, clearAnim, isMobile, hiScore } = engine;

  // 画面振動オフセット
  const shakeOff = shake
    ? { x: MathUtils.randomRange(-0.5, 0.5) * shake, y: MathUtils.randomRange(-0.5, 0.5) * shake }
    : { x: 0, y: 0 };

  // 背景色
  const currentRamp = ramps[player.ramp];
  const bgColor = currentRamp ? GeometryDomain.getRampColor(player.ramp).bg : '#0a0a1a';

  // 表示フラグ
  const isPlaying = gameState === GameState.PLAY || gameState === GameState.DYING || gameState === GameState.COUNTDOWN;
  const showResult = gameState === GameState.OVER || gameState === GameState.CLEAR;
  const showTap = isMobile && (gameState === GameState.TITLE || gameState === GameState.OVER
    || (gameState === GameState.CLEAR && clearAnim.phase === 2));
  const showMobileControls = isMobile && (gameState === GameState.PLAY || gameState === GameState.COUNTDOWN);

  const title = useMemo(() => 'NON-BRAKE DESCENT', []);

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: 'linear-gradient(180deg, #050510 0%, #101025 100%)',
        padding: isMobile ? 5 : 10, fontFamily: 'monospace',
        touchAction: 'none', userSelect: 'none', width: '100%',
      }}
    >
      <h1 style={{ color: '#00eeff', fontSize: isMobile ? 16 : 18, margin: '5px 0', textShadow: '0 0 15px #00eeff', letterSpacing: 3 }}>
        {title}
      </h1>
      <div
        onClick={isMobile ? engine.handleTap : undefined}
        style={{
          position: 'relative',
          width: isMobile ? Math.min(W, window.innerWidth - 10) : W,
          height: isMobile ? Math.min(H, window.innerHeight - 180) : H,
          background: `linear-gradient(180deg, ${bgColor} 0%, #0a0a15 100%)`,
          border: '2px solid #00ccff', borderRadius: 6, overflow: 'hidden',
          transform: `translate(${shakeOff.x}px, ${shakeOff.y}px)`,
          boxShadow: '0 0 25px rgba(0,200,255,0.25)',
        }}
      >
        {gameState === GameState.TITLE && <TitleScreen hiScore={hiScore} isMobile={isMobile} />}
        {showResult && (
          <ResultScreen
            type={gameState} score={engine.score} hiScore={hiScore}
            reachedRamp={player.ramp + 1} totalRamps={TOTAL}
            isNewHighScore={engine.isNewHighScore} clearAnim={clearAnim} isMobile={isMobile}
          />
        )}
        {isPlaying && (
          <PlayScreen
            state={gameState} player={player} ramps={ramps}
            camY={engine.camY} speed={engine.speed} score={engine.score}
            effect={engine.effect} speedBonus={engine.speedBonus}
            combo={engine.combo} comboTimer={engine.comboTimer}
            nearMissCount={engine.nearMissCount} dangerLevel={engine.dangerLevel}
            death={engine.death} particles={engine.particles}
            jetParticles={engine.jetParticles} scorePopups={engine.scorePopups}
            nearMissEffects={engine.nearMissEffects} clouds={engine.clouds}
            buildings={engine.buildings} transitionEffect={engine.transitionEffect}
            countdown={engine.countdown} frameCount={engine.frameRef.current}
          />
        )}
      </div>
      {showMobileControls ? <MobileControls touchKeys={engine.touchKeys} onTouch={engine.handleTouch} /> : undefined}
      {!isMobile ? <div style={{ marginTop: 8, color: '#556', fontSize: 10 }}>← → 移動 / Z 加速 / X ジャンプ / SPACE 開始</div> : undefined}
      {showTap ? <div style={{ marginTop: 15, color: '#44ffaa', fontSize: 14 }}>タップしてスタート</div> : undefined}
    </div>
  );
};
