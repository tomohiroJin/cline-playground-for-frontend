/**
 * 台座の描画テスト
 *
 * 台座は「形（役割）× サイズ（コスト）× 文字（個体）」を担う。
 * 敵マーカーと混同しないよう pointer-events を持たず、セルのボタンが
 * クリックを受ける（UnitHpBar と同じ方針）。
 *
 * 見た目の検証は data 属性ではなく**実際に適用された CSS** で行う。
 * transient prop（`$...`）だけを差し替えた退行を検出するため。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { UnitPlate } from './UnitPlate';
import { appliedCssUnderReducedMotionOf, appliedLengthOf, appliedValueOf } from './applied-css';
import { buildPlates } from './board-plates';
import type { PlateModel } from './board-plates';
import type { CombatState, PlacedEmber, PlacedUnit } from '../domain/combat/combat-state';
import { createCombatState } from '../domain/combat/combat-state';
import type { DeckState } from '../domain/cards/deck';
import { COLORS } from './theme';

/**
 * テスト用に必要な部分だけ持つ CombatState を組む
 *
 * 最小限の有効な DeckState で createCombatState を初期化し、
 * spread で overrides を適用する。これにより TypeScript は完全な
 * CombatState を保証し、as キャストを避けられる。
 */
const stateWith = (overrides: {
  units?: PlacedUnit[];
  embers?: PlacedEmber[];
  events?: CombatState['events'];
}): CombatState => {
  const emptyDeck: DeckState = { drawPile: [], hand: [], graveyard: [] };
  const base = createCombatState(emptyDeck, []);
  return {
    ...base,
    units: overrides.units ?? [],
    traps: [],
    reactors: [],
    embers: overrides.embers ?? [],
    events: overrides.events ?? [],
  };
};

const plateFor = (cardId: string, events: CombatState['events'] = []) =>
  buildPlates(
    stateWith({
      units: [{ cardId, pos: { x: 2, y: 3 }, hp: 8, maxHp: 8, cooldownLeft: 0 }],
      events,
    })
  )[0];

/** 燠火の台座モデルを cooldownLeft から作る（再点火の合図テスト用） */
const emberPlateFor = (cooldownLeft: number): PlateModel =>
  buildPlates(stateWith({ embers: [{ pos: { x: 3, y: 3 }, cooldownLeft }] }))[0];

/** この tick に0番の守り手が撃ったことにするイベント */
const shotEvent: CombatState['events'] = [
  { kind: 'shot', unitIndex: 0, targetId: 1, auraDamageBonus: 0, beyondBaseRange: false },
];

describe('UnitPlate', () => {
  it('個体を表す文字を描く', () => {
    render(<UnitPlate plate={plateFor('arrow-tower')} columns={9} rows={7} />);
    expect(screen.getByText('弓')).toBeInTheDocument();
  });

  it('役割と個体名を aria-label に持つ', () => {
    render(<UnitPlate plate={plateFor('arrow-tower')} columns={9} rows={7} />);
    expect(screen.getByLabelText('攻撃塔 弓兵')).toBeInTheDocument();
  });

  it('石壁は横長プレートになる（実際に適用された幅と高さが異なる）', () => {
    render(<UnitPlate plate={plateFor('stone-wall')} columns={9} rows={7} />);
    const plate = screen.getByTestId('unit-plate-2-3');
    const width = appliedLengthOf(plate, 'width');
    const height = appliedLengthOf(plate, 'height');
    expect(width).toBeDefined();
    expect(height).toBeDefined();
    expect(width!).toBeGreaterThan(height!);
  });

  it('攻撃塔以外は data-role で区別できる', () => {
    render(<UnitPlate plate={plateFor('beacon')} columns={9} rows={7} />);
    expect(screen.getByTestId('unit-plate-2-3')).toHaveAttribute('data-role', 'support');
  });

  it('文字は clip-path の外に置かれ、形に切られない（設計 Risk 1 の退避先を守る）', () => {
    // clip-path は子孫まで切る。形と文字を同じ要素に載せていた頃は、最小幅
    // 360px（セル約37px）で下向き三角のベースライン付近の実効幅が 4px 程度になり、
    // 「棘」「網」の下半分が消えていた（最終レビュー指摘G）。
    render(<UnitPlate plate={plateFor('spike-trap')} columns={9} rows={7} />);
    const shape = screen.getByTestId('unit-shape-2-3');
    const plate = screen.getByTestId('unit-plate-2-3');
    const glyph = screen.getByText('棘');

    // 形は確かに clip-path で描かれている（この前提が崩れると検証が空になる）
    expect(appliedValueOf(shape, 'clip-path')).toContain('polygon');
    // その要素は文字を含まない（＝文字は切られない）
    expect(shape).toBeEmptyDOMElement();
    expect(shape.contains(glyph)).toBe(false);
    // 文字自身にも、その祖先である台座にも clip-path は掛かっていない
    expect(appliedValueOf(glyph, 'clip-path')).toBeUndefined();
    expect(appliedValueOf(plate, 'clip-path')).toBeUndefined();
  });

  it('配置時にポップインアニメーションが出力される', () => {
    // popIn キーフレームには scale(0.7) と scale(1) の状態遷移が含まれる。
    // styled-components が出力する CSS に popIn の固有値が含まれることで、
    // ポップインアニメーション実装の有無を検証する。
    render(<UnitPlate plate={plateFor('arrow-tower')} columns={9} rows={7} />);
    const styles = Array.from(document.querySelectorAll('style'))
      .map((el) => el.textContent ?? '')
      .join('');
    expect(styles).toContain('scale(0.7)');
    expect(appliedValueOf(screen.getByTestId('unit-plate-2-3'), 'animation')).toBeDefined();
  });

  it('撃った tick の台座には脈動が足され、ポップインの名前は消えない', () => {
    // UnitPlate.tsx の【重要】コメントが守っている不変条件。$firing 分岐から
    // popIn を外すと animation-name がリストから一度消えるため、$firing が
    // false へ戻るたびにポップインが再生し直される（撃つたびに現れ直す）。
    // モデル側（board-plates）は検証済みだが、DOM に届いていることは
    // 誰も見ていなかった（最終レビュー指摘H-4）。
    const { unmount } = render(<UnitPlate plate={plateFor('arrow-tower')} columns={9} rows={7} />);
    const idleAnimation = appliedValueOf(screen.getByTestId('unit-plate-2-3'), 'animation');
    expect(idleAnimation).toBeDefined();
    const popInName = idleAnimation!.trim().split(' ')[0]!;
    unmount();

    render(<UnitPlate plate={plateFor('arrow-tower', shotEvent)} columns={9} rows={7} />);
    const firingAnimation = appliedValueOf(screen.getByTestId('unit-plate-2-3'), 'animation');
    expect(firingAnimation).toBeDefined();
    // 脈動が足されている（何も変わらないなら検証の意味が無い）
    expect(firingAnimation).not.toBe(idleAnimation);
    // かつ popIn の名前はリストの先頭に残り続けている
    expect(firingAnimation!.trim().startsWith(popInName)).toBe(true);
  });

  it('動きを減らす設定では脈動もポップインも止まる', () => {
    // 「CSS に prefers-reduced-motion という文字列がある」だけでは、
    // ブロックの中身を animation-play-state: running; に変えても通ってしまう
    // （最終レビュー指摘H-3）。台座のクラスに対して何が指定されているかを見る。
    render(<UnitPlate plate={plateFor('arrow-tower', shotEvent)} columns={9} rows={7} />);
    const reduced = appliedCssUnderReducedMotionOf(screen.getByTestId('unit-plate-2-3'));
    expect(reduced).toContain('animation:none');
  });

  describe('再点火可能な合図（isReady）', () => {
    // 手札もマナも尽きた終盤、プレイヤーがまだ操作できる唯一のものが燠火。
    // 見落とすとランを失うため、色だけに頼らない合図がここで壊れていないかを
    // 実際に適用された CSS で検証する（data-* での抜け道は使わない）。

    it('再点火可能な燠は好機色になる', () => {
      // これを壊す一行変更の例: UnitPlate.tsx で `$ready` を参照する条件式を
      // `plate.isReady` から常に false（または常に true）へ変えること。
      render(<UnitPlate plate={emberPlateFor(0)} columns={9} rows={7} />);
      const glyph = screen.getByText('燠');
      expect(appliedValueOf(glyph, 'color')).toBe(COLORS.opportunity);
    });

    it('再点火可能な燠は色だけでなく太さも変わる（色のみに依存しない）', () => {
      // これを壊す一行変更の例: 好機色の分岐から font-weight の宣言を消すこと。
      // 消すと、上のテストは通ったままここだけが落ちる＝色だけに頼った実装を検知できる。
      render(<UnitPlate plate={emberPlateFor(0)} columns={9} rows={7} />);
      const glyph = screen.getByText('燠');
      expect(appliedValueOf(glyph, 'font-weight')).toBe('700');
    });

    it('再点火待ちの燠は好機色にも太字にもならない', () => {
      // これを壊す一行変更の例: $ready の判定を isFiring 等の無関係な値にすり替える、
      // または常に true にすること（どちらもこのテストが false 側で検知する）。
      render(<UnitPlate plate={emberPlateFor(5)} columns={9} rows={7} />);
      const glyph = screen.getByText('燠');
      expect(appliedValueOf(glyph, 'color')).not.toBe(COLORS.opportunity);
      expect(appliedValueOf(glyph, 'font-weight')).not.toBe('700');
    });
  });
});
