/**
 * キャラクターナラティブコメント表示コンポーネント
 * SprintStartScreen / RetrospectiveScreen で共用
 */
import React from 'react';
import { COLORS } from '../constants';

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
    background: `${COLORS.accent}08`,
    borderRadius: 8,
    border: `1px solid ${COLORS.accent}18`,
  }}>
    {characterImage ? (
      <img
        src={characterImage}
        alt=""
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    ) : (
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: `${COLORS.accent}15`,
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
      fontSize: 12,
      color: COLORS.text,
      lineHeight: 1.5,
    }}>
      {text}
    </div>
  </div>
);
