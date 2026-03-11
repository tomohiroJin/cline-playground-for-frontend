/**
 * 仲間リストコンポーネント
 * バトル/進化画面での仲間表示
 */
import React from 'react';
import type { Ally } from '../../types';
import { TC } from '../../constants';
import { drawAlly } from '../../sprites';
import { AllyBadge, AllyRow } from '../../styles';

export interface AllyListProps {
  allies: Ally[];
  mode: 'evo' | 'battle';
}

export const AllyList: React.FC<AllyListProps> = ({ allies, mode }) => {
  if (!allies.length) return null;
  return (
    <AllyRow>
      {allies.map((a, i) => {
        if (mode === 'battle') {
          const hpPct = a.a ? Math.max(0, (a.hp / a.mhp) * 100) : 0;
          const hpCl = hpPct < 25 ? '#e55' : hpPct < 50 ? '#e0a040' : TC[a.t];
          return (
            <AllyBadge key={i} $dead={!a.a}>
              <canvas
                aria-hidden="true"
                ref={c => {
                  if (c) {
                    drawAlly(c, a.t, 2);
                  }
                }}
                style={{ width: 20, height: 26, margin: '0 auto 1px', display: 'block', imageRendering: 'pixelated' }}
              />
              <div style={{ color: TC[a.t] }}>{a.n}</div>
              {a.a && (
                <div style={{ height: 3, background: '#1a1a22', borderRadius: 2, overflow: 'hidden', marginTop: 1, width: '100%' }}>
                  <div style={{ height: '100%', borderRadius: 2, transition: 'width .2s', width: `${hpPct}%`, background: hpCl }} />
                </div>
              )}
              <div style={{ fontSize: 8, color: '#605848' }}>{a.a ? `${a.hp}/${a.mhp}` : '💀'}</div>
            </AllyBadge>
          );
        }
        return (
          <AllyBadge key={i} $dead={!a.a}>
            <span style={{ color: TC[a.t] }}>{a.n}</span>{' '}
            <span style={{ fontSize: 8, color: '#605848' }}>{a.a ? `HP${a.hp}` : '💀'}</span>
          </AllyBadge>
        );
      })}
    </AllyRow>
  );
};
