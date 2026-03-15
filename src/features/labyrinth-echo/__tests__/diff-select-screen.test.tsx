/**
 * 迷宮の残響 - DiffSelectScreen コンポーネントテスト
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiffSelectScreen } from '../components/DiffSelectScreen';
import { DIFFICULTY } from '../game-logic';
import { createTestMeta, createTestFx } from './helpers/factories';

const baseMeta = createTestMeta({ runs: 1, kp: 10, bestFl: 2, totalEvents: 10, totalDeaths: 1 });
const baseFx = createTestFx();

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
    // Arrange & Act
    render(<DiffSelectScreen {...makeProps()} />);

    // Assert
    expect(screen.getByText('難易度選択')).toBeInTheDocument();
  });

  it('全4難易度カードが表示される', () => {
    // Arrange & Act
    render(<DiffSelectScreen {...makeProps()} />);

    // Assert
    for (const d of DIFFICULTY) {
      expect(screen.getByText(d.name)).toBeInTheDocument();
    }
  });

  it('各難易度の説明テキストが表示される', () => {
    // Arrange & Act
    render(<DiffSelectScreen {...makeProps()} />);

    // Assert
    for (const d of DIFFICULTY) {
      expect(screen.getByText(d.desc)).toBeInTheDocument();
    }
  });

  it('各難易度の獲得知見ポイントが表示される', () => {
    // Arrange & Act
    render(<DiffSelectScreen {...makeProps()} />);

    // Assert
    for (const d of DIFFICULTY) {
      expect(screen.getAllByText(`脱出 +${d.kpWin}pt`).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('クリア済み難易度がある場合に「クリア済」マークが表示される', () => {
    // Arrange
    const meta = createTestMeta({ runs: 1, clearedDiffs: ["normal"] });

    // Act
    render(<DiffSelectScreen {...makeProps({ meta })} />);

    // Assert
    expect(screen.getByText(/クリア済/)).toBeInTheDocument();
  });

  it('難易度カードをクリックするとselectDiffが正しい引数で呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = makeProps();
    render(<DiffSelectScreen {...props} />);

    // Act
    const normalCard = screen.getByText(DIFFICULTY[1].name).closest('button');
    expect(normalCard).not.toBeNull();
    await user.click(normalCard!);

    // Assert
    expect(props.selectDiff).toHaveBeenCalledTimes(1);
    expect(props.selectDiff).toHaveBeenCalledWith(
      expect.objectContaining({ id: DIFFICULTY[1].id })
    );
  });

  it('「戻る」ボタンをクリックするとsetPhase("title")が呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = makeProps();
    render(<DiffSelectScreen {...props} />);

    // Act
    await user.click(screen.getByText('戻る'));

    // Assert
    expect(props.setPhase).toHaveBeenCalledWith('title');
  });
});
