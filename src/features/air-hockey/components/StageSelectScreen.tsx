/**
 * ステージ選択画面コンポーネント
 * US-2.3: ストーリーモードのステージ選択 UI
 * S8-3: チャプターセクション分け対応
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
    classic: 'オリジナル',
    wide: 'ワイド',
    pillars: 'ピラーズ',
    zigzag: 'ジグザグ',
    fortress: 'フォートレス',
    bastion: 'バスティオン',
  };
  return nameMap[fieldId] ?? fieldId;
};

/** チャプター番号からタイトルを取得 */
const CHAPTER_TITLES: Record<number, string> = {
  1: '第1章 はじめの挑戦',
  2: '第2章 はじめての大舞台',
};

/** ステージ配列をチャプター番号でグループ化 */
const groupByChapter = (stages: StageDefinition[]): Map<number, StageDefinition[]> => {
  const map = new Map<number, StageDefinition[]>();
  for (const stage of stages) {
    const group = map.get(stage.chapter) ?? [];
    group.push(stage);
    map.set(stage.chapter, group);
  }
  return map;
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

  const chapters = groupByChapter(stages);

  return (
    <MenuCard>
      <GameTitle>ストーリーモード</GameTitle>

      {[...chapters.entries()].map(([chapter, chapterStages]) => (
        <div key={chapter} style={{ width: '100%', marginBottom: '20px' }}>
          {/* チャプタータイトル */}
          <h4 style={chapterTitleStyle}>
            {CHAPTER_TITLES[chapter] ?? `第${chapter}章`}
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chapterStages.map(stage => {
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
        </div>
      ))}

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

// ── スタイル定義 ────────────────

const chapterTitleStyle: React.CSSProperties = {
  color: '#e67e22',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
  paddingBottom: '8px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
};
