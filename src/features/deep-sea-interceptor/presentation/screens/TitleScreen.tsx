// ============================================================================
// Deep Sea Interceptor - タイトル画面
// ============================================================================

import React from 'react';
import { DifficultyConfig } from '../../constants';
import {
  StyledGameContainer,
  FullScreenOverlay,
  GameTitle,
  GameSubTitle,
  InfoBox,
  Button,
} from '../../styles';
import type { WeaponType, Difficulty } from '../../types';

/** 武器情報 */
const WeaponInfo: Record<WeaponType, { name: string; description: string }> = {
  torpedo: { name: 'トーピード', description: 'バランス型の魚雷' },
  sonarWave: { name: 'ソナーウェーブ', description: '近距離特化の音波' },
  bioMissile: { name: 'バイオミサイル', description: 'ホーミング型の生体弾' },
};

interface TitleScreenProps {
  highScore: number;
  selectedWeapon: WeaponType;
  selectedDifficulty: Difficulty;
  onSelectWeapon: (w: WeaponType) => void;
  onSelectDifficulty: (d: Difficulty) => void;
  onStartGame: () => void;
}

/** タイトル画面コンポーネント */
export function TitleScreen({
  highScore,
  selectedWeapon,
  selectedDifficulty,
  onSelectWeapon,
  onSelectDifficulty,
  onStartGame,
}: TitleScreenProps) {
  return (
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
              onClick={() => onSelectWeapon(w)}
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
                onClick={() => onSelectDifficulty(d)}
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
        <Button $primary onClick={onStartGame}>
          START GAME
        </Button>
        <div style={{ marginTop: 20, fontSize: 12, color: '#aaa' }}>
          HIGH SCORE: {highScore}
        </div>
      </FullScreenOverlay>
    </StyledGameContainer>
  );
}
