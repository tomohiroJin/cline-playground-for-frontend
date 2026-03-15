/**
 * 迷宮の残響 - EventResultScreen コンポーネントテスト
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventResultScreen } from '../components/EventResultScreen';
import { FLOOR_META } from '../definitions';
import type { LogEntry } from '../definitions';
import { DIFFICULTY } from '../game-logic';
import { createTestPlayer } from './helpers/factories';
import type { GameEvent } from '../events/event-utils';

const normalDiff = DIFFICULTY.find(d => d.id === 'normal')!;

const testPlayer = createTestPlayer({ hp: 60, maxHp: 100, mn: 50, maxMn: 80, inf: 25 });

const testEvent: GameEvent = {
  id: "test001", fl: [1], tp: "exploration",
  sit: "テスト用のイベントテキストです。",
  ch: [
    { t: "選択肢A", o: [{ c: "hp>30", r: "結果A-好条件", hp: -5, mn: 5, inf: 10 }, { c: "default", r: "結果A-通常", hp: -10, mn: 0, inf: 3 }] },
    { t: "選択肢B", o: [{ c: "default", r: "結果B", hp: 5, mn: -5, inf: 0 }] },
    { t: "選択肢C", o: [{ c: "mn>40", r: "結果C", hp: 0, mn: -10, inf: 15, fl: "add:呪い" }, { c: "default", r: "結果C-通常", hp: 0, mn: -15, inf: 5 }] },
  ],
};

const testLog: LogEntry[] = [
  { fl: 1, step: 1, ch: "探索した", hp: -10, mn: -5, inf: 2 },
  { fl: 1, step: 2, ch: "休憩した", hp: 5, mn: 5, inf: 0 },
  { fl: 2, step: 1, ch: "遭遇した", hp: -15, mn: 0, inf: 8, flag: "add:負傷" },
];

const makeProps = (overrides: Partial<Parameters<typeof EventResultScreen>[0]> = {}) => ({
  Particles: <div data-testid="particles" />,
  vignette: {},
  overlay: null,
  shake: false,
  player: testPlayer,
  floor: 1,
  floorMeta: FLOOR_META[1],
  floorColor: FLOOR_META[1].color,
  diff: normalDiff,
  step: 1,
  progressPct: 10,
  audioOn: false,
  toggleAudio: jest.fn(),
  showLog: false,
  setShowLog: jest.fn(),
  log: testLog,
  event: testEvent,
  phase: "event" as const,
  revealed: testEvent.sit,
  done: true,
  ready: true,
  skip: jest.fn(),
  handleChoice: jest.fn(),
  resTxt: "",
  resChg: null,
  drainInfo: null,
  proceed: jest.fn(),
  lowMental: false,
  ...overrides,
});

describe('EventResultScreen', () => {
  describe('イベント表示', () => {
    it('イベントテキストが表示される', () => {
      // Arrange & Act
      render(<EventResultScreen {...makeProps()} />);

      // Assert
      expect(screen.getByText(testEvent.sit)).toBeInTheDocument();
    });

    it('全選択肢が表示される', () => {
      // Arrange & Act
      render(<EventResultScreen {...makeProps()} />);

      // Assert
      expect(screen.getByText('選択肢A')).toBeInTheDocument();
      expect(screen.getByText('選択肢B')).toBeInTheDocument();
      expect(screen.getByText('選択肢C')).toBeInTheDocument();
    });

    it('キーボードインジケーター[N]が表示される', () => {
      // Arrange & Act
      render(<EventResultScreen {...makeProps()} />);

      // Assert
      expect(screen.getByText('[1]')).toBeInTheDocument();
      expect(screen.getByText('[2]')).toBeInTheDocument();
      expect(screen.getByText('[3]')).toBeInTheDocument();
    });

    it('選択肢をクリックするとhandleChoiceが正しいインデックスで呼ばれる', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = makeProps();
      render(<EventResultScreen {...props} />);

      // Act
      await user.click(screen.getByText('選択肢B'));

      // Assert
      expect(props.handleChoice).toHaveBeenCalledWith(1);
    });
  });

  describe('ヒント表示', () => {
    it('INF>=50のプレイヤーを渡すと詳細ヒントテキストが表示される', () => {
      // Arrange
      const highInfPlayer = createTestPlayer({ hp: 60, maxHp: 100, mn: 50, maxMn: 80, inf: 50 });

      // Act
      render(<EventResultScreen {...makeProps({ player: highInfPlayer })} />);

      // Assert
      expect(screen.getByText(/体力に余裕があるなら/)).toBeInTheDocument();
    });

    it('INF<50のプレイヤーを渡すと詳細ヒントテキストが表示されない', () => {
      // Arrange & Act
      render(<EventResultScreen {...makeProps({ player: testPlayer })} />);

      // Assert
      expect(screen.queryByText(/体力に余裕があるなら/)).not.toBeInTheDocument();
    });

    it('INF>=20のプレイヤーを渡すと条件アイコンが表示される', () => {
      // Arrange
      const midInfPlayer = createTestPlayer({ hp: 60, maxHp: 100, mn: 50, maxMn: 80, inf: 20 });

      // Act
      render(<EventResultScreen {...makeProps({ player: midInfPlayer })} />);

      // Assert — inf 20-34 → "?" アイコン
      expect(screen.getAllByTitle('条件あり').length).toBeGreaterThan(0);
    });
  });

  describe('ステータスバー', () => {
    it('HPと精神力のステータスバーが表示される', () => {
      // Arrange & Act
      render(<EventResultScreen {...makeProps()} />);

      // Assert
      expect(screen.getAllByText(/体力/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/精神力/).length).toBeGreaterThan(0);
    });

    it('情報値が表示される', () => {
      // Arrange & Act
      render(<EventResultScreen {...makeProps()} />);

      // Assert
      expect(screen.getAllByText('25').length).toBeGreaterThan(0);
    });

    it('フロア表示が正しい', () => {
      // Arrange & Act
      render(<EventResultScreen {...makeProps()} />);

      // Assert
      expect(screen.getAllByText(/第1層/).length).toBeGreaterThan(0);
    });
  });

  describe('結果画面', () => {
    it('結果テキストが表示される', () => {
      // Arrange & Act
      render(<EventResultScreen {...makeProps({
        phase: "result",
        revealed: "結果テキストです。",
        resTxt: "結果テキストです。",
        resChg: { hp: -10, mn: 5, inf: 3 },
      })} />);

      // Assert
      expect(screen.getByText('結果テキストです。')).toBeInTheDocument();
    });

    it('HP/精神/情報の変化量が表示される', () => {
      // Arrange & Act
      render(<EventResultScreen {...makeProps({
        phase: "result",
        revealed: "結果",
        resTxt: "結果",
        resChg: { hp: -10, mn: 5, inf: 3 },
        done: true,
        ready: true,
      })} />);

      // Assert
      expect(screen.getByText(/HP.*▼.*-10/)).toBeInTheDocument();
      expect(screen.getByText(/精神.*▲.*\+5/)).toBeInTheDocument();
      expect(screen.getByText(/情報.*▲.*\+3/)).toBeInTheDocument();
    });

    it('「先に進む」ボタンをクリックするとproceedが呼ばれる', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = makeProps({
        phase: "result",
        revealed: "結果",
        resTxt: "結果",
        resChg: { hp: -10, mn: 5, inf: 3 },
        done: true,
        ready: true,
      });
      render(<EventResultScreen {...props} />);

      // Act
      await user.click(screen.getByText('先に進む'));

      // Assert
      expect(props.proceed).toHaveBeenCalledTimes(1);
    });
  });

  describe('ログパネル', () => {
    it('ログが開かれている場合にフィルターボタンが表示される', () => {
      // Arrange & Act
      render(<EventResultScreen {...makeProps({ showLog: true })} />);

      // Assert
      expect(screen.getByText('全て')).toBeInTheDocument();
      expect(screen.getByText('被害')).toBeInTheDocument();
      expect(screen.getByText('回復')).toBeInTheDocument();
      expect(screen.getByText('状態変化')).toBeInTheDocument();
    });

    it('ログエントリーが表示される', () => {
      // Arrange & Act
      render(<EventResultScreen {...makeProps({ showLog: true })} />);

      // Assert
      expect(screen.getByText('探索した')).toBeInTheDocument();
      expect(screen.getByText('休憩した')).toBeInTheDocument();
    });

    it('フロアセパレーターが表示される', () => {
      // Arrange & Act
      render(<EventResultScreen {...makeProps({ showLog: true })} />);

      // Assert
      expect(screen.getByText(/── 第2層 ──/)).toBeInTheDocument();
    });

    it('被害フィルターをクリックすると被害ログのみ表示される', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<EventResultScreen {...makeProps({ showLog: true })} />);

      // Act
      await user.click(screen.getByText('被害'));

      // Assert — HP -10 と HP -15 のログが表示される
      expect(screen.getByText('探索した')).toBeInTheDocument();
      expect(screen.getByText('遭遇した')).toBeInTheDocument();
      // 回復ログは表示されない
      expect(screen.queryByText('休憩した')).not.toBeInTheDocument();
    });

    it('コピーボタンが表示される', () => {
      // Arrange & Act
      render(<EventResultScreen {...makeProps({ showLog: true })} />);

      // Assert
      expect(screen.getByText('📋')).toBeInTheDocument();
    });
  });
});
