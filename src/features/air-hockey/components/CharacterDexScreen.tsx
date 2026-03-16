/**
 * キャラクター図鑑画面コンポーネント
 * P2-03: CharacterDexScreen
 *
 * 2列グリッドでキャラクターカードを表示。
 * アンロック済み: アイコン + 名前 + テーマカラーボーダー
 * ロック中: グレースケール + シルエット + 「???」
 * NEW バッジ: 赤背景 + 白文字、カード右上
 */
import React, { useEffect, useMemo, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import type { Character, DexEntry } from '../core/types';

// ── 定数 ──────────────────────────────────────────
const CARD_HEIGHT_PX = 120;
const ICON_SIZE_PX = 64;
const GRID_GAP_PX = 12;
const STAGGER_DELAY_MS = 50;
const DEFAULT_BORDER_COLOR = 'rgba(255,255,255,0.1)';

// ── アニメーション ────────────────────────────────────
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`;

// ── styled-components ─────────────────────────────
const ScreenContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  background: var(--bg-gradient);
  padding: 20px 20px 0;
  overflow: hidden;
  box-sizing: border-box;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  max-width: 450px;
  margin-bottom: 16px;
  gap: 8px;
`;

const BackButton = styled.button`
  background: none;
  border: 1px solid var(--text-secondary);
  color: var(--text-secondary);
  padding: 5px 15px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  align-self: flex-start;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
  }
`;

const Title = styled.h1`
  text-align: center;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--accent-color);
  margin: 0;
  text-shadow: 0 0 10px rgba(0, 210, 255, 0.5);
`;

const ProgressSection = styled.div`
  width: 100%;
  max-width: 450px;
  margin-bottom: 20px;
`;

const ProgressBarBg = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
`;

const ProgressBarFill = styled.div<{ $rate: number }>`
  width: ${(props) => props.$rate * 100}%;
  height: 100%;
  background: #3498db;
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const ProgressText = styled.span`
  color: var(--text-secondary);
  font-size: 14px;
`;

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${GRID_GAP_PX}px;
  width: 100%;
  max-width: 450px;
  margin: 0 auto;
  padding-bottom: 20px;
  align-content: start;
`;

const CardWrapper = styled.div<{ $index: number }>`
  animation: ${fadeInUp} 300ms ease-out both;
  animation-delay: ${(props) => props.$index * STAGGER_DELAY_MS}ms;
`;

const Card = styled.button<{ $borderColor: string; $isLocked: boolean }>`
  position: relative;
  width: 100%;
  height: ${CARD_HEIGHT_PX}px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid ${(props) => (props.$isLocked ? 'rgba(255,255,255,0.1)' : props.$borderColor)};
  border-radius: 12px;
  cursor: ${(props) => (props.$isLocked ? 'default' : 'pointer')};
  padding: 12px;
  transition: transform 100ms ease;

  &:active {
    transform: ${(props) => (props.$isLocked ? 'none' : 'scale(0.95)')};
  }
`;

const CharIcon = styled.img<{ $isLocked: boolean }>`
  width: ${ICON_SIZE_PX}px;
  height: ${ICON_SIZE_PX}px;
  border-radius: 50%;
  object-fit: cover;
  filter: ${(props) => (props.$isLocked ? 'grayscale(1) brightness(0.3)' : 'none')};
`;

const CharName = styled.span<{ $isLocked: boolean }>`
  color: ${(props) => (props.$isLocked ? 'var(--text-secondary)' : 'var(--text-primary)')};
  font-size: 14px;
  font-weight: 600;
`;

const NewBadge = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  background: #e74c3c;
  color: white;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  animation: ${pulse} 1s ease-in-out infinite;
`;

// ── Props ─────────────────────────────────────────
type CharacterDexScreenProps = {
  dexEntries: DexEntry[];
  unlockedIds: string[];
  newlyUnlockedIds: string[];
  characters: Record<string, Character>;
  completionRate: number;
  onSelectCharacter: (characterId: string) => void;
  onBack: () => void;
  onMarkViewed: (characterIds: string[]) => void;
};

// ── コンポーネント ────────────────────────────────────
export const CharacterDexScreen: React.FC<CharacterDexScreenProps> = ({
  dexEntries,
  unlockedIds,
  newlyUnlockedIds,
  characters,
  completionRate,
  onSelectCharacter,
  onBack,
  onMarkViewed,
}) => {
  // 図鑑画面を開いた際に、未確認のアンロックを既読にする（初回マウント時のみ）
  const hasMarkedViewed = useRef(false);
  useEffect(() => {
    if (!hasMarkedViewed.current && newlyUnlockedIds.length > 0) {
      hasMarkedViewed.current = true;
      onMarkViewed(newlyUnlockedIds);
    }
  }, [newlyUnlockedIds, onMarkViewed]);

  const totalCount = dexEntries.length;
  // 表示対象エントリに含まれるアンロック済みキャラのみカウント
  const unlockedCount = useMemo(() => {
    const visibleCharIds = dexEntries.map((e) => e.profile.characterId);
    return unlockedIds.filter((id) => visibleCharIds.includes(id)).length;
  }, [dexEntries, unlockedIds]);

  const handleCardClick = (characterId: string, isLocked: boolean) => {
    if (isLocked) return;
    onSelectCharacter(characterId);
  };

  return (
    <ScreenContainer>
      <Header>
        <BackButton onClick={onBack}>← 戻る</BackButton>
        <Title>キャラクター図鑑</Title>
      </Header>

      <ProgressSection>
        <ProgressBarBg>
          <ProgressBarFill $rate={completionRate} />
        </ProgressBarBg>
        <ProgressText>{unlockedCount} / {totalCount}</ProgressText>
      </ProgressSection>

      <ScrollArea>
        <Grid>
          {dexEntries.map((entry, index) => {
            const charId = entry.profile.characterId;
            const isUnlocked = unlockedIds.includes(charId);
            const isNew = newlyUnlockedIds.includes(charId);
            const character = characters[charId];
            const displayName = isUnlocked
              ? (character?.name ?? entry.profile.fullName)
              : '???';
            const borderColor = character?.color ?? DEFAULT_BORDER_COLOR;

            return (
              <CardWrapper key={charId} $index={index}>
                <Card
                  $borderColor={borderColor}
                  $isLocked={!isUnlocked}
                  onClick={() => handleCardClick(charId, !isUnlocked)}
                >
                  {isNew && <NewBadge>NEW</NewBadge>}
                  <CharIcon
                    src={character?.icon ?? ''}
                    alt={displayName}
                    $isLocked={!isUnlocked}
                  />
                  <CharName $isLocked={!isUnlocked}>{displayName}</CharName>
                </Card>
              </CardWrapper>
            );
          })}
        </Grid>
      </ScrollArea>
    </ScreenContainer>
  );
};
