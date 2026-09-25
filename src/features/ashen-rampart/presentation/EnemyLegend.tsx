/**
 * 灰燼の城壁 - 敵の凡例
 *
 * S1 の教訓: 形を描き分けても、記号を意味に接続する索引が無いと
 * 「赤丸とオレンジ菱形がある」止まりになる。凡例は必須。
 *
 * 反復5: 一部の敵は経路の脇に置いた守り手も攻撃するようになった。
 * 射程が見えなければ、経路外は安全という前提が裏切られ理不尽な事故になる。
 */
import React from 'react';
import styled from 'styled-components';
import { ENEMY_IDS, getEnemySpec, type EnemySpec } from '../domain/combat/enemies';
import { getEnemyVisual, getShapeClipPath } from './enemy-visual';
import { toSeconds } from './card-text';
import { COLORS } from './theme';

const List = styled.ul`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  list-style: none;
  margin: 0;
  padding: 8px;
  color: ${COLORS.secondary};
`;

const Item = styled.li`
  display: flex;
`;

/**
 * 凡例の1項目＝その敵の能力表示を開くボタン（反復7 段階2・設計書 §4.3 #4）
 *
 * 盤面の敵マーカーは小さく動き続けるので、狙って押すのは難しい（特に 360px）。
 * 凡例は動かないので、いつでも確実に開ける入口になる。見た目は従来の凡例のままにし、
 * 開いている種類だけ枠の色で示す（aria-pressed と対応）。枠は常に 1px なので押しても大きさは変わらない。
 * 高さは 32px（WCAG 2.5.8 の最小 24px を満たす）。44px にすると 360px で7種が4行に折り返し、
 * 手札が画面の下へ押し出される。
 */
const LEGEND_BUTTON_MIN_HEIGHT_PX = 32;

const ItemButton = styled.button<{ $pressed: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: ${LEGEND_BUTTON_MIN_HEIGHT_PX}px;
  padding: 0 6px;
  font: inherit;
  font-size: 12px;
  color: ${COLORS.secondary};
  background: transparent;
  border: 1px solid ${({ $pressed }) => ($pressed ? COLORS.secondary : 'transparent')};
  border-radius: 4px;
  cursor: pointer;
`;

const Swatch = styled.span<{ $color: string; $clip?: string }>`
  width: 12px;
  height: 12px;
  background: ${({ $color }) => $color};
  clip-path: ${({ $clip }) => $clip ?? 'none'};
  border-radius: ${({ $clip }) => ($clip ? '0' : '50%')};
`;

const Stat = styled.span`
  color: ${COLORS.secondary};
`;

const Note = styled.p`
  margin: 0;
  padding: 0 8px 8px;
  font-size: 11px;
  color: ${COLORS.secondary};
`;

/**
 * 敵の能力を凡例の短い表記にする（反復7 段階2）
 *
 * 「射程 」で始めない（既存のテストが「射程 」の数で射程持ちを数えている）。
 */
export const abilityTextsOf = (spec: EnemySpec): string[] => [
  ...(spec.armor ? [`装甲${spec.armor}`] : []),
  ...(spec.heal
    ? [`回復${spec.heal.amount}（${toSeconds(spec.heal.intervalTicks)}秒ごと・周囲${spec.heal.radius}）`]
    : []),
];

interface Props {
  /** いま能力表示を開いている敵の種類（反復7 段階2） */
  inspectedEnemyId?: string;
  /** 項目を押したとき（反復7 段階2）。省略時は何もしない（既存の呼び出しの互換） */
  onInspect?: (enemyId: string) => void;
}

export const EnemyLegend: React.FC<Props> = ({ inspectedEnemyId, onInspect }) => (
  <>
    <List aria-label="敵の凡例">
      {ENEMY_IDS.map((id) => {
        const visual = getEnemyVisual(id);
        const spec = getEnemySpec(id);
        const isPressed = inspectedEnemyId === id;
        return (
          <Item key={id}>
            <ItemButton
              type="button"
              aria-label={`${spec.name} の能力を見る`}
              aria-pressed={isPressed}
              $pressed={isPressed}
              onClick={() => onInspect?.(id)}
            >
              <Swatch $color={visual.color} $clip={getShapeClipPath(visual.shape)} />
              <span>
                {visual.name}
                {spec.flying ? '（飛行・弩砲のみ有効）' : ''}
              </span>
              {spec.attackRange > 0 && <Stat>射程 {spec.attackRange}</Stat>}
              {abilityTextsOf(spec).map((text) => (
                <Stat key={text}>{text}</Stat>
              ))}
            </ItemButton>
          </Item>
        );
      })}
    </List>
    <Note>射程を持つ敵は、経路の脇に置いた守り手も削ります。</Note>
    <Note>装甲: 1撃ごとにその値だけダメージを減らす（0 まで）。</Note>
    <Note>回復: 一定の間隔で、周りの敵の HP を戻す。</Note>
  </>
);
