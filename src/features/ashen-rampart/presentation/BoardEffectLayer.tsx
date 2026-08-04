/**
 * 灰燼の城壁 - エフェクト層
 *
 * viewBox をセル座標系（0 0 width height）に一致させることで、
 * セル座標をそのまま x1/y1/x2/y2 に書ける（px 換算が不要）。
 * Frame は aspect-ratio 固定のため歪みは出ない。
 *
 * 色は theme.ts の既存トークンのみを使う。味方の行動（射撃・罠・燠火）は
 * secondary、脅威が与えた実害は danger / dangerText。
 *
 * danger は「漏れ専用」ではなく「脅威の実害」全般に一般化した
 * （反復2 の規約の趣旨は「罠のような味方の資産に赤を割り当てない」ことに
 * あり、要素名の列挙ではない。守り手の消滅は脅威が与えた実害であり
 * 趣旨に該当するため、漏れと同じ danger を使う）。罠はプレイヤーの資産の
 * ままなので、漏れ・消滅と区別して引き続き secondary を使う。
 * 被弾（unit-damaged）は高頻度な非致命の実害なので、danger より明度の
 * 高い dangerText を使い、消滅（致命）と視覚的な重みを分ける。
 * opportunity は BoardGrid が「再点火可能」の意味で使っているため使わない。
 */
import React from 'react';
import styled from 'styled-components';
import type { StageMap } from '../domain/board/stage-map';
import { EFFECT_DASH_PATTERN, EFFECT_STROKE_WIDTH, type Effect } from './combat-effects';
import { COLORS } from './theme';

/** セルの中心へ寄せる補正（セル座標は左上基準のため） */
const CENTER = 0.5;

const Svg = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /* 盤面セルのクリックを吸わない。
     z 順序は セル(0) < エフェクト(1) < 守り手のHPバー(2) < 敵マーカー(3) */
  pointer-events: none;
  z-index: 1;

  /* stroke-width を viewBox のスケールから独立させる。
     viewBox 座標系では stroke-width: 1 がセル1個分の太さになるため */
  line,
  circle,
  rect {
    vector-effect: non-scaling-stroke;
  }
`;

interface Props {
  effects: readonly Effect[];
  map: StageMap;
}

export const BoardEffectLayer: React.FC<Props> = ({ effects, map }) => (
  <Svg
    viewBox={`0 0 ${map.width} ${map.height}`}
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    {effects.map((effect) => {
      if (effect.kind === 'shot') {
        return (
          <line
            key={effect.id}
            data-effect="shot"
            x1={effect.from.x + CENTER}
            y1={effect.from.y + CENTER}
            x2={effect.to.x + CENTER}
            y2={effect.to.y + CENTER}
            stroke={COLORS.secondary}
            strokeWidth={effect.wide ? EFFECT_STROKE_WIDTH.shotWide : EFFECT_STROKE_WIDTH.shot}
            strokeDasharray={effect.dashed ? EFFECT_DASH_PATTERN : undefined}
            opacity={0.8}
          />
        );
      }
      if (effect.kind === 'defeat') {
        return (
          <g key={effect.id}>
            <line
              data-effect="defeat"
              x1={effect.from.x + CENTER}
              y1={effect.from.y + CENTER}
              x2={effect.to.x + CENTER}
              y2={effect.to.y + CENTER}
              stroke={COLORS.secondary}
              strokeWidth={EFFECT_STROKE_WIDTH.defeat}
            />
            {/* 終端の ✕。色だけでなく形でも撃破と分かるようにする */}
            <g
              data-effect="defeat-mark"
              stroke={COLORS.secondary}
              strokeWidth={EFFECT_STROKE_WIDTH.defeatMark}
            >
              <line
                x1={effect.to.x + 0.25}
                y1={effect.to.y + 0.25}
                x2={effect.to.x + 0.75}
                y2={effect.to.y + 0.75}
              />
              <line
                x1={effect.to.x + 0.75}
                y1={effect.to.y + 0.25}
                x2={effect.to.x + 0.25}
                y2={effect.to.y + 0.75}
              />
            </g>
          </g>
        );
      }
      if (effect.kind === 'trap') {
        return (
          <rect
            key={effect.id}
            data-effect="trap"
            x={effect.at.x + 0.05}
            y={effect.at.y + 0.05}
            width={0.9}
            height={0.9}
            fill="none"
            stroke={COLORS.secondary}
            strokeWidth={EFFECT_STROKE_WIDTH.trap}
          />
        );
      }
      if (effect.kind === 'ember') {
        return (
          <circle
            key={effect.id}
            data-effect="ember"
            cx={effect.at.x + CENTER}
            cy={effect.at.y + CENTER}
            r={effect.radius}
            fill="none"
            stroke={COLORS.secondary}
            strokeWidth={EFFECT_STROKE_WIDTH.ember}
            opacity={0.7}
          />
        );
      }
      if (effect.kind === 'leak') {
        return (
          <rect
            key={effect.id}
            data-effect="leak"
            x={effect.at.x}
            y={effect.at.y}
            width={1}
            height={1}
            fill={COLORS.danger}
            opacity={0.65}
          />
        );
      }
      if (effect.kind === 'unit-damaged') {
        // 被弾: 攻撃間隔ごとに出る高頻度の出来事なので、細い矩形の縁取りに
        // 留める。消滅（✕）と形で区別できるので、色（dangerText）だけに
        // 情報を載せていない。
        return (
          <rect
            key={effect.id}
            data-effect="unit-damaged"
            x={effect.pos.x + 0.1}
            y={effect.pos.y + 0.1}
            width={0.8}
            height={0.8}
            fill="none"
            stroke={COLORS.dangerText}
            strokeWidth={EFFECT_STROKE_WIDTH.unitDamaged}
          />
        );
      }
      // unit-lost: 守り手の消滅。取り返しがつかない実害なので ✕ で強く示し、
      // 被弾（矩形）とは形で区別する。
      return (
        <g key={effect.id} data-effect="unit-lost">
          <line
            x1={effect.pos.x + 0.25}
            y1={effect.pos.y + 0.25}
            x2={effect.pos.x + 0.75}
            y2={effect.pos.y + 0.75}
            stroke={COLORS.danger}
            strokeWidth={EFFECT_STROKE_WIDTH.unitLost}
          />
          <line
            x1={effect.pos.x + 0.75}
            y1={effect.pos.y + 0.25}
            x2={effect.pos.x + 0.25}
            y2={effect.pos.y + 0.75}
            stroke={COLORS.danger}
            strokeWidth={EFFECT_STROKE_WIDTH.unitLost}
          />
        </g>
      );
    })}
  </Svg>
);
