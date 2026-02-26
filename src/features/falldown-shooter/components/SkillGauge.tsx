// スキルゲージコンポーネント

import React from 'react';
import type { SkillType, SkillInfo } from '../types';
import { CONFIG, SKILLS } from '../constants';
import {
  SkillGaugeContainer,
  GaugeBar,
  GaugeFill,
  SkillButtons,
  SkillBtn,
} from '../../../pages/FallingShooterPage.styles';

interface SkillGaugeProps {
  charge: number;
  onUseSkill: (skill: SkillType) => void;
}

export const SkillGauge: React.FC<SkillGaugeProps> = React.memo(({ charge, onUseSkill }) => {
  const isFull = charge >= CONFIG.skill.maxCharge;
  return (
    <SkillGaugeContainer>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <GaugeBar
          role="progressbar"
          aria-valuenow={Math.floor(charge)}
          aria-valuemax={100}
          aria-label="スキルゲージ"
        >
          <GaugeFill $width={charge} $isFull={isFull} />
        </GaugeBar>
        <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{Math.floor(charge)}%</span>
      </div>
      {isFull && (
        <SkillButtons>
          {(Object.entries(SKILLS) as [SkillType, SkillInfo][]).map(([key, skill]) => (
            <SkillBtn
              key={key}
              onClick={() => onUseSkill(key)}
              $color={skill.color}
              title={`${skill.name}: ${skill.desc}`}
              aria-label={`スキル: ${skill.name}`}
            >
              <span style={{ fontSize: '1.25rem' }}>{skill.icon}</span>
              <span style={{ fontSize: '0.75rem', marginLeft: '0.25rem' }}>{skill.key}</span>
            </SkillBtn>
          ))}
        </SkillButtons>
      )}
    </SkillGaugeContainer>
  );
});
SkillGauge.displayName = 'SkillGauge';
