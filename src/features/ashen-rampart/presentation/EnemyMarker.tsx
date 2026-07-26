/**
 * 灰燼の城壁 - 敵マーカー
 *
 * 敵種を形・サイズ・色で描き分け、HP を背景トラック付きバーで示す。
 * トラックが無いと「満タンかどうか」しか読めないため、必ず土台を敷く。
 */
import React from 'react';
import styled from 'styled-components';
import type { EnemySnapshot } from '../domain/combat/simulate-wave';
import {
  getEnemyVisual,
  getHpBarWidthPct,
  getShapeClipPath,
  HP_BAR_COLOR,
} from './enemy-visual';

const Wrapper = styled.div<{ $x: number; $y: number; $size: number }>`
  position: absolute;
  width: ${({ $size }) => $size}%;
  aspect-ratio: 1;
  left: ${({ $x }) => $x}%;
  top: ${({ $y }) => $y}%;
  transform: translate(-50%, -50%);
  transition:
    left 0.1s linear,
    top 0.1s linear;
  pointer-events: none;
`;

const Ring = styled.div<{ $color: string; $clip?: string }>`
  position: absolute;
  inset: 0;
  background: ${({ $color }) => $color};
  clip-path: ${({ $clip }) => $clip ?? 'none'};
  border-radius: ${({ $clip }) => ($clip ? '0' : '50%')};
`;

const Body = styled.div<{ $color: string; $clip?: string; $inset: string }>`
  position: absolute;
  inset: ${({ $inset }) => $inset};
  background: ${({ $color }) => $color};
  clip-path: ${({ $clip }) => $clip ?? 'none'};
  border-radius: ${({ $clip }) => ($clip ? '0' : '50%')};
`;

/**
 * HP バー
 *
 * 全長は最大HPの絶対スケール（硬い敵ほど長い）。マーカーに密着させて、
 * セルのテキストラベルを覆う面積を最小化する。
 */
const HpTrack = styled.div<{ $widthPct: number }>`
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%);
  width: ${({ $widthPct }) => $widthPct}%;
  height: 4px;
  background: #14100f;
  border: 1px solid #6b5f57;
  border-radius: 2px;
  overflow: hidden;
`;

const HpFill = styled.div<{ $ratio: number }>`
  height: 100%;
  width: ${({ $ratio }) => Math.max(0, Math.min(1, $ratio)) * 100}%;
  background: ${HP_BAR_COLOR};
`;

interface Props {
  enemy: EnemySnapshot;
  /** 盤面の列数・行数（セル座標を % に変換するため） */
  boardWidth: number;
  boardHeight: number;
  /** 砦までの残りセル数。読み取れない場合は undefined */
  cellsToFortress?: number;
}

export const EnemyMarker: React.FC<Props> = ({
  enemy,
  boardWidth,
  boardHeight,
  cellsToFortress,
}) => {
  const visual = getEnemyVisual(enemy.enemyId);
  const clip = getShapeClipPath(visual.shape);
  const ratio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 0;
  const distanceText =
    cellsToFortress === undefined ? '' : `・砦まで残り${cellsToFortress}マス`;

  return (
    <Wrapper
      role="img"
      aria-label={`敵: ${visual.name} HP ${Math.max(0, Math.round(enemy.hp))}/${enemy.maxHp}${distanceText}`}
      $x={((enemy.x + 0.5) / boardWidth) * 100}
      $y={((enemy.y + 0.5) / boardHeight) * 100}
      $size={visual.sizePct}
    >
      <HpTrack $widthPct={(getHpBarWidthPct(enemy.maxHp) / visual.sizePct) * 100}>
        <HpFill $ratio={ratio} />
      </HpTrack>
      {visual.ringColor && <Ring $color={visual.ringColor} $clip={clip} />}
      <Body
        $color={visual.color}
        $clip={clip}
        $inset={visual.ringColor ? '18%' : '0'}
      />
    </Wrapper>
  );
};
