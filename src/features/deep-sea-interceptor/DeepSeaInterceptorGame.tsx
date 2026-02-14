// ============================================================================
// Deep Sea Interceptor - メインゲームコンポーネント
// ============================================================================

import React from 'react';
import { PageContainer } from '../../pages/DeepSeaShooterPage.styles';
import { ShareButton } from '../../components/molecules/ShareButton';
import { StageConfig, ItemConfig } from './constants';
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
import EnemySprite from './components/EnemySprite';
import BulletSprite from './components/BulletSprite';
import HUD from './components/HUD';
import TouchControls from './components/TouchControls';

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

  // ゲームオーバー画面
  if (gameState === 'gameover')
    return (
      <PageContainer>
        <StyledGameContainer>
          <FullScreenOverlay $bg="#1a0a0a">
            <h1 style={{ color: '#f66' }}>MISSION FAILED</h1>
            <p>SCORE: {uiState.score}</p>
            <p style={{ fontSize: 12, color: '#aaa' }}>HIGH SCORE: {uiState.highScore}</p>
            <div style={{ margin: '15px 0' }}>
              <ShareButton
                text={`Deep Sea Shooterで${uiState.score}点を獲得しました！`}
                hashtags={['DeepSeaShooter', 'GamePlatform']}
              />
            </div>
            <Button onClick={startGame}>RETRY</Button>
            <Button onClick={() => setGameState('title')}>TITLE</Button>
          </FullScreenOverlay>
        </StyledGameContainer>
      </PageContainer>
    );

  // エンディング画面
  if (gameState === 'ending')
    return (
      <PageContainer>
        <StyledGameContainer>
          <FullScreenOverlay $bg="#0a1a2a">
            <h1 style={{ color: '#6ac' }}>MISSION COMPLETE</h1>
            <p>FINAL SCORE: {uiState.score}</p>
            <p style={{ fontSize: 12, color: '#aaa' }}>HIGH SCORE: {uiState.highScore}</p>
            <div style={{ margin: '15px 0' }}>
              <ShareButton
                text={`Deep Sea Shooterをクリア！スコア: ${uiState.score}点`}
                hashtags={['DeepSeaShooter', 'GamePlatform']}
              />
            </div>
            <Button $primary onClick={() => setGameState('title')}>
              RETURN TO TITLE
            </Button>
          </FullScreenOverlay>
        </StyledGameContainer>
      </PageContainer>
    );

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
