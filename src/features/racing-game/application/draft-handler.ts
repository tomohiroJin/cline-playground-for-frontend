// ドラフトフェーズの更新ハンドラ

import type { GameOrchestratorConfig, GameOrchestratorState } from './orchestrator-state';
import { applyCardEffectsToPlayer } from './orchestrator-state';
import { drawCards, selectCard, cpuSelectCard } from '../domain/card/deck';
import { getCpuSkill } from '../domain/player/cpu-strategy';

/** ドラフトキューを処理する */
export const processDraftQueue = (
  state: GameOrchestratorState,
  config: GameOrchestratorConfig,
  now: number,
): void => {
  // CPU プレイヤーのドラフトは自動処理
  while (state.draftQueue.length > 0) {
    const trigger = state.draftQueue[0];
    const player = state.players[trigger.playerIndex];
    if (player.isCpu) {
      state.draftQueue.shift();
      // CPU: 3 枚ドローして自動選択
      state.decks[trigger.playerIndex] = drawCards(state.decks[trigger.playerIndex], 3);
      state.decks[trigger.playerIndex] = cpuSelectCard(state.decks[trigger.playerIndex], getCpuSkill(config.raceConfig.cpuDifficulty));
      state.players[trigger.playerIndex] = applyCardEffectsToPlayer(state.players[trigger.playerIndex], state.decks[trigger.playerIndex]);
    } else {
      // 人間プレイヤー: ドラフトフェーズに遷移
      const next = state.draftQueue.shift()!;
      state.phase = 'draft';
      state.draftCurrentPlayer = next.playerIndex;
      state.draftSelectedIndex = 1;
      state.draftConfirmed = false;
      state.draftTimer = 15;
      state.draftStartTime = now;
      state.decks[next.playerIndex] = drawCards(state.decks[next.playerIndex], 3);
      return;
    }
  }
};

/** ドラフトフェーズの更新 */
export const updateDraftPhase = (
  state: GameOrchestratorState,
  config: GameOrchestratorConfig,
  now: number,
): void => {
  // タイマー更新
  const elapsed = (now - state.draftStartTime) / 1000;
  state.draftTimer = Math.max(0, 15 - elapsed);

  // タイムアウトまたは確定済み → レースに戻る
  if (state.draftTimer <= 0 || state.draftConfirmed) {
    // 未確定ならタイムアウトで選択中のカードを自動選択
    if (!state.draftConfirmed) {
      const pi = state.draftCurrentPlayer;
      const deck = state.decks[pi];
      if (deck.hand.length > 0) {
        const cardId = deck.hand[Math.min(state.draftSelectedIndex, deck.hand.length - 1)]?.id;
        if (cardId) {
          state.decks[pi] = selectCard(state.decks[pi], cardId);
          state.players[pi] = applyCardEffectsToPlayer(state.players[pi], state.decks[pi]);
        }
      }
    }

    // 残りキューがあればそちらを処理、なければレースに戻る
    if (state.draftQueue.length > 0) {
      processDraftQueue(state, config, now);
    } else {
      state.phase = 'race';
      // ラップ開始時刻をリセット
      state.players = state.players.map(p => ({ ...p, lapStart: now }));
    }
  }
};
