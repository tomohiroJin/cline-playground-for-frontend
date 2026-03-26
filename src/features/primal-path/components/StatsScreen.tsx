/**
 * 原始進化録 - PRIMAL PATH - ラン統計画面
 */
import React from 'react';
import type { RunStats, AggregateStats, SfxType } from '../types';
import type { GameAction } from '../hooks';
import { DIFFS } from '../constants';
import { IFS } from '../constants/ui';
import { Screen, SubTitle, Divider, GameButton, GamePanel, RunStatRow, Gc } from '../styles';

interface Props {
  runStats: RunStats[];
  aggregate: AggregateStats;
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
}

/** プレイ時間をMM:SS形式に変換 */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const StatsScreen: React.FC<Props> = ({ runStats, aggregate, dispatch, playSfx }) => {
  const clearRate = aggregate.totalRuns > 0
    ? Math.round((aggregate.totalClears / aggregate.totalRuns) * 100)
    : 0;

  return (
    <Screen $center>
      <SubTitle>📊 ラン統計</SubTitle>
      <Divider />

      <GamePanel style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: IFS.md, color: '#f0c040', marginBottom: 4, textAlign: 'center' }}>── 累計統計 ──</div>
        <RunStatRow><span>総プレイ回数</span><span>{aggregate.totalRuns}</span></RunStatRow>
        <RunStatRow><span>総クリア回数</span><span><Gc>{aggregate.totalClears}</Gc></span></RunStatRow>
        <RunStatRow><span>クリア率</span><span>{clearRate}%</span></RunStatRow>
        <RunStatRow><span>総撃破数</span><span>{aggregate.totalKills}</span></RunStatRow>
        <RunStatRow><span>総獲得骨</span><span><Gc>{aggregate.totalBoneEarned.toLocaleString()}</Gc></span></RunStatRow>
        <RunStatRow><span>総イベント</span><span>{aggregate.totalEvents}</span></RunStatRow>
      </GamePanel>

      <GamePanel style={{ padding: '8px 10px', maxHeight: 280, overflowY: 'auto' }}>
        <div style={{ fontSize: IFS.md, color: '#f0c040', marginBottom: 4, textAlign: 'center' }}>── 直近のラン ──</div>
        {runStats.length === 0 && (
          <div style={{ fontSize: IFS.md, color: '#605848', textAlign: 'center', padding: 8 }}>
            まだプレイ記録がありません
          </div>
        )}
        {[...runStats].reverse().slice(0, 20).map((s) => {
          const diff = DIFFS[s.difficulty];
          const icon = s.result === 'victory' ? '✅' : '❌';
          const awk = s.awakening ? ` / ${s.awakening}` : '';
          return (
            <div key={s.id} style={{ fontSize: IFS.sm, padding: '3px 0', borderBottom: '1px solid #1a1a22', color: '#a89878' }}>
              <span>{icon} </span>
              <span>{diff?.ic ?? ''} {diff?.n ?? ''}</span>
              <span>{awk}</span>
              <span style={{ float: 'right', color: '#605848' }}>
                {s.biomeCount}面 {s.totalKills}体 {formatTime(s.playtimeSeconds)}
              </span>
            </div>
          );
        })}
      </GamePanel>

      <GameButton style={{ marginTop: 8, minWidth: 190 }}
        onClick={() => { playSfx('click'); dispatch({ type: 'SET_PHASE', phase: 'title' }); }}>
        🔙 戻る
      </GameButton>
    </Screen>
  );
};
