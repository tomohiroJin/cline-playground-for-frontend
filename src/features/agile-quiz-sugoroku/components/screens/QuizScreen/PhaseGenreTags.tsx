/**
 * フェーズジャンルタグ表示コンポーネント
 */
import React from 'react';
import { COLORS } from '../../../constants';
import { TAG_MAP } from '../../../questions/tag-master';

interface PhaseGenreTagsProps {
  /** タグID配列 */
  tagIds: string[];
}

/** フェーズに対応するジャンルタグを表示 */
export const PhaseGenreTags: React.FC<PhaseGenreTagsProps> = ({ tagIds }) => {
  if (tagIds.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
      {tagIds.map((tagId) => {
        const tag = TAG_MAP.get(tagId);
        return (
          <span key={tagId} style={{
            fontSize: 9, padding: '2px 6px', borderRadius: 3,
            background: `${tag?.color ?? COLORS.accent}10`,
            border: `1px solid ${tag?.color ?? COLORS.accent}22`,
            color: tag?.color ?? COLORS.accent, fontWeight: 500,
          }}>
            {tag?.name ?? tagId}
          </span>
        );
      })}
    </div>
  );
};
