import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StyleListScreen from './StyleListScreen';

describe('StyleListScreen', () => {
  const defaultProps = {
    active: true,
    selectedIndex: 0,
    ownedStyles: ['standard'],
    equippedStyles: ['standard'],
    maxSlots: 1,
    onItemClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('ヘッダー「PLAY STYLE」が表示される', () => {
      render(<StyleListScreen {...defaultProps} />);
      expect(screen.getByText('PLAY STYLE')).toBeInTheDocument();
    });

    it('STANDARD スタイルが表示される', () => {
      render(<StyleListScreen {...defaultProps} />);
      expect(screen.getByText('STANDARD')).toBeInTheDocument();
    });

    it('全スタイルが表示される', () => {
      render(<StyleListScreen {...defaultProps} />);
      expect(screen.getByText('STANDARD')).toBeInTheDocument();
      expect(screen.getByText('ハイリスク信者')).toBeInTheDocument();
      expect(screen.getByText('慎重派')).toBeInTheDocument();
      expect(screen.getByText('瞬間判断型')).toBeInTheDocument();
      expect(screen.getByText('一発逆転型')).toBeInTheDocument();
    });

    it('バフ説明が表示される', () => {
      render(<StyleListScreen {...defaultProps} />);
      expect(screen.getByText('+バランス型')).toBeInTheDocument();
    });

    it('デバフ説明が表示される（ハイリスク信者の場合）', () => {
      render(<StyleListScreen {...defaultProps} ownedStyles={['standard', 'highrisk']} />);
      expect(screen.getByText('-1レーン避難所化')).toBeInTheDocument();
    });
  });

  describe('所持・装備状態', () => {
    it('装備中のスタイルに EQUIP タグが表示される', () => {
      render(<StyleListScreen {...defaultProps} />);
      expect(screen.getByText('EQUIP')).toBeInTheDocument();
    });

    it('未所持スタイルに LOCKED タグが表示される', () => {
      render(<StyleListScreen {...defaultProps} ownedStyles={['standard']} />);
      const lockedTags = screen.getAllByText('LOCKED');
      // standard 以外は LOCKED
      expect(lockedTags.length).toBe(4);
    });

    it('所持済みスタイルには LOCKED タグが非表示', () => {
      render(
        <StyleListScreen
          {...defaultProps}
          ownedStyles={['standard', 'highrisk']}
          equippedStyles={['standard']}
        />,
      );
      const lockedTags = screen.getAllByText('LOCKED');
      // highrisk は所持済みなので LOCKED が減る
      expect(lockedTags.length).toBe(3);
    });
  });

  describe('フッター', () => {
    it('スロット1の場合のフッターが表示される', () => {
      render(<StyleListScreen {...defaultProps} maxSlots={1} />);
      expect(screen.getByText(/1枠.*UNLOCKで拡張/)).toBeInTheDocument();
    });

    it('スロット2以上の場合にスロット情報が表示される', () => {
      render(
        <StyleListScreen
          {...defaultProps}
          maxSlots={2}
          equippedStyles={['standard']}
        />,
      );
      expect(screen.getByText(/SLOT 1\/2/)).toBeInTheDocument();
    });
  });

  describe('操作', () => {
    it('スタイル項目クリックで onItemClick が呼ばれる', () => {
      const onItemClick = jest.fn();
      render(<StyleListScreen {...defaultProps} onItemClick={onItemClick} />);

      fireEvent.click(screen.getByText('STANDARD'));
      expect(onItemClick).toHaveBeenCalledWith(0);
    });

    it('2番目のスタイルクリックで onItemClick(1) が呼ばれる', () => {
      const onItemClick = jest.fn();
      render(<StyleListScreen {...defaultProps} onItemClick={onItemClick} />);

      fireEvent.click(screen.getByText('ハイリスク信者'));
      expect(onItemClick).toHaveBeenCalledWith(1);
    });
  });
});
