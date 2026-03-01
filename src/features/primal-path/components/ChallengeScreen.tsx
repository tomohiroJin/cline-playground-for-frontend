/**
 * 原始進化録 - PRIMAL PATH - チャレンジ選択画面
 * 2段階フロー: チャレンジ選択 → 難易度選択
 */
import React, { useState } from 'react';
import type { AggregateStats, SaveData, SfxType, ChallengeDef } from '../types';
import type { GameAction } from '../hooks';
import { CHALLENGES, DIFFS } from '../constants';
import { Screen, SubTitle, Divider, GameButton, GamePanel, EvoCard, Gc, Xc } from '../styles';

interface Props {
  aggregate: AggregateStats;
  save: SaveData;
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
  onStartChallenge: (challengeId: string, di: number) => void;
}

export const ChallengeScreen: React.FC<Props> = ({ aggregate, save, dispatch, playSfx, onStartChallenge }) => {
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeDef | undefined>(undefined);
  const [selectedDi, setSelectedDi] = useState(0);

  // Step 2: 難易度選択画面
  if (selectedChallenge) {
    return (
      <Screen $center>
        <SubTitle>⚔️ {selectedChallenge.name}</SubTitle>
        <div style={{ fontSize: 9, color: '#908870', marginBottom: 4 }}>
          難易度を選択してください
        </div>
        <Divider />

        <GamePanel style={{ padding: '8px 10px', maxHeight: 380, overflowY: 'auto' }}>
          {DIFFS.map((dd, di) => {
            // 解放判定: 最初の難易度は常に解放、それ以降は前の難易度をクリア済みの場合
            const isUnlocked = di === 0 || save.best[di - 1] !== undefined;
            const isSelected = selectedDi === di;

            return (
              <EvoCard
                key={di}
                style={{
                  marginBottom: 6,
                  opacity: isUnlocked ? 1 : 0.4,
                  borderColor: isSelected ? '#f0c040' : undefined,
                  cursor: isUnlocked ? 'pointer' : 'default',
                }}
                onClick={() => {
                  if (!isUnlocked) return;
                  playSfx('click');
                  setSelectedDi(di);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16 }}>{dd.ic}</span>
                  <div>
                    <div style={{ fontSize: 11, color: isSelected ? '#f0c040' : '#c0a880' }}>
                      {dd.n}
                    </div>
                    <div style={{ fontSize: 8, color: '#908870' }}>{dd.d}</div>
                  </div>
                </div>
                {!isUnlocked && (
                  <div style={{ fontSize: 8, color: '#605848', marginTop: 2 }}>
                    前の難易度をクリアして解放
                  </div>
                )}
              </EvoCard>
            );
          })}
        </GamePanel>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <GameButton
            style={{ minWidth: 100 }}
            onClick={() => { playSfx('click'); setSelectedChallenge(undefined); setSelectedDi(0); }}
          >
            🔙 戻る
          </GameButton>
          <GameButton
            style={{ minWidth: 140, borderColor: '#f0c04060', color: '#f0c040' }}
            onClick={() => { playSfx('click'); onStartChallenge(selectedChallenge.id, selectedDi); }}
          >
            ⚔️ 開始
          </GameButton>
        </div>
      </Screen>
    );
  }

  // Step 1: チャレンジ一覧
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
              onClick={() => { playSfx('click'); setSelectedChallenge(ch); }}>
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

      <GameButton style={{ marginTop: 8, minWidth: 190 }}
        onClick={() => { playSfx('click'); dispatch({ type: 'SET_PHASE', phase: 'title' }); }}>
        🔙 戻る
      </GameButton>
    </Screen>
  );
};
