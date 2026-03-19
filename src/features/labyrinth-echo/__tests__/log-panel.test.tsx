/**
 * 迷宮の残響 - LogPanel コンポーネントテスト
 *
 * EventResultScreen から分割された LogPanel の独立テスト。
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogPanel } from '../components/LogPanel';
import type { LogEntry } from '../domain/models/game-state';

const testLog: LogEntry[] = [
  { fl: 1, step: 1, ch: "探索した", hp: -10, mn: -5, inf: 2 },
  { fl: 1, step: 2, ch: "休憩した", hp: 5, mn: 5, inf: 0 },
  { fl: 2, step: 1, ch: "遭遇した", hp: -15, mn: 0, inf: 8, flag: "add:負傷" },
];

describe('LogPanel', () => {
  describe('フィルター表示', () => {
    it('全フィルターボタンが表示される', () => {
      // Arrange & Act
      render(<LogPanel log={testLog} />);

      // Assert
      expect(screen.getByText('全て')).toBeInTheDocument();
      expect(screen.getByText('被害')).toBeInTheDocument();
      expect(screen.getByText('回復')).toBeInTheDocument();
      expect(screen.getByText('状態変化')).toBeInTheDocument();
    });
  });

  describe('ログ表示', () => {
    it('ログエントリーが表示される', () => {
      // Arrange & Act
      render(<LogPanel log={testLog} />);

      // Assert
      expect(screen.getByText('探索した')).toBeInTheDocument();
      expect(screen.getByText('休憩した')).toBeInTheDocument();
      expect(screen.getByText('遭遇した')).toBeInTheDocument();
    });

    it('フロアセパレーターが表示される', () => {
      // Arrange & Act
      render(<LogPanel log={testLog} />);

      // Assert
      expect(screen.getByText(/── 第2層 ──/)).toBeInTheDocument();
    });

    it('空のログの場合「ログなし」が表示される', () => {
      // Arrange & Act
      render(<LogPanel log={[]} />);

      // Assert
      expect(screen.getByText('ログなし')).toBeInTheDocument();
    });
  });

  describe('フィルタリング', () => {
    it('被害フィルターをクリックすると被害ログのみ表示される', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LogPanel log={testLog} />);

      // Act
      await user.click(screen.getByText('被害'));

      // Assert
      expect(screen.getByText('探索した')).toBeInTheDocument();
      expect(screen.getByText('遭遇した')).toBeInTheDocument();
      expect(screen.queryByText('休憩した')).not.toBeInTheDocument();
    });

    it('回復フィルターをクリックすると回復ログのみ表示される', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LogPanel log={testLog} />);

      // Act
      await user.click(screen.getByText('回復'));

      // Assert
      expect(screen.getByText('休憩した')).toBeInTheDocument();
      expect(screen.queryByText('探索した')).not.toBeInTheDocument();
    });

    it('状態変化フィルターをクリックするとフラグ付きログのみ表示される', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LogPanel log={testLog} />);

      // Act
      await user.click(screen.getByText('状態変化'));

      // Assert
      expect(screen.getByText('遭遇した')).toBeInTheDocument();
      expect(screen.queryByText('探索した')).not.toBeInTheDocument();
      expect(screen.queryByText('休憩した')).not.toBeInTheDocument();
    });
  });

  describe('コピー機能', () => {
    it('コピーボタンが表示される', () => {
      // Arrange & Act
      render(<LogPanel log={testLog} />);

      // Assert
      expect(screen.getByText('📋')).toBeInTheDocument();
    });
  });
});
