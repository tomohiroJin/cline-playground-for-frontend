/**
 * キャラクターアバター表示コンポーネント
 *
 * キャラアイコン画像を丸型で表示し、画像読み込み完了前と
 * 読み込み失敗時はキャラ名の頭文字をフォールバック表示する。
 * CLS 防止のため、画像には固定サイズを設定する。
 */
import React, { useState } from 'react';
import type { Character } from '../core/types';

type CharacterAvatarProps = {
  character: Character;
  /** アバターのサイズ（px）。デフォルト 48 */
  size?: number;
  /** 枠線を表示するか */
  showBorder?: boolean;
  /** グロー効果を表示するか */
  showGlow?: boolean;
};

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  character,
  size = 48,
  showBorder = false,
  showGlow = false,
}) => {
  const [isImageError, setIsImageError] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const hasIcon = Boolean(character.icon) && !isImageError;

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        background: character.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        ...(showBorder ? {
          border: `3px solid ${character.color}`,
        } : {}),
        ...(showGlow ? {
          boxShadow: `0 0 20px ${character.color}40`,
        } : {}),
      }}
    >
      {hasIcon && (
        <img
          src={character.icon}
          alt={character.name}
          width={size}
          height={size}
          style={{
            objectFit: 'cover',
            opacity: isImageLoaded ? 1 : 0,
            position: isImageLoaded ? 'static' : 'absolute',
          }}
          onLoad={() => setIsImageLoaded(true)}
          onError={() => setIsImageError(true)}
        />
      )}
      {/* ロード前・エラー時のフォールバック */}
      {(!hasIcon || !isImageLoaded) && (
        <span style={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: `${size * 0.45}px`,
        }}>
          {character.name.charAt(0)}
        </span>
      )}
    </div>
  );
};
