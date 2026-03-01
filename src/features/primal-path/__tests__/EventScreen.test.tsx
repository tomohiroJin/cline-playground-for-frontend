/**
 * 原始進化録 - PRIMAL PATH - イベント画面コンポーネントテスト（FB-P3-3）
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventScreen } from '../components/EventScreen';
import type { RandomEventDef, RunState, EventChoice, SfxType } from '../types';
import { makeRun } from './test-helpers';

/* ===== テスト用データ ===== */

const mockEvent: RandomEventDef = {
  id: 'bone_merchant' as const,
  name: '骨の商人',
  description: '奇妙な商人が骨と引き換えに力を分けてくれるという。',
  situationText: '取引に応じるか？',
  choices: [
    {
      label: '骨30で取引する',
      description: '骨を消費してATK+8を得る',
      effect: { type: 'stat_change', stat: 'atk', value: 8 },
      riskLevel: 'safe',
      cost: { type: 'bone', amount: 30 },
    },
    {
      label: '立ち去る',
      description: '何も起こらない',
      effect: { type: 'nothing' },
      riskLevel: 'safe',
    },
  ],
};

/* ===== テスト ===== */

describe('EventScreen', () => {
  const mockOnChoose = jest.fn();
  const mockPlaySfx = jest.fn();

  beforeEach(() => {
    mockOnChoose.mockClear();
    mockPlaySfx.mockClear();
  });

  describe('基本レンダリング', () => {
    it('イベント名・説明・状況テキストが表示される', () => {
      // Arrange
      const run = makeRun();

      // Act
      render(
        <EventScreen event={mockEvent} run={run} onChoose={mockOnChoose} playSfx={mockPlaySfx} />,
      );

      // Assert
      expect(screen.getByText('骨の商人')).toBeInTheDocument();
      expect(screen.getByText(mockEvent.description)).toBeInTheDocument();
      expect(screen.getByText('取引に応じるか？')).toBeInTheDocument();
    });

    it('選択肢ボタンが全て表示される', () => {
      // Arrange
      const run = makeRun();

      // Act
      render(
        <EventScreen event={mockEvent} run={run} onChoose={mockOnChoose} playSfx={mockPlaySfx} />,
      );

      // Assert
      expect(screen.getByText(/骨30で取引する/)).toBeInTheDocument();
      expect(screen.getByText(/立ち去る/)).toBeInTheDocument();
    });
  });

  describe('Canvas スプライト表示', () => {
    it('Canvas 要素が存在する', () => {
      // Arrange
      const run = makeRun();

      // Act
      const { container } = render(
        <EventScreen event={mockEvent} run={run} onChoose={mockOnChoose} playSfx={mockPlaySfx} />,
      );

      // Assert
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('エフェクトヒント表示', () => {
    it('選択肢にエフェクトヒントアイコンが表示される', () => {
      // Arrange: stat_change の選択肢は 📈、nothing は …
      const run = makeRun();

      // Act
      render(
        <EventScreen event={mockEvent} run={run} onChoose={mockOnChoose} playSfx={mockPlaySfx} />,
      );

      // Assert: stat_change の 📈 が含まれる
      expect(screen.getByText('📈')).toBeInTheDocument();
    });
  });

  describe('選択肢クリック操作', () => {
    it('選択肢をクリックすると onChoose が呼ばれる', () => {
      // Arrange
      const run = makeRun();

      // Act
      render(
        <EventScreen event={mockEvent} run={run} onChoose={mockOnChoose} playSfx={mockPlaySfx} />,
      );
      fireEvent.click(screen.getByText(/立ち去る/).closest('button')!);

      // Assert
      expect(mockOnChoose).toHaveBeenCalledTimes(1);
      expect(mockPlaySfx).toHaveBeenCalledWith('click');
    });
  });

  describe('リスクレベル表示', () => {
    it('safe の選択肢に🟢アイコンが表示される', () => {
      // Arrange: mockEvent の選択肢は両方 riskLevel: 'safe'
      const run = makeRun();

      // Act
      render(
        <EventScreen event={mockEvent} run={run} onChoose={mockOnChoose} playSfx={mockPlaySfx} />,
      );

      // Assert: 🟢 が safe の選択肢に表示される
      const safeIcons = screen.getAllByText(/🟢/);
      expect(safeIcons.length).toBeGreaterThanOrEqual(1);
    });

    it('dangerous の選択肢に🔴アイコンが表示される', () => {
      // Arrange: dangerous な選択肢を含むイベント
      const dangerousEvent: RandomEventDef = {
        id: 'beast_den' as const,
        name: '獣の巣',
        description: '巣穴を見つけた。',
        situationText: '突入するか？',
        choices: [
          {
            label: '巣に突入する',
            description: '高リスク高リターン',
            effect: { type: 'stat_change', stat: 'atk', value: 15 },
            riskLevel: 'dangerous',
          },
          {
            label: '立ち去る',
            description: '何も起こらない',
            effect: { type: 'nothing' },
            riskLevel: 'safe',
          },
        ],
      };
      const run = makeRun();

      // Act
      render(
        <EventScreen event={dangerousEvent} run={run} onChoose={mockOnChoose} playSfx={mockPlaySfx} />,
      );

      // Assert
      expect(screen.getByText(/🔴/)).toBeInTheDocument();
    });
  });

  describe('コスト制約', () => {
    it('骨コスト不足時にボタンが disabled になる', () => {
      // Arrange: 骨が10しかない（コスト30に不足）
      const run = makeRun({ bE: 10 });

      // Act
      render(
        <EventScreen event={mockEvent} run={run} onChoose={mockOnChoose} playSfx={mockPlaySfx} />,
      );

      // Assert: 「骨30で取引する」ボタンが disabled
      const tradeBtn = screen.getByText(/骨30で取引する/).closest('button')!;
      expect(tradeBtn).toBeDisabled();
      // 「不足」テキストが表示される
      expect(screen.getByText(/不足/)).toBeInTheDocument();
    });
  });
});
