/**
 * 迷宮の残響 - EndScreens コンポーネントテスト
 *
 * GameOverScreen / VictoryScreen の表示・コールバックをテスト。
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameOverScreen, VictoryScreen } from '../components/EndScreens';
import { ENDINGS, FLOOR_META } from '../definitions';
import type { MetaState, Player, DifficultyDef } from '../game-logic';
import { DIFFICULTY } from '../game-logic';
import type { LogEntry } from '../definitions';

/* share モジュールのモック（canvas 操作回避） */
jest.mock('../share', () => ({
  shareCard: jest.fn(),
  ShareData: {},
}));

const normalDiff: DifficultyDef = DIFFICULTY.find(d => d.id === 'normal')!;

const baseMeta: MetaState = {
  runs: 3, escapes: 1, kp: 20, unlocked: [], bestFl: 4,
  totalEvents: 30, endings: ["standard"], clearedDiffs: [], totalDeaths: 2,
  lastRun: null, title: null,
};

const deadPlayer: Player = {
  hp: 0, maxHp: 100, mn: 20, maxMn: 80, inf: 5, st: [],
};

const alivePlayer: Player = {
  hp: 45, maxHp: 100, mn: 30, maxMn: 80, inf: 12, st: [],
};

const sampleLog: LogEntry[] = [
  { fl: 1, step: 1, ch: "探索した", hp: -10, mn: -5, inf: 2 },
  { fl: 1, step: 2, ch: "休憩した", hp: 5, mn: 5, inf: 0 },
];

// ── GameOverScreen ──────────────────────────────────────

describe('GameOverScreen', () => {
  const makeProps = (overrides: Partial<Parameters<typeof GameOverScreen>[0]> = {}) => ({
    Particles: <div data-testid="particles" />,
    player: deadPlayer,
    meta: baseMeta,
    diff: normalDiff,
    floor: 3,
    floorMeta: FLOOR_META[3],
    floorColor: FLOOR_META[3].color,
    progressPct: 55,
    log: sampleLog,
    usedSecondLife: false,
    startRun: jest.fn(),
    setPhase: jest.fn(),
    ...overrides,
  });

  it('「探索失敗」が表示される', () => {
    render(<GameOverScreen {...makeProps()} />);
    expect(screen.getByText('探索失敗')).toBeInTheDocument();
  });

  it('死因が表示される（HP 0 → 体力消耗）', () => {
    render(<GameOverScreen {...makeProps()} />);
    expect(screen.getByText('体力消耗')).toBeInTheDocument();
  });

  it('死因が表示される（MN 0 → 精神崩壊）', () => {
    const mentalDead: Player = { hp: 50, maxHp: 100, mn: 0, maxMn: 80, inf: 5, st: [] };
    render(<GameOverScreen {...makeProps({ player: mentalDead })} />);
    expect(screen.getByText('精神崩壊')).toBeInTheDocument();
  });

  it('到達階層が表示される', () => {
    render(<GameOverScreen {...makeProps()} />);
    expect(screen.getAllByText(/第3層/).length).toBeGreaterThan(0);
  });

  it('獲得知見ポイントが表示される', () => {
    render(<GameOverScreen {...makeProps()} />);
    expect(screen.getByText(/獲得知見/)).toBeInTheDocument();
  });

  it('「再び挑む」ボタンクリックで startRun が呼ばれる', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<GameOverScreen {...props} />);
    await user.click(screen.getByText('再び挑む'));
    expect(props.startRun).toHaveBeenCalledTimes(1);
  });

  it('「タイトル」ボタンクリックで setPhase("title") が呼ばれる', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<GameOverScreen {...props} />);
    await user.click(screen.getByText('タイトル'));
    expect(props.setPhase).toHaveBeenCalledWith('title');
  });

  it('KP がある場合に知見の継承ボタンが表示される', () => {
    render(<GameOverScreen {...makeProps()} />);
    expect(screen.getByText(/知見の継承/)).toBeInTheDocument();
  });

  it('二度目の命が使用済みの場合に表示される', () => {
    render(<GameOverScreen {...makeProps({ usedSecondLife: true })} />);
    expect(screen.getByText(/二度目の命/)).toBeInTheDocument();
  });
});

// ── VictoryScreen ──────────────────────────────────────

describe('VictoryScreen', () => {
  const standardEnding = ENDINGS.find(e => e.id === 'standard') ?? ENDINGS[ENDINGS.length - 1];

  const makeProps = (overrides: Partial<Parameters<typeof VictoryScreen>[0]> = {}) => ({
    Particles: <div data-testid="particles" />,
    ending: standardEnding,
    isNewEnding: false,
    isNewDiffClear: false,
    diff: normalDiff,
    player: alivePlayer,
    usedSecondLife: false,
    log: sampleLog,
    meta: baseMeta,
    floor: 5,
    startRun: jest.fn(),
    setPhase: jest.fn(),
    ...overrides,
  });

  it('エンディング名が表示される', () => {
    render(<VictoryScreen {...makeProps()} />);
    // エンディング名はタイトルと記録パネルに複数表示される
    expect(screen.getAllByText(standardEnding.name).length).toBeGreaterThan(0);
  });

  it('エンディング説明が表示される', () => {
    render(<VictoryScreen {...makeProps()} />);
    // desc には改行が含まれるため部分一致で検索
    const firstLine = standardEnding.desc.split('\n')[0];
    expect(screen.getByText(new RegExp(firstLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
  });

  it('floor prop が正しく渡され Page に使用される', () => {
    const { container } = render(<VictoryScreen {...makeProps({ floor: 5 })} />);
    /* Page コンポーネントが floor をパララックスに渡してエラーなくレンダーされる */
    expect(container.querySelector('.card')).toBeInTheDocument();
  });

  it('新エンディング時に NEW ENDING バッジが表示される', () => {
    render(<VictoryScreen {...makeProps({ isNewEnding: true })} />);
    expect(screen.getByText(/NEW ENDING/)).toBeInTheDocument();
  });

  it('新難易度クリア時にバッジが表示される', () => {
    render(<VictoryScreen {...makeProps({ isNewDiffClear: true })} />);
    expect(screen.getByText(/初クリア/)).toBeInTheDocument();
  });

  it('獲得知見ポイントが正しく計算される', () => {
    render(<VictoryScreen {...makeProps()} />);
    const expectedKp = (normalDiff.kpWin ?? 4) + standardEnding.bonusKp;
    expect(screen.getByText(new RegExp(`\\+${expectedKp}pt`))).toBeInTheDocument();
  });

  it('エンディング回収グリッドが表示される', () => {
    render(<VictoryScreen {...makeProps()} />);
    expect(screen.getByText(/回収済/)).toBeInTheDocument();
  });

  it('「新たな探索へ」ボタンクリックで startRun が呼ばれる', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<VictoryScreen {...props} />);
    await user.click(screen.getByText('新たな探索へ'));
    expect(props.startRun).toHaveBeenCalledTimes(1);
  });

  it('「タイトル」ボタンクリックで setPhase("title") が呼ばれる', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<VictoryScreen {...props} />);
    await user.click(screen.getByText('タイトル'));
    expect(props.setPhase).toHaveBeenCalledWith('title');
  });

  it('残存HPと精神が生還記録に表示される', () => {
    render(<VictoryScreen {...makeProps()} />);
    expect(screen.getByText(`${alivePlayer.hp}/${alivePlayer.maxHp}`)).toBeInTheDocument();
    expect(screen.getByText(`${alivePlayer.mn}/${alivePlayer.maxMn}`)).toBeInTheDocument();
  });
});
