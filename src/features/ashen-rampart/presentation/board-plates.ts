/**
 * 灰燼の城壁 - 盤面の台座モデル（純粋）
 *
 * CombatState を描画用の配列へ変換する。状態バーは常に1本で、
 * 意味は役割が決める（設計書 §5.1）。UnitPlate / PlacedStatusBar は
 * この結果を描くだけにし、意味の判断をここへ集約する。
 */
import type { CellPos } from '../domain/board/stage-map';
import type { CombatState } from '../domain/combat/combat-state';
import { getCardDefinition } from '../domain/cards/card-pool';
import { getUnitVisual, type UnitVisual } from './unit-visual';

/**
 * PlacedReactor と PlacedEmber は cardId を持たない（combat-state.ts）ため、
 * 「炉カードは1種・燠カードは1種」というカードプールの前提に依存する。
 * これは run-summary.ts が撃破の帰属で抱えているのと同じ制約であり、
 * 2種類目を追加した瞬間に静かに誤表示する。そのときはドメインに cardId を
 * 持たせる変更とセットで直すこと。
 */
const REACTOR_CARD_ID = 'reactor';
const EMBER_CARD_ID = 'ember-blast';

export interface PlateModel {
  /** React の key。1マスに設置物は1つまでなので座標で一意 */
  key: string;
  cardId: string;
  pos: CellPos;
  visual: UnitVisual;
  /** 状態バーの現在値。statusMax が 0 のときバーは描かない */
  statusNow: number;
  statusMax: number;
  /** 状態バーの意味（aria-label に使う） */
  statusLabel: string;
  /** この tick に撃ったか（台座を脈動させる） */
  isFiring: boolean;
}

export const plateKeyOf = (pos: CellPos): string => `${pos.x},${pos.y}`;

const plateOf = (
  cardId: string,
  pos: CellPos,
  status: { now: number; max: number; suffix: string },
  isFiring = false
): PlateModel => {
  const visual = getUnitVisual(cardId);
  return {
    key: plateKeyOf(pos),
    cardId,
    pos,
    visual,
    statusNow: status.now,
    statusMax: status.max,
    statusLabel: `${visual.name} ${status.suffix}`,
    isFiring,
  };
};

/**
 * 設置物すべてを台座モデルへ変換する
 *
 * 攻撃直後の判定は cooldownLeft が最大に戻ったことで見る。stepTick は
 * 撃った tick に cooldownLeft を cooldownTicks へ戻すため、エフェクト層を
 * 参照せずに「今撃った」が分かる。
 */
export const buildPlates = (state: CombatState): PlateModel[] => {
  const plates: PlateModel[] = [];

  state.units.forEach((unit) => {
    const tower = getCardDefinition(unit.cardId).tower;
    const cooldownTicks = tower?.cooldownTicks ?? 0;
    const isFiring = cooldownTicks > 0 && unit.cooldownLeft >= cooldownTicks;
    plates.push(
      plateOf(unit.cardId, unit.pos, { now: unit.hp, max: unit.maxHp, suffix: 'の耐久' }, isFiring)
    );
  });

  state.traps.forEach((trap) => {
    const uses = getCardDefinition(trap.cardId).trap?.uses ?? 0;
    plates.push(
      plateOf(trap.cardId, trap.pos, { now: trap.usesLeft, max: uses, suffix: 'の残り回数' })
    );
  });

  state.reactors.forEach((reactor) => {
    const interval = getCardDefinition(REACTOR_CARD_ID).reactor?.intervalTicks ?? 0;
    plates.push(
      plateOf(REACTOR_CARD_ID, reactor.pos, {
        now: interval - reactor.ticksToMana,
        max: interval,
        suffix: 'のマナ生成',
      })
    );
  });

  state.embers.forEach((ember) => {
    const cooldown = getCardDefinition(EMBER_CARD_ID).ember?.cooldownTicks ?? 0;
    plates.push(
      plateOf(EMBER_CARD_ID, ember.pos, {
        now: cooldown - ember.cooldownLeft,
        max: cooldown,
        suffix: 'の再点火',
      })
    );
  });

  return plates;
};
