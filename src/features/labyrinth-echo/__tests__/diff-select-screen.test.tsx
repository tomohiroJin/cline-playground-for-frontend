/**
 * 迷宮の残響 - DiffSelectScreen コンポーネントテスト
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiffSelectScreen } from '../components/DiffSelectScreen';
import { DIFFICULTY } from '../domain/constants/difficulty-defs';
import { createTestMeta, createTestFx } from './helpers/factories';
import { createMetaState } from '../domain/models/meta-state';
import { ECHO_FRAGMENTS } from '../domain/constants/echo-fragment-defs';

const allFrags = ECHO_FRAGMENTS.map(f => f.id);

const baseMeta = createTestMeta({ runs: 1, kp: 10, bestFloor: 2, totalEvents: 10, totalDeaths: 1 });
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
      expect(screen.getByText(d.description)).toBeInTheDocument();
    }
  });

  it('各難易度の獲得知見ポイントが表示される', () => {
    // Arrange & Act
    render(<DiffSelectScreen {...makeProps()} />);

    // Assert
    for (const d of DIFFICULTY) {
      expect(screen.getAllByText(`脱出 +${d.rewards.kpOnWin}pt`).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('クリア済み難易度がある場合に「クリア済」マークが表示される', () => {
    // Arrange
    const meta = createTestMeta({ runs: 1, clearedDifficulties: ["normal"] });

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
      expect.objectContaining({ id: DIFFICULTY[1].id }),
      0,
      null,
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

const basePressureProps = (over = {}) => ({
  Particles: null,
  fx: { hpBonus: 0, mentalBonus: 0, infoBonus: 0 } as never,
  meta: createMetaState({ echoDepth: 3 }),
  selectDiff: jest.fn(),
  setPhase: () => undefined,
  ...over,
});

describe('DiffSelectScreen 残響圧', () => {
  it('echoDepth>0 のとき残響圧セレクタが表示される', () => {
    render(<DiffSelectScreen {...basePressureProps()} />);
    expect(screen.getByText(/残響圧/)).toBeInTheDocument();
  });

  it('echoDepth=0 のときは圧セレクタを出さない', () => {
    render(<DiffSelectScreen {...basePressureProps({ meta: createMetaState({ echoDepth: 0 }) })} />);
    expect(screen.queryByText(/残響圧/)).toBeNull();
  });

  it('難易度選択時に現在の圧を添えて selectDiff を呼ぶ', () => {
    const selectDiff = jest.fn();
    render(<DiffSelectScreen {...basePressureProps({ selectDiff })} />);
    // 既定圧0で最初の難易度カードを選択
    fireEvent.click(screen.getByText('探索者').closest('button')!);
    expect(selectDiff).toHaveBeenCalledWith(expect.objectContaining({ id: 'easy' }), 0, null);
  });

  it('圧>0 のとき難易度カードの侵蝕・被ダメが実効値で表示される', () => {
    render(<DiffSelectScreen {...basePressureProps({ meta: createMetaState({ echoDepth: 3 }) })} />);
    // 残響圧3を選択（normal 実効: drainMod -2→-3、dmgMult 1→1.15）
    fireEvent.click(screen.getByText('3'));
    expect(screen.getByText('被ダメ ×1.15')).toBeInTheDocument();
    expect(screen.getByText('侵蝕 -3/手')).toBeInTheDocument();
  });

  it('圧>0 でも selectDiff には基底難易度（圧未適用）と圧が渡る（二重適用しない）', () => {
    const selectDiff = jest.fn();
    render(<DiffSelectScreen {...basePressureProps({ selectDiff, meta: createMetaState({ echoDepth: 3 }) })} />);
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('挑戦者').closest('button')!);
    expect(selectDiff).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'normal', modifiers: expect.objectContaining({ drainMod: -2, dmgMult: 1 }) }),
      3,
      null,
    );
  });
});

describe('DiffSelectScreen 残響継承', () => {
  it('解禁レガシーが無いとき継承セレクタを出さない', () => {
    render(<DiffSelectScreen {...basePressureProps({ meta: createMetaState({ echoDepth: 0, fragments: [] }) })} />);
    expect(screen.queryByText(/継承/)).toBeNull();
  });

  it('解禁レガシーがあるとき継承セレクタを表示する', () => {
    render(<DiffSelectScreen {...basePressureProps({ meta: createMetaState({ echoDepth: 3, fragments: allFrags }) })} />);
    // 「残響継承」ヘッダーが1つだけ存在することで継承セレクタの表示を確認
    expect(screen.getByText('残響継承')).toBeInTheDocument();
    expect(screen.getByText('記録者の継承')).toBeInTheDocument();
  });

  it('継承を選び難易度を選ぶと selectDiff に legacyId が渡る', () => {
    const selectDiff = jest.fn();
    render(<DiffSelectScreen {...basePressureProps({ selectDiff, meta: createMetaState({ echoDepth: 3, fragments: allFrags }) })} />);
    fireEvent.click(screen.getByText('記録者の継承'));
    fireEvent.click(screen.getByText('挑戦者').closest('button')!);
    expect(selectDiff).toHaveBeenCalledWith(expect.objectContaining({ id: 'normal' }), 0, 'lg_lian');
  });

  it('既定（継承なし）では legacyId が null で渡る', () => {
    const selectDiff = jest.fn();
    render(<DiffSelectScreen {...basePressureProps({ selectDiff, meta: createMetaState({ echoDepth: 3, fragments: allFrags }) })} />);
    fireEvent.click(screen.getByText('探索者').closest('button')!);
    expect(selectDiff).toHaveBeenCalledWith(expect.objectContaining({ id: 'easy' }), 0, null);
  });

  it('lg_twins 継承選択で normal カードの HP・精神プレビューが減少する（hpBonus-10, mentalBonus-8）', () => {
    // Arrange: 全断片取得済みメタ（全レガシー解禁）・圧0・継承なし状態でレンダリング
    render(<DiffSelectScreen {...basePressureProps({ meta: createMetaState({ echoDepth: 3, fragments: allFrags }) })} />);

    // 継承なし時: normal HP = BASE_HP(52) + hpBonus(0) + hpMod(0) = 52、精神 33
    expect(screen.getByText('HP 52')).toBeInTheDocument();
    expect(screen.getByText('精神 33')).toBeInTheDocument();

    // Act: 絆の継承（lg_twins: hpBonus -10, mentalBonus -8）を選択
    fireEvent.click(screen.getByText('絆の継承'));

    // Assert: normal HP = 52 - 10 = 42、精神 = 33 - 8 = 25 に追従する
    expect(screen.getByText('HP 42')).toBeInTheDocument();
    expect(screen.getByText('精神 25')).toBeInTheDocument();
  });
});
