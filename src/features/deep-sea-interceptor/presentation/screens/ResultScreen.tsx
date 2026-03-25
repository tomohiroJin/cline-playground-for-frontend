// ============================================================================
// Deep Sea Interceptor - リザルト画面（ゲームオーバー/エンディング共通）
// ============================================================================

import React from 'react';
import { ShareButton } from '../../../../components/molecules/ShareButton';
import { StageConfig, DifficultyConfig } from '../../constants';
import { calculateRank } from '../../game-logic';
import {
  StyledGameContainer,
  FullScreenOverlay,
  Button,
} from '../../styles';
import type { UiState, Achievement, WeaponType } from '../../types';

/** 武器情報 */
const WeaponInfo: Record<WeaponType, { name: string }> = {
  torpedo: { name: 'トーピード' },
  sonarWave: { name: 'ソナーウェーブ' },
  bioMissile: { name: 'バイオミサイル' },
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

interface ResultScreenProps {
  isCleared: boolean;
  uiState: UiState;
  playTime: number;
  maxCombo: number;
  newAchievements: Achievement[];
  onRetry: () => void;
  onTitle: () => void;
}

/** リザルト画面コンポーネント */
export function ResultScreen({
  isCleared,
  uiState,
  playTime,
  maxCombo,
  newAchievements,
  onRetry,
  onTitle,
}: ResultScreenProps) {
  const rank = calculateRank(uiState.score, uiState.lives, uiState.difficulty);
  const rankColor = RankColors[rank] || '#888';
  const stageName = StageConfig[uiState.stage]?.name || '';

  return (
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
          <div>STAGE: {uiState.stage} - {stageName}</div>
          <div>DIFFICULTY: {DifficultyConfig[uiState.difficulty].label}</div>
          <div>WEAPON: {WeaponInfo[uiState.weaponType].name}</div>
          <div style={{ borderTop: '1px solid #334', margin: '8px 0', paddingTop: 8 }}>
            SCORE: <strong style={{ color: '#fff' }}>{uiState.score.toLocaleString()}</strong>
          </div>
          <div>MAX COMBO: {maxCombo}</div>
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
            text={`Deep Sea Interceptor ${isCleared ? 'クリア' : ''}！スコア: ${uiState.score}点 ランク: ${rank} コンボ: ${maxCombo}`}
            hashtags={['DeepSeaShooter', 'GamePlatform']}
          />
        </div>

        <Button $primary onClick={onRetry}>
          RETRY
        </Button>
        <Button onClick={onTitle}>TITLE</Button>
      </FullScreenOverlay>
    </StyledGameContainer>
  );
}
