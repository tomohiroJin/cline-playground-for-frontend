/**
 * ペアマッチ（2v2）チーム確認画面
 * チーム構成を表示して対戦開始
 * Field / Win Score はタイトル画面の設定値をそのまま使用する
 */
import React from 'react';
import {
  MenuCard,
  OptionContainer,
  OptionTitle,
  StartButton,
  MenuButton,
} from '../styles';

type TeamSetupScreenProps = {
  onStart: () => void;
  onBack: () => void;
};

export const TeamSetupScreen: React.FC<TeamSetupScreenProps> = ({
  onStart,
  onBack,
}) => (
  <MenuCard>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
      <MenuButton onClick={onBack}>&larr; 戻る</MenuButton>
      <h2 style={{ margin: 0, fontSize: '1.2rem' }}>ペアマッチ</h2>
    </div>

    <OptionContainer>
      <OptionTitle>チーム1（下）</OptionTitle>
      <div style={{ fontSize: '0.9rem', color: '#ccc', lineHeight: 1.8, paddingLeft: '8px' }}>
        <div>P1: あなた</div>
        <div>P2: CPU（味方）</div>
      </div>
    </OptionContainer>

    <OptionContainer>
      <OptionTitle>チーム2（上）</OptionTitle>
      <div style={{ fontSize: '0.9rem', color: '#ccc', lineHeight: 1.8, paddingLeft: '8px' }}>
        <div>P3: CPU（敵1）</div>
        <div>P4: CPU（敵2）</div>
      </div>
    </OptionContainer>

    <StartButton
      onClick={onStart}
      style={{ background: 'linear-gradient(135deg, #27ae60, #2ecc71)', marginTop: '16px' }}
    >
      対戦開始！
    </StartButton>
  </MenuCard>
);
