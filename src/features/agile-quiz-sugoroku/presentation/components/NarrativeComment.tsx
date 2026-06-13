/**
 * キャラクターナラティブコメント表示コンポーネント
 * SprintStartScreen / RetrospectiveScreen で共用
 */
import React from 'react';
import { DESIGN_TOKENS } from '../styles/design-tokens';

interface NarrativeCommentProps {
  /** キャラクター画像の URL */
  characterImage: string | undefined;
  /** ナラティブテキスト */
  text: string;
}

/**
 * キャラクターアイコン + コメント吹き出し
 */
export const NarrativeComment: React.FC<NarrativeCommentProps> = ({ characterImage, text }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    marginBottom: 14,
    background: `${DESIGN_TOKENS.colors.primary}08`,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    border: `1px solid ${DESIGN_TOKENS.colors.primary}18`,
  }}>
    {characterImage ? (
      <img
        src={characterImage}
        alt=""
        style={{
          width: 40,
          height: 40,
          borderRadius: DESIGN_TOKENS.borderRadius.round,
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    ) : (
      <div style={{
        width: 40,
        height: 40,
        borderRadius: DESIGN_TOKENS.borderRadius.round,
        background: `${DESIGN_TOKENS.colors.primary}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        flexShrink: 0,
      }}>
        ?
      </div>
    )}
    <div style={{
      fontSize: DESIGN_TOKENS.fontSize.xs,
      color: DESIGN_TOKENS.colors.textPrimary,
      lineHeight: 1.5,
    }}>
      {text}
    </div>
  </div>
);
