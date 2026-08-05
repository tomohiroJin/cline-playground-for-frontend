/**
 * 能力チップのテスト
 *
 * 盤面に出さない詳細（攻撃力・射程・対空可否・攻撃の形など）を
 * 役割ごとに正しく組み立てられることを検証する。状態フィクスチャは
 * board-plates.test.ts / PlacedStatusBar.test.tsx と同じ createCombatState
 * ベースの流儀に揃える（as unknown as CombatState は使わない）。
 *
 * chipsOf の5分岐（攻撃塔・支援塔・壁・罠・炉・燠）をすべて**値で**通す。
 * 「テスト名は数値を出すと言っているのに数値を見ていない」状態にしない
 * （最終レビュー指摘 E-3）。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { InspectPanel } from './InspectPanel';
import { buildPlates } from './board-plates';
import { toSeconds } from './card-text';
import type {
  CombatState,
  PlacedUnit,
  PlacedTrap,
  PlacedReactor,
  PlacedEmber,
} from '../domain/combat/combat-state';
import { createCombatState } from '../domain/combat/combat-state';
import { getCardDefinition } from '../domain/cards/card-pool';
import type { DeckState } from '../domain/cards/deck';

/**
 * テスト用に必要な部分だけ持つ CombatState を組む
 *
 * 最小限の有効な DeckState で createCombatState を初期化し、
 * spread で overrides を適用する。これにより TypeScript は完全な
 * CombatState を保証し、as キャストを避けられる。
 */
const stateWith = (overrides: {
  units?: PlacedUnit[];
  traps?: PlacedTrap[];
  reactors?: PlacedReactor[];
  embers?: PlacedEmber[];
}): CombatState => {
  const emptyDeck: DeckState = { drawPile: [], hand: [], graveyard: [] };
  const base = createCombatState(emptyDeck, []);
  return {
    ...base,
    units: overrides.units ?? [],
    traps: overrides.traps ?? [],
    reactors: overrides.reactors ?? [],
    embers: overrides.embers ?? [],
  };
};

const plateFor = (cardId: string) =>
  buildPlates(
    stateWith({ units: [{ cardId, pos: { x: 0, y: 0 }, hp: 8, maxHp: 8, cooldownLeft: 0 }] })
  )[0];

describe('InspectPanel', () => {
  describe('攻撃塔', () => {
    it('攻撃力・射程・攻撃間隔を実際の数値で出す', () => {
      // 「射程 → HP」のように別のフィールドへ差し替えるとここが落ちる
      const tower = getCardDefinition('piercer').tower!;
      render(<InspectPanel plate={plateFor('piercer')} />);
      expect(screen.getByText('攻撃塔 徹甲弩')).toBeInTheDocument();
      expect(screen.getByText(`攻撃${tower.damage}`)).toBeInTheDocument();
      expect(screen.getByText(`射程${tower.range}`)).toBeInTheDocument();
      expect(screen.getByText(`間隔${toSeconds(tower.cooldownTicks)}秒`)).toBeInTheDocument();
    });

    it('対空可否と攻撃の形（貫通）を出す', () => {
      render(<InspectPanel plate={plateFor('piercer')} />);
      expect(screen.getByText('飛行に当たる')).toBeInTheDocument();
      expect(screen.getByText('貫通')).toBeInTheDocument();
    });

    it('範囲攻撃の塔は半径を出し、飛行に当たらないことを明示する', () => {
      const tower = getCardDefinition('catapult').tower!;
      render(<InspectPanel plate={plateFor('catapult')} />);
      expect(screen.getByText(`範囲${tower.splashRadius}`)).toBeInTheDocument();
      expect(screen.getByText('飛行に当たらない')).toBeInTheDocument();
    });

    it('貫通も範囲も持たない塔は単体と出す', () => {
      render(<InspectPanel plate={plateFor('ballista')} />);
      expect(screen.getByText('単体')).toBeInTheDocument();
    });
  });

  describe('支援塔', () => {
    it('強化内容と効果範囲を出す（HP ではない。設計書 §5.2）', () => {
      render(<InspectPanel plate={plateFor('forge')} />);
      expect(screen.getByText('隣接の射程 +0.6')).toBeInTheDocument();
      expect(screen.getByText('効果範囲 隣接8マス')).toBeInTheDocument();
      expect(screen.queryByText(/^HP/)).not.toBeInTheDocument();
    });

    it('篝火は火力の強化率を出す', () => {
      const aura = getCardDefinition('beacon').tower!.aura!;
      render(<InspectPanel plate={plateFor('beacon')} />);
      expect(
        screen.getByText(`隣接の攻撃力 +${aura.towerDamageBonus! * 100}%`)
      ).toBeInTheDocument();
    });
  });

  describe('壁', () => {
    it('HP と攻撃しないことを出す', () => {
      const tower = getCardDefinition('stone-wall').tower!;
      render(<InspectPanel plate={plateFor('stone-wall')} />);
      expect(screen.getByText(`HP${tower.hp}`)).toBeInTheDocument();
      expect(screen.getByText('攻撃しない')).toBeInTheDocument();
    });
  });

  describe('罠', () => {
    it('ダメージと「今の」残り回数を出す', () => {
      const trap = getCardDefinition('spike-trap').trap!;
      const plate = buildPlates(
        stateWith({
          traps: [{ cardId: 'spike-trap', pos: { x: 1, y: 2 }, usesLeft: 2, hitEnemyIds: [] }],
        })
      )[0];
      render(<InspectPanel plate={plate} />);
      expect(screen.getByText(`ダメージ${trap.damage}`)).toBeInTheDocument();
      // 定義値（uses=3）ではなく、その設置物の現在値（2）を出すこと
      expect(screen.getByText('残り2回')).toBeInTheDocument();
      expect(screen.queryByText(`残り${trap.uses}回`)).not.toBeInTheDocument();
    });

    it('地上化を持つ罠はその秒数を出す', () => {
      const trap = getCardDefinition('snare-net').trap!;
      const plate = buildPlates(
        stateWith({
          traps: [{ cardId: 'snare-net', pos: { x: 1, y: 2 }, usesLeft: 3, hitEnemyIds: [] }],
        })
      )[0];
      render(<InspectPanel plate={plate} />);
      expect(
        screen.getByText(`${toSeconds(trap.groundedTicks!)}秒 地上化`)
      ).toBeInTheDocument();
    });

    it('地上化を持たない罠には地上化のチップが出ない', () => {
      const plate = buildPlates(
        stateWith({
          traps: [{ cardId: 'spike-trap', pos: { x: 1, y: 2 }, usesLeft: 3, hitEnemyIds: [] }],
        })
      )[0];
      render(<InspectPanel plate={plate} />);
      expect(screen.queryByText(/地上化/)).not.toBeInTheDocument();
    });
  });

  describe('魔力炉', () => {
    it('生成量と間隔を出す', () => {
      const reactor = getCardDefinition('reactor').reactor!;
      const plate = buildPlates(stateWith({ reactors: [{ pos: { x: 2, y: 2 }, ticksToMana: 5 }] }))[0];
      render(<InspectPanel plate={plate} />);
      expect(screen.getByText(`マナ+${reactor.manaPerTick}`)).toBeInTheDocument();
      expect(
        screen.getByText(`${toSeconds(reactor.intervalTicks)}秒ごと`)
      ).toBeInTheDocument();
    });
  });

  describe('燠火', () => {
    it('ダメージ・半径・クールダウンを出す（設計書 §5.2）', () => {
      const ember = getCardDefinition('ember-blast').ember!;
      const plate = buildPlates(
        stateWith({ embers: [{ pos: { x: 3, y: 3 }, cooldownLeft: ember.cooldownTicks }] })
      )[0];
      render(<InspectPanel plate={plate} />);
      expect(screen.getByText(`ダメージ${ember.damage}`)).toBeInTheDocument();
      expect(screen.getByText(`半径${ember.radius}`)).toBeInTheDocument();
      expect(
        screen.getByText(`クールダウン${toSeconds(ember.cooldownTicks)}秒`)
      ).toBeInTheDocument();
    });

    it('クールダウン中は「クリックで再点火」ではなく残り時間を出す', () => {
      // このパネルが開けるのはクールダウン中の燠火だけ（設計書 §5.2 の優先順位で
      // 再点火可能な燠火はタップが再点火に横取りされる）。したがって
      // 「クリックで再点火」を固定で出すと、できない時にしか出ない嘘になる。
      const cooldownLeft = 20;
      const plate = buildPlates(stateWith({ embers: [{ pos: { x: 3, y: 3 }, cooldownLeft }] }))[0];
      render(<InspectPanel plate={plate} />);
      expect(screen.getByText(`再点火まで${toSeconds(cooldownLeft)}秒`)).toBeInTheDocument();
      expect(screen.queryByText('クリックで再点火')).not.toBeInTheDocument();
    });

    it('パネルを開いたままクールダウンが明けたら再点火できると出す', () => {
      const plate = buildPlates(stateWith({ embers: [{ pos: { x: 3, y: 3 }, cooldownLeft: 0 }] }))[0];
      render(<InspectPanel plate={plate} />);
      expect(screen.getByText('クリックで再点火')).toBeInTheDocument();
    });
  });
});
