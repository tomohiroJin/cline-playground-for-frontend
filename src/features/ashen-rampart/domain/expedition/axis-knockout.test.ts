import { validateDeck } from '../cards/deck-builder';
import { DECK_SIZE, KNOCKOUT_CARD_IDS } from '../cards/card-pool';
import { KNOCKOUT_ID_PREFIX, baseIdOf, knockoutIdOf } from '../cards/knockout-cards';
import { DEMAND_AXES, axesOf } from './stage-definition';
import { AUDIT_FULL_DECK, knockoutDeck } from './axis-knockout';

describe('knockoutDeck（デッキの同じ位置で差し替える）', () => {
  it('枚数が変わらない', () => {
    DEMAND_AXES.forEach((axis) => {
      expect(knockoutDeck(AUDIT_FULL_DECK, axis)).toHaveLength(AUDIT_FULL_DECK.length);
    });
  });

  // 繰越指摘2: 元は anti-air の1軸だけを検査していた。全軸へ広げる
  it('その軸を持つ札だけが、同じ位置で変種に置き換わる（全軸）', () => {
    DEMAND_AXES.forEach((axis) => {
      const swapped = knockoutDeck(AUDIT_FULL_DECK, axis);
      AUDIT_FULL_DECK.forEach((id, index) => {
        const expected = axesOf(id).includes(axis) ? knockoutIdOf(axis, id) : id;
        expect(swapped[index]).toBe(expected);
      });
    });
  });

  it('置き換わった札は、その軸を失っている', () => {
    DEMAND_AXES.forEach((axis) => {
      knockoutDeck(AUDIT_FULL_DECK, axis).forEach((id) => {
        expect(axesOf(id)).not.toContain(axis);
      });
    });
  });

  // 繰越指摘2: 元は block の1軸だけを検査していた。全軸へ広げる
  it('その軸を持たない札は1枚も変わらない（全軸）', () => {
    DEMAND_AXES.forEach((axis) => {
      const swapped = knockoutDeck(AUDIT_FULL_DECK, axis);
      AUDIT_FULL_DECK.forEach((id, index) => {
        if (axesOf(id).includes(axis)) return;
        expect(swapped[index]).toBe(id);
      });
    });
  });

  it('存在しない変種を参照しない', () => {
    DEMAND_AXES.forEach((axis) => {
      knockoutDeck(AUDIT_FULL_DECK, axis).forEach((id) => {
        if (!AUDIT_FULL_DECK.includes(id)) expect(KNOCKOUT_CARD_IDS).toContain(id);
      });
    });
  });

  /**
   * `B0-P2`（変種は落とした軸だけを失う）を全変種について検査する（最終レビュー I1・設計書 §8.2.15(f)）
   *
   * 従来は `AUDIT_FULL_DECK` の7枚に限っていたため、実プールの11変種のうち
   * `catapult`×2・`piercer`×3・`ember-blast`×1 の6変種が一度も検査されていなかった。
   * とくに `piercer` は4軸中3軸を持つ唯一の札で、この道具が最も間違えやすい相手である。
   */
  it('全変種が、落とした軸だけを失い他の軸を保つ（B0-P2・設計書 §8.2.15(f)）', () => {
    expect(KNOCKOUT_CARD_IDS.length).toBeGreaterThan(0);
    KNOCKOUT_CARD_IDS.forEach((koId) => {
      const axis = DEMAND_AXES.find((a) => koId.startsWith(`${KNOCKOUT_ID_PREFIX}${a}/`));
      expect(axis).toBeDefined();
      const before = axesOf(baseIdOf(koId));
      expect([...axesOf(koId)].sort()).toEqual(before.filter((a) => a !== axis).slice().sort());
    });
  });
});

describe('AUDIT_FULL_DECK（B0-P5・設計書 §8.2.15(e)）', () => {
  it(`枚数は ${DECK_SIZE} 枚ちょうどで、構築規則を満たす`, () => {
    expect(AUDIT_FULL_DECK).toHaveLength(DECK_SIZE);
    expect(validateDeck([...AUDIT_FULL_DECK]).errors).toEqual([]);
  });

  it('4軸すべてを備えている', () => {
    DEMAND_AXES.forEach((axis) => {
      expect(AUDIT_FULL_DECK.some((id) => axesOf(id).includes(axis))).toBe(true);
    });
  });

  it('業火を含まない（再点火が基礎カードを読むため軸を消せない）', () => {
    // step-tick.ts の applyReactivate は getCardDefinition('ember-blast') を
    // ID 直書きで引き、PlacedEmber は cardId を持たない（設計書 §8.2.15(a)2）
    expect(AUDIT_FULL_DECK).not.toContain('ember-blast');
  });

  it('徹甲弩を含まない（貫通が飛行を絞らないため対空を消せない）', () => {
    // applyPiercingDamage に飛行の絞り込みが無い（設計書 §8.2.15(a)5）
    expect(AUDIT_FULL_DECK).not.toContain('piercer');
  });
});
