import { startRun } from './start-run';
import { playCard } from './play-card';
import { startWave, finishWave } from './start-wave';
import { chooseReward } from './choose-reward';
import { SeededRandom } from '../../infrastructure/random/seeded-random';
import { PLAINS_MAP } from '../../domain/board/stage-map';
import { PLAINS_WAVES } from '../../domain/combat/waves';
import { getCardDefinition } from '../../domain/cards/card-pool';
import { HAND_SIZE } from '../../domain/cards/deck';
import type { RunState } from '../../domain/run/run-state';

const rng = () => new SeededRandom(42);

/** タワーを全設置マスに強制配置した状態を作る（テスト用に盤面だけ差し替え） */
const withFullTowers = (state: RunState): RunState => ({
  ...state,
  board: {
    ...state.board,
    towers: PLAINS_MAP.buildSlots.map((pos) => ({ cardId: 'arrow-tower', pos })),
  },
});

describe('startWave', () => {
  it('戦闘フェーズへ遷移し戦闘結果を保持する', () => {
    const state = startWave(startRun(rng()));
    expect(state.phase).toBe('combat');
    expect(state.lastResult).not.toBeNull();
    expect(state.lastResult?.ticks.length).toBeGreaterThan(0);
  });

  it('準備フェーズ以外からは開始できない', () => {
    const state = startWave(startRun(rng()));
    expect(() => startWave(state)).toThrow();
  });
});

describe('finishWave', () => {
  it('漏れた敵の数だけライフが減る', () => {
    // タワーなし → 全敵漏れ
    const combat = startWave(startRun(rng()));
    const leaked = combat.lastResult?.leaked ?? 0;
    const next = finishWave(combat, rng());
    expect(leaked).toBeGreaterThan(0);
    expect(next.life).toBe(combat.life - leaked);
  });

  it('ライフが0以下になると敗北リザルトへ', () => {
    const combat = startWave({ ...startRun(rng()), life: 1 });
    const next = finishWave(combat, rng());
    expect(next.phase).toBe('result');
    expect(next.status).toBe('lost');
    expect(next.life).toBe(0);
  });

  it('ウェーブを凌ぐと報酬フェーズへ進み選択肢3枚と waveIndex が進む', () => {
    const combat = startWave(withFullTowers(startRun(rng())));
    const next = finishWave(combat, rng());
    expect(next.phase).toBe('reward');
    expect(next.rewardChoices).toHaveLength(3);
    expect(next.waveIndex).toBe(1);
    expect(next.score).toBeGreaterThan(0);
    // 修飾子はリセットされる
    expect(next.pendingModifiers.openingDamage).toBe(0);
    expect(next.pendingModifiers.speedMultiplier).toBe(1);
  });

  it('最終ウェーブを凌ぐと勝利リザルトへ（ライフボーナス加算）', () => {
    const base = withFullTowers(startRun(rng()));
    const lastWaveState: RunState = {
      ...base,
      waveIndex: PLAINS_WAVES.length - 1,
    };
    const next = finishWave(startWave(lastWaveState), rng());
    expect(next.phase).toBe('result');
    expect(next.status).toBe('won');
  });

  it('使い切った罠は盤面から除去される', () => {
    // 落とし穴（uses:1）を経路マスに配置、最初の敵が踏んで使い切る
    const base = startRun(rng());
    const stateWithTrap: RunState = {
      ...base,
      board: {
        ...base.board,
        traps: [
          {
            cardId: 'pitfall',
            pos: PLAINS_MAP.path[5],
            usesLeft: 1,
          },
        ],
      },
    };
    const combat = startWave(stateWithTrap);
    const next = finishWave(combat, rng());
    // 落とし穴は1体を葬り、残る5体が漏れる
    expect(combat.lastResult?.leaked).toBe(5);
    // usesLeft が 0 になった罠は除去される
    expect(next.board.traps).toHaveLength(0);
  });

  it('使い残した罠は usesLeft を減らして盤面に残る', () => {
    // 棘罠を usesLeft:10 で配置（手動オーバーライド）、6体全員が踏んで usesLeft:4 で残る
    const base = startRun(rng());
    const stateWithTrap: RunState = {
      ...base,
      board: {
        ...base.board,
        traps: [
          {
            cardId: 'spike-trap',
            pos: PLAINS_MAP.path[5],
            usesLeft: 10,
          },
        ],
      },
    };
    const combat = startWave(stateWithTrap);
    const next = finishWave(combat, rng());
    // 棘罠は 5 ダメージで雑兵は 20hp なので生き残る。全員漏れる
    expect(combat.lastResult?.leaked).toBe(6);
    // usesLeft は 10 - 6 = 4 になる
    expect(next.board.traps).toHaveLength(1);
    expect(next.board.traps[0].cardId).toBe('spike-trap');
    expect(next.board.traps[0].usesLeft).toBe(4);
  });
});

describe('chooseReward', () => {
  const rewardState = (): RunState =>
    finishWave(startWave(withFullTowers(startRun(rng()))), rng());

  it('選んだカードが捨札に加わり準備フェーズへ戻る', () => {
    const state = rewardState();
    const chosen = state.rewardChoices[0];
    const next = chooseReward(state, 0, rng());
    expect(next.phase).toBe('preparation');
    expect(next.mana).toBe(next.manaMax);
    expect(next.deck.hand).toHaveLength(HAND_SIZE);
    // 選んだカードがデッキ全体（山札+手札+捨札）に含まれる
    const all = [...next.deck.drawPile, ...next.deck.hand, ...next.deck.discardPile];
    expect(all).toContain(chosen);
    expect(getCardDefinition(chosen)).toBeDefined();
  });

  it('スキップ（null）ではデッキ枚数が変わらない', () => {
    const state = rewardState();
    const before =
      state.deck.drawPile.length +
      state.deck.hand.length +
      state.deck.discardPile.length;
    const next = chooseReward(state, null, rng());
    const after =
      next.deck.drawPile.length +
      next.deck.hand.length +
      next.deck.discardPile.length;
    expect(after).toBe(before);
  });

  it('報酬フェーズ以外では選択できない', () => {
    expect(() => chooseReward(startRun(rng()), 0, rng())).toThrow();
  });
});
