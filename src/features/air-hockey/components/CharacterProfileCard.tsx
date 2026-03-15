/**
 * キャラクタープロフィールカードコンポーネント
 * P2-04: CharacterProfileCard
 *
 * キャラクターの詳細プロフィールをモーダル表示。
 * 立ち絵タップで表情切替（normal ⇔ happy）。
 * 閉じる: ✕ ボタン / 背景タップ / Escape キー。
 */
import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import type { Character, DexEntry } from '../core/types';

// ── 定数 ──────────────────────────────────────────
const PORTRAIT_MAX_WIDTH_PX = 200;
const PORTRAIT_MAX_HEIGHT_PX = 300;
const ICON_FALLBACK_SIZE_PX = 128;
const CARD_BORDER_RADIUS_PX = 16;

// ── アニメーション ────────────────────────────────────
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// ── styled-components ─────────────────────────────
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  animation: ${fadeIn} 200ms ease-out;
`;

const CardContainer = styled.div`
  position: relative;
  width: 90%;
  max-width: 400px;
  max-height: 85vh;
  background: #fff;
  border-radius: ${CARD_BORDER_RADIUS_PX}px;
  overflow-y: auto;
  animation: ${slideUp} 300ms ease-out;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  color: #333;

  &:hover {
    background: rgba(0, 0, 0, 0.2);
  }
`;

const PortraitSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 8px;
`;

const PortraitImage = styled.img<{ $isIcon?: boolean }>`
  max-width: ${(props) => (props.$isIcon ? ICON_FALLBACK_SIZE_PX : PORTRAIT_MAX_WIDTH_PX)}px;
  max-height: ${(props) => (props.$isIcon ? ICON_FALLBACK_SIZE_PX : PORTRAIT_MAX_HEIGHT_PX)}px;
  object-fit: contain;
  cursor: ${(props) => (props.$isIcon ? 'default' : 'pointer')};
  border-radius: ${(props) => (props.$isIcon ? '50%' : '0')};
  transition: opacity 150ms ease;
`;

const PortraitHint = styled.span`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.4);
  margin-top: 4px;
`;

const QuoteSection = styled.div<{ $color: string }>`
  padding: 12px 24px;
  text-align: center;
  font-style: italic;
  color: ${(props) => props.$color};
  font-size: 15px;

  &::before {
    content: '「';
  }
  &::after {
    content: '」';
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  margin: 0 24px;
`;

const NameSection = styled.div`
  padding: 12px 24px;
  text-align: center;
`;

const FullName = styled.div`
  font-size: 24px;
  font-weight: 800;
  color: #222;
`;

const Reading = styled.div`
  font-size: 14px;
  color: #888;
  margin-top: 2px;
`;

const InfoSection = styled.div`
  padding: 8px 24px;
  text-align: center;
  font-size: 14px;
  color: #555;
  line-height: 1.8;
`;

const TagSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 24px;
  justify-content: center;
`;

const PersonalityTag = styled.span<{ $color: string }>`
  background: ${(props) => props.$color}20;
  color: ${(props) => props.$color};
  font-size: 13px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
`;

const PlayStyleSection = styled.div`
  padding: 12px 24px 16px;
`;

const SectionLabel = styled.div`
  font-size: 12px;
  color: #888;
  font-weight: 600;
  margin-bottom: 4px;
`;

const PlayStyleName = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #333;
`;

const SpecialMoveName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #444;
  margin-top: 8px;
`;

const SpecialMoveDesc = styled.div`
  font-size: 13px;
  color: #666;
  margin-top: 2px;
`;

const DescriptionSection = styled.div`
  padding: 12px 24px 24px;
  font-size: 14px;
  color: #444;
  line-height: 1.7;
  text-align: left;
`;

// ── Props ─────────────────────────────────────────
type CharacterProfileCardProps = {
  entry: DexEntry;
  character: Character;
  onClose: () => void;
};

// ── コンポーネント ────────────────────────────────────
export const CharacterProfileCard: React.FC<CharacterProfileCardProps> = ({
  entry,
  character,
  onClose,
}) => {
  const { profile } = entry;
  const hasPortrait = !!character.portrait;
  const [isHappy, setIsHappy] = useState(false);

  // Escape キーで閉じる
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 背景オーバーレイクリックで閉じる
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 立ち絵タップで表情切替
  const handlePortraitClick = useCallback(() => {
    if (hasPortrait) {
      setIsHappy((prev) => !prev);
    }
  }, [hasPortrait]);

  // 表示する画像の src を決定
  const { portrait } = character;
  const imageSrc = portrait
    ? isHappy
      ? portrait.happy
      : portrait.normal
    : character.icon;

  const themeColor = character.color;

  return (
    <Overlay data-testid="profile-overlay" onClick={handleOverlayClick}>
      <CardContainer data-testid="profile-card" onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose} aria-label="閉じる">
          ✕
        </CloseButton>

        {/* 立ち絵 / アイコン */}
        <PortraitSection>
          <PortraitImage
            src={imageSrc}
            alt={profile.fullName}
            $isIcon={!hasPortrait}
            onClick={handlePortraitClick}
          />
          {hasPortrait && <PortraitHint>タップで表情変更</PortraitHint>}
        </PortraitSection>

        {/* 代表セリフ */}
        <QuoteSection $color={themeColor}>{profile.quote}</QuoteSection>

        <Divider />

        {/* キャラ名 */}
        <NameSection>
          <FullName>{profile.fullName}</FullName>
          <Reading>{profile.reading}</Reading>
        </NameSection>

        <Divider />

        {/* 基本情報 */}
        <InfoSection>
          <div>
            {profile.grade} | {profile.age}歳 | {profile.height}
          </div>
          <div>
            {profile.birthday}生 | {profile.school}
          </div>
        </InfoSection>

        <Divider />

        {/* 性格タグ */}
        <TagSection>
          {profile.personality.map((tag) => (
            <PersonalityTag key={tag} $color={themeColor}>
              {tag}
            </PersonalityTag>
          ))}
        </TagSection>

        <Divider />

        {/* プレイスタイル・得意技 */}
        <PlayStyleSection>
          <SectionLabel>プレイスタイル</SectionLabel>
          <PlayStyleName>{profile.playStyle}</PlayStyleName>
          <SpecialMoveName>得意技: {profile.specialMove}</SpecialMoveName>
          <SpecialMoveDesc>{profile.specialMoveDesc}</SpecialMoveDesc>
        </PlayStyleSection>

        <Divider />

        {/* 紹介文 */}
        <DescriptionSection>{profile.description}</DescriptionSection>
      </CardContainer>
    </Overlay>
  );
};
