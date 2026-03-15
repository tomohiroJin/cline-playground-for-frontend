/**
 * 迷宮の残響 - EndScreens コンポーネントテスト
 *
 * GameOverScreen / VictoryScreen の表示・コールバックをテスト。
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameOverScreen, VictoryScreen } from '../components/EndScreens';
import { ENDINGS, FLOOR_META } from '../definitions';
import { DIFFICULTY } from '../game-logic';
import type { LogEntry } from '../definitions';
import { createTestPlayer, createTestMeta } from './helpers/factories';

const normalDiff = DIFFICULTY.find(d => d.id === 'normal')!;

const baseMeta = createTestMeta({
  runs: 3, escapes: 1, kp: 20, bestFl: 4,
  totalEvents: 30, endings: ["standard"], totalDeaths: 2,
});

const deadPlayer = createTestPlayer({ hp: 0, maxHp: 100, mn: 20, maxMn: 80 });
const alivePlayer = createTestPlayer({ hp: 45, maxHp: 100, mn: 30, maxMn: 80, inf: 12 });

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
    // Arrange & Act
    render(<GameOverScreen {...makeProps()} />);

    // Assert
    expect(screen.getByText('探索失敗')).toBeInTheDocument();
  });

  it('HP 0のプレイヤーを渡すと死因「体力消耗」が表示される', () => {
    // Arrange & Act
    render(<GameOverScreen {...makeProps()} />);

    // Assert
    expect(screen.getByText('体力消耗')).toBeInTheDocument();
  });

  it('MN 0のプレイヤーを渡すと死因「精神崩壊」が表示される', () => {
    // Arrange
    const mentalDead = createTestPlayer({ hp: 50, maxHp: 100, mn: 0, maxMn: 80 });

    // Act
    render(<GameOverScreen {...makeProps({ player: mentalDead })} />);

    // Assert
    expect(screen.getByText('精神崩壊')).toBeInTheDocument();
  });

  it('到達階層が表示される', () => {
    // Arrange & Act
    render(<GameOverScreen {...makeProps()} />);

    // Assert
    expect(screen.getAllByText(/第3層/).length).toBeGreaterThan(0);
  });

  it('獲得知見ポイントが表示される', () => {
    // Arrange & Act
    render(<GameOverScreen {...makeProps()} />);

    // Assert
    expect(screen.getByText(/獲得知見/)).toBeInTheDocument();
  });

  it('「再び挑む」ボタンをクリックするとstartRunが呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = makeProps();
    render(<GameOverScreen {...props} />);

    // Act
    await user.click(screen.getByText('再び挑む'));

    // Assert
    expect(props.startRun).toHaveBeenCalledTimes(1);
  });

  it('「タイトル」ボタンをクリックするとsetPhase("title")が呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = makeProps();
    render(<GameOverScreen {...props} />);

    // Act
    await user.click(screen.getByText('タイトル'));

    // Assert
    expect(props.setPhase).toHaveBeenCalledWith('title');
  });

  it('KPがある場合に知見の継承ボタンが表示される', () => {
    // Arrange & Act
    render(<GameOverScreen {...makeProps()} />);

    // Assert
    expect(screen.getByText(/知見の継承/)).toBeInTheDocument();
  });

  it('usedSecondLife=trueを渡すと二度目の命の表示がある', () => {
    // Arrange & Act
    render(<GameOverScreen {...makeProps({ usedSecondLife: true })} />);

    // Assert
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
    // Arrange & Act
    render(<VictoryScreen {...makeProps()} />);

    // Assert
    expect(screen.getAllByText(standardEnding.name).length).toBeGreaterThan(0);
  });

  it('エンディング説明が表示される', () => {
    // Arrange & Act
    render(<VictoryScreen {...makeProps()} />);

    // Assert — desc には改行が含まれるため部分一致で検索
    const firstLine = standardEnding.desc.split('\n')[0];
    // eslint-disable-next-line security/detect-non-literal-regexp
    expect(screen.getByText(new RegExp(firstLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
  });

  it('floor propが正しく渡されPageがエラーなくレンダーされる', () => {
    // Arrange & Act
    const { container } = render(<VictoryScreen {...makeProps({ floor: 5 })} />);

    // Assert
    expect(container.querySelector('.card')).toBeInTheDocument();
  });

  it('isNewEnding=trueを渡すとNEW ENDINGバッジが表示される', () => {
    // Arrange & Act
    render(<VictoryScreen {...makeProps({ isNewEnding: true })} />);

    // Assert
    expect(screen.getByText(/NEW ENDING/)).toBeInTheDocument();
  });

  it('isNewDiffClear=trueを渡すと初クリアバッジが表示される', () => {
    // Arrange & Act
    render(<VictoryScreen {...makeProps({ isNewDiffClear: true })} />);

    // Assert
    expect(screen.getByText(/初クリア/)).toBeInTheDocument();
  });

  it('獲得知見ポイントが正しく計算されて表示される', () => {
    // Arrange & Act
    render(<VictoryScreen {...makeProps()} />);

    // Assert
    const expectedKp = (normalDiff.kpWin ?? 4) + standardEnding.bonusKp;
    // eslint-disable-next-line security/detect-non-literal-regexp
    expect(screen.getByText(new RegExp(`\\+${expectedKp}pt`))).toBeInTheDocument();
  });

  it('エンディング回収グリッドが表示される', () => {
    // Arrange & Act
    render(<VictoryScreen {...makeProps()} />);

    // Assert
    expect(screen.getByText(/回収済/)).toBeInTheDocument();
  });

  it('「新たな探索へ」ボタンをクリックするとstartRunが呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = makeProps();
    render(<VictoryScreen {...props} />);

    // Act
    await user.click(screen.getByText('新たな探索へ'));

    // Assert
    expect(props.startRun).toHaveBeenCalledTimes(1);
  });

  it('「タイトル」ボタンをクリックするとsetPhase("title")が呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = makeProps();
    render(<VictoryScreen {...props} />);

    // Act
    await user.click(screen.getByText('タイトル'));

    // Assert
    expect(props.setPhase).toHaveBeenCalledWith('title');
  });

  it('残存HPと精神が生還記録に表示される', () => {
    // Arrange & Act
    render(<VictoryScreen {...makeProps()} />);

    // Assert
    expect(screen.getByText(`${alivePlayer.hp}/${alivePlayer.maxHp}`)).toBeInTheDocument();
    expect(screen.getByText(`${alivePlayer.mn}/${alivePlayer.maxMn}`)).toBeInTheDocument();
  });
});
