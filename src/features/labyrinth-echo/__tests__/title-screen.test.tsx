/**
 * 迷宮の残響 - TitleScreen コンポーネントテスト
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TitleScreen } from '../components/TitleScreen';
import type { MetaState } from '../game-logic';

/* 画像・パララックスモジュールは jest.config のモックで自動処理される */

/** テスト用メタ状態（初回プレイ） */
const freshMeta: MetaState = {
  runs: 0, escapes: 0, kp: 0, unlocked: [], bestFl: 0,
  totalEvents: 0, endings: [], clearedDiffs: [], totalDeaths: 0,
  lastRun: null, title: null,
};

/** テスト用メタ状態（複数回プレイ済み） */
const veteranMeta: MetaState = {
  runs: 5, escapes: 2, kp: 30, unlocked: ["u1", "u2"], bestFl: 4,
  totalEvents: 40, endings: ["standard"], clearedDiffs: ["normal"], totalDeaths: 3,
  lastRun: { cause: "体力消耗", floor: 3, ending: null, hp: 0, mn: 20, inf: 5 },
  title: null,
};

/** 共通 props ファクトリ */
const makeProps = (overrides: Partial<Parameters<typeof TitleScreen>[0]> = {}) => ({
  meta: freshMeta,
  Particles: <div data-testid="particles" />,
  startRun: jest.fn(),
  enableAudio: jest.fn(),
  setPhase: jest.fn(),
  eventCount: 163,
  ...overrides,
});

describe('TitleScreen', () => {
  it('タイトル「迷宮の残響」が表示される', () => {
    render(<TitleScreen {...makeProps()} />);
    expect(screen.getByText('迷宮の残響')).toBeInTheDocument();
  });

  it('イベント数とエンディング数がサブテキストに表示される', () => {
    render(<TitleScreen {...makeProps({ eventCount: 163 })} />);
    expect(screen.getByText(/163種のイベント/)).toBeInTheDocument();
  });

  describe('初回プレイ時', () => {
    it('「探索を開始する」ボタンが表示される', () => {
      render(<TitleScreen {...makeProps()} />);
      expect(screen.getByText('探索を開始する')).toBeInTheDocument();
    });

    it('知見の継承・称号・実績ボタンが表示されない', () => {
      render(<TitleScreen {...makeProps()} />);
      expect(screen.queryByText(/知見の継承/)).not.toBeInTheDocument();
      expect(screen.queryByText('称号')).not.toBeInTheDocument();
      expect(screen.queryByText('実績')).not.toBeInTheDocument();
    });

    it('設定ボタンが表示される', () => {
      render(<TitleScreen {...makeProps()} />);
      expect(screen.getByText(/設定/)).toBeInTheDocument();
    });
  });

  describe('複数回プレイ済み', () => {
    it('「N回目の探索を開始」ボタンが表示される', () => {
      render(<TitleScreen {...makeProps({ meta: veteranMeta })} />);
      expect(screen.getByText('6回目の探索を開始')).toBeInTheDocument();
    });

    it('知見の継承ボタンにKPが表示される', () => {
      render(<TitleScreen {...makeProps({ meta: veteranMeta })} />);
      expect(screen.getByText(/知見の継承/)).toBeInTheDocument();
      expect(screen.getByText(/30pt/)).toBeInTheDocument();
    });

    it('称号・実績ボタンが表示される', () => {
      render(<TitleScreen {...makeProps({ meta: veteranMeta })} />);
      expect(screen.getByText('称号')).toBeInTheDocument();
      expect(screen.getByText('実績')).toBeInTheDocument();
    });

    it('探索統計が表示される', () => {
      render(<TitleScreen {...makeProps({ meta: veteranMeta })} />);
      expect(screen.getByText(/探索 5回/)).toBeInTheDocument();
      expect(screen.getByText(/脱出 2回/)).toBeInTheDocument();
      expect(screen.getByText(/最深 第4層/)).toBeInTheDocument();
    });

    it('前回の結果が表示される', () => {
      render(<TitleScreen {...makeProps({ meta: veteranMeta })} />);
      expect(screen.getByText(/前回: 第3層にて体力消耗/)).toBeInTheDocument();
    });
  });

  describe('コールバック', () => {
    it('探索開始ボタンクリックで startRun が呼ばれる', async () => {
      const user = userEvent.setup();
      const props = makeProps();
      render(<TitleScreen {...props} />);
      await user.click(screen.getByText('探索を開始する'));
      expect(props.startRun).toHaveBeenCalledTimes(1);
    });

    it('設定ボタンクリックで setPhase("settings") が呼ばれる', async () => {
      const user = userEvent.setup();
      const props = makeProps();
      render(<TitleScreen {...props} />);
      await user.click(screen.getByText(/設定/));
      expect(props.setPhase).toHaveBeenCalledWith('settings');
    });

    it('称号ボタンクリックで setPhase("titles") が呼ばれる', async () => {
      const user = userEvent.setup();
      const props = makeProps({ meta: veteranMeta });
      render(<TitleScreen {...props} />);
      await user.click(screen.getByText('称号'));
      expect(props.setPhase).toHaveBeenCalledWith('titles');
    });

    it('実績ボタンクリックで setPhase("records") が呼ばれる', async () => {
      const user = userEvent.setup();
      const props = makeProps({ meta: veteranMeta });
      render(<TitleScreen {...props} />);
      await user.click(screen.getByText('実績'));
      expect(props.setPhase).toHaveBeenCalledWith('records');
    });
  });
});
