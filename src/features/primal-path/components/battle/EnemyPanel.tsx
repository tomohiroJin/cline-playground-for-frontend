/**
 * 敵表示パネルコンポーネント
 * 敵スプライト、HP/ステータス、ダメージポップアップを表示
 */
import React, { useRef, useEffect } from 'react';
import type { Enemy } from '../../types';
import { drawEnemy, drawBurnFx } from '../../sprites';
import { HpBar } from '../shared';
import { GamePanel, EnemySprite, StatText, PopupContainer, PopupText } from '../../styles';
import type { PopupEntry } from './use-battle-popups';

export interface EnemyPanelProps {
  enemy: Enemy;
  boss: boolean;
  burn: number;
  turn: number;
  isHit: boolean;
  popups: PopupEntry[];
}

export const EnemyPanel: React.FC<EnemyPanelProps> = ({ enemy, boss, burn, turn, isHit, popups }) => {
  const esprRef = useRef<HTMLCanvasElement>(null);
  const burnFrameRef = useRef(0);

  // 敵スプライト描画
  useEffect(() => {
    if (esprRef.current) {
      drawEnemy(esprRef.current, enemy.n, boss, 2);
      if (burn) {
        const ctx = esprRef.current.getContext('2d');
        if (ctx) {
          burnFrameRef.current++;
          drawBurnFx(ctx, esprRef.current.width, esprRef.current.height, burnFrameRef.current);
        }
      }
    }
  }, [enemy.n, enemy.hp, enemy.mhp, boss, burn, turn]);

  return (
    <GamePanel style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <EnemySprite ref={esprRef} aria-hidden="true" $hit={isHit} $burn={!!burn} style={{
          width: boss ? 52 : 34, height: boss ? 52 : 34,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: boss ? '#ff6040' : '#f05050', marginBottom: 2 }}>
            {boss ? '👑 ' : ''}{enemy.n}{enemy.hp <= 0 ? ' 💀' : ''}
            {burn ? <span style={{ marginLeft: 4, fontSize: 13, animation: 'none' }}>🔥</span> : null}
          </div>
          <HpBar value={enemy.hp} max={enemy.mhp} variant="eh" showPct />
          <StatText>ATK {enemy.atk} DEF {enemy.def} <span style={{ color: '#c0a040' }}>🦴{enemy.bone}</span></StatText>
        </div>
      </div>
      <PopupContainer>
        {popups.map(p => (
          <PopupText key={p.id} style={{ left: `${p.x}%`, color: p.cl, fontSize: p.fs }}>{p.v}</PopupText>
        ))}
      </PopupContainer>
    </GamePanel>
  );
};
