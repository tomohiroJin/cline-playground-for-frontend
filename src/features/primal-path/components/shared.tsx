/**
 * 原始進化録 - PRIMAL PATH - 共有UIコンポーネント
 */
import React from 'react';
import type { Ally, RunState, CivTypeExt, BiomeIdExt, CivLevels, AwokenRecord, ActiveSynergy } from '../types';
import type { GameAction } from '../hooks';
import { TC, TN, BIO, SYNERGY_TAG_INFO, SPEED_OPTS } from '../constants';
import { effATK, civLvs, biomeBonus } from '../game-logic';
import { AllyBadge, AllyRow, SpeedBtn, Tc, Lc, Rc } from '../styles';

/* ===== ProgressBar ===== */

export const ProgressBar: React.FC<{ current: number; max: number; label: string }> = ({ current, max, label }) => {
  const pct = Math.min(100, (current / max) * 100);
  return (
    <div style={{ width: '100%', marginBottom: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#605848', marginBottom: 1 }}>
        <span>{label}</span><span>{current}/{max}</span>
      </div>
      <div style={{ background: '#1a1a22', height: 6, borderRadius: 3, overflow: 'hidden', border: '1px solid #1a1a28' }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg,#f0c040,#f08040)', borderRadius: 3, transition: 'width .4s', width: `${pct}%` }} />
      </div>
    </div>
  );
};

/* ===== HpBar ===== */

export const HpBar: React.FC<{ value: number; max: number; variant: 'hp' | 'eh'; showPct?: boolean; low?: boolean }> = ({ value, max, variant, showPct, low }) => {
  const pct = Math.max(0, (value / max) * 100);
  const bg = variant === 'hp' ? 'linear-gradient(180deg,#5e5,#2a2)' : 'linear-gradient(180deg,#e55,#a22)';
  return (
    <div style={{ background: '#16161e', height: 14, width: '100%', border: '1px solid #2a2a3a', position: 'relative', borderRadius: 2, overflow: 'hidden', margin: '2px 0' }}>
      <div style={{
        height: '100%', transition: 'width .3s', width: `${pct}%`, background: low ? 'linear-gradient(180deg,#e55,#a22)' : bg,
        ...(low ? { animation: 'barPulse .8s infinite' } : {}),
      }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', textAlign: 'center', fontSize: 9, lineHeight: '14px', color: '#fff', textShadow: '0 1px 2px #000' }}>
        {Math.max(0, value)}/{max}{showPct ? ` (${Math.round(pct)}%)` : ''}
      </div>
    </div>
  );
};

/* ===== StatPreview ===== */

export const StatPreview: React.FC<{ label: string; current: number; next: number; max: number; color: string }> = ({ label, current, next, max, color }) => {
  const pC = Math.min(100, (current / max) * 100);
  const pN = Math.min(100, (next / max) * 100);
  const diff = next - current;
  const baseW = Math.min(pC, pN);
  const deltaStart = next > current ? pC : next < current ? pN : 0;
  const deltaW = Math.abs(pN - pC);
  const deltaColor = next > current ? '#50e090' : next < current ? '#f05050' : 'transparent';

  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center', margin: '1px 0', fontSize: 8 }}>
      <div style={{ width: 22, color: '#605848', textAlign: 'right', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 5, background: '#1a1a22', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: '100%', borderRadius: 3, position: 'absolute', top: 0, left: 0, transition: 'width .2s', width: `${baseW}%`, background: color }} />
        <div style={{ height: '100%', borderRadius: 3, position: 'absolute', top: 0, left: `${deltaStart}%`, width: `${deltaW}%`, background: deltaColor, opacity: 0.7 }} />
      </div>
      <div style={{ minWidth: 52, color: '#908870', fontSize: 8, flexShrink: 0, textAlign: 'right' }}>
        {next}{' '}
        {diff > 0 ? <span style={{ color: '#50e090' }}>+{diff}</span>
          : diff < 0 ? <span style={{ color: '#f05050' }}>{diff}</span>
          : <span style={{ color: '#605848' }}>±0</span>}
      </div>
    </div>
  );
};

/* ===== CivBadge ===== */

export const CivBadge: React.FC<{ type: CivTypeExt; extra?: string }> = ({ type, extra }) => (
  <span style={{
    background: TC[type] + '18', color: TC[type], border: `1px solid ${TC[type]}40`,
    fontSize: 8, padding: '1px 6px', borderRadius: 10, display: 'inline-block',
  }}>
    {extra || ''}{TN[type]}
  </span>
);

/* ===== AwakeningBadges ===== */

export const AwakeningBadges: React.FC<{ awoken: AwokenRecord[] }> = ({ awoken }) => (
  <>
    {awoken.map(a => (
      <span key={a.id} style={{
        fontSize: 8, padding: '1px 5px', borderRadius: 8, display: 'inline-block', margin: '1px',
        background: a.cl + '20', color: a.cl, border: `1px solid ${a.cl}40`,
      }}>
        {a.nm}
      </span>
    ))}
  </>
);

/* ===== CivLevels display ===== */

export const CivLevelsDisplay: React.FC<{ run: RunState }> = ({ run }) => (
  <span>
    <Tc>技{run.cT}</Tc> / <Lc>生{run.cL}</Lc> / <Rc>儀{run.cR}</Rc>
  </span>
);

/* ===== StatLine ===== */

export const StatLine: React.FC<{ run: RunState }> = ({ run }) => (
  <span>
    HP <span style={{ color: '#e0d8c8' }}>{run.hp}/{run.mhp}</span>{' '}
    ATK <Tc>{effATK(run)}</Tc>{' '}
    DEF <span style={{ color: '#50c8e8' }}>{run.def}</span>
  </span>
);

/* ===== AffinityBadge ===== */

export const AffinityBadge: React.FC<{ biome: BiomeIdExt; levels: CivLevels }> = ({ biome, levels }) => {
  if (biome === 'final') return null;
  const afn = biomeBonus(biome, levels);
  return afn > 1
    ? <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 6, display: 'inline-block', marginLeft: 3, color: '#50e090', background: '#50e09015', border: '1px solid #50e09030' }}>相性◎ ×{afn}</span>
    : <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 6, display: 'inline-block', marginLeft: 3, color: '#605848', background: '#60584810', border: '1px solid #60584820' }}>相性─</span>;
};

/* ===== SynergyBadges ===== */

export const SynergyBadges: React.FC<{ synergies: ActiveSynergy[]; showCount?: boolean }> = ({ synergies, showCount }) => {
  if (!synergies.length) return null;
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 3 }}>
      {synergies.map(s => {
        const info = SYNERGY_TAG_INFO[s.tag];
        return (
          <span key={s.tag} style={{
            fontSize: 7, color: info.cl, background: info.cl + '15',
            border: `1px solid ${info.cl}40`, padding: '0 4px', borderRadius: 4,
          }}>
            {info.ic}{showCount ? `×${s.count} ` : ''}{s.bonusName}
          </span>
        );
      })}
    </div>
  );
};

/* ===== SpeedControl（速度切替の共有コンポーネント） ===== */

/** 速度切替ボタン群。SpeedBar 内で使用する */
export const SpeedControl: React.FC<{
  battleSpd: number;
  dispatch: React.Dispatch<GameAction>;
}> = ({ battleSpd, dispatch }) => (
  <>
    <span style={{ fontSize: 8, color: '#403828' }}>速度</span>
    {SPEED_OPTS.map(([label, spd]) => (
      <SpeedBtn key={spd} $active={battleSpd === spd}
        onClick={() => dispatch({ type: 'CHANGE_SPEED', speed: spd })}>
        {label}
      </SpeedBtn>
    ))}
    <SpeedBtn $active={battleSpd === 0}
      onClick={() => dispatch({ type: 'CHANGE_SPEED', speed: 0 })}>
      ⏸
    </SpeedBtn>
  </>
);

/* ===== renderParticles ===== */

const DEFAULT_PARTICLE_COUNT = 24;

/** パーティクルのランダム配置を生成 */
export function renderParticles(biome: string, count = DEFAULT_PARTICLE_COUNT): React.ReactNode[] {
  if (biome !== 'glacier' && biome !== 'volcano' && biome !== 'grassland') return [];
  return Array.from({ length: count }, (_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 6;
    const duration = 4 + Math.random() * 4;
    return (
      <span
        key={i}
        style={{
          left: `${left}%`,
          top: biome === 'volcano' ? 'auto' : `${Math.random() * 20}%`,
          bottom: biome === 'volcano' ? '0' : 'auto',
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
        }}
      />
    );
  });
}

/* ===== AllyList ===== */

export const AllyList: React.FC<{ allies: Ally[]; mode: 'evo' | 'battle' }> = ({ allies, mode }) => {
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
                    const { drawAlly } = require('../sprites');
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
