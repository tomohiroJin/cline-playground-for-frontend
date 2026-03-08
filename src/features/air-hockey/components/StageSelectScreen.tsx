/**
 * ステージ選択画面コンポーネント
 * US-2.3: ストーリーモードのステージ選択 UI
 */
import React from 'react';
import { MenuCard, GameTitle, MenuButton } from '../styles';
import type { StageDefinition, StoryProgress } from '../core/story';
import { isStageUnlocked } from '../core/story';
import { findCharacterById } from '../core/characters';
import { CharacterAvatar } from './CharacterAvatar';
import type { Difficulty } from '../core/types';

type StageSelectScreenProps = {
  stages: StageDefinition[];
  progress: StoryProgress;
  onSelectStage: (stage: StageDefinition) => void;
  onBack: () => void;
  onReset: () => void;
};

/** 難易度を★表記に変換 */
const difficultyStars = (difficulty: Difficulty): string => {
  const starMap: Record<Difficulty, string> = {
    easy: '★',
    normal: '★★',
    hard: '★★★',
  };
  return starMap[difficulty];
};

/** フィールドIDから表示名を取得 */
const fieldDisplayName = (fieldId: string): string => {
  const nameMap: Record<string, string> = {
    classic: 'Original',
    wide: 'Wide',
    pillars: 'Pillars',
    zigzag: 'Zigzag',
    fortress: 'Fortress',
    bastion: 'Bastion',
  };
  return nameMap[fieldId] ?? fieldId;
};

export const StageSelectScreen: React.FC<StageSelectScreenProps> = ({
  stages,
  progress,
  onSelectStage,
  onBack,
  onReset,
}) => {
  const handleReset = () => {
    if (window.confirm('ストーリーの進行データをリセットしますか？')) {
      onReset();
    }
  };

  return (
    <MenuCard>
      <GameTitle>第1章 はじめの挑戦</GameTitle>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {stages.map(stage => {
          const isUnlocked = isStageUnlocked(stage.id, progress, stages);
          const isCleared = progress.clearedStages.includes(stage.id);
          const character = findCharacterById(stage.characterId);

          return (
            <div
              key={stage.id}
              data-testid={`stage-card-${stage.id}`}
              onClick={() => isUnlocked && onSelectStage(stage)}
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: isUnlocked
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.4)',
                border: `1px solid ${isUnlocked ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)'}`,
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                opacity: isUnlocked ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s',
              }}
            >
              {/* キャラアイコン */}
              {character && <CharacterAvatar character={character} size={48} />}

              {/* ステージ情報 */}
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                }}>
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.95rem' }}>
                    {stage.id} {stage.name}
                  </span>
                  {isCleared && <span>✅</span>}
                  {!isUnlocked && <span>🔒</span>}
                </div>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  fontSize: '0.8rem',
                  color: '#aaa',
                }}>
                  <span>vs {character?.name ?? stage.characterId}</span>
                  <span>{fieldDisplayName(stage.fieldId)}</span>
                  <span>{difficultyStars(stage.difficulty)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* アクションボタン */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <MenuButton onClick={onBack}>戻る</MenuButton>
        <MenuButton onClick={handleReset} style={{ color: '#e74c3c', borderColor: '#e74c3c' }}>
          リセット
        </MenuButton>
      </div>
    </MenuCard>
  );
};
