import React, { useRef, useEffect } from 'react';
import type { RunState, BiomeId, SfxType } from '../types';
import type { GameAction } from '../hooks';
import { BIO, TC, SPEED_OPTS, LOG_COLORS } from '../constants';
import { effATK, civLvs, biomeBonus } from '../game-logic';
import { drawEnemy, drawPlayer, drawAlly } from '../sprites';
import { ProgressBar, HpBar, CivLevelsDisplay, AffinityBadge, AllyList } from './shared';
import { Screen, GamePanel, StatText, SpeedBar, SpeedBtn, SurrenderBtn, LogContainer, LogLine, Tc, Lc, Rc, Gc, Bc, PausedOverlay } from '../styles';

interface Props {
  run: RunState;
  finalMode: boolean;
  battleSpd: number;
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
}

export const BattleScreen: React.FC<Props> = ({ run, finalMode, battleSpd, dispatch, playSfx }) => {
  const esprRef = useRef<HTMLCanvasElement>(null);
  const psprRef = useRef<HTMLCanvasElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const e = run.en;
  const m = BIO[run.cBT as BiomeId];
  const boss = run.cW > run.wpb || finalMode;
  const lvs = civLvs(run);
  const wDps = run.wTurn > 0 ? Math.floor((run.dmgDealt - (run._wDmgBase || 0)) / run.wTurn) : 0;

  const lbl = finalMode
    ? '⚡ 最終決戦' + (run._fPhase === 2 ? ' Phase2' : '')
    : m ? `${m.ic} ${m.nm}${boss ? ' BOSS' : ` Wave ${run.cW}/${run.wpb}`}` : '⚡';

  // Draw sprites
  useEffect(() => {
    if (esprRef.current && e) drawEnemy(esprRef.current, e.n, boss, 2);
  }, [e?.n, boss]);

  useEffect(() => {
    if (psprRef.current) drawPlayer(psprRef.current, 2, run.fe);
  }, [run.fe]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [run.log.length]);

  if (!e) return null;

  const ritActive = run.fe === 'rit' && run.hp < run.mhp * 0.3;
  const feLabel = run.awoken.map(a => (
    <span key={a.id} style={{ color: a.cl, fontSize: 8 }}>{a.nm} </span>
  ));

  return (
    <Screen>
      <ProgressBar current={Math.min(run.cW, run.wpb + 1)} max={run.wpb + 1} label={lbl} />

      <SpeedBar>
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
        <span style={{ fontSize: 8, color: '#403828', marginLeft: 4 }}>T{run.turn} DPS:{wDps}</span>
        <SurrenderBtn onClick={() => {
          if (window.confirm('降伏しますか？骨は半分になります。')) {
            dispatch({ type: 'SURRENDER' });
          }
        }}>
          降伏
        </SurrenderBtn>
      </SpeedBar>

      {/* Enemy panel */}
      <GamePanel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <canvas ref={esprRef} style={{
            width: boss ? 52 : 34, height: boss ? 52 : 34,
            border: '1px solid #222', borderRadius: 3, background: '#08080c', flexShrink: 0,
            imageRendering: 'pixelated',
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: boss ? '#ff6040' : '#f05050', marginBottom: 2 }}>
              {boss ? '👑 ' : ''}{e.n}{e.hp <= 0 ? ' 💀' : ''}
            </div>
            <HpBar value={e.hp} max={e.mhp} variant="eh" showPct />
            <StatText>ATK {e.atk} DEF {e.def} <span style={{ color: '#c0a040' }}>🦴{e.bone}</span></StatText>
          </div>
        </div>
      </GamePanel>

      <div style={{ fontSize: 10, color: '#302818', margin: '3px 0', letterSpacing: 4, textAlign: 'center' }}>── ⚔ ──</div>

      {/* Player panel */}
      <GamePanel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <canvas ref={psprRef} style={{
            width: 40, height: 55,
            border: '1px solid #222', borderRadius: 3, background: '#08080c', flexShrink: 0,
            imageRendering: 'pixelated',
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#50e090', marginBottom: 2 }}>
              部族長 {feLabel}
              <AffinityBadge biome={run.cBT} levels={lvs} />
              {ritActive && (
                <span style={{ fontSize: 7, color: '#ff4060', background: '#ff406015', border: '1px solid #ff406030', padding: '1px 5px', borderRadius: 6 }}>
                  ⚡ATK×3
                </span>
              )}
            </div>
            <HpBar value={run.hp} max={run.mhp} variant="hp" low={run.hp < run.mhp * 0.25} />
            <StatText>
              ATK <Tc>{effATK(run)}</Tc> DEF <span style={{ color: '#50c8e8' }}>{run.def}</span>{' '}
              🦴<Bc>{run.bE}</Bc> <CivLevelsDisplay run={run} />
            </StatText>
          </div>
        </div>
        <AllyList allies={run.al} mode="battle" />
      </GamePanel>

      {/* Battle log */}
      <LogContainer ref={logRef}>
        {run.log.slice(-28).map((l, i) => (
          <LogLine key={i} $color={LOG_COLORS[l.c]}>{l.x}</LogLine>
        ))}
      </LogContainer>

      {/* 一時停止オーバーレイ */}
      {battleSpd === 0 && <PausedOverlay>PAUSED</PausedOverlay>}
    </Screen>
  );
};
