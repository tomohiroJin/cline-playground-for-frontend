import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PerkSelectScreen from './PerkSelectScreen';
import type { PerkDef } from '../types';

// テスト用パーク定義
const testPerks: PerkDef[] = [
  { id: 'shield', nm: '緊急防壁', ds: 'シールド+1', tp: 'buff', ic: '◆', fn: () => {} },
  { id: 'gamble', nm: 'ギャンブラー', ds: 'スコア×1.8 予告-1段', tp: 'risk', ic: '!', fn: () => {} },
  { id: 'slow', nm: '時の砂', ds: '速度-15%', tp: 'buff', ic: '◷', fn: () => {} },
];

describe('PerkSelectScreen', () => {
  const defaultProps = {
    choices: testPerks,
    selectedIndex: 0,
    perks: [] as PerkDef[],
    onPerkClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('タイトル「PERK SELECT」が表示される', () => {
      render(<PerkSelectScreen {...defaultProps} />);
      expect(screen.getByText('PERK SELECT')).toBeInTheDocument();
    });

    it('操作説明が表示される', () => {
      render(<PerkSelectScreen {...defaultProps} />);
      expect(screen.getByText('▲▼ SELECT ─ ● EQUIP')).toBeInTheDocument();
    });

    it('パーク選択肢が全て表示される', () => {
      render(<PerkSelectScreen {...defaultProps} />);
      expect(screen.getByText(/緊急防壁/)).toBeInTheDocument();
      expect(screen.getByText(/ギャンブラー/)).toBeInTheDocument();
      expect(screen.getByText(/時の砂/)).toBeInTheDocument();
    });

    it('パークの説明が表示される', () => {
      render(<PerkSelectScreen {...defaultProps} />);
      expect(screen.getByText('シールド+1')).toBeInTheDocument();
      expect(screen.getByText('スコア×1.8 予告-1段')).toBeInTheDocument();
      expect(screen.getByText('速度-15%')).toBeInTheDocument();
    });

    it('BUFFパークに「✦ BUFF」タイプが表示される', () => {
      render(<PerkSelectScreen {...defaultProps} />);
      const buffLabels = screen.getAllByText('✦ BUFF');
      expect(buffLabels.length).toBe(2);
    });

    it('RISKパークに「⚠ RISK」タイプが表示される', () => {
      render(<PerkSelectScreen {...defaultProps} />);
      expect(screen.getByText('⚠ RISK')).toBeInTheDocument();
    });

    it('フッター「パークは累積する」が表示される', () => {
      render(<PerkSelectScreen {...defaultProps} />);
      expect(screen.getByText('パークは累積する')).toBeInTheDocument();
    });
  });

  describe('ビルドサマリー', () => {
    it('パークが空の場合「BUILD: なし」が表示される', () => {
      render(<PerkSelectScreen {...defaultProps} perks={[]} />);
      expect(screen.getByText('BUILD: なし')).toBeInTheDocument();
    });

    it('パークがある場合にアイコン列が表示される', () => {
      const equippedPerks = [testPerks[0], testPerks[2]];
      render(<PerkSelectScreen {...defaultProps} perks={equippedPerks} />);
      expect(screen.getByText('BUILD: ◆◷')).toBeInTheDocument();
    });
  });

  describe('操作', () => {
    it('パーク項目クリックで onPerkClick が呼ばれる', () => {
      const onPerkClick = jest.fn();
      render(<PerkSelectScreen {...defaultProps} onPerkClick={onPerkClick} />);

      // 2番目のパーク（ギャンブラー）をクリック
      fireEvent.click(screen.getByText('スコア×1.8 予告-1段'));
      expect(onPerkClick).toHaveBeenCalledWith(1);
    });

    it('最初のパーク項目クリックで onPerkClick(0) が呼ばれる', () => {
      const onPerkClick = jest.fn();
      render(<PerkSelectScreen {...defaultProps} onPerkClick={onPerkClick} />);

      fireEvent.click(screen.getByText('シールド+1'));
      expect(onPerkClick).toHaveBeenCalledWith(0);
    });
  });
});
