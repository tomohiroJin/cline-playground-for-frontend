import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

  describe('オーバーレイクリック', () => {
    it('オーバーレイクリックで onCancel が呼ばれる', () => {
      render(<ConfirmDialog {...defaultProps} />);
      fireEvent.click(screen.getByTestId('confirm-dialog-overlay'));
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it('ダイアログ本体クリックでは onCancel が呼ばれない', () => {
      render(<ConfirmDialog {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);
      expect(defaultProps.onCancel).not.toHaveBeenCalled();
    });
  });

  describe('アクセシビリティ', () => {
    it('ボタンのタッチターゲットが 44px 以上', () => {
      render(<ConfirmDialog {...defaultProps} />);
      const cancelButton = screen.getByText('続ける');
      expect(cancelButton.style.minHeight).toBe('44px');
    });
  });

  describe('アニメーション（S8-2）', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('isOpen=false → true でオーバーレイが表示される', () => {
      const { rerender } = render(<ConfirmDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('confirm-dialog-overlay')).toBeNull();
      rerender(<ConfirmDialog {...defaultProps} isOpen={true} />);
      expect(screen.getByTestId('confirm-dialog-overlay')).toBeTruthy();
    });

    it('isOpen=true → false で closing 後に DOM から除去される', () => {
      const { rerender } = render(<ConfirmDialog {...defaultProps} isOpen={true} />);
      expect(screen.getByTestId('confirm-dialog-overlay')).toBeTruthy();
      rerender(<ConfirmDialog {...defaultProps} isOpen={false} />);
      // closing フェーズ中はまだ DOM に存在
      expect(screen.getByTestId('confirm-dialog-overlay')).toBeTruthy();
      // フォールバック timer 後に除去
      act(() => { jest.advanceTimersByTime(300); });
      expect(screen.queryByTestId('confirm-dialog-overlay')).toBeNull();
    });

    it('closing フェーズ中のオーバーレイクリックが onCancel を呼ばない', () => {
      const onCancel = jest.fn();
      const { rerender } = render(<ConfirmDialog {...defaultProps} isOpen={true} onCancel={onCancel} />);
      rerender(<ConfirmDialog {...defaultProps} isOpen={false} onCancel={onCancel} />);
      // closing 中にクリック
      fireEvent.click(screen.getByTestId('confirm-dialog-overlay'));
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('フォールバック timer で closing → closed が確実に発生する', () => {
      const { rerender } = render(<ConfirmDialog {...defaultProps} isOpen={true} />);
      rerender(<ConfirmDialog {...defaultProps} isOpen={false} />);
      // onTransitionEnd を発火させずに timer のみで除去
      act(() => { jest.advanceTimersByTime(300); });
      expect(screen.queryByTestId('confirm-dialog-overlay')).toBeNull();
    });
  });

  describe('フォーカストラップ（S8-2）', () => {
    it('Tab キーでフォーカスがダイアログ内ボタン間をループする', () => {
      render(<ConfirmDialog {...defaultProps} />);
      const cancelButton = screen.getByText('続ける');
      const confirmButton = screen.getByText('メニューに戻る');
      // 初期フォーカスは cancelButton
      expect(document.activeElement).toBe(cancelButton);
      // Tab → confirmButton へ
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(document.activeElement).toBe(confirmButton);
      // Tab → cancelButton へ（ループ）
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(document.activeElement).toBe(cancelButton);
    });

    it('Shift+Tab でフォーカスが逆方向にループする', () => {
      render(<ConfirmDialog {...defaultProps} />);
      const cancelButton = screen.getByText('続ける');
      const confirmButton = screen.getByText('メニューに戻る');
      // 初期フォーカスは cancelButton
      expect(document.activeElement).toBe(cancelButton);
      // Shift+Tab → confirmButton へ（逆ループ）
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(confirmButton);
    });
  });
});
