/**
 * プレイヤー表示パネルコンポーネント
 * プレイヤースプライト、HP/ステータス、バフ、シナジー、ポップアップを表示
 */
import React, { useRef, useEffect, useMemo } from 'react';
import type { RunState } from '../../types';
import { A_SKILLS, TB_SUMMARY } from '../../constants';
import { effATK, civLvs, calcSynergies, applySynergyBonuses } from '../../game-logic';
import { drawPlayer } from '../../sprites';
import { HpBar, CivLevelsDisplay, AffinityBadge, AllyList, SynergyBadges } from '../shared';
import { GamePanel, StatText, Tc, Bc, PopupContainer, PopupText } from '../../styles';
import type { PopupEntry } from './use-battle-popups';

/** 低HP時の儀式発動閾値 */
const RIT_LOW_HP_RATIO = 0.3;

export interface PlayerPanelProps {
  run: RunState;
  popups: PopupEntry[];
}

export const PlayerPanel: React.FC<PlayerPanelProps> = ({ run, popups }) => {
  const psprRef = useRef<HTMLCanvasElement>(null);

  // プレイヤースプライト描画
  useEffect(() => {
    if (psprRef.current) drawPlayer(psprRef.current, 2, run.fe, run.awoken);
  }, [run.fe, run.awoken]);

  const lvs = civLvs(run);
  const activeSynergies = useMemo(() => calcSynergies(run.evs), [run.evs]);
  const synergyBonus = useMemo(() => applySynergyBonuses(activeSynergies), [activeSynergies]);
  const tbParts = useMemo(() => TB_SUMMARY.filter(s => run.tb[s.k] !== 0).map(s => s.f(run.tb[s.k])), [run.tb]);
  const ritActive = run.fe === 'rit' && run.hp < run.mhp * RIT_LOW_HP_RATIO;
  const activeBuffs = run.sk.bfs;

  const feLabel = run.awoken.map(a => (
    <span key={a.id} style={{ color: a.cl, fontSize: 11 }}>{a.nm} </span>
  ));

  return (
    <GamePanel style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <canvas ref={psprRef} aria-hidden="true" style={{
          width: 54, height: 72,
          border: '1px solid #222', borderRadius: 3, background: '#08080c', flexShrink: 0,
          imageRendering: 'pixelated',
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: '#50e090', marginBottom: 2 }}>
            部族長 {feLabel}
            <AffinityBadge biome={run.cBT} levels={lvs} />
            {ritActive && (
              <span style={{ fontSize: 7, color: '#ff4060', background: '#ff406015', border: '1px solid #ff406030', padding: '1px 5px', borderRadius: 6 }}>⚡ATK×3</span>
            )}
          </div>
          <HpBar value={run.hp} max={run.mhp} variant="hp" low={run.hp < run.mhp * 0.25} showPct />
          <StatText>
            ATK <Tc>{effATK(run)}</Tc>{synergyBonus.atkBonus > 0 && <span style={{ color: '#f0c040', fontSize: 7 }}>+{synergyBonus.atkBonus}</span>}{' '}
            DEF <span style={{ color: '#50c8e8' }}>{run.def}</span>{synergyBonus.defBonus > 0 && <span style={{ color: '#50c8e8', fontSize: 7 }}>+{synergyBonus.defBonus}</span>}{' '}
            🦴<Bc>{run.bE}</Bc> <CivLevelsDisplay run={run} />
          </StatText>
          {tbParts.length > 0 && (
            <div style={{ fontSize: 13, color: '#aaa', marginTop: 1 }}>🌳 {tbParts.join(' ')}</div>
          )}
        </div>
      </div>
      <AllyList allies={run.al} mode="battle" />
      {activeBuffs.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 2, justifyContent: 'center' }}>
          {activeBuffs.map((b, i) => {
            const def = A_SKILLS.find(s => s.id === b.sid);
            return (
              <span key={i} style={{ fontSize: 11, color: '#f0c040', background: '#f0c04015', border: '1px solid #f0c04025', padding: '1px 4px', borderRadius: 4 }}>
                {def?.ic} {b.rT}T
              </span>
            );
          })}
        </div>
      )}
      <SynergyBadges synergies={activeSynergies} />
      <PopupContainer>
        {popups.map(p => (
          <PopupText key={p.id} style={{ left: `${p.x}%`, color: p.cl, fontSize: p.fs }}>
            {p.heal ? '+' : ''}{p.v}
          </PopupText>
        ))}
      </PopupContainer>
    </GamePanel>
  );
};
