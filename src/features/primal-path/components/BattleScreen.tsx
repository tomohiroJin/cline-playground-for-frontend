/**
 * 原始進化録 - PRIMAL PATH - バトル画面
 * サブコンポーネントを統合するオーケストレータ
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { RunState, BiomeId, SfxType, TickEvent, ASkillId } from '../types';
import type { GameAction } from '../hooks';
import { BIO, A_SKILLS } from '../constants';
import { IFS } from '../constants/ui';
import { calcAvlSkills, applySkill } from '../game-logic';
import { ProgressBar, SpeedControl, renderParticles } from './shared';
import { BattleLog } from './battle/BattleLog';
import { SkillPanel } from './battle/SkillPanel';
import { EnemyPanel } from './battle/EnemyPanel';
import { PlayerPanel } from './battle/PlayerPanel';
import { useBattlePopups } from './battle/use-battle-popups';
import { useHitFlash } from './battle/use-hit-flash';
import { Screen, SpeedBar, SurrenderBtn, PausedOverlay, BattleScrollArea, BiomeBg, WeatherParticles, TimerDisplay } from '../styles';

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

interface Props {
  run: RunState;
  finalMode: boolean;
  battleSpd: number;
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
  tickEvents?: TickEvent[];
}

export const BattleScreen: React.FC<Props> = ({ run, finalMode, battleSpd, dispatch, playSfx, tickEvents }) => {
  const { enPopups, plPopups, addPopup } = useBattlePopups();
  const { isHit, triggerHit } = useHitFlash();

  const e = run.en;
  const boss = run.cW > run.wpb || finalMode;
  const wDps = run.wTurn > 0 ? Math.floor((run.dmgDealt - (run._wDmgBase || 0)) / run.wTurn) : 0;
  const lbl = buildBiomeLabel(run, finalMode, boss);

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

  // スキル関連
  const avlSkills = calcAvlSkills(run);
  const skillDefs = A_SKILLS.filter(s => avlSkills.includes(s.id));

  const handleSkill = useCallback((sid: ASkillId) => {
    const { nextRun, events } = applySkill(run, sid);
    for (const ev of events) {
      if (ev.type === 'sfx') playSfx(ev.sfx);
      if (ev.type === 'popup') addPopup(ev.v, ev.crit, ev.heal, ev.tgt);
    }
    dispatch({ type: 'BATTLE_TICK', nextRun });
  }, [run, playSfx, addPopup, dispatch]);

  if (!e) return null;

  return (
    <Screen $noScroll>
      <BiomeBg $biome={biomeForBg} />
      <WeatherParticles $biome={biomeForBg}>{particles}</WeatherParticles>

      <BattleScrollArea>
        <ProgressBar current={Math.min(run.cW, run.wpb + 1)} max={run.wpb + 1} label={lbl} />

        {remaining !== undefined && (
          <TimerDisplay $urgent={remaining <= 60}>⏱️ {formatTime(remaining)}</TimerDisplay>
        )}

        <SpeedBar>
          <SpeedControl battleSpd={battleSpd} dispatch={dispatch} />
          <span style={{ fontSize: IFS.lg, color: '#403828', marginLeft: 4 }}>T{run.turn} DPS:{wDps}</span>
          <SurrenderBtn onClick={() => {
            if (window.confirm('降伏しますか？骨は半分になります。')) dispatch({ type: 'SURRENDER' });
          }}>降伏</SurrenderBtn>
        </SpeedBar>

        <EnemyPanel enemy={e} boss={boss} burn={run.burn} turn={run.turn} isHit={isHit} popups={enPopups} />

        <div style={{ fontSize: 14, color: '#302818', margin: '4px 0', letterSpacing: 4, textAlign: 'center' }}>── ⚔ ──</div>

        <PlayerPanel run={run} popups={plPopups} />

        <BattleLog log={run.log} />
      </BattleScrollArea>

      <SkillPanel skills={skillDefs} sk={run.sk} onUseSkill={handleSkill} />

      {battleSpd === 0 && <PausedOverlay>PAUSED</PausedOverlay>}
    </Screen>
  );
};
