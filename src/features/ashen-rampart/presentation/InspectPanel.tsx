/**
 * 灰燼の城壁 - 能力チップ（盤面外）
 *
 * 盤面に数値を並べると煩雑になるため、要求時の詳細は盤面の外に出す
 * （設計書 §5.2）。盤面には射程リングだけが出る。
 */
import React from 'react';
import styled from 'styled-components';
import type { PlateModel, TowerEffective } from './board-plates';
import { getCardDefinition } from '../domain/cards/card-pool';
import type { TowerSpec } from '../domain/cards/card-definition';
import { HIGH_GROUND_DAMAGE_MULT } from '../domain/combat/step-tick';
import { roleLabelOf } from './unit-visual';
import { toSeconds, TICKS_PER_SECOND } from './card-text';
import { getEnemySpec, type EnemySpec } from '../domain/combat/enemies';
import { abilityTextsOf } from './EnemyLegend';
import { COLORS } from './theme';
import { INSPECT_ROW_HEIGHT_PX } from './layout-constants';

/**
 * 能力表示の1行（反復7 段階2・設計書 §4.0 a）
 *
 * 高さを固定し、チップは折り返さず横へ流す（狭い画面では横にスクロールして読む）。
 * 折り返すと、開くたびに枠の高さが変わって手札が動く。
 */
const Panel = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 6px;
  height: ${INSPECT_ROW_HEIGHT_PX}px;
  box-sizing: border-box;
  padding: 0 8px;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.grid};
  border-radius: 4px;
`;

const Chip = styled.span`
  flex-shrink: 0;
  font-size: 11px;
  opacity: 0.9;
`;

/**
 * 支援塔のオーラが届くマス数（チェビシェフ距離1の 3×3 から自分のセルを除く）
 *
 * 盤面には RangeOverlay が同じ範囲を枠で描く。数字と枠が食い違わないよう
 * 「隣接8マス」という同じ意味をここでも明示する。
 */
const AURA_CELL_COUNT = 8;

/** 実効値が素の値と違うときだけ「（素N）」を添える */
const withBase = (label: string, effective: number, base: number): string =>
  effective === base ? `${label}${base}` : `${label}${effective}（素${base}）`;

/** 強化の出どころ（反復7 段階2）。札の名前ではなく働きで書く（支援札が増えても嘘にならない） */
const boostChipsOf = (effective: TowerEffective | undefined): string[] =>
  effective
    ? [
        ...(effective.auraDamageBonus > 0 ? [`支援で攻撃+${effective.auraDamageBonus}`] : []),
        ...(effective.auraRangeBonus > 0 ? [`支援で射程+${effective.auraRangeBonus}`] : []),
        ...(effective.isHighGround ? [`高台で攻撃×${HIGH_GROUND_DAMAGE_MULT}`] : []),
      ]
    : [];

/** 攻撃塔のチップ。実効値があればそれを主に、素の値を括弧で添える */
const attackChipsOf = (t: TowerSpec, effective: TowerEffective | undefined): string[] => [
  withBase('攻撃', effective?.damage ?? t.damage, t.damage),
  withBase('射程', effective?.range ?? t.range, t.range),
  `間隔${toSeconds(t.cooldownTicks)}秒`,
  t.hitsFlying ? '飛行に当たる' : '飛行に当たらない',
  t.piercing ? '貫通' : t.splashRadius > 0 ? `範囲${t.splashRadius}` : '単体',
  ...boostChipsOf(effective),
];

/** 役割ごとに出す能力を組み立てる（盤面に出さない詳細はすべてここへ集める） */
const chipsOf = (plate: PlateModel, isDuringCardSelection: boolean): string[] => {
  const card = getCardDefinition(plate.cardId);
  if (card.tower) {
    const t = card.tower;
    if (t.aura) {
      // 設計書 §5.2 の表は支援塔に「強化内容 / 効果範囲」を求めている。
      // HP は支援塔の判断材料にならない（攻撃されにくい後方に置く札のため）
      const parts: string[] = [];
      if (t.aura.towerDamageBonus) parts.push(`隣接の攻撃力 +${t.aura.towerDamageBonus * 100}%`);
      if (t.aura.towerRangeBonus) parts.push(`隣接の射程 +${t.aura.towerRangeBonus}`);
      return [...parts, `効果範囲 隣接${AURA_CELL_COUNT}マス`];
    }
    if (t.damage === 0) return [`HP${t.hp}`, '攻撃しない'];
    return attackChipsOf(t, plate.effective);
  }
  if (card.trap) {
    return [
      `ダメージ${card.trap.damage}`,
      `残り${plate.statusNow}回`,
      ...(card.trap.groundedTicks ? [`${toSeconds(card.trap.groundedTicks)}秒 地上化`] : []),
    ];
  }
  if (card.reactor) {
    return [`マナ+${card.reactor.manaPerTick}`, `${toSeconds(card.reactor.intervalTicks)}秒ごと`];
  }
  if (card.ember) {
    // 状態バーの分子分母（board-plates.ts）から残りクールダウンを戻す。
    // PlacedEmber そのものは PlateModel に載らないため、ここが唯一の経路。
    const cooldownLeftTicks = plate.statusMax - plate.statusNow;
    // 選択なしのときは、再点火できる燠火はタップが再点火に横取りされて
    // このパネルが開かない（設計書 §5.2 の優先順位）。反復7 段階2（§4.3 #4）で
    // カード選択中はタップが能力表示に回るようになり、選択中は再点火できる
    // 燠火でもこのパネルが開く。しかし選択中はタップしても再点火は起きないため、
    // 「クリックで再点火」を出すとその場では嘘になる。選択を解除すれば同じ
    // タップで再点火できるので、選択中はこのチップ自体を出さない。
    return [
      `ダメージ${card.ember.damage}`,
      `半径${card.ember.radius}`,
      `クールダウン${toSeconds(card.ember.cooldownTicks)}秒`,
      ...(cooldownLeftTicks > 0
        ? [`再点火まで${toSeconds(cooldownLeftTicks)}秒`]
        : isDuringCardSelection
          ? []
          : ['クリックで再点火']),
    ];
  }
  return [];
};

interface Props {
  plate: PlateModel;
  /**
   * いま札を選んでいるか（開いた時点ではなく現在の状態。反復7 段階2・設計書 §4.3 #4）。
   * 選択を解除すれば次のタップで再点火できるため、選択中は「クリックで再点火」チップを出さない。
   * 省略時は false
   */
  isDuringCardSelection?: boolean;
}

export const InspectPanel: React.FC<Props> = ({ plate, isDuringCardSelection = false }) => (
  <Panel data-testid="inspect-panel" role="status">
    <strong>
      {roleLabelOf(plate.visual.role)} {plate.visual.name}
    </strong>
    {chipsOf(plate, isDuringCardSelection).map((chip) => (
      <Chip key={chip}>{chip}</Chip>
    ))}
  </Panel>
);

/** 速度の表示の桁（0.06 マス/tick × 10 = 0.6000000000000001 を 0.6 にする） */
const SPEED_DISPLAY_DECIMALS = 1;

/**
 * 敵の種類の能力チップ（反復7 段階2・設計書 §4.3 #4・判定項目9(b)）
 *
 * 個体の今の HP ではなく種類の値を出す（HP はマーカーのバーが示す）。
 * 装甲・回復は凡例と同じ abilityTextsOf で作り、凡例と表記をずらさない。
 * 「射程 」（空白つき）で始めない（EnemyLegend.test.tsx が凡例の「射程 」の数を数えている）。
 */
export const enemyChipsOf = (spec: EnemySpec): string[] => [
  `HP${spec.hp}`,
  `速度${Number((spec.speed * TICKS_PER_SECOND).toFixed(SPEED_DISPLAY_DECIMALS))}マス/秒`,
  spec.flying ? '飛行' : '地上',
  `攻撃${spec.attack}（${toSeconds(spec.attackIntervalTicks)}秒ごと）`,
  spec.attackRange > 0 ? `射程${spec.attackRange}（経路の脇にも届く）` : '射程なし（塞いだ守り手だけ攻撃）',
  ...abilityTextsOf(spec),
];

/**
 * 敵の能力表示（反復7 段階2）
 *
 * 設置物の能力表示と同じ Panel（高さ INSPECT_ROW_HEIGHT_PX・折り返さない）を使い、
 * BoardInfoSlot の同じ1行に出す。枠の高さは変わらない。
 */
export const EnemyInspectPanel: React.FC<{ enemyId: string }> = ({ enemyId }) => {
  const spec = getEnemySpec(enemyId);
  return (
    <Panel data-testid="enemy-inspect-panel" role="status">
      <strong>敵 {spec.name}</strong>
      {enemyChipsOf(spec).map((chip) => (
        <Chip key={chip}>{chip}</Chip>
      ))}
    </Panel>
  );
};
