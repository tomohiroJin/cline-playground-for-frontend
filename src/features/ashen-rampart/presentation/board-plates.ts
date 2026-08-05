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
  /** この tick に撃ったか（台座を脈動させる）。`shot` イベントから引く */
  isFiring: boolean;
  /**
   * プレイヤーの操作を今すぐ待っているか（合図の対象は燠火のみ）。
   *
   * 炉のバーも100%まで満ちるが、それは「マナが生まれる」合図であって
   * 「操作しろ」という合図ではない。isReady を「バーが満タンか」という
   * 汎用判定にすると炉まで光ってしまい、本当に押してほしい燠の合図が
   * ノイズに埋もれる。だからこの値は種別ごとに個別に立てる
   * （バーの充填率からの逆算はしない）。
   */
  isReady: boolean;
}

export const plateKeyOf = (pos: CellPos): string => `${pos.x},${pos.y}`;

const plateOf = (
  cardId: string,
  pos: CellPos,
  status: { now: number; max: number; suffix: string },
  flags: { isFiring?: boolean; isReady?: boolean } = {}
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
    isFiring: flags.isFiring ?? false,
    isReady: flags.isReady ?? false,
  };
};

/**
 * この tick に撃った守り手の index を集める
 *
 * cooldownLeft からの逆算はしない。stepTick は発射時に
 * `Math.max(0, cooldownTicks - 1)` を入れるため「cooldownTicks と等しい」は
 * 決して成り立たず、さらに内部実装が変われば静かに壊れる。`shot` イベントは
 * 発射そのものを表す一次情報であり、設計書 §5.3 の「shot エフェクトに同期」
 * とも一致する。
 */
const firingUnitIndicesOf = (state: CombatState): Set<number> => {
  const indices = new Set<number>();
  state.events.forEach((event) => {
    if (event.kind === 'shot') indices.add(event.unitIndex);
  });
  return indices;
};

/** 設置物すべてを台座モデルへ変換する */
export const buildPlates = (state: CombatState): PlateModel[] => {
  const plates: PlateModel[] = [];
  const firingIndices = firingUnitIndicesOf(state);

  state.units.forEach((unit, index) => {
    plates.push(
      plateOf(
        unit.cardId,
        unit.pos,
        { now: unit.hp, max: unit.maxHp, suffix: 'の耐久' },
        { isFiring: firingIndices.has(index) }
      )
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
      plateOf(
        EMBER_CARD_ID,
        ember.pos,
        {
          now: cooldown - ember.cooldownLeft,
          max: cooldown,
          suffix: 'の再点火',
        },
        // useAshenRampartGame.ts の interactCell と同じ条件（cooldownLeft === 0）。
        // ここがずれると「今押せる」という合図が嘘をつく。
        { isReady: ember.cooldownLeft === 0 }
      )
    );
  });

  return plates;
};
