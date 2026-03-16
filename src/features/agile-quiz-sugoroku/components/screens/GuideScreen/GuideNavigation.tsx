/**
 * ガイド画面ナビゲーションコンポーネント
 * 戻るボタンとキーボードショートカット
 */
import React from 'react';
import { useKeys } from '../../../hooks';
import { COLORS } from '../../../constants';
import {
  Button,
  HotkeyHint,
} from '../../styles';

interface GuideNavigationProps {
  onBack: () => void;
}

/**
 * ガイド画面の戻るボタン + Esc キーハンドリング
 */
export const GuideNavigation: React.FC<GuideNavigationProps> = ({ onBack }) => {
  useKeys((e) => {
    if (e.key === 'Escape') {
      onBack();
    }
  });

  return (
    <div style={{ textAlign: 'center' }}>
      <Button $color={COLORS.accent} onClick={onBack}>
        ← タイトルに戻る
        <HotkeyHint>[Esc]</HotkeyHint>
      </Button>
    </div>
  );
};
