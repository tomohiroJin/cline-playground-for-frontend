import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UnlockShopScreen from './UnlockShopScreen';

describe('UnlockShopScreen', () => {
  const defaultProps = {
    active: true,
    selectedIndex: 0,
    pts: 500,
    ownedStyles: ['standard'],
    ownedUnlocks: [] as string[],
    onItemClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('ヘッダー「UNLOCK」が表示される', () => {
      render(<UnlockShopScreen {...defaultProps} />);
      expect(screen.getByText('UNLOCK')).toBeInTheDocument();
    });

    it('ポイント残高が表示される', () => {
      render(<UnlockShopScreen {...defaultProps} pts={500} />);
      expect(screen.getByText('PT:500')).toBeInTheDocument();
    });

    it('フッター操作説明が表示される', () => {
      render(<UnlockShopScreen {...defaultProps} />);
      expect(screen.getByText('◀ BACK ──── BUY ●')).toBeInTheDocument();
    });

    it('ショップアイテムが表示される', () => {
      render(<UnlockShopScreen {...defaultProps} />);
      expect(screen.getByText('ハイリスク信者')).toBeInTheDocument();
      expect(screen.getByText('危険強調')).toBeInTheDocument();
      expect(screen.getByText('タイミングバー+')).toBeInTheDocument();
    });

    it('アイテム説明が表示される', () => {
      render(<UnlockShopScreen {...defaultProps} />);
      expect(screen.getByText('最大×8/1レーン避難所化/死亡PT+50%')).toBeInTheDocument();
      expect(screen.getByText('障害レーンのセグ列を強調')).toBeInTheDocument();
    });
  });

  describe('所持状態', () => {
    it('未購入アイテムに価格が表示される', () => {
      render(<UnlockShopScreen {...defaultProps} />);
      // 100PT は highrisk と cautious の2つある
      const prices100 = screen.getAllByText('100PT');
      expect(prices100.length).toBe(2);
      expect(screen.getByText('50PT')).toBeInTheDocument();
    });

    it('購入済みスタイルに OWNED が表示される', () => {
      render(
        <UnlockShopScreen
          {...defaultProps}
          ownedStyles={['standard', 'highrisk']}
        />,
      );
      const ownedLabels = screen.getAllByText('OWNED');
      expect(ownedLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('購入済みアンロックに OWNED が表示される', () => {
      render(
        <UnlockShopScreen
          {...defaultProps}
          ownedUnlocks={['ui_danger', 'ui_timing']}
        />,
      );
      const ownedLabels = screen.getAllByText('OWNED');
      expect(ownedLabels.length).toBe(2);
    });
  });

  describe('操作', () => {
    it('アイテムクリックで onItemClick が呼ばれる', () => {
      const onItemClick = jest.fn();
      render(<UnlockShopScreen {...defaultProps} onItemClick={onItemClick} />);

      fireEvent.click(screen.getByText('ハイリスク信者'));
      expect(onItemClick).toHaveBeenCalledWith(0);
    });

    it('3番目のアイテムクリックで onItemClick(2) が呼ばれる', () => {
      const onItemClick = jest.fn();
      render(<UnlockShopScreen {...defaultProps} onItemClick={onItemClick} />);

      fireEvent.click(screen.getByText('瞬間判断型'));
      expect(onItemClick).toHaveBeenCalledWith(2);
    });
  });
});
