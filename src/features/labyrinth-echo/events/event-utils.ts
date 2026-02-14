// @ts-nocheck
/**
 * 迷宮の残響 - イベント処理ユーティリティ
 *
 * LabyrinthEchoGame.tsx §5 から抽出。
 * イベント選択・選択肢処理・バリデーション等の純粋関数群。
 */
import {
  invariant, shuffle, evalCond, resolveOutcome,
  applyModifiers, applyToPlayer, computeDrain,
  classifyImpact,
} from '../game-logic';

/** ビネット視覚効果をプレイヤーのHPから計算 */
export const computeVignette = (player) => {
  if (!player) return {};
  const hr = player.hp / player.maxHp, mr = player.mn / player.maxMn;
  const spread = hr < 0.5 ? Math.round((1 - hr) * 200) : 0;
  return {
    boxShadow: spread > 0 ? `inset 0 0 ${spread}px ${Math.round(spread * 0.4)}px rgba(${hr < 0.25 ? "180,0,0" : "60,0,0"},${(0.6 - hr).toFixed(2)})` : "none",
    filter: mr < 0.3 ? `blur(${Math.round((0.3 - mr) * 3)}px) saturate(${(mr * 3).toFixed(1)})` : "none",
  };
};

/**
 * チェインフラグをパース。
 * @returns チェインイベントID or null
 */
export const parseChainFlag = (flag) => {
  if (!flag) return null;
  if (flag.startsWith("chain:")) return flag.slice(6);
  return null;
};

/**
 * プレイヤーの選択を処理 — 純粋計算、副作用なし。
 * @pre event と player が non-null、0 <= choiceIdx < event.ch.length
 * @post UI コールバックに必要な全派生データを返す
 */
export const processChoice = (event, choiceIdx, player, fx, diff) => {
  invariant(event && player, "processChoice", "event and player required");
  invariant(choiceIdx >= 0 && choiceIdx < event.ch.length, "processChoice", `invalid index ${choiceIdx}`);
  const choice  = event.ch[choiceIdx];
  const outcome = resolveOutcome(choice, player, fx);
  const mods    = applyModifiers(outcome, fx, diff, player.st);
  const chainId = parseChainFlag(outcome.fl);
  let playerFlag = chainId ? null : outcome.fl;
  if (fx.curseImmune && playerFlag === "add:呪い") playerFlag = null;
  const updated  = applyToPlayer(player, mods, playerFlag);
  const { player: drained, drain } = computeDrain(updated, fx, diff);
  const impact   = classifyImpact(mods.hp, mods.mn);
  return { choice, outcome, mods, chainId, playerFlag, drained, drain, impact };
};

/** ロード時にイベントデータをバリデーション（フェイルファスト DbC） */
export const validateEvents = (events, EVENT_TYPE) => {
  for (const e of events) {
    invariant(e.id, "validateEvents", "Event missing id");
    invariant(Array.isArray(e.fl) && e.fl.length > 0, "validateEvents", `${e.id}: floors must be non-empty array`);
    invariant(EVENT_TYPE[e.tp], "validateEvents", `${e.id}: unknown type "${e.tp}"`);
    invariant(Array.isArray(e.ch) && e.ch.length > 0, "validateEvents", `${e.id}: choices required`);
    for (const ch of e.ch) {
      invariant(ch.t, "validateEvents", `${e.id}: choice missing text`);
      invariant(Array.isArray(ch.o) && ch.o.length > 0, "validateEvents", `${e.id}: "${ch.t}" must have outcomes`);
    }
  }
  return events;
};

/**
 * イベントを選択（chainOnlyイベントと使用済みIDを除外）。
 * チェインイベントは明示的なチェインフラグでのみトリガーされる。
 * クロスランイベントは metaCond のチェックが必要。
 * chainBoost: チェイン結果を持つイベントの重みを倍にする。
 */
export const pickEvent = (events, floor, usedIds, meta, fx) => {
  const pool = events.filter(e =>
    e.fl.includes(floor) && !usedIds.includes(e.id) && !e.chainOnly
    && (!e.metaCond || e.metaCond(meta))
  );
  if (pool.length === 0) return null;
  // chainBoost: チェイン開始イベントの重みを倍にする
  if (fx?.chainBoost) {
    const boosted = [];
    for (const e of pool) {
      boosted.push(e);
      const hasChain = e.ch?.some(c => c.o?.some(o => o.fl?.startsWith("chain:")));
      if (hasChain) boosted.push(e);
    }
    return shuffle(boosted)[0];
  }
  return shuffle(pool)[0];
};

/** IDでチェインイベントを検索 */
export const findChainEvent = (events, id) => events.find(e => e.id === id) ?? null;
