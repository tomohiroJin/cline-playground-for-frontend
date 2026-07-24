/**
 * 灰燼の城壁 - メインコンテナ
 *
 * フェーズに応じて準備/戦闘/報酬/リザルトの UI を切り替える。
 */
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useAshenRampartGame } from './useAshenRampartGame';
import { BoardGrid } from './BoardGrid';
import { HandArea } from './HandArea';
import { StatusBar } from './StatusBar';
import { RewardPanel } from './RewardPanel';
import { ResultPanel } from './ResultPanel';
import { SeededRandom, DefaultRandom } from '../infrastructure/random/seeded-random';
import { getCardDefinition } from '../domain/cards/card-pool';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #1a1418;
  min-height: 100vh;
`;

const Title = styled.h1`
  color: #e8b04b;
  text-align: center;
  font-size: 24px;
  margin: 0;
`;

const ErrorText = styled.p`
  color: #e07a5f;
  text-align: center;
  margin: 0;
`;

const WaveButton = styled.button`
  align-self: center;
  padding: 10px 32px;
  border-radius: 8px;
  border: none;
  background: #8b2635;
  color: #e8ded2;
  font-size: 16px;
  cursor: pointer;
`;

interface Props {
  /** テスト用: シード指定で決定的なランにする */
  seed?: number;
}

export const AshenRampartGame: React.FC<Props> = ({ seed }) => {
  const rng = useMemo(
    () => (seed !== undefined ? new SeededRandom(seed) : new DefaultRandom()),
    [seed]
  );
  const game = useAshenRampartGame(rng);
  const { run, selectedHandIndex, replayTick, error } = game;

  const enemies =
    run.phase === 'combat' && run.lastResult
      ? (run.lastResult.ticks[Math.min(replayTick, run.lastResult.ticks.length - 1)]
          ?.enemies ?? [])
      : [];

  const placingType = useMemo(() => {
    if (selectedHandIndex === null) return null;
    const cardId = run.deck.hand[selectedHandIndex];
    if (cardId === undefined) return null;
    const type = getCardDefinition(cardId).type;
    return type === 'tower' || type === 'trap' ? type : null;
  }, [selectedHandIndex, run.deck.hand]);

  const placingRange = useMemo(() => {
    if (selectedHandIndex === null) return undefined;
    const cardId = run.deck.hand[selectedHandIndex];
    if (cardId === undefined) return undefined;
    return getCardDefinition(cardId).tower?.range;
  }, [selectedHandIndex, run.deck.hand]);

  return (
    <Container>
      <Title>灰燼の城壁</Title>
      <StatusBar run={run} />
      {error && <ErrorText role="alert">{error}</ErrorText>}
      {run.phase === 'result' ? (
        <ResultPanel run={run} onRestart={game.restart} />
      ) : (
        <>
          <BoardGrid
            board={run.board}
            enemies={enemies}
            placingType={placingType}
            placingRange={placingRange}
            onCellClick={game.placeAt}
          />
          {run.phase === 'preparation' && (
            <>
              <HandArea
                hand={run.deck.hand}
                mana={run.mana}
                selectedIndex={selectedHandIndex}
                onSelect={game.selectCard}
              />
              <WaveButton onClick={game.beginWave}>ウェーブ開始</WaveButton>
            </>
          )}
          {run.phase === 'combat' && <ErrorText as="p">⚔️ 戦闘中…</ErrorText>}
          {run.phase === 'reward' && (
            <RewardPanel choices={run.rewardChoices} onPick={game.pickReward} />
          )}
        </>
      )}
    </Container>
  );
};
