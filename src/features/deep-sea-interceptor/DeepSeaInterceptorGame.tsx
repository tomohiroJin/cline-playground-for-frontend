// ============================================================================
// Deep Sea Interceptor - メインゲームコンポーネント
// ============================================================================

import React from 'react';
import { PageContainer } from '../../pages/DeepSeaShooterPage.styles';
import { ShareButton } from '../../components/molecules/ShareButton';
import { StageConfig, ItemConfig, DifficultyConfig, Config, BOSS_NAMES } from './constants';
import { calculateRank } from './game-logic';
import { useDeepSeaGame } from './hooks';
import {
  StyledGameContainer,
  FullScreenOverlay,
  GameTitle,
  GameSubTitle,
  InfoBox,
  Button,
  GameGlobalStyles,
} from './styles';
import PlayerSprite from './components/PlayerSprite';
import EnemySprite from './components/EnemySprite';
import BulletSprite from './components/BulletSprite';
import HUD from './components/HUD';
import TouchControls from './components/TouchControls';
import type { WeaponType, Difficulty } from './types';

/** 武器情報 */
const WeaponInfo: Record<WeaponType, { name: string; description: string }> = {
  torpedo: { name: 'トーピード', description: 'バランス型の魚雷' },
  sonarWave: { name: 'ソナーウェーブ', description: '近距離特化の音波' },
  bioMissile: { name: 'バイオミサイル', description: 'ホーミング型の生体弾' },
};

/** ランクの表示色 */
const RankColors: Record<string, string> = {
  S: '#ffd700',
  A: '#c0c0c0',
  B: '#cd7f32',
  C: '#6ac',
  D: '#888',
};

/** プレイ時間をフォーマット */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** Deep Sea Interceptor メインコンポーネント */
export default function DeepSeaInterceptorGame() {
  const {
    gameState,
    setGameState,
    uiState,
    gameData,
    startGame,
    handleCharge,
    handleTouchShoot,
    handleTouchMove,
    selectedWeapon,
    setSelectedWeapon,
    selectedDifficulty,
    setSelectedDifficulty,
    newAchievements,
    testMode,
  } = useDeepSeaGame();

  const gd = gameData.current;
  const cfg = StageConfig[uiState.stage];

  // タイトル画面
  if (gameState === 'title')
    return (
      <PageContainer>
        <GameGlobalStyles />
        <StyledGameContainer role="region" aria-label="深海シューティングゲーム画面" tabIndex={0}>
          <FullScreenOverlay $bg="linear-gradient(180deg,#0a1a2a,#020810)">
            <GameTitle>深海迎撃</GameTitle>
            <GameSubTitle>DEEP SEA INTERCEPTOR</GameSubTitle>

            {/* 武器選択 */}
            <div style={{ width: '80%', marginBottom: 20 }}>
              <div style={{ fontSize: 18, color: '#8ac', marginBottom: 10 }}>WEAPON SELECT</div>
              {(Object.keys(WeaponInfo) as WeaponType[]).map(w => (
                <div
                  key={w}
                  onClick={() => setSelectedWeapon(w)}
                  style={{
                    padding: '10px 18px',
                    marginBottom: 8,
                    borderRadius: 8,
                    border: `2px solid ${selectedWeapon === w ? '#4a9acf' : '#334'}`,
                    background: selectedWeapon === w ? 'rgba(40,80,120,0.5)' : 'rgba(0,20,40,0.4)',
                    cursor: 'pointer',
                    fontSize: 18,
                  }}
                >
                  <span style={{ color: selectedWeapon === w ? '#6cf' : '#888' }}>
                    {selectedWeapon === w ? '●' : '○'}{' '}
                  </span>
                  <strong>{WeaponInfo[w].name}</strong>
                  <span style={{ color: '#888', marginLeft: 10 }}>{WeaponInfo[w].description}</span>
                </div>
              ))}
            </div>

            {/* 難易度選択 */}
            <div style={{ width: '80%', marginBottom: 20 }}>
              <div style={{ fontSize: 18, color: '#8ac', marginBottom: 10 }}>DIFFICULTY</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(Object.keys(DifficultyConfig) as Difficulty[]).map(d => (
                  <div
                    key={d}
                    onClick={() => setSelectedDifficulty(d)}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      borderRadius: 8,
                      border: `2px solid ${selectedDifficulty === d ? '#4a9acf' : '#334'}`,
                      background:
                        selectedDifficulty === d ? 'rgba(40,80,120,0.5)' : 'rgba(0,20,40,0.4)',
                      cursor: 'pointer',
                      fontSize: 16,
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ color: selectedDifficulty === d ? '#6cf' : '#aaa' }}>
                      {DifficultyConfig[d].label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <InfoBox>
              <p>移動: 矢印キー</p>
              <p>ショット: Z</p>
              <p>チャージ: X</p>
            </InfoBox>
            <Button $primary onClick={startGame}>
              START GAME
            </Button>
            {testMode && (
              <div style={{
                marginTop: 16,
                padding: '8px 24px',
                background: 'rgba(255,200,0,0.2)',
                border: '2px solid #fc0',
                borderRadius: 8,
                color: '#fc0',
                fontSize: 20,
                fontWeight: 'bold',
                textShadow: '0 0 10px #fa0',
                animation: 'blink 1s infinite',
              }}>
                TEST MODE ACTIVATED
              </div>
            )}
            <div style={{ marginTop: 36, fontSize: 20, color: '#aaa' }}>
              HIGH SCORE: {uiState.highScore}
            </div>
          </FullScreenOverlay>
        </StyledGameContainer>
      </PageContainer>
    );

  // リザルト画面（ゲームオーバー/エンディング共通）
  if (gameState === 'gameover' || gameState === 'ending') {
    const isCleared = gameState === 'ending';
    const playTime = Date.now() - (gd.gameStartTime || Date.now());
    const rank = calculateRank(uiState.score, uiState.lives, uiState.difficulty);
    const rankColor = RankColors[rank] || '#888';
    const stageName = StageConfig[uiState.stage]?.name || '';

    return (
      <PageContainer>
        <StyledGameContainer>
          <FullScreenOverlay $bg={isCleared ? '#0a1a2a' : '#1a0a0a'}>
            <h1 style={{ color: isCleared ? '#6ac' : '#f66', fontSize: 32, margin: '0 0 18px' }}>
              {isCleared ? 'MISSION COMPLETE' : 'MISSION FAILED'}
            </h1>

            {/* 詳細リザルト */}
            <div
              style={{
                width: '80%',
                background: 'rgba(0,20,40,0.6)',
                borderRadius: 10,
                padding: 20,
                fontSize: 18,
                lineHeight: 2,
              }}
            >
              <div>
                STAGE: {uiState.stage} - {stageName}
              </div>
              <div>DIFFICULTY: {DifficultyConfig[uiState.difficulty].label}</div>
              <div>WEAPON: {WeaponInfo[uiState.weaponType].name}</div>
              <div style={{ borderTop: '1px solid #334', margin: '8px 0', paddingTop: 8 }}>
                SCORE: <strong style={{ color: '#fff' }}>{uiState.score.toLocaleString()}</strong>
              </div>
              <div>MAX COMBO: {uiState.maxCombo}</div>
              <div>GRAZE: {uiState.grazeCount}</div>
              <div>TIME: {formatTime(playTime)}</div>
            </div>

            {/* ランク表示 */}
            <div
              style={{
                fontSize: 64,
                fontWeight: 'bold',
                color: rankColor,
                textShadow: `0 0 30px ${rankColor}`,
                margin: '18px 0',
              }}
            >
              RANK: {rank}
            </div>

            {/* 実績表示 */}
            {newAchievements.length > 0 && (
              <div
                style={{
                  width: '80%',
                  background: 'rgba(40,40,0,0.4)',
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 14,
                }}
              >
                <div style={{ fontSize: 16, color: '#fc4', marginBottom: 8 }}>NEW ACHIEVEMENTS!</div>
                {newAchievements.map(a => (
                  <div key={a.id} style={{ fontSize: 16, color: '#fd6', lineHeight: 1.8 }}>
                    {a.name} - {a.description}
                  </div>
                ))}
              </div>
            )}

            <p style={{ fontSize: 18, color: '#aaa', margin: 0 }}>
              HIGH SCORE: {uiState.highScore}
            </p>

            <div style={{ margin: '18px 0' }}>
              <ShareButton
                text={`Deep Sea Interceptor ${isCleared ? 'クリア' : ''}！スコア: ${uiState.score}点 ランク: ${rank} コンボ: ${uiState.maxCombo}`}
                hashtags={['DeepSeaShooter', 'GamePlatform']}
              />
            </div>

            <Button $primary onClick={startGame}>
              RETRY
            </Button>
            <Button onClick={() => setGameState('title')}>TITLE</Button>
          </FullScreenOverlay>
        </StyledGameContainer>
      </PageContainer>
    );
  }

  // ボスを検索
  const bossEnemy = gd.enemies.find(
    e => e.enemyType === 'boss' || e.enemyType.startsWith('boss')
  );

  // グレイズフラッシュ判定（0.3秒以内）
  const showGraze = Date.now() - gd.grazeFlashTime < 300;

  // プレイ画面
  return (
    <PageContainer>
      <StyledGameContainer
        $shake={gd.screenShake > 0}
        style={{ background: `linear-gradient(180deg,${cfg.bg},#010408)` }}
        role="region"
        aria-label="深海シューティングゲーム画面"
      >
        {/* 画面フラッシュ */}
        {gd.screenFlash > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255,255,255,0.3)',
              pointerEvents: 'none',
              zIndex: 100,
            }}
          />
        )}

        {/* 泡 */}
        {gd.bubbles.map(b => (
          <div
            key={b.id}
            style={{
              position: 'absolute',
              left: b.x,
              top: b.y,
              width: b.size,
              height: b.size,
              borderRadius: '50%',
              border: `1px solid rgba(100,170,200,${b.opacity})`,
            }}
          />
        ))}

        {/* 環境ギミック表示 */}
        {/* Stage 1: 海流方向表示 */}
        {cfg.gimmick === 'current' && (
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              color: 'rgba(100,180,220,0.4)',
              fontSize: 28,
              pointerEvents: 'none',
            }}
          >
            {gd.currentDirection > 0 ? '→ 海流 →' : '← 海流 ←'}
          </div>
        )}

        {/* Stage 3: 熱水柱 */}
        {gd.thermalVents.map((v, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: v.x - v.width / 2,
              top: 0,
              width: v.width,
              height: '100%',
              background: v.active
                ? 'rgba(255,80,20,0.25)'
                : 'rgba(255,200,100,0.1)',
              borderLeft: v.active ? '3px solid rgba(255,100,30,0.4)' : '2px dashed rgba(255,200,100,0.2)',
              borderRight: v.active ? '3px solid rgba(255,100,30,0.4)' : '2px dashed rgba(255,200,100,0.2)',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Stage 4: 発光エフェクト */}
        {gd.luminescence && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 50% 50%, rgba(60,255,170,0.15), transparent 70%)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Stage 5: 水圧の壁 */}
        {cfg.gimmick === 'pressure' && gd.pressureBounds.left > 0 && (
          <>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: gd.pressureBounds.left,
                height: '100%',
                background: 'rgba(0,0,30,0.7)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: Config.canvas.width - gd.pressureBounds.right,
                height: '100%',
                background: 'rgba(0,0,30,0.7)',
                pointerEvents: 'none',
              }}
            />
          </>
        )}

        {/* HUD */}
        <HUD
          uiState={uiState}
          stageName={cfg.name}
          bossEnemy={bossEnemy}
          showGraze={showGraze}
          testMode={testMode}
        />

        {/* エンティティ */}
        <PlayerSprite
          x={gd.player.x}
          y={gd.player.y}
          opacity={gd.invincible && Math.floor(Date.now() / 100) % 2 === 0 ? 0.5 : 1}
          shield={Date.now() < uiState.shieldEndTime}
        />
        {gd.bullets.map(b => (
          <BulletSprite key={b.id} bullet={b} />
        ))}
        {gd.enemies.map(e => (
          <EnemySprite key={e.id} enemy={e} />
        ))}
        {gd.enemyBullets.map(b => (
          <div
            key={b.id}
            style={{
              position: 'absolute',
              left: b.x - 8,
              top: b.y - 8,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'radial-gradient(circle,#f66,#a33)',
              boxShadow: '0 0 9px #f33',
            }}
          />
        ))}
        {gd.items.map(i => {
          const ic = ItemConfig[i.itemType];
          return (
            <div
              key={i.id}
              style={{
                position: 'absolute',
                left: i.x - i.size / 2,
                top: i.y - i.size / 2,
                width: i.size,
                height: i.size,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${ic.color}, ${ic.color}88)`,
                boxShadow: `0 0 15px ${ic.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 20,
                fontWeight: 'bold',
              }}
            >
              {ic.label}
            </div>
          );
        })}
        {gd.particles.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: p.color,
              opacity: p.life / p.maxLife,
            }}
          />
        ))}

        {/* チャージバー */}
        {gd.charging && (
          <div
            style={{
              position: 'absolute',
              left: gd.player.x - 40,
              top: gd.player.y + 44,
              width: 80,
              height: 10,
              background: 'rgba(0,0,0,0.6)',
            }}
          >
            <div
              style={{
                width: `${gd.chargeLevel * 100}%`,
                height: '100%',
                background: gd.chargeLevel >= 0.8 ? '#6cf' : '#48a',
              }}
            />
          </div>
        )}

        {/* タッチコントロール */}
        <TouchControls
          onMove={handleTouchMove}
          onShoot={handleTouchShoot}
          onCharge={handleCharge}
          charging={gd.charging}
        />

        {/* WARNING表示（強化版） */}
        {gd.bossWarning && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 50,
            }}
          >
            <div
              style={{
                color: '#f44',
                fontSize: 56,
                fontWeight: 'bold',
                textShadow: '0 0 40px #f00, 0 0 80px #f00',
                animation: 'warningPulse 0.5s ease-in-out infinite',
                letterSpacing: 8,
              }}
            >
              ⚠ WARNING ⚠
            </div>
            {/* ボス名表示 */}
            <div
              style={{
                color: '#fc0',
                fontSize: 28,
                fontWeight: 'bold',
                textShadow: '0 0 20px #fa0',
                marginTop: 20,
                opacity: (Date.now() - gd.bossWarningStartTime) > 500 ? 1 : 0,
                transition: 'opacity 0.5s ease-in',
              }}
            >
              {BOSS_NAMES[uiState.stage] ?? 'UNKNOWN'}
            </div>
            {/* 画面端の赤い点滅エフェクト */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                border: '8px solid rgba(255,0,0,0.4)',
                pointerEvents: 'none',
                animation: 'warningBorder 0.5s ease-in-out infinite',
              }}
            />
            {/* 上下の赤いグラデーション */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 80,
                background: 'linear-gradient(180deg, rgba(255,0,0,0.3), transparent)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 80,
                background: 'linear-gradient(0deg, rgba(255,0,0,0.3), transparent)',
                pointerEvents: 'none',
              }}
            />
          </div>
        )}

        {/* ボス撃破メッセージ */}
        {gd.bossDefeated && (
          <div
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              color: '#6f8',
              fontSize: 28,
              fontWeight: 'bold',
              textShadow: '0 0 22px #0f0',
            }}
          >
            BOSS DEFEATED!
          </div>
        )}

        {/* STAGE CLEAR表示 */}
        {gd.stageClearTime > 0 && Date.now() - gd.stageClearTime < 2000 && (
          <div
            style={{
              position: 'absolute',
              top: '35%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              textAlign: 'center',
              pointerEvents: 'none',
              zIndex: 50,
            }}
          >
            <div
              style={{
                color: '#6cf',
                fontSize: 36,
                fontWeight: 'bold',
                textShadow: '0 0 22px #4af',
              }}
            >
              STAGE CLEAR
            </div>
            <div style={{ color: '#adf', fontSize: 20, marginTop: 14 }}>
              BONUS: +{1000 * (uiState.stage - 1) + gd.maxCombo * 10 + gd.grazeCount * 5}
            </div>
          </div>
        )}

        {/* CSS アニメーション */}
        <style>{`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </StyledGameContainer>
    </PageContainer>
  );
}
