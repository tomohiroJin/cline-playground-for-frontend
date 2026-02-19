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
}

/** ゲーム中のスコア・ライフ・パワー表示 */
const HUD = memo(function HUD({ uiState, stageName, bossEnemy, showGraze }: HUDProps) {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          color: '#6ac',
          fontSize: 10,
          fontWeight: 'bold',
        }}
      >
        STAGE {uiState.stage}: {stageName}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          color: '#fff',
          fontSize: 10,
          fontWeight: 'bold',
        }}
      >
        SCORE: {uiState.score}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 120,
          color: '#aaa',
          fontSize: 10,
          fontWeight: 'bold',
        }}
      >
        HI: {uiState.highScore}
      </div>
      <div style={{ position: 'absolute', top: 22, right: 8, color: '#f66', fontSize: 12 }}>
        {'♥'.repeat(Math.max(0, uiState.lives))}
      </div>
      <div style={{ position: 'absolute', top: 36, right: 8, color: '#fa6', fontSize: 9 }}>
        POW: {uiState.power} {uiState.spreadTime > Date.now() ? '| 3WAY' : ''}
      </div>
      {/* コンボ表示 */}
      {uiState.combo > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 50,
            right: 8,
            color: uiState.combo >= 10 ? '#ffdd44' : '#fff',
            fontSize: 11,
            fontWeight: 'bold',
            textShadow: uiState.combo >= 10 ? '0 0 8px #ffdd44' : 'none',
          }}
        >
          {uiState.combo} COMBO ×{uiState.multiplier.toFixed(1)}
        </div>
      )}
      {/* グレイズ表示 */}
      <div style={{ position: 'absolute', top: 64, right: 8, color: '#aac', fontSize: 9 }}>
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
            fontSize: 14,
            fontWeight: 'bold',
            textShadow: '0 0 10px #4af',
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
            top: 24,
            left: 8,
            width: 200,
          }}
        >
          <div style={{ fontSize: 8, color: '#aac', marginBottom: 2 }}>
            {BossNames[bossEnemy.enemyType] || 'BOSS'}
          </div>
          <div
            style={{
              width: '100%',
              height: 6,
              background: 'rgba(0,0,0,0.5)',
              borderRadius: 3,
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
    </>
  );
});

export default HUD;
