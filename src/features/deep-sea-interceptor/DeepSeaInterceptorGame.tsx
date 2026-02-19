// ============================================================================
// Deep Sea Interceptor - メインゲームコンポーネント
// ============================================================================

import React from 'react';
import { PageContainer } from '../../pages/DeepSeaShooterPage.styles';
import { ShareButton } from '../../components/molecules/ShareButton';
import { StageConfig, ItemConfig, DifficultyConfig } from './constants';
import { calculateRank } from './game-logic';
import { useDeepSeaGame } from './hooks';
import {
  StyledGameContainer,
  FullScreenOverlay,
  GameTitle,
  GameSubTitle,
  InfoBox,
  Button,
} from './styles';
import PlayerSprite from './components/PlayerSprite';
import EnemySprite, { BossNames } from './components/EnemySprite';
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
  } = useDeepSeaGame();

  const gd = gameData.current;
  const cfg = StageConfig[uiState.stage];

  // タイトル画面
  if (gameState === 'title')
    return (
      <PageContainer>
        <StyledGameContainer role="region" aria-label="深海シューティングゲーム画面" tabIndex={0}>
          <FullScreenOverlay $bg="linear-gradient(180deg,#0a1a2a,#020810)">
            <GameTitle>深海迎撃</GameTitle>
            <GameSubTitle>DEEP SEA INTERCEPTOR</GameSubTitle>

            {/* 武器選択 */}
            <div style={{ width: '80%', marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#8ac', marginBottom: 6 }}>WEAPON SELECT</div>
              {(Object.keys(WeaponInfo) as WeaponType[]).map(w => (
                <div
                  key={w}
                  onClick={() => setSelectedWeapon(w)}
                  style={{
                    padding: '6px 10px',
                    marginBottom: 4,
                    borderRadius: 6,
                    border: `1px solid ${selectedWeapon === w ? '#4a9acf' : '#334'}`,
                    background: selectedWeapon === w ? 'rgba(40,80,120,0.5)' : 'rgba(0,20,40,0.4)',
                    cursor: 'pointer',
                    fontSize: 10,
                  }}
                >
                  <span style={{ color: selectedWeapon === w ? '#6cf' : '#888' }}>
                    {selectedWeapon === w ? '●' : '○'}{' '}
                  </span>
                  <strong>{WeaponInfo[w].name}</strong>
                  <span style={{ color: '#888', marginLeft: 6 }}>{WeaponInfo[w].description}</span>
                </div>
              ))}
            </div>

            {/* 難易度選択 */}
            <div style={{ width: '80%', marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#8ac', marginBottom: 6 }}>DIFFICULTY</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {(Object.keys(DifficultyConfig) as Difficulty[]).map(d => (
                  <div
                    key={d}
                    onClick={() => setSelectedDifficulty(d)}
                    style={{
                      flex: 1,
                      padding: '6px 4px',
                      borderRadius: 6,
                      border: `1px solid ${selectedDifficulty === d ? '#4a9acf' : '#334'}`,
                      background:
                        selectedDifficulty === d ? 'rgba(40,80,120,0.5)' : 'rgba(0,20,40,0.4)',
                      cursor: 'pointer',
                      fontSize: 9,
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
            <div style={{ marginTop: 20, fontSize: 12, color: '#aaa' }}>
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
            <h1 style={{ color: isCleared ? '#6ac' : '#f66', fontSize: 18, margin: '0 0 10px' }}>
              {isCleared ? 'MISSION COMPLETE' : 'MISSION FAILED'}
            </h1>

            {/* 詳細リザルト */}
            <div
              style={{
                width: '80%',
                background: 'rgba(0,20,40,0.6)',
                borderRadius: 8,
                padding: 12,
                fontSize: 10,
                lineHeight: 2,
              }}
            >
              <div>
                STAGE: {uiState.stage} - {stageName}
              </div>
              <div>DIFFICULTY: {DifficultyConfig[uiState.difficulty].label}</div>
              <div>WEAPON: {WeaponInfo[uiState.weaponType].name}</div>
              <div style={{ borderTop: '1px solid #334', margin: '4px 0', paddingTop: 4 }}>
                SCORE: <strong style={{ color: '#fff' }}>{uiState.score.toLocaleString()}</strong>
              </div>
              <div>MAX COMBO: {uiState.maxCombo}</div>
              <div>GRAZE: {uiState.grazeCount}</div>
              <div>TIME: {formatTime(playTime)}</div>
            </div>

            {/* ランク表示 */}
            <div
              style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: rankColor,
                textShadow: `0 0 20px ${rankColor}`,
                margin: '10px 0',
              }}
            >
              RANK: {rank}
            </div>

            <p style={{ fontSize: 10, color: '#aaa', margin: 0 }}>
              HIGH SCORE: {uiState.highScore}
            </p>

            <div style={{ margin: '10px 0' }}>
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

  // プレイ画面
  return (
    <PageContainer>
      <StyledGameContainer
        style={{ background: `linear-gradient(180deg,${cfg.bg},#010408)` }}
        role="region"
        aria-label="深海シューティングゲーム画面"
      >
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

        {/* HUD */}
        <HUD uiState={uiState} stageName={cfg.name} />

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
              left: b.x - 4,
              top: b.y - 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'radial-gradient(circle,#f66,#a33)',
              boxShadow: '0 0 6px #f33',
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
                boxShadow: `0 0 10px ${ic.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 12,
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
              left: gd.player.x - 20,
              top: gd.player.y + 22,
              width: 40,
              height: 5,
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

        {/* ボス撃破メッセージ */}
        {gd.bossDefeated && (
          <div
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              color: '#6f8',
              fontSize: 15,
              fontWeight: 'bold',
              textShadow: '0 0 15px #0f0',
            }}
          >
            BOSS DEFEATED!
          </div>
        )}
      </StyledGameContainer>
    </PageContainer>
  );
}
