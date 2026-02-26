// ゲーム盤面描画コンポーネント

import React from 'react';
import type { GameState } from '../types';
import { CONFIG } from '../constants';
import { Block } from '../block';
import { CellComponent } from './CellView';
import { BulletView } from './BulletView';
import { PlayerShip } from './PlayerShip';
import { LaserEffectComponent, ExplosionEffectComponent, BlastEffectComponent } from './Effects';
import { GameArea, DangerLine } from '../../../pages/FallingShooterPage.styles';

interface GameBoardProps {
  state: GameState;
  playerX: number;
  cellSize: number;
  explosions: { id: string; x: number; y: number }[];
  laserX: number | null;
  showBlast: boolean;
}

/** グリッド・ブロック・弾丸・エフェクト・プレイヤーを描画する */
export const GameBoard: React.FC<GameBoardProps> = ({
  state,
  playerX,
  cellSize: SZ,
  explosions,
  laserX,
  showBlast,
}) => {
  const { width: W, height: H } = CONFIG.grid;

  return (
    <GameArea
      $width={W * SZ}
      $height={H * SZ}
      role="region"
      aria-label="シューティングパズルゲーム画面"
      tabIndex={0}
    >
      {state.grid.map((row, y) =>
        row.map(
          (color, x) =>
            color && <CellComponent key={`g${x}${y}`} x={x} y={y} color={color} size={SZ} />
        )
      )}

      {state.blocks.map(block =>
        Block.getCells(block).map(
          (cell, i) =>
            cell.y >= 0 && (
              <CellComponent
                key={`b${block.id}${i}`}
                x={cell.x}
                y={cell.y}
                color={block.color}
                size={SZ}
                power={i === 0 ? block.power : null}
              />
            )
        )
      )}

      {state.bullets.map(b => (
        <BulletView key={b.id} bullet={b} size={SZ} />
      ))}
      {explosions.map(e => (
        <ExplosionEffectComponent key={e.id} x={e.x} y={e.y} size={SZ} />
      ))}
      {laserX !== null && <LaserEffectComponent x={laserX} size={SZ} height={H} />}
      <BlastEffectComponent visible={showBlast} />
      <PlayerShip x={playerX} y={state.playerY} size={SZ} />

      <DangerLine $top={SZ * CONFIG.dangerLine} />
    </GameArea>
  );
};
