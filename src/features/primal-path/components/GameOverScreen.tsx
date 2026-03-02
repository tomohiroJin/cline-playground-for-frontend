import React, { useEffect, useRef, useState } from 'react';
import type { RunState, SaveData, SfxType } from '../types';
import type { GameAction } from '../hooks';
import { calcBoneReward, aliveAllies, effATK, civLvs } from '../game-logic';
import { ACHIEVEMENTS, LOG_COLORS } from '../constants';
import { CivLevelsDisplay } from './shared';
import { Screen, SubTitle, Divider, GameButton, GamePanel, RunStatRow, Gc, Tc, Xc, BiomeBg, LogReviewContainer, LogLine } from '../styles';

interface Props {
  run: RunState;
  won: boolean;
  save: SaveData;
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
  newAchievements?: string[];
}

export const GameOverScreen: React.FC<Props> = ({ run, won, save, dispatch, playSfx, newAchievements = [] }) => {
  // ログパネル展開状態
  const [isLogOpen, setIsLogOpen] = useState(false);

  // 勝利時にSFXを再生
  const winPlayed = useRef(false);
  useEffect(() => {
    if (won && !winPlayed.current) {
      winPlayed.current = true;
      playSfx('win');
    }
  }, [won, playSfx]);

  // 実績解除時にSFXを再生
  const achvPlayed = useRef(false);
  useEffect(() => {
    if (newAchievements.length > 0 && !achvPlayed.current) {
      achvPlayed.current = true;
      playSfx('achv');
    }
  }, [newAchievements, playSfx]);

  const boneReward = calcBoneReward(run, won);
  const avgDps = run.turn > 0 ? Math.floor(run.dmgDealt / run.turn) : 0;
  const awkS = run.awoken.map(a => (
    <span key={a.id} style={{ color: a.cl }}>{a.nm} </span>
  ));
  const alive = aliveAllies(run.al).length;
  const allyS = run.al.length ? `${alive}/${run.al.length}体生存` : '';
  const d = run.dd;

  return (
    <Screen>
      <BiomeBg $biome={run.cBT as string} />
      <SubTitle style={{ fontSize: 18, color: won ? '#f0c040' : '#f05050' }}>
        {won
          ? '🏆 神話を刻んだ！'
          : run.isEndless && run.hp > 0
            ? '♾️ 探索を終えた'
            : '💀 部族は滅びた…'}
      </SubTitle>
      <Divider />
      <GamePanel style={{ textAlign: 'center', padding: 14 }}>
        <div style={{ fontSize: 14, color: won ? '#f0c040' : '#f05050', marginBottom: 10 }}>
          {won
            ? '最終ボス撃破！'
            : run.isEndless && run.hp > 0
              ? `ウェーブ ${run.endlessWave} まで到達！`
              : '次こそは…'}
        </div>
        <div style={{ fontSize: 14, marginBottom: 8 }}>🦴 <Gc style={{ fontSize: 16 }}>+{boneReward}</Gc></div>
        <div style={{ fontSize: 11, color: '#908870' }}>所持骨：<Gc>{save.bones}</Gc></div>
      </GamePanel>

      <GamePanel style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: 10, color: '#f0c040', marginBottom: 4, textAlign: 'center' }}>── ラン統計 ──</div>
        <RunStatRow><span>難易度</span><span>{d.ic} {d.n}</span></RunStatRow>
        <RunStatRow><span>ターン数</span><span>{run.turn}</span></RunStatRow>
        <RunStatRow><span>撃破数</span><span>{run.kills}</span></RunStatRow>
        <RunStatRow><span>平均DPS</span><span><Gc>{avgDps}</Gc></span></RunStatRow>
        <RunStatRow><span>与ダメージ</span><span><Tc>{run.dmgDealt}</Tc></span></RunStatRow>
        <RunStatRow><span>最大一撃</span><span><Tc>{run.maxHit}</Tc></span></RunStatRow>
        <RunStatRow><span>被ダメージ</span><span><Xc>{run.dmgTaken}</Xc></span></RunStatRow>
        <RunStatRow><span>会心率</span><span><Gc>{(run.cr * 100).toFixed(0)}%</Gc></span></RunStatRow>
        <RunStatRow><span>文明</span><span><CivLevelsDisplay run={run} /></span></RunStatRow>
        {awkS.length > 0 && <RunStatRow><span>覚醒</span><span>{awkS}</span></RunStatRow>}
        {allyS && <RunStatRow><span>仲間</span><span>👥 {allyS}</span></RunStatRow>}
        <RunStatRow><span>踏破</span><span>{run.bc}/3</span></RunStatRow>
      </GamePanel>

      {/* エンドレスモード結果表示 */}
      {run.isEndless && (
        <GamePanel style={{ padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: '#f0c040', marginBottom: 4, textAlign: 'center' }}>── エンドレス結果 ──</div>
          <RunStatRow><span>到達ウェーブ</span><span><Gc>{run.endlessWave}</Gc></span></RunStatRow>
          <RunStatRow><span>総撃破数</span><span><Gc>{run.kills}</Gc></span></RunStatRow>
        </GamePanel>
      )}

      {newAchievements.length > 0 && (
        <GamePanel style={{ padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: '#f0c040', marginBottom: 4, textAlign: 'center' }}>── 実績解除！ ──</div>
          {newAchievements.map(id => {
            const ach = ACHIEVEMENTS.find(a => a.id === id);
            if (!ach) return null;
            return (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: 10, color: '#f0c040' }}>
                <span style={{ fontSize: 16 }}>{ach.icon}</span>
                <span>{ach.name}</span>
              </div>
            );
          })}
        </GamePanel>
      )}

      {/* 戦闘ログ見返し */}
      <GamePanel style={{ padding: '8px 10px' }}>
        <GameButton
          style={{ width: '100%', fontSize: 10, padding: '4px 8px' }}
          onClick={() => { playSfx('click'); setIsLogOpen(prev => !prev); }}
        >
          {isLogOpen ? '▲ 戦闘ログを閉じる' : '▼ 戦闘ログを見る'}
        </GameButton>
        {isLogOpen && (
          <LogReviewContainer>
            {run.log.map((l, i) => (
              <LogLine key={i} $color={LOG_COLORS[l.c]}>{l.x}</LogLine>
            ))}
          </LogReviewContainer>
        )}
      </GamePanel>

      <GameButton style={{ marginTop: 8, minWidth: 190, fontSize: 12 }}
        onClick={() => { playSfx('click'); dispatch({ type: 'RETURN_TO_TITLE' }); }}>
        タイトルへ
      </GameButton>
    </Screen>
  );
};
