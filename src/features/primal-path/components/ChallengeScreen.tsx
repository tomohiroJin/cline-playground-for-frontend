/**
 * 原始進化録 - PRIMAL PATH - チャレンジ選択画面
 */
import React from 'react';
import type { AggregateStats, SfxType } from '../types';
import type { GameAction } from '../hooks';
import { CHALLENGES, DIFFS } from '../constants';
import { Screen, SubTitle, Divider, GameButton, GamePanel, EvoCard, Gc, Xc } from '../styles';

interface Props {
  aggregate: AggregateStats;
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
  onStartChallenge: (challengeId: string, di: number) => void;
}

export const ChallengeScreen: React.FC<Props> = ({ aggregate, dispatch, playSfx, onStartChallenge }) => {
  return (
    <Screen $center>
      <SubTitle>⚔️ チャレンジモード</SubTitle>
      <div style={{ fontSize: 9, color: '#908870', marginBottom: 4 }}>
        特殊なルールで腕試し
      </div>
      <Divider />

      <GamePanel style={{ padding: '8px 10px', maxHeight: 420, overflowY: 'auto' }}>
        {CHALLENGES.map(ch => {
          const isCleared = aggregate.clearedChallenges.includes(ch.id);

          return (
            <EvoCard key={ch.id} style={{ marginBottom: 6 }}
              onClick={() => { playSfx('click'); onStartChallenge(ch.id, 0); }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>{ch.icon}</span>
                <div>
                  <div style={{ fontSize: 12, color: '#f0c040' }}>
                    {ch.name}
                    {isCleared && <span style={{ marginLeft: 6, fontSize: 10, color: '#50e090' }}>✅</span>}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 9, color: '#a89878', lineHeight: 1.5 }}>
                {ch.description}
              </div>
              <div style={{ fontSize: 8, color: '#605848', marginTop: 4 }}>
                {ch.modifiers.map((m, i) => {
                  switch (m.type) {
                    case 'hp_multiplier':
                      return <span key={i}><Xc>HP ×{m.value}</Xc> </span>;
                    case 'max_evolutions':
                      return <span key={i}><Xc>進化上限{m.count}回</Xc> </span>;
                    case 'speed_limit':
                      return <span key={i}><Xc>制限時間{Math.floor(m.maxSeconds / 60)}分</Xc> </span>;
                    case 'enemy_multiplier':
                      return <span key={i}><Xc>敵{m.stat === 'atk' ? 'ATK' : 'HP'} ×{m.value}</Xc> </span>;
                    case 'no_healing':
                      return <span key={i}><Xc>回復禁止</Xc> </span>;
                    default:
                      return null;
                  }
                })}
              </div>
            </EvoCard>
          );
        })}
      </GamePanel>

      <div style={{ fontSize: 9, color: '#605848', marginTop: 4 }}>
        難易度は「原始時代」固定です
      </div>

      <GameButton style={{ marginTop: 8, minWidth: 190 }}
        onClick={() => { playSfx('click'); dispatch({ type: 'SET_PHASE', phase: 'title' }); }}>
        🔙 戻る
      </GameButton>
    </Screen>
  );
};
