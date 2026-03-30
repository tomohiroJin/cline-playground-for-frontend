import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

const defaultProps = {
  isOpen: true,
  title: 'ゲームを終了しますか？',
  message: 'チーム設定がリセットされます',
  confirmLabel: 'メニューに戻る',
  cancelLabel: '続ける',
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
};

describe('ConfirmDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示・非表示', () => {
    it('isOpen=true でダイアログが表示される', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByText('ゲームを終了しますか？')).toBeTruthy();
      expect(screen.getByText('チーム設定がリセットされます')).toBeTruthy();
    });

    it('isOpen=false でダイアログが表示されない', () => {
      render(<ConfirmDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('ゲームを終了しますか？')).toBeNull();
    });

    it('両方のボタンが表示される', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByText('続ける')).toBeTruthy();
      expect(screen.getByText('メニューに戻る')).toBeTruthy();
    });
  });

  describe('ボタンクリック', () => {
    it('「続ける」クリックで onCancel が呼ばれる', () => {
      render(<ConfirmDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('続ける'));
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it('「メニューに戻る」クリックで onConfirm が呼ばれる', () => {
      render(<ConfirmDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('メニューに戻る'));
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('キーボード操作（MF-1）', () => {
    it('Escape キーで onCancel が呼ばれる', () => {
      render(<ConfirmDialog {...defaultProps} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it('初期フォーカスが「続ける」ボタンにある', () => {
      render(<ConfirmDialog {...defaultProps} />);
      const cancelButton = screen.getByText('続ける');
      expect(document.activeElement).toBe(cancelButton);
    });
  });

  describe('アクセシビリティ', () => {
    it('ボタンのタッチターゲットが 44px 以上', () => {
      render(<ConfirmDialog {...defaultProps} />);
      const cancelButton = screen.getByText('続ける');
      expect(cancelButton.style.minHeight).toBe('44px');
    });
  });
});
