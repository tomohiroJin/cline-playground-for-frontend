// ============================================================================
// Deep Sea Interceptor - HUD（ヘッドアップディスプレイ）
// ============================================================================

import React, { memo } from 'react';
import type { UiState, Enemy } from '../types';
import { BossNames } from './EnemySprite';

interface HUDProps {
  uiState: UiState;
  stageName: string;
  bossEnemy?: Enemy;
  showGraze?: boolean;
  testMode?: boolean;
}

/** ゲーム中のスコア・ライフ・パワー表示 */
const HUD = memo(function HUD({ uiState, stageName, bossEnemy, showGraze, testMode }: HUDProps) {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          color: '#6ac',
          fontSize: 18,
          fontWeight: 'bold',
        }}
      >
        STAGE {uiState.stage}: {stageName}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
        }}
      >
        SCORE: {uiState.score}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 240,
          color: '#aaa',
          fontSize: 18,
          fontWeight: 'bold',
        }}
      >
        HI: {uiState.highScore}
      </div>
      <div style={{ position: 'absolute', top: 44, right: 16, color: '#f66', fontSize: 22 }}>
        {'♥'.repeat(Math.max(0, uiState.lives))}
      </div>
      <div style={{ position: 'absolute', top: 72, right: 16, color: '#fa6', fontSize: 16 }}>
        POW: {uiState.power} {uiState.spreadTime > Date.now() ? '| 3WAY' : ''}
      </div>
      {/* コンボ表示 */}
      {uiState.combo > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 100,
            right: 16,
            color: uiState.combo >= 10 ? '#ffdd44' : '#fff',
            fontSize: 20,
            fontWeight: 'bold',
            textShadow: uiState.combo >= 10 ? '0 0 12px #ffdd44' : 'none',
          }}
        >
          {uiState.combo} COMBO x{uiState.multiplier.toFixed(1)}
        </div>
      )}
      {/* グレイズ表示 */}
      <div style={{ position: 'absolute', top: 128, right: 16, color: '#aac', fontSize: 16 }}>
        GRAZE: {uiState.grazeCount}
      </div>
      {/* グレイズフラッシュ */}
      {showGraze && (
        <div
          style={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#adf',
            fontSize: 26,
            fontWeight: 'bold',
            textShadow: '0 0 15px #4af',
            opacity: 0.8,
            pointerEvents: 'none',
          }}
        >
          GRAZE!
        </div>
      )}
      {/* ボスHPバー */}
      {bossEnemy && (
        <div
          style={{
            position: 'absolute',
            top: 48,
            left: 16,
            width: 400,
          }}
        >
          <div style={{ fontSize: 14, color: '#aac', marginBottom: 4 }}>
            {BossNames[bossEnemy.enemyType] || 'BOSS'}
          </div>
          <div
            style={{
              width: '100%',
              height: 12,
              background: 'rgba(0,0,0,0.5)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(0, (bossEnemy.hp / bossEnemy.maxHp) * 100)}%`,
                height: '100%',
                background:
                  bossEnemy.hp / bossEnemy.maxHp > 0.5
                    ? '#4c8'
                    : bossEnemy.hp / bossEnemy.maxHp > 0.25
                      ? '#ca4'
                      : '#f44',
                transition: 'width 0.1s',
              }}
            />
          </div>
        </div>
      )}
      {testMode && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            padding: '4px 12px',
            background: 'rgba(255,200,0,0.2)',
            border: '1px solid #fc0',
            borderRadius: 4,
            color: '#fc0',
            fontSize: 14,
            fontWeight: 'bold',
            opacity: 0.6,
          }}
        >
          TEST
        </div>
      )}
    </>
  );
});

export default HUD;
