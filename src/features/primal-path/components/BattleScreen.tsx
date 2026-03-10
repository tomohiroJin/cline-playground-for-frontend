/**
 * 原始進化録 - PRIMAL PATH - バトル画面
 * サブコンポーネントを統合するオーケストレータ
 */
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import type { RunState, BiomeId, SfxType, TickEvent, ASkillId } from '../types';
import type { GameAction } from '../hooks';
import { BIO, A_SKILLS, TB_SUMMARY } from '../constants';
import { effATK, civLvs, calcAvlSkills, applySkill, calcSynergies, applySynergyBonuses } from '../game-logic';
import { drawEnemy, drawPlayer, drawBurnFx } from '../sprites';
import { ProgressBar, HpBar, CivLevelsDisplay, AffinityBadge, AllyList, SynergyBadges, SpeedControl, renderParticles } from './shared';
import { BattleLog } from './battle/BattleLog';
import { SkillPanel } from './battle/SkillPanel';
import { useBattlePopups } from './battle/use-battle-popups';
import { Screen, GamePanel, StatText, SpeedBar, SurrenderBtn, Tc, Bc, PausedOverlay, EnemySprite, PopupText, PopupContainer, BattleScrollArea, BiomeBg, WeatherParticles, TimerDisplay } from '../styles';

/** 秒を mm:ss 形式にフォーマット */
const formatTime = (s: number): string => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

/** バイオームラベルを生成 */
const buildBiomeLabel = (run: RunState, finalMode: boolean, boss: boolean): string => {
  const m = BIO[run.cBT as BiomeId];
  const finalPhaseLabel = (finalMode && run.dd.bb > 1)
    ? ` ${run._fPhase}/${run.dd.bb}`
    : '';
  if (finalMode) return `⚡ 最終決戦${finalPhaseLabel}`;
  return m ? `${m.ic} ${m.nm}${boss ? ' BOSS' : ` Wave ${run.cW}/${run.wpb}`}` : '⚡';
};

/** ヒットフラッシュ管理フック */
const useHitFlash = () => {
  const [isHit, setIsHit] = useState(false);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const triggerHit = useCallback(() => {
    setIsHit(true);
    const tid = setTimeout(() => {
      timersRef.current.delete(tid);
      setIsHit(false);
    }, 400);
    timersRef.current.add(tid);
  }, []);

  return { isHit, triggerHit };
};

interface Props {
  run: RunState;
  finalMode: boolean;
  battleSpd: number;
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
  tickEvents?: TickEvent[];
}

export const BattleScreen: React.FC<Props> = ({ run, finalMode, battleSpd, dispatch, playSfx, tickEvents }) => {
  const esprRef = useRef<HTMLCanvasElement>(null);
  const psprRef = useRef<HTMLCanvasElement>(null);
  const burnFrameRef = useRef(0);

  const { enPopups, plPopups, addPopup } = useBattlePopups();
  const { isHit, triggerHit } = useHitFlash();

  const e = run.en;
  const boss = run.cW > run.wpb || finalMode;
  const lvs = civLvs(run);
  const wDps = run.wTurn > 0 ? Math.floor((run.dmgDealt - (run._wDmgBase || 0)) / run.wTurn) : 0;
  const lbl = buildBiomeLabel(run, finalMode, boss);

  // 敵スプライト描画
  useEffect(() => {
    if (esprRef.current && e) {
      drawEnemy(esprRef.current, e.n, boss, 2);
      if (run.burn) {
        const ctx = esprRef.current.getContext('2d');
        if (ctx) {
          burnFrameRef.current++;
          drawBurnFx(ctx, esprRef.current.width, esprRef.current.height, burnFrameRef.current);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e?.n, e?.hp, e?.mhp, boss, run.burn, run.turn]);

  // プレイヤースプライト描画
  useEffect(() => {
    if (psprRef.current) drawPlayer(psprRef.current, 2, run.fe, run.awoken);
  }, [run.fe, run.awoken]);

  // tickEvents からポップアップ追加 & ヒットフラッシュ
  useEffect(() => {
    if (!tickEvents || tickEvents.length === 0) return;
    let hasShake = false;
    for (const ev of tickEvents) {
      if (ev.type === 'popup') addPopup(ev.v, ev.crit, ev.heal, ev.tgt);
      if (ev.type === 'shake_enemy') hasShake = true;
    }
    if (hasShake) triggerHit();
  }, [run.turn, tickEvents, addPopup, triggerHit]);

  // シナジー計算
  const activeSynergies = useMemo(() => calcSynergies(run.evs), [run.evs]);
  const synergyBonus = useMemo(() => applySynergyBonuses(activeSynergies), [activeSynergies]);

  // ツリーボーナスサマリー
  const tbParts = useMemo(() => TB_SUMMARY.filter(s => run.tb[s.k] !== 0).map(s => s.f(run.tb[s.k])), [run.tb]);

  // チャレンジタイマー
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!run.timerStart || !run.timeLimit) return;
    const tid = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tid);
  }, [run.timerStart, run.timeLimit]);

  const remaining = (run.timerStart && run.timeLimit)
    ? Math.max(0, run.timeLimit - Math.floor((now - run.timerStart) / 1000))
    : undefined;

  useEffect(() => {
    if (remaining === 0) dispatch({ type: 'GAME_OVER', won: false });
  }, [remaining, dispatch]);

  // バイオーム背景
  const biomeForBg = finalMode ? 'final' : (run.cBT as string);
  const particles = useMemo(() => renderParticles(biomeForBg), [biomeForBg]);

  if (!e) return null;

  const ritActive = run.fe === 'rit' && run.hp < run.mhp * 0.3;
  const feLabel = run.awoken.map(a => (
    <span key={a.id} style={{ color: a.cl, fontSize: 8 }}>{a.nm} </span>
  ));

  // スキル関連
  const avlSkills = calcAvlSkills(run);
  const skillDefs = A_SKILLS.filter(s => avlSkills.includes(s.id));

  const handleSkill = (sid: ASkillId) => {
    const { nextRun, events } = applySkill(run, sid);
    for (const ev of events) {
      if (ev.type === 'sfx') playSfx(ev.sfx);
      if (ev.type === 'popup') addPopup(ev.v, ev.crit, ev.heal, ev.tgt);
    }
    dispatch({ type: 'BATTLE_TICK', nextRun });
  };

  const activeBuffs = run.sk.bfs;

  return (
    <Screen $noScroll>
      <BiomeBg $biome={biomeForBg} />
      <WeatherParticles $biome={biomeForBg}>{particles}</WeatherParticles>

      <BattleScrollArea>
        <ProgressBar current={Math.min(run.cW, run.wpb + 1)} max={run.wpb + 1} label={lbl} />

        {/* チャレンジタイマー */}
        {remaining !== undefined && (
          <TimerDisplay $urgent={remaining <= 60}>⏱️ {formatTime(remaining)}</TimerDisplay>
        )}

        <SpeedBar>
          <SpeedControl battleSpd={battleSpd} dispatch={dispatch} />
          <span style={{ fontSize: 8, color: '#403828', marginLeft: 4 }}>T{run.turn} DPS:{wDps}</span>
          <SurrenderBtn onClick={() => {
            if (window.confirm('降伏しますか？骨は半分になります。')) dispatch({ type: 'SURRENDER' });
          }}>降伏</SurrenderBtn>
        </SpeedBar>

        {/* 敵パネル */}
        <GamePanel style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <EnemySprite ref={esprRef} aria-hidden="true" $hit={isHit} $burn={!!run.burn} style={{
              width: boss ? 52 : 34, height: boss ? 52 : 34,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: boss ? '#ff6040' : '#f05050', marginBottom: 2 }}>
                {boss ? '👑 ' : ''}{e.n}{e.hp <= 0 ? ' 💀' : ''}
                {run.burn ? <span style={{ marginLeft: 4, fontSize: 10, animation: 'none' }}>🔥</span> : null}
              </div>
              <HpBar value={e.hp} max={e.mhp} variant="eh" showPct />
              <StatText>ATK {e.atk} DEF {e.def} <span style={{ color: '#c0a040' }}>🦴{e.bone}</span></StatText>
            </div>
          </div>
          <PopupContainer>
            {enPopups.map(p => (
              <PopupText key={p.id} style={{ left: `${p.x}%`, color: p.cl, fontSize: p.fs }}>{p.v}</PopupText>
            ))}
          </PopupContainer>
        </GamePanel>

        <div style={{ fontSize: 10, color: '#302818', margin: '3px 0', letterSpacing: 4, textAlign: 'center' }}>── ⚔ ──</div>

        {/* プレイヤーパネル */}
        <GamePanel style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <canvas ref={psprRef} aria-hidden="true" style={{
              width: 40, height: 55,
              border: '1px solid #222', borderRadius: 3, background: '#08080c', flexShrink: 0,
              imageRendering: 'pixelated',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#50e090', marginBottom: 2 }}>
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
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>🌳 {tbParts.join(' ')}</div>
              )}
            </div>
          </div>
          <AllyList allies={run.al} mode="battle" />
          {activeBuffs.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 2, justifyContent: 'center' }}>
              {activeBuffs.map((b, i) => {
                const def = A_SKILLS.find(s => s.id === b.sid);
                return (
                  <span key={i} style={{ fontSize: 8, color: '#f0c040', background: '#f0c04015', border: '1px solid #f0c04025', padding: '1px 4px', borderRadius: 4 }}>
                    {def?.ic} {b.rT}T
                  </span>
                );
              })}
            </div>
          )}
          <SynergyBadges synergies={activeSynergies} />
          <PopupContainer>
            {plPopups.map(p => (
              <PopupText key={p.id} style={{ left: `${p.x}%`, color: p.cl, fontSize: p.fs }}>
                {p.heal ? '+' : ''}{p.v}
              </PopupText>
            ))}
          </PopupContainer>
        </GamePanel>

        <BattleLog log={run.log} />
      </BattleScrollArea>

      <SkillPanel skills={skillDefs} sk={run.sk} onUseSkill={handleSkill} />

      {battleSpd === 0 && <PausedOverlay>PAUSED</PausedOverlay>}
    </Screen>
  );
};
