/**
 * 実績一覧画面コンポーネント
 */
import React, { useMemo } from 'react';
import { COLORS, FONTS } from '../constants';
import { ACHIEVEMENTS } from '../domain/achievement';
import { AchievementRepository } from '../infrastructure/storage/achievement-repository';
import { LocalStorageAdapter } from '../infrastructure/storage/local-storage-adapter';
import { AchievementRarity } from '../domain/types';
import { ParticleEffect } from './ParticleEffect';
import {
  PageWrapper,
  Panel,
  SectionBox,
  Button,
  Scanlines,
} from './styles';

interface AchievementScreenProps {
  onBack: () => void;
}

const achievementRepo = new AchievementRepository(new LocalStorageAdapter());

/** レア度ごとの色 */
const RARITY_COLORS: Record<AchievementRarity, string> = {
  Bronze: '#cd7f32',
  Silver: '#c0c0c0',
  Gold: '#ffd700',
  Platinum: '#e5e4e2',
};

/** レア度ごとのアイコン */
const RARITY_ICONS: Record<AchievementRarity, string> = {
  Bronze: '\u{1F949}',
  Silver: '\u{1F948}',
  Gold: '\u{1F947}',
  Platinum: '\u{1F48E}',
};

export const AchievementScreen: React.FC<AchievementScreenProps> = ({ onBack }) => {
  const progress = useMemo(() => achievementRepo.loadProgress(), []);
  const unlockedCount = Object.keys(progress.unlocked).length;

  return (
    <PageWrapper>
      <ParticleEffect />
      <Scanlines />
      <Panel $fadeIn={false} style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{
            fontSize: 10,
            color: COLORS.muted,
            letterSpacing: 2,
            fontFamily: FONTS.mono,
            fontWeight: 700,
          }}>
            ACHIEVEMENTS
          </div>
          <h2 style={{ fontSize: 20, color: COLORS.text2, margin: '4px 0 8px' }}>
            実績一覧
          </h2>
          <div style={{
            fontSize: 12,
            color: COLORS.accent,
            fontFamily: FONTS.mono,
          }}>
            {unlockedCount} / {ACHIEVEMENTS.length} 達成
          </div>
        </div>

        <SectionBox style={{ maxHeight: '50vh', overflowY: 'auto' }}>
          {ACHIEVEMENTS.map(achievement => {
            const isUnlocked = progress.unlocked[achievement.id] !== undefined;
            const unlockDate = progress.unlocked[achievement.id];
            const rarityColor = RARITY_COLORS[achievement.rarity];

            return (
              <div
                key={achievement.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: isUnlocked ? `${rarityColor}0a` : `${COLORS.bg}44`,
                  border: `1px solid ${isUnlocked ? `${rarityColor}30` : COLORS.border}`,
                  marginBottom: 6,
                  opacity: isUnlocked ? 1 : 0.5,
                  transition: 'opacity 0.2s',
                }}
              >
                {/* レア度アイコン */}
                <span style={{ fontSize: 20, minWidth: 28 }}>
                  {isUnlocked ? RARITY_ICONS[achievement.rarity] : '\u{1F512}'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: isUnlocked ? COLORS.text2 : COLORS.muted,
                  }}>
                    {achievement.name}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: COLORS.muted,
                    marginTop: 2,
                  }}>
                    {achievement.description}
                  </div>
                </div>
                {/* レア度バッジ */}
                <div style={{
                  fontSize: 9,
                  color: rarityColor,
                  fontFamily: FONTS.mono,
                  fontWeight: 700,
                  letterSpacing: 1,
                }}>
                  {achievement.rarity}
                </div>
                {/* 達成日時 */}
                {isUnlocked && unlockDate && (
                  <div style={{
                    fontSize: 9,
                    color: COLORS.muted,
                    fontFamily: FONTS.mono,
                  }}>
                    {new Date(unlockDate).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
            );
          })}
        </SectionBox>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button $color={COLORS.muted} onClick={onBack} style={{ padding: '10px 32px', fontSize: 12 }}>
            戻る
          </Button>
        </div>
      </Panel>
    </PageWrapper>
  );
};
