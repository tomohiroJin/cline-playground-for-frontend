/**
 * スキルパネルコンポーネント
 * バトル中のスキルボタン群
 */
import React from 'react';
import type { ASkillDef, ASkillId, SkillSt } from '../../types';
import { BattleFixedBottom, SkillBar, SkillBtn } from '../../styles';

export interface SkillPanelProps {
  skills: readonly ASkillDef[];
  sk: SkillSt;
  onUseSkill: (sid: ASkillId) => void;
}

export const SkillPanel: React.FC<SkillPanelProps> = ({ skills, sk, onUseSkill }) => {
  if (skills.length === 0) return null;

  return (
    <BattleFixedBottom>
      <SkillBar>
        {skills.map(s => {
          const cd = sk.cds[s.id] || 0;
          const isOff = cd > 0;
          return (
            <SkillBtn key={s.id} $off={isOff} onClick={() => onUseSkill(s.id)}
              title={s.ds}>
              {s.ic} {s.nm}{isOff ? ` (${cd})` : ''}
            </SkillBtn>
          );
        })}
      </SkillBar>
    </BattleFixedBottom>
  );
};
