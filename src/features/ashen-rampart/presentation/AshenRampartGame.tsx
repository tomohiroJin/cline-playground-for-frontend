/**
 * 灰燼の城壁 - ゲーム画面
 *
 * 「構築 ⇄ 遠征」の2画面を遷移する（反復7 段階1・設計書 §3.2）。
 * 反復6 までの単発ランは遠征に置き換えた。遠征の中の遷移
 * （ブリーフィング・ステージ・獲得・結果）は ExpeditionView が持つ。
 *
 * **遠征は `attempt` を key にして毎回作り直す。** 「同じデッキで別のシードに挑む」で
 * 前の遠征のフック（ログの記録済み集合・ステージの状態）が残らないようにする。
 */
import React, { useState } from 'react';
import { DeckBuilder } from './DeckBuilder';
import { ExpeditionView } from './ExpeditionView';
import { HEADER_CLEARANCE } from './layout-constants';
import { createSeed } from '../application/use-cases/start-run';

export { HEADER_CLEARANCE };

type Phase = 'building' | 'expedition';

export const AshenRampartGame: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('building');
  const [cards, setCards] = useState<string[]>([]);
  const [seed, setSeed] = useState<number>(0);
  const [lastSeed, setLastSeed] = useState<number | undefined>(undefined);
  const [attempt, setAttempt] = useState(0);

  const beginExpedition = (nextSeed: number): void => {
    setSeed(nextSeed);
    setLastSeed(nextSeed);
    setAttempt((current) => current + 1);
    setPhase('expedition');
  };

  const handleBuilderStart = (chosenCards: string[], chosenSeed?: number): void => {
    setCards(chosenCards);
    beginExpedition(chosenSeed ?? createSeed());
  };

  if (phase === 'building') {
    // デッキは引き継ぐ（12枚を毎回組み直させない）。シードは欄に入れず添えるだけ（SeedField）
    return <DeckBuilder onStart={handleBuilderStart} initialCards={cards} lastSeed={lastSeed} />;
  }
  return (
    <ExpeditionView
      key={attempt}
      cards={cards}
      seed={seed}
      onRetry={() => beginExpedition(createSeed())}
      onRebuild={() => setPhase('building')}
    />
  );
};
