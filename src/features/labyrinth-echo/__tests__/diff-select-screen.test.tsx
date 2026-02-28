/**
 * 迷宮の残響 - DiffSelectScreen コンポーネントテスト
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiffSelectScreen } from '../components/DiffSelectScreen';
import { DIFFICULTY, FX_DEFAULTS } from '../game-logic';
import type { MetaState, FxState } from '../game-logic';

const baseMeta: MetaState = {
  runs: 1, escapes: 0, kp: 10, unlocked: [], bestFl: 2,
  totalEvents: 10, endings: [], clearedDiffs: [], totalDeaths: 1,
  lastRun: null, title: null,
};

const baseFx: FxState = { ...FX_DEFAULTS };

const makeProps = (overrides: Partial<Parameters<typeof DiffSelectScreen>[0]> = {}) => ({
  Particles: <div data-testid="particles" />,
  fx: baseFx,
  meta: baseMeta,
  selectDiff: jest.fn(),
  setPhase: jest.fn(),
  ...overrides,
});

describe('DiffSelectScreen', () => {
  it('「難易度選択」見出しが表示される', () => {
    render(<DiffSelectScreen {...makeProps()} />);
    expect(screen.getByText('難易度選択')).toBeInTheDocument();
  });

  it('全4難易度カードが表示される', () => {
    render(<DiffSelectScreen {...makeProps()} />);
    for (const d of DIFFICULTY) {
      expect(screen.getByText(d.name)).toBeInTheDocument();
    }
  });

  it('各難易度の説明テキストが表示される', () => {
    render(<DiffSelectScreen {...makeProps()} />);
    for (const d of DIFFICULTY) {
      expect(screen.getByText(d.desc)).toBeInTheDocument();
    }
  });

  it('各難易度の獲得知見ポイントが表示される', () => {
    render(<DiffSelectScreen {...makeProps()} />);
    for (const d of DIFFICULTY) {
      expect(screen.getAllByText(`脱出 +${d.kpWin}pt`).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('クリア済み難易度に「クリア済」マークが表示される', () => {
    const meta = { ...baseMeta, clearedDiffs: ["normal"] };
    render(<DiffSelectScreen {...makeProps({ meta })} />);
    expect(screen.getByText(/クリア済/)).toBeInTheDocument();
  });

  it('難易度カードクリックで selectDiff が正しい引数で呼ばれる', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<DiffSelectScreen {...props} />);

    const normalCard = screen.getByText(DIFFICULTY[1].name).closest('button');
    expect(normalCard).not.toBeNull();
    await user.click(normalCard!);

    expect(props.selectDiff).toHaveBeenCalledTimes(1);
    expect(props.selectDiff).toHaveBeenCalledWith(
      expect.objectContaining({ id: DIFFICULTY[1].id })
    );
  });

  it('「戻る」ボタンクリックで setPhase("title") が呼ばれる', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<DiffSelectScreen {...props} />);
    await user.click(screen.getByText('戻る'));
    expect(props.setPhase).toHaveBeenCalledWith('title');
  });
});
