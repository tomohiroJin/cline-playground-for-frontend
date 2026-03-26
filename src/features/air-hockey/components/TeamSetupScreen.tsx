/**
 * ペアマッチ（2v2）チーム設定画面
 * フィールド・勝利スコアを選択してゲーム開始
 */
import React, { useState } from 'react';
import { FieldConfig } from '../core/types';
import { FIELDS, WIN_SCORE_OPTIONS } from '../core/config';
import {
  MenuCard,
  OptionContainer,
  OptionTitle,
  ButtonGroup,
  ModeButton,
  StartButton,
  MenuButton,
} from '../styles';

export type TeamSetupConfig = {
  field: FieldConfig;
  winScore: number;
};

type TeamSetupScreenProps = {
  fields: readonly FieldConfig[];
  unlockedFieldIds: string[];
  onStart: (config: TeamSetupConfig) => void;
  onBack: () => void;
};

export const TeamSetupScreen: React.FC<TeamSetupScreenProps> = ({
  fields,
  unlockedFieldIds,
  onStart,
  onBack,
}) => {
  const [field, setField] = useState<FieldConfig>(fields[0]);
  const [winScore, setWinScore] = useState(7);

  const handleStart = () => {
    onStart({ field, winScore });
  };

  return (
    <MenuCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <MenuButton onClick={onBack}>&larr; 戻る</MenuButton>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>ペアマッチ設定</h2>
      </div>

      <OptionContainer>
        <OptionTitle>チーム構成</OptionTitle>
        <div style={{ fontSize: '0.85rem', color: '#ccc', lineHeight: 1.6 }}>
          <div>チーム1（下）: あなた + CPU</div>
          <div>チーム2（上）: CPU + CPU</div>
        </div>
      </OptionContainer>

      <OptionContainer>
        <OptionTitle>Field</OptionTitle>
        <ButtonGroup>
          {fields.map(f => {
            const isLocked = !unlockedFieldIds.includes(f.id);
            return (
              <ModeButton
                key={f.id}
                onClick={() => !isLocked && setField(f)}
                $selected={field.id === f.id}
                style={isLocked ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
              >
                {isLocked ? '🔒' : f.name}
              </ModeButton>
            );
          })}
        </ButtonGroup>
      </OptionContainer>

      <OptionContainer>
        <OptionTitle>Win Score</OptionTitle>
        <ButtonGroup>
          {WIN_SCORE_OPTIONS.map(s => (
            <ModeButton key={s} onClick={() => setWinScore(s)} $selected={winScore === s}>
              {s}
            </ModeButton>
          ))}
        </ButtonGroup>
      </OptionContainer>

      <StartButton
        onClick={handleStart}
        style={{ background: 'linear-gradient(135deg, #27ae60, #2ecc71)', marginTop: '16px' }}
      >
        対戦開始！
      </StartButton>
    </MenuCard>
  );
};
