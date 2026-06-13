/**
 * 復習選択画面
 *
 * 誤答 / ブックマーク から復習を開始する入口。タグ別はタグチップ経由で開始する。
 */
import React from 'react';
import { ReviewSource } from '../../../domain/quiz';
import { DESIGN_TOKENS } from '../../styles/design-tokens';
import { Button } from '../../styles';

interface ReviewSelectScreenProps {
  wrongCount: number;
  bookmarkCount: number;
  onSelectSource: (source: ReviewSource) => void;
  onBack: () => void;
}

/** 復習ソースを選ぶ画面 */
export const ReviewSelectScreen: React.FC<ReviewSelectScreenProps> = ({
  wrongCount,
  bookmarkCount,
  onSelectSource,
  onBack,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: DESIGN_TOKENS.spacing.md,
      padding: DESIGN_TOKENS.spacing.lg,
    }}
  >
    <h2 style={{ color: DESIGN_TOKENS.colors.textPrimary, fontSize: DESIGN_TOKENS.fontSize.xl }}>
      復習モード
    </h2>
    <Button
      $color={DESIGN_TOKENS.colors.danger}
      $disabled={wrongCount === 0}
      disabled={wrongCount === 0}
      onClick={() => onSelectSource('wrong')}
    >
      誤答から復習（{wrongCount}）
    </Button>
    <Button
      $color={DESIGN_TOKENS.colors.warning}
      $disabled={bookmarkCount === 0}
      disabled={bookmarkCount === 0}
      onClick={() => onSelectSource('bookmark')}
    >
      ブックマークから復習（{bookmarkCount}）
    </Button>
    <Button $color={DESIGN_TOKENS.colors.textMuted} onClick={onBack}>
      タイトルへ戻る
    </Button>
  </div>
);
