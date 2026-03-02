import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { RunState, BiomeId, SfxType, TickEvent, ASkillId } from '../types';
import type { GameAction } from '../hooks';
import { BIO, TC, LOG_COLORS, A_SKILLS } from '../constants';
import { effATK, civLvs, mkPopup, calcAvlSkills, applySkill, calcSynergies, applySynergyBonuses } from '../game-logic';
import { drawEnemy, drawPlayer, drawBurnFx } from '../sprites';
import { ProgressBar, HpBar, CivLevelsDisplay, AffinityBadge, AllyList, SynergyBadges, SpeedControl, renderParticles } from './shared';
import { Screen, GamePanel, StatText, SpeedBar, SurrenderBtn, LogContainer, LogLine, Tc, Bc, PausedOverlay, EnemySprite, SkillBar, SkillBtn, PopupText, PopupContainer, BattleScrollArea, BattleFixedBottom, BiomeBg, WeatherParticles, TimerDisplay } from '../styles';

const MAX_POPUP_DISPLAY = 6;
const POPUP_DURATION_MS = 900;
/** DOM ポップアップ用エントリ */
interface PopupEntry {
  id: number;
  v: number;
  x: number;
  cl: string;
  fs: number;
  heal: boolean;
}

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
  const logRef = useRef<HTMLDivElement>(null);
  const popupIdRef = useRef(0);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // DOM ポップアップ管理
  const [enPopups, setEnPopups] = useState<PopupEntry[]>([]);
  const [plPopups, setPlPopups] = useState<PopupEntry[]>([]);

  // ヒットフラッシュ管理
  const [isHit, setIsHit] = useState(false);
  const burnFrameRef = useRef(0);

  // アンマウント時に全 setTimeout をクリーンアップ
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current.clear();
    };
  }, []);

  const e = run.en;
  const m = BIO[run.cBT as BiomeId];
  const boss = run.cW > run.wpb || finalMode;
  const lvs = civLvs(run);
  const wDps = run.wTurn > 0 ? Math.floor((run.dmgDealt - (run._wDmgBase || 0)) / run.wTurn) : 0;

  // ラベル表示
  const finalPhaseLabel = (finalMode && run.dd.bb > 1)
    ? ` ${run._fPhase}/${run.dd.bb}`
    : '';
  const lbl = finalMode
    ? `⚡ 最終決戦${finalPhaseLabel}`
    : m ? `${m.ic} ${m.nm}${boss ? ' BOSS' : ` Wave ${run.cW}/${run.wpb}`}` : '⚡';

  // 敵スプライト描画（火傷パーティクルのみ追加）
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
  }, [e?.n, e?.hp, e?.mhp, boss, run.burn, run.turn]);

  useEffect(() => {
    if (psprRef.current) drawPlayer(psprRef.current, 2, run.fe, run.awoken);
  }, [run.fe, run.awoken]);

  /** ポップアップ追加ヘルパー */
  const addPopup = (v: number, crit: boolean, heal: boolean, tgt: 'en' | 'pl') => {
    const base = mkPopup(v, crit, heal);
    const id = ++popupIdRef.current;
    // プレイヤー被ダメは赤に上書き
    const cl = tgt === 'pl' && !heal ? '#ff5050' : base.cl;
    const entry: PopupEntry = {
      id,
      v: base.v,
      x: 30 + Math.random() * 40, // 30%〜70% にランダム分散
      cl,
      fs: base.fs,
      heal,
    };
    if (tgt === 'en') setEnPopups(prev => [...prev, entry].slice(-MAX_POPUP_DISPLAY));
    else setPlPopups(prev => [...prev, entry].slice(-MAX_POPUP_DISPLAY));
    // アニメーション後に自動除去（アンマウント時のクリーンアップ対応）
    const tid = setTimeout(() => {
      timersRef.current.delete(tid);
      if (tgt === 'en') setEnPopups(prev => prev.filter(p => p.id !== id));
      else setPlPopups(prev => prev.filter(p => p.id !== id));
    }, POPUP_DURATION_MS);
    timersRef.current.add(tid);
  };

  // tickEvents からポップアップ追加 & ヒットフラッシュ
  useEffect(() => {
    if (!tickEvents || tickEvents.length === 0) return;
    let hasShake = false;
    for (const ev of tickEvents) {
      if (ev.type === 'popup') addPopup(ev.v, ev.crit, ev.heal, ev.tgt);
      if (ev.type === 'shake_enemy') hasShake = true;
    }
    if (hasShake) {
      setIsHit(true);
      const hitTid = setTimeout(() => {
        timersRef.current.delete(hitTid);
        setIsHit(false);
      }, 400);
      timersRef.current.add(hitTid);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.turn, tickEvents]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [run.log.length]);

  if (!e) return null;

  const ritActive = run.fe === 'rit' && run.hp < run.mhp * 0.3;
  const feLabel = run.awoken.map(a => (
    <span key={a.id} style={{ color: a.cl, fontSize: 8 }}>{a.nm} </span>
  ));

  // シナジー計算（evs が変わった時だけ再計算）
  const activeSynergies = useMemo(() => calcSynergies(run.evs), [run.evs]);
  const synergyBonus = useMemo(() => applySynergyBonuses(activeSynergies), [activeSynergies]);

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

  // バフアイコン表示用
  const activeBuffs = run.sk.bfs;

  // チャレンジタイマー（RunState の timerStart から経過時間を計算）
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!run.timerStart || !run.timeLimit) return;
    const tid = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(tid);
  }, [run.timerStart, run.timeLimit]);

  const remaining = (run.timerStart && run.timeLimit)
    ? Math.max(0, run.timeLimit - Math.floor((now - run.timerStart) / 1000))
    : undefined;

  // タイムアップ時にゲームオーバーを発火
  useEffect(() => {
    if (remaining === 0) {
      dispatch({ type: 'GAME_OVER', won: false });
    }
  }, [remaining, dispatch]);

  /** 秒を mm:ss 形式にフォーマット */
  const formatTime = (s: number): string => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // バイオーム背景用
  const biomeForBg = finalMode ? 'final' : (run.cBT as string);
  const particles = useMemo(() => renderParticles(biomeForBg), [biomeForBg]);

  return (
    <Screen $noScroll>
      {/* バイオーム別背景 */}
      <BiomeBg $biome={biomeForBg} />
      <WeatherParticles $biome={biomeForBg}>
        {particles}
      </WeatherParticles>

      {/* 上部：スクロール可能な領域 */}
      <BattleScrollArea>
        <ProgressBar current={Math.min(run.cW, run.wpb + 1)} max={run.wpb + 1} label={lbl} />

        {/* チャレンジタイマー */}
        {remaining !== undefined && (
          <TimerDisplay $urgent={remaining <= 60}>
            ⏱️ {formatTime(remaining)}
          </TimerDisplay>
        )}

        <SpeedBar>
          <SpeedControl battleSpd={battleSpd} dispatch={dispatch} />
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
          {/* 敵側ダメージポップアップ（DOM） */}
          <PopupContainer>
            {enPopups.map(p => (
              <PopupText key={p.id} style={{ left: `${p.x}%`, color: p.cl, fontSize: p.fs }}>
                {p.v}
              </PopupText>
            ))}
          </PopupContainer>
        </GamePanel>

        <div style={{ fontSize: 10, color: '#302818', margin: '3px 0', letterSpacing: 4, textAlign: 'center' }}>── ⚔ ──</div>

        {/* Player panel */}
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
                  <span style={{ fontSize: 7, color: '#ff4060', background: '#ff406015', border: '1px solid #ff406030', padding: '1px 5px', borderRadius: 6 }}>
                    ⚡ATK×3
                  </span>
                )}
              </div>
              <HpBar value={run.hp} max={run.mhp} variant="hp" low={run.hp < run.mhp * 0.25} showPct />
              <StatText>
                ATK <Tc>{effATK(run)}</Tc>{synergyBonus.atkBonus > 0 && <span style={{ color: '#f0c040', fontSize: 7 }}>+{synergyBonus.atkBonus}</span>}{' '}
                DEF <span style={{ color: '#50c8e8' }}>{run.def}</span>{synergyBonus.defBonus > 0 && <span style={{ color: '#50c8e8', fontSize: 7 }}>+{synergyBonus.defBonus}</span>}{' '}
                🦴<Bc>{run.bE}</Bc> <CivLevelsDisplay run={run} />
              </StatText>
            </div>
          </div>
          <AllyList allies={run.al} mode="battle" />
          {/* バフアイコン */}
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
          {/* シナジーアイコン */}
          <SynergyBadges synergies={activeSynergies} />
          {/* プレイヤー側ダメージポップアップ（DOM） */}
          <PopupContainer>
            {plPopups.map(p => (
              <PopupText key={p.id} style={{ left: `${p.x}%`, color: p.cl, fontSize: p.fs }}>
                {p.heal ? '+' : ''}{p.v}
              </PopupText>
            ))}
          </PopupContainer>
        </GamePanel>

        {/* Battle log */}
        <LogContainer ref={logRef}>
          {run.log.slice(-40).map((l, i) => (
            <LogLine key={i} $color={LOG_COLORS[l.c]}>{l.x}</LogLine>
          ))}
        </LogContainer>
      </BattleScrollArea>

      {/* 下部：固定配置のスキルバー（戦闘中に位置が変わらない） */}
      {skillDefs.length > 0 && (
        <BattleFixedBottom>
          <SkillBar>
            {skillDefs.map(s => {
              const cd = run.sk.cds[s.id] || 0;
              const isOff = cd > 0;
              return (
                <SkillBtn key={s.id} $off={isOff} onClick={() => handleSkill(s.id)}
                  title={s.ds}>
                  {s.ic} {s.nm}{isOff ? ` (${cd})` : ''}
                </SkillBtn>
              );
            })}
          </SkillBar>
        </BattleFixedBottom>
      )}

      {/* 一時停止オーバーレイ */}
      {battleSpd === 0 && <PausedOverlay>PAUSED</PausedOverlay>}
    </Screen>
  );
};
