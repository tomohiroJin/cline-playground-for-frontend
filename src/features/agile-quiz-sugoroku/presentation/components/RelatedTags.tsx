/**
 * 関連タグチップコンポーネント
 *
 * 問題の tags を表示名チップで表示する。
 * onTagClick 指定時はクリック可能なボタンとして描画される（Phase 3 タグレビュー用）。
 */
import React from 'react';
import { TAG_MAP } from '../../data/questions/tag-master';
import { DESIGN_TOKENS } from '../styles/design-tokens';

interface RelatedTagsProps {
  /** タグ ID の配列 */
  tags: string[];
  /** チップクリック時に tag id を返すコールバック（指定時のみクリック可能） */
  onTagClick?: (tagId: string) => void;
}

/** 関連タグチップ */
export const RelatedTags: React.FC<RelatedTagsProps> = ({ tags, onTagClick }) => {
  if (tags.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: DESIGN_TOKENS.spacing.xs,
        marginTop: DESIGN_TOKENS.spacing.xs,
      }}
    >
      {tags.map((tagId) => {
        const tag = TAG_MAP.get(tagId);
        const label = tag?.name ?? tagId;
        const color = tag?.color ?? DESIGN_TOKENS.colors.primary;
        const chipStyle: React.CSSProperties = {
          display: 'inline-block',
          fontSize: 9,
          padding: '1px 6px',
          borderRadius: 3,
          background: `${color}15`,
          color,
          border: 'none',
          cursor: onTagClick ? 'pointer' : 'default',
        };

        return onTagClick ? (
          <button
            key={tagId}
            type="button"
            style={chipStyle}
            onClick={() => onTagClick(tagId)}
          >
            #{label}
          </button>
        ) : (
          <span key={tagId} style={chipStyle}>
            #{label}
          </span>
        );
      })}
    </div>
  );
};
