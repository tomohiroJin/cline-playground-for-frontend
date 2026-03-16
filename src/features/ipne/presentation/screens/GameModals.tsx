/**
 * ゲームモーダルコンポーネント群
 * ClassSelectScreen, LevelUpOverlayComponent, HelpOverlayComponent, EffectEvent型
 */
import React, { useState } from 'react';
import {
  Overlay,
  ClassSelectContainer,
  ClassSelectTitle,
  ClassCardsContainer,
  ClassCard,
  ClassName,
  ClassDescription,
  ClassStats,
  ClassSelectButton,
  LevelUpOverlay,
  LevelUpTitle,
  LevelUpSubtitle,
  LevelUpChoicesContainer,
  LevelUpChoice,
  LevelUpChoiceLabel,
  LevelUpChoiceValue,
  LevelUpCloseButton,
  RemainingPointsText,
  HelpOverlay as HelpOverlayStyled,
  HelpContainer,
  HelpTitle,
  HelpSection,
  HelpSectionTitle,
  HelpKeyList,
  HelpKeyItem,
  HelpKey,
  HelpKeyDescription,
  HelpCloseButton,
  HelpHint,
  ClassImage,
} from '../../../../pages/IpnePage.styles';
import {
  Player,
  PlayerClass,
  PlayerClassValue,
  CLASS_CONFIGS,
  LEVEL_UP_CHOICES,
  canChooseStat,
  StatTypeValue,
} from '../../index';
import type { EffectTypeValue } from '../effects';
import warriorClassImg from '../../../../assets/images/ipne_class_warrior.webp';
import thiefClassImg from '../../../../assets/images/ipne_class_thief.webp';

/** 外部からキューイングされるエフェクトイベント */
export interface EffectEvent {
  type: EffectTypeValue;
  x: number;
  y: number;
  /** 敵タイプ（ENEMY_DEATH用） */
  enemyType?: string;
  /** コンボ倍率 */
  comboMultiplier?: number;
  /** パワーレベル（ATTACK_HIT用） */
  powerLevel?: number;
  /** エフェクトバリエーション（ENEMY_ATTACK用: melee/ranged/boss） */
  variant?: string;
  /** アイテム種類（ITEM_PICKUP用） */
  itemType?: string;
}

/**
 * 職業選択画面コンポーネント（MVP3）
 */
export const ClassSelectScreen: React.FC<{
  onSelect: (playerClass: PlayerClassValue) => void;
}> = ({ onSelect }) => {
  const [selectedClass, setSelectedClass] = useState<PlayerClassValue | null>(null);

  const handleConfirm = () => {
    if (selectedClass) {
      onSelect(selectedClass);
    }
  };

  return (
    <Overlay>
      <ClassSelectContainer>
        <ClassSelectTitle>職業を選択</ClassSelectTitle>
        <ClassCardsContainer>
          <ClassCard
            $classType="warrior"
            $selected={selectedClass === PlayerClass.WARRIOR}
            onClick={() => setSelectedClass(PlayerClass.WARRIOR)}
          >
            <ClassImage src={warriorClassImg} alt="戦士" />
            <ClassName>{CLASS_CONFIGS[PlayerClass.WARRIOR].name}</ClassName>
            <ClassDescription>
              耐久力と攻撃力が高く、正面突破スタイル。罠・特殊壁は触れて判明。
            </ClassDescription>
            <ClassStats>
              <span>HP: 20 / 攻撃力: 2</span>
              <span>攻撃速度: 速 / 回復+1</span>
            </ClassStats>
          </ClassCard>
          <ClassCard
            $classType="thief"
            $selected={selectedClass === PlayerClass.THIEF}
            onClick={() => setSelectedClass(PlayerClass.THIEF)}
          >
            <ClassImage src={thiefClassImg} alt="盗賊" />
            <ClassName>{CLASS_CONFIGS[PlayerClass.THIEF].name}</ClassName>
            <ClassDescription>
              移動速度が高く、罠を避けて進むスタイル。罠・特殊壁がうっすら見える。
            </ClassDescription>
            <ClassStats>
              <span>HP: 12 / 攻撃力: 1</span>
              <span>移動速度: 速 / 罠視認: ○</span>
            </ClassStats>
          </ClassCard>
        </ClassCardsContainer>
        <ClassSelectButton $disabled={!selectedClass} onClick={handleConfirm}>
          この職業で開始
        </ClassSelectButton>
      </ClassSelectContainer>
    </Overlay>
  );
};

/**
 * レベルアップオーバーレイコンポーネント（MVP3、ポイント制対応）
 */
export const LevelUpOverlayComponent: React.FC<{
  player: Player;
  pendingPoints: number;
  onChoose: (stat: StatTypeValue) => void;
  onClose: () => void;
}> = ({ player, pendingPoints, onChoose, onClose }) => {
  const choices = LEVEL_UP_CHOICES.map(choice => ({
    ...choice,
    canChoose: canChooseStat(player.stats, choice.stat),
    currentValue: player.stats[choice.stat as keyof typeof player.stats],
  }));

  return (
    <LevelUpOverlay>
      <LevelUpTitle>🎉 レベルアップ！</LevelUpTitle>
      <LevelUpSubtitle>強化する能力を選んでください</LevelUpSubtitle>
      {pendingPoints > 1 && (
        <RemainingPointsText>残りポイント: {pendingPoints}</RemainingPointsText>
      )}
      <LevelUpChoicesContainer>
        {choices.map(choice => (
          <LevelUpChoice
            key={choice.stat}
            $disabled={!choice.canChoose}
            onClick={() => choice.canChoose && onChoose(choice.stat)}
          >
            <LevelUpChoiceLabel>{choice.description}</LevelUpChoiceLabel>
            <LevelUpChoiceValue $disabled={!choice.canChoose}>
              {choice.canChoose
                ? `${choice.currentValue} → ${choice.currentValue + choice.increase}`
                : '上限'}
            </LevelUpChoiceValue>
          </LevelUpChoice>
        ))}
      </LevelUpChoicesContainer>
      <LevelUpCloseButton onClick={onClose}>後で選ぶ</LevelUpCloseButton>
    </LevelUpOverlay>
  );
};

/**
 * ヘルプオーバーレイコンポーネント（MVP4）
 */
export const HelpOverlayComponent: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <HelpOverlayStyled onClick={onClose}>
    <HelpContainer onClick={e => e.stopPropagation()}>
      <HelpTitle>操作方法</HelpTitle>

      <HelpSection>
        <HelpSectionTitle>移動</HelpSectionTitle>
        <HelpKeyList>
          <HelpKeyItem>
            <HelpKey>W A S D</HelpKey>
            <HelpKeyDescription>上/左/下/右に移動</HelpKeyDescription>
          </HelpKeyItem>
          <HelpKeyItem>
            <HelpKey>↑ ← ↓ →</HelpKey>
            <HelpKeyDescription>矢印キーでも移動可能</HelpKeyDescription>
          </HelpKeyItem>
        </HelpKeyList>
      </HelpSection>

      <HelpSection>
        <HelpSectionTitle>アクション</HelpSectionTitle>
        <HelpKeyList>
          <HelpKeyItem>
            <HelpKey>Space</HelpKey>
            <HelpKeyDescription>攻撃（押しながら移動キーで向き変更）</HelpKeyDescription>
          </HelpKeyItem>
          <HelpKeyItem>
            <HelpKey>M</HelpKey>
            <HelpKeyDescription>マップ表示切替（小窓→全画面→非表示）</HelpKeyDescription>
          </HelpKeyItem>
          <HelpKeyItem>
            <HelpKey>H</HelpKey>
            <HelpKeyDescription>このヘルプを表示/非表示</HelpKeyDescription>
          </HelpKeyItem>
        </HelpKeyList>
      </HelpSection>

      <HelpSection>
        <HelpSectionTitle>ゲームの目的</HelpSectionTitle>
        <HelpKeyList>
          <HelpKeyItem>
            <HelpKeyDescription>
              迷宮を探索してゴール（緑色のタイル）を目指しましょう。
              敵を倒してレベルアップし、アイテムを取得して有利に進めましょう。
              クリアタイムで評価が決まります！
            </HelpKeyDescription>
          </HelpKeyItem>
        </HelpKeyList>
      </HelpSection>

      <HelpCloseButton onClick={onClose}>閉じる</HelpCloseButton>
      <HelpHint>画面外をクリックしても閉じられます</HelpHint>
    </HelpContainer>
  </HelpOverlayStyled>
);
