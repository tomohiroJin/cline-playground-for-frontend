import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { RunState, BiomeId, SfxType, DmgPopup, TickEvent, ASkillId } from '../types';
import type { GameAction } from '../hooks';
import { BIO, TC, SPEED_OPTS, LOG_COLORS, A_SKILLS } from '../constants';
import { effATK, civLvs, biomeBonus, mkPopup, updatePopups, calcAvlSkills, applySkill } from '../game-logic';
import { drawEnemy, drawPlayer, drawAlly, drawDmgPopup, drawBurnFx, drawEnemyHpBar, drawStatusIcons } from '../sprites';
import { ProgressBar, HpBar, CivLevelsDisplay, AffinityBadge, AllyList } from './shared';
import { Screen, GamePanel, StatText, SpeedBar, SpeedBtn, SurrenderBtn, LogContainer, LogLine, Tc, Lc, Rc, Gc, Bc, PausedOverlay, flashHit, SkillBar, SkillBtn } from '../styles';

const MAX_POPUP_DISPLAY = 5;

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
  const enPopupRef = useRef<HTMLCanvasElement>(null);
  const plPopupRef = useRef<HTMLCanvasElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // ポップアップ管理
  const [enPopups, setEnPopups] = useState<DmgPopup[]>([]);
  const [plPopups, setPlPopups] = useState<DmgPopup[]>([]);

  // ヒットフラッシュ管理
  const [isHit, setIsHit] = useState(false);
  const burnFrameRef = useRef(0);

  const e = run.en;
  const m = BIO[run.cBT as BiomeId];
  const boss = run.cW > run.wpb || finalMode;
  const lvs = civLvs(run);
  const wDps = run.wTurn > 0 ? Math.floor((run.dmgDealt - (run._wDmgBase || 0)) / run.wTurn) : 0;

  const lbl = finalMode
    ? '⚡ 最終決戦' + (run._fPhase === 2 ? ' Phase2' : '')
    : m ? `${m.ic} ${m.nm}${boss ? ' BOSS' : ` Wave ${run.cW}/${run.wpb}`}` : '⚡';

  // Draw sprites（火傷パーティクル・HPバー・ステータスアイコンは毎tick更新）
  useEffect(() => {
    if (esprRef.current && e) {
      drawEnemy(esprRef.current, e.n, boss, 2);
      const ctx = esprRef.current.getContext('2d');
      if (ctx) {
        const cw = esprRef.current.width;
        const ch = esprRef.current.height;
        // HPバー（スプライト下部）
        drawEnemyHpBar(ctx, e.hp, e.mhp, 1, ch - 5, cw - 2);
        // 状態アイコン
        drawStatusIcons(ctx, 2, 12, !!run.burn);
        // 火傷パーティクル
        if (run.burn) {
          burnFrameRef.current++;
          drawBurnFx(ctx, cw, ch, burnFrameRef.current);
        }
      }
    }
  }, [e?.n, e?.hp, e?.mhp, boss, run.burn, run.turn]);

  useEffect(() => {
    if (psprRef.current) drawPlayer(psprRef.current, 2, run.fe);
  }, [run.fe]);

  // tickEvents からポップアップ追加 & ヒットフラッシュ & 既存ポップアップ更新
  useEffect(() => {
    if (tickEvents && tickEvents.length > 0) {
      const newEn: DmgPopup[] = [];
      const newPl: DmgPopup[] = [];
      let hasShake = false;
      for (const ev of tickEvents) {
        if (ev.type === 'popup') {
          const p = mkPopup(ev.v, ev.crit, ev.heal);
          if (ev.tgt === 'en') newEn.push(p);
          else newPl.push(p);
        }
        if (ev.type === 'shake_enemy') hasShake = true;
      }
      setEnPopups(prev => [...updatePopups(prev), ...newEn].slice(-MAX_POPUP_DISPLAY));
      setPlPopups(prev => [...updatePopups(prev), ...newPl].slice(-MAX_POPUP_DISPLAY));
      // ヒットフラッシュ
      if (hasShake) {
        setIsHit(true);
        setTimeout(() => setIsHit(false), 150);
      }
    } else {
      setEnPopups(prev => updatePopups(prev));
      setPlPopups(prev => updatePopups(prev));
    }
  }, [run.turn, tickEvents]);

  // ポップアップ Canvas 描画（敵側）
  useEffect(() => {
    const cvs = enPopupRef.current;
    if (!cvs || enPopups.length === 0) {
      if (cvs) {
        const ctx = cvs.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, cvs.width, cvs.height);
      }
      return;
    }
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    enPopups.forEach(p => drawDmgPopup(ctx, p, cvs.width, cvs.height));
  }, [enPopups]);

  // ポップアップ Canvas 描画（プレイヤー側）
  useEffect(() => {
    const cvs = plPopupRef.current;
    if (!cvs || plPopups.length === 0) {
      if (cvs) {
        const ctx = cvs.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, cvs.width, cvs.height);
      }
      return;
    }
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    plPopups.forEach(p => drawDmgPopup(ctx, p, cvs.width, cvs.height));
  }, [plPopups]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [run.log.length]);

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
    // SFXとポップアップイベント処理
    for (const ev of events) {
      if (ev.type === 'sfx') playSfx(ev.sfx);
      if (ev.type === 'popup') {
        const p = mkPopup(ev.v, ev.crit, ev.heal);
        if (ev.tgt === 'en') setEnPopups(prev => [...prev, p].slice(-MAX_POPUP_DISPLAY));
        else setPlPopups(prev => [...prev, p].slice(-MAX_POPUP_DISPLAY));
      }
    }
    dispatch({ type: 'BATTLE_TICK', nextRun });
  };

  // バフアイコン表示用
  const activeBuffs = run.sk.bfs;

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

      {/* スキルボタン */}
      {skillDefs.length > 0 && (
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
      )}

      {/* Enemy panel */}
      <GamePanel style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <canvas ref={esprRef} style={{
            width: boss ? 52 : 34, height: boss ? 52 : 34,
            border: '1px solid #222', borderRadius: 3, background: '#08080c', flexShrink: 0,
            imageRendering: 'pixelated',
            animation: isHit ? `${flashHit} 0.15s` : undefined,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: boss ? '#ff6040' : '#f05050', marginBottom: 2 }}>
              {boss ? '👑 ' : ''}{e.n}{e.hp <= 0 ? ' 💀' : ''}
            </div>
            <HpBar value={e.hp} max={e.mhp} variant="eh" showPct />
            <StatText>ATK {e.atk} DEF {e.def} <span style={{ color: '#c0a040' }}>🦴{e.bone}</span></StatText>
          </div>
        </div>
        {/* 敵側ポップアップ Canvas */}
        <canvas ref={enPopupRef} width={200} height={60} style={{
          position: 'absolute', top: 0, right: 0, pointerEvents: 'none',
        }} />
      </GamePanel>

      <div style={{ fontSize: 10, color: '#302818', margin: '3px 0', letterSpacing: 4, textAlign: 'center' }}>── ⚔ ──</div>

      {/* Player panel */}
      <GamePanel style={{ position: 'relative' }}>
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
        {/* プレイヤー側ポップアップ Canvas */}
        <canvas ref={plPopupRef} width={200} height={60} style={{
          position: 'absolute', top: 0, right: 0, pointerEvents: 'none',
        }} />
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
