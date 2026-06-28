/**
 * 迷宮の残響 - FloorIntroScreen コンポーネントテスト
 */
import { render, screen } from '@testing-library/react';
import { FloorIntroScreen } from '../components/FloorIntroScreen';
import { LEGACIES } from '../domain/constants/legacy-defs';
import { FLOOR_META } from '../domain/constants/floor-meta';
import { createTestMeta } from './helpers/factories';
import { DIFFICULTY } from '../domain/constants/difficulty-defs';

/** テスト用の最小 Props を生成する */
const makeProps = (overrides: Partial<Parameters<typeof FloorIntroScreen>[0]> = {}) => ({
  Particles: null,
  floor: 1,
  floorMeta: FLOOR_META[1],
  floorColor: FLOOR_META[1].color,
  diff: DIFFICULTY[1],
  meta: createTestMeta(),
  progressPct: 0,
  player: null,
  chainNext: null,
  ...overrides,
});

describe('FloorIntroScreen 継承バッジ', () => {
  it('legacy プロップあり: 「継承：〈アイコン〉〈名前〉」バッジが表示される', () => {
    // Arrange: lg_lian レガシーを渡す
    const legacy = LEGACIES.find(l => l.id === 'lg_lian')!;

    // Act
    render(<FloorIntroScreen {...makeProps({ legacy })} />);

    // Assert: 「継承：📜 記録者の継承」が表示される
    expect(screen.getByText(`継承：${legacy.icon} ${legacy.name}`)).toBeInTheDocument();
  });

  it('legacy プロップなし（null）: 継承バッジが表示されない', () => {
    // Arrange: legacy を明示的に null に設定

    // Act
    render(<FloorIntroScreen {...makeProps({ legacy: null })} />);

    // Assert: 「継承：」を含むテキストが存在しない
    expect(screen.queryByText(/継承：/)).toBeNull();
  });
});
