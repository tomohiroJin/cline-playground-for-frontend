/**
 * stepTick 経由のブロック判定テスト
 *
 * 「止まる」だけを単独で検証する（設計書 §12）。「削れる」「消滅して再開する」は
 * Task 5 で別々に書く。1つのテストで全部を通そうとすると、どれかがゼロのまま緑になる。
 *
 * 守り手は play-card 経由ではなく state.units への直接注入で置く。
 * 現時点の canPlaceAt は「経路外なら置ける（塔）」「経路上なら置ける（罠）」の
 * どちらか一方であり、経路上に PlacedUnit を置く配置ルールはまだ無い（Task 8 で
 * 配置先種別を刷新するまでの暫定）。stepTick 内の combat 系テストが既に使っている
 * withUnit 相当のパターン（state を直接組み立てる）に倣う。
 */
import { createCombatState } from './combat-state';
import { stepTick } from './step-tick';
import { PLAINS_MAP, laneOf } from '../board/stage-map';
import type { CombatState } from './combat-state';

const emptyDeck = { drawPile: [], hand: [], graveyard: [] };

const runTicks = (state: CombatState, count: number): CombatState => {
  let s = state;
  for (let i = 0; i < count; i++) s = stepTick(s, [], PLAINS_MAP);
  return s;
};

/** 経路セル上に守り手を1基置いた状態を作る */
const withBlockerOn = (state: CombatState, x: number, y: number): CombatState => ({
  ...state,
  units: [...state.units, { cardId: 'stone-wall', pos: { x, y }, hp: 60, maxHp: 60, cooldownLeft: 0 }],
});

describe('ブロック判定（stepTick 経由）', () => {
  it('経路上に守り手がいると、地上の敵はそこで止まる', () => {
    const wave = [{
      startTick: 0,
      entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 1, laneIndex: 0 }],
    }];
    const lane = laneOf(PLAINS_MAP, 0);
    const blockCell = lane[3]!;
    let state = createCombatState(emptyDeck, wave);
    state = withBlockerOn(state, blockCell.x, blockCell.y);
    state = runTicks(state, 200);

    const enemy = state.enemies[0];
    expect(enemy).toBeDefined();
    expect(enemy!.alive).toBe(true);
    // セル3 に進入していない
    expect(enemy!.progress).toBeLessThan(3);
  });

  it('守り手がいなければ同じ条件で砦まで到達する', () => {
    const wave = [{
      startTick: 0,
      entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 1, laneIndex: 0 }],
    }];
    let state = createCombatState(emptyDeck, wave);
    state = runTicks(state, 200);
    expect(state.life).toBeLessThan(12);
  });
});
