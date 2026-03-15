/**
 * 迷宮の残響 - TitleScreen コンポーネントテスト
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TitleScreen } from '../components/TitleScreen';
import { createTestMeta } from './helpers/factories';

/* 画像・パララックスモジュールは jest.config のモックで自動処理される */

/** テスト用メタ状態（初回プレイ） */
const freshMeta = createTestMeta();

/** テスト用メタ状態（複数回プレイ済み） */
const veteranMeta = createTestMeta({
  runs: 5, escapes: 2, kp: 30, unlocked: ["u1", "u2"], bestFl: 4,
  totalEvents: 40, endings: ["standard"], clearedDiffs: ["normal"], totalDeaths: 3,
  lastRun: { cause: "体力消耗", floor: 3, ending: null, hp: 0, mn: 20, inf: 5 },
});

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
    // Arrange & Act
    render(<TitleScreen {...makeProps()} />);

    // Assert
    expect(screen.getByText('迷宮の残響')).toBeInTheDocument();
  });

  it('イベント数がサブテキストに表示される', () => {
    // Arrange & Act
    render(<TitleScreen {...makeProps({ eventCount: 163 })} />);

    // Assert
    expect(screen.getByText(/163種のイベント/)).toBeInTheDocument();
  });

  describe('初回プレイ時', () => {
    it('「探索を開始する」ボタンが表示される', () => {
      // Arrange & Act
      render(<TitleScreen {...makeProps()} />);

      // Assert
      expect(screen.getByText('探索を開始する')).toBeInTheDocument();
    });

    it('知見の継承・称号・実績ボタンが表示されない', () => {
      // Arrange & Act
      render(<TitleScreen {...makeProps()} />);

      // Assert
      expect(screen.queryByText(/知見の継承/)).not.toBeInTheDocument();
      expect(screen.queryByText('称号')).not.toBeInTheDocument();
      expect(screen.queryByText('実績')).not.toBeInTheDocument();
    });

    it('設定ボタンが表示される', () => {
      // Arrange & Act
      render(<TitleScreen {...makeProps()} />);

      // Assert
      expect(screen.getByText(/設定/)).toBeInTheDocument();
    });
  });

  describe('複数回プレイ済み', () => {
    it('「N回目の探索を開始」ボタンが表示される', () => {
      // Arrange & Act
      render(<TitleScreen {...makeProps({ meta: veteranMeta })} />);

      // Assert
      expect(screen.getByText('6回目の探索を開始')).toBeInTheDocument();
    });

    it('知見の継承ボタンにKPが表示される', () => {
      // Arrange & Act
      render(<TitleScreen {...makeProps({ meta: veteranMeta })} />);

      // Assert
      expect(screen.getByText(/知見の継承/)).toBeInTheDocument();
      expect(screen.getByText(/30pt/)).toBeInTheDocument();
    });

    it('称号・実績ボタンが表示される', () => {
      // Arrange & Act
      render(<TitleScreen {...makeProps({ meta: veteranMeta })} />);

      // Assert
      expect(screen.getByText('称号')).toBeInTheDocument();
      expect(screen.getByText('実績')).toBeInTheDocument();
    });

    it('探索統計が表示される', () => {
      // Arrange & Act
      render(<TitleScreen {...makeProps({ meta: veteranMeta })} />);

      // Assert
      expect(screen.getByText(/探索 5回/)).toBeInTheDocument();
      expect(screen.getByText(/脱出 2回/)).toBeInTheDocument();
      expect(screen.getByText(/最深 第4層/)).toBeInTheDocument();
    });

    it('前回の結果が表示される', () => {
      // Arrange & Act
      render(<TitleScreen {...makeProps({ meta: veteranMeta })} />);

      // Assert
      expect(screen.getByText(/前回: 第3層にて体力消耗/)).toBeInTheDocument();
    });
  });

  describe('コールバック', () => {
    it('探索開始ボタンをクリックするとstartRunが呼ばれる', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = makeProps();
      render(<TitleScreen {...props} />);

      // Act
      await user.click(screen.getByText('探索を開始する'));

      // Assert
      expect(props.startRun).toHaveBeenCalledTimes(1);
    });

    it('設定ボタンをクリックするとsetPhase("settings")が呼ばれる', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = makeProps();
      render(<TitleScreen {...props} />);

      // Act
      await user.click(screen.getByText(/設定/));

      // Assert
      expect(props.setPhase).toHaveBeenCalledWith('settings');
    });

    it('称号ボタンをクリックするとsetPhase("titles")が呼ばれる', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = makeProps({ meta: veteranMeta });
      render(<TitleScreen {...props} />);

      // Act
      await user.click(screen.getByText('称号'));

      // Assert
      expect(props.setPhase).toHaveBeenCalledWith('titles');
    });

    it('実績ボタンをクリックするとsetPhase("records")が呼ばれる', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = makeProps({ meta: veteranMeta });
      render(<TitleScreen {...props} />);

      // Act
      await user.click(screen.getByText('実績'));

      // Assert
      expect(props.setPhase).toHaveBeenCalledWith('records');
    });
  });
});
