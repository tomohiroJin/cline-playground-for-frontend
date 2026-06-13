/**
 * 復習選択画面
 *
 * 誤答 / ブックマーク から復習を開始する入口。タグ別はタグチップ経由で開始する。
 * 他の画面（AchievementScreen, StudySelectScreen 等）と同じ PageWrapper + Scanlines + Panel の
 * 標準クロームで包み、ページレベルで表示したときの視覚的統一感を保つ。
 */
import React from 'react';
import { ReviewSource } from '../../../domain/quiz';
import { COLORS, FONTS } from '../../../constants';
import {
  PageWrapper,
  Panel,
  Scanlines,
  Button,
} from '../../styles';

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
  <PageWrapper>
    <Scanlines />
    <Panel $fadeIn={false}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          fontSize: 10,
          color: COLORS.accent,
          letterSpacing: 3,
          fontFamily: FONTS.mono,
          fontWeight: 700,
        }}>
          REVIEW MODE
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text2, marginTop: 6 }}>
          復習モード
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <Button
          $color={COLORS.red}
          $disabled={wrongCount === 0}
          disabled={wrongCount === 0}
          onClick={() => onSelectSource('wrong')}
        >
          誤答から復習（{wrongCount}）
        </Button>
        <Button
          $color={COLORS.yellow}
          $disabled={bookmarkCount === 0}
          disabled={bookmarkCount === 0}
          onClick={() => onSelectSource('bookmark')}
        >
          ブックマークから復習（{bookmarkCount}）
        </Button>
        <Button $color={COLORS.muted} onClick={onBack}>
          タイトルへ戻る
        </Button>
      </div>
    </Panel>
  </PageWrapper>
);
