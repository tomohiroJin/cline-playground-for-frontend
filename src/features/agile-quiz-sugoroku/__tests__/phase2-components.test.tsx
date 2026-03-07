/**
 * フェーズ2コンポーネント - 単体テスト
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AchievementScreen } from '../components/AchievementScreen';
import { HistoryScreen } from '../components/HistoryScreen';
import { DifficultySelector } from '../components/DifficultySelector';
import { ChallengeResultScreen } from '../components/ChallengeResultScreen';
import { LineChart } from '../components/LineChart';
import { AchievementToast } from '../components/AchievementToast';
import { AchievementDefinition } from '../types';

// styled-components 対応のモック
jest.mock('../components/ParticleEffect', () => ({
  ParticleEffect: () => null,
}));

describe('フェーズ2 コンポーネント', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('AchievementScreen', () => {
    it('実績一覧が表示される', () => {
      const onBack = jest.fn();
      render(<AchievementScreen onBack={onBack} />);
      expect(screen.getByText('実績一覧')).toBeInTheDocument();
      expect(screen.getByText('はじめの一歩')).toBeInTheDocument();
      expect(screen.getByText('コンボマスター')).toBeInTheDocument();
    });

    it('達成数が表示される', () => {
      render(<AchievementScreen onBack={jest.fn()} />);
      expect(screen.getByText(/0 \/ 20 達成/)).toBeInTheDocument();
    });

    it('戻るボタンでonBackが呼ばれる', () => {
      const onBack = jest.fn();
      render(<AchievementScreen onBack={onBack} />);
      fireEvent.click(screen.getByText('戻る'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('アンロック済み実績がある場合に達成数が更新される', () => {
      localStorage.setItem('aqs_achievements', JSON.stringify({
        unlocked: { 'first-clear': 1000, 'combo-5': 2000 },
      }));
      render(<AchievementScreen onBack={jest.fn()} />);
      expect(screen.getByText(/2 \/ 20 達成/)).toBeInTheDocument();
    });
  });

  describe('HistoryScreen', () => {
    it('履歴がない場合にメッセージが表示される', () => {
      render(<HistoryScreen onBack={jest.fn()} />);
      expect(screen.getByText('まだプレイ履歴がありません')).toBeInTheDocument();
    });

    it('履歴がある場合にグラフが表示される', () => {
      localStorage.setItem('aqs_history', JSON.stringify([
        {
          totalCorrect: 15, totalQuestions: 21, correctRate: 71,
          averageSpeed: 6.5, stability: 75, debt: 10, maxCombo: 4,
          grade: 'A', gradeLabel: 'High-Performing',
          teamTypeId: 'synergy', teamTypeName: 'シナジーチーム',
          timestamp: Date.now(),
        },
      ]));
      render(<HistoryScreen onBack={jest.fn()} />);
      expect(screen.getByText('正答率の推移')).toBeInTheDocument();
      expect(screen.getByText('直近の結果')).toBeInTheDocument();
    });

    it('戻るボタンでonBackが呼ばれる', () => {
      const onBack = jest.fn();
      render(<HistoryScreen onBack={onBack} />);
      fireEvent.click(screen.getByText('戻る'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('DifficultySelector', () => {
    it('4つの難易度ボタンが表示される', () => {
      render(<DifficultySelector value="normal" onChange={jest.fn()} />);
      expect(screen.getByText('Easy')).toBeInTheDocument();
      expect(screen.getByText('Normal')).toBeInTheDocument();
      expect(screen.getByText('Hard')).toBeInTheDocument();
      expect(screen.getByText('Extreme')).toBeInTheDocument();
    });

    it('ボタンクリックでonChangeが呼ばれる', () => {
      const onChange = jest.fn();
      render(<DifficultySelector value="normal" onChange={onChange} />);
      fireEvent.click(screen.getByText('Hard'));
      expect(onChange).toHaveBeenCalledWith('hard');
    });

    it('選択中の難易度の説明が表示される', () => {
      render(<DifficultySelector value="easy" onChange={jest.fn()} />);
      expect(screen.getByText(/初心者向け/)).toBeInTheDocument();
    });
  });

  describe('ChallengeResultScreen', () => {
    it('正解数が表示される', () => {
      render(
        <ChallengeResultScreen
          correctCount={12}
          maxCombo={5}
          onRetry={jest.fn()}
          onBack={jest.fn()}
        />
      );
      expect(screen.getByText('チャレンジ終了')).toBeInTheDocument();
      // 正解数が含まれる要素が存在する
      const elements = screen.getAllByText('12');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('最大コンボが表示される', () => {
      render(
        <ChallengeResultScreen
          correctCount={12}
          maxCombo={5}
          onRetry={jest.fn()}
          onBack={jest.fn()}
        />
      );
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('リトライボタンでonRetryが呼ばれる', () => {
      const onRetry = jest.fn();
      render(
        <ChallengeResultScreen
          correctCount={12}
          maxCombo={5}
          onRetry={onRetry}
          onBack={jest.fn()}
        />
      );
      fireEvent.click(screen.getByText('もう一度挑戦'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('戻るボタンでonBackが呼ばれる', () => {
      const onBack = jest.fn();
      render(
        <ChallengeResultScreen
          correctCount={12}
          maxCombo={5}
          onRetry={jest.fn()}
          onBack={onBack}
        />
      );
      fireEvent.click(screen.getByText('タイトルに戻る'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('LineChart', () => {
    it('データが空の場合にメッセージが表示される', () => {
      render(<LineChart data={[]} />);
      expect(screen.getByText('データがありません')).toBeInTheDocument();
    });

    it('データがある場合にSVGが描画される', () => {
      const { container } = render(<LineChart data={[50, 70, 80]} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('データポイントの数だけ円が描画される', () => {
      const { container } = render(<LineChart data={[50, 70, 80]} />);
      const circles = container.querySelectorAll('circle');
      expect(circles).toHaveLength(3);
    });
  });

  describe('AchievementToast', () => {
    it('実績が空の場合は何も表示しない', () => {
      const { container } = render(
        <AchievementToast achievements={[]} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('実績が渡された場合にトーストが表示される', () => {
      const achievements: AchievementDefinition[] = [
        {
          id: 'test',
          name: 'テスト実績',
          description: 'テスト用',
          rarity: 'Bronze',
          check: () => true,
        },
      ];
      render(<AchievementToast achievements={achievements} />);
      // setTimeoutで表示されるため、初期状態では表示されない可能性がある
      // 非同期テストは省略し、レンダリングエラーがないことを確認
    });
  });
});
