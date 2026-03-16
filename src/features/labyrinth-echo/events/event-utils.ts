/**
 * 迷宮の残響 - イベント処理ユーティリティ
 *
 * LabyrinthEchoGame.tsx §5 から抽出。
 * イベント選択・選択肢処理・バリデーション等の純粋関数群。
 *
 * NOTE: processChoice は旧型（フラット DifficultyDef, Player.st）で呼ばれるため、
 * ドメイン層の関数をそのまま使えない。ドメイン移行が完了するまでローカルに
 * 旧互換の関数を保持する。
 */
import { invariant } from '../domain/contracts/invariants';
import { clamp, shuffle } from '../../../utils/math-utils';
import { evalCondCompat } from '../domain/events/condition';
import type { StatusEffectId } from '../domain/models/player';
import type { CSSProperties } from 'react';
import { shuffleWith } from '../domain/events/random';
import type { RandomSource } from '../domain/events/random';

// ── ドメイン型（LabyrinthEchoGame.tsx がドメイン型に移行済み） ──

/** プレイヤー状態（statuses: readonly StatusEffectId[] 形式） */
export interface Player {
  hp: number; maxHp: number;
  mn: number; maxMn: number;
  inf: number;
  statuses: readonly StatusEffectId[];
}

/** 難易度定義（modifiers/rewards サブオブジェクト形式） */
export interface DifficultyDef {
  id: string; name: string; subtitle: string;
  color: string; icon: string; description: string;
  modifiers: {
    hpMod: number; mnMod: number; drainMod: number; dmgMult: number;
  };
  rewards: {
    kpOnDeath: number; kpOnWin: number;
  };
}

/** FxState（ドメイン FxState と同一構造） */
import type { FxState } from '../domain/models/unlock';
export type { FxState };

/** MetaState（ドメイン MetaState を再エクスポート） */
import type { MetaState } from '../domain/models/meta-state';
export type { MetaState };

/** 旧アウトカム */
export interface Outcome {
  c: string; r: string;
  hp?: number; mn?: number; inf?: number;
  fl?: string;
}

/** 旧選択肢 */
export interface Choice {
  t: string;
  o: Outcome[];
}

// ── 旧互換ロジック（ドメイン移行完了まで） ──

/** ステータスメタ情報（computeDrain用） */
const STATUS_META: Readonly<Record<string, { tick: { hp: number; mn: number } | null }>> = {
  "負傷": { tick: null },
  "混乱": { tick: null },
  "出血": { tick: { hp: -5, mn: 0 } },
  "恐怖": { tick: { hp: 0, mn: -4 } },
  "呪い": { tick: null },
};

/**
 * 条件を評価してアウトカムを決定する（旧evalCond互換）
 */
const resolveOutcome = (choice: Choice, player: Player, fx: FxState): Outcome => {
  invariant(choice?.o?.length > 0, "resolveOutcome", "choice must have outcomes");
  for (const o of choice.o) {
    if (o.c !== "default" && evalCondCompat(o.c, player, fx)) return o;
  }
  return choice.o.find(o => o.c === "default") ?? choice.o[0];
};

/**
 * FX/難易度の修正値を適用する（旧フラット DifficultyDef 互換）
 */
const applyModifiers = (outcome: Outcome, fx: FxState, diff: DifficultyDef | null, playerStatuses: readonly string[]): { hp: number; mn: number; inf: number } => {
  let hp = outcome.hp ?? 0, mn = outcome.mn ?? 0, inf = outcome.inf ?? 0;
  if (hp > 0) hp = Math.round(hp * fx.healMult);
  if (hp < 0) hp = Math.round(hp * fx.hpReduce);
  if (diff && diff.modifiers.dmgMult !== 1) {
    if (hp < 0) hp = Math.round(hp * diff.modifiers.dmgMult);
    if (mn < 0) mn = Math.round(mn * diff.modifiers.dmgMult);
  }
  if (inf > 0) inf = Math.round(inf * fx.infoMult);
  if (mn < 0) mn = Math.round(mn * fx.mnReduce);
  if (playerStatuses.includes("呪い") && inf > 0) inf = Math.round(inf * 0.5);
  return { hp, mn, inf };
};

/**
 * プレイヤーにステータス変更を適用する（ドメイン Player.statuses 形式）
 */
const applyToPlayer = (player: Player, { hp, mn, inf }: { hp: number; mn: number; inf: number }, flag: string | null): Player => {
  let sts: StatusEffectId[] = [...player.statuses];
  if (flag?.startsWith("add:"))    { const s = flag.slice(4) as StatusEffectId; if (!sts.includes(s)) sts.push(s); }
  if (flag?.startsWith("remove:")) { sts = sts.filter(s => s !== flag.slice(7)); }
  return {
    ...player,
    hp:  clamp(player.hp + hp, 0, player.maxHp),
    mn:  clamp(player.mn + mn, 0, player.maxMn),
    inf: Math.max(0, player.inf + inf),
    statuses: sts,
  };
};

/**
 * ターン経過ドレインを計算する（ドメイン DifficultyDef, Player.statuses 形式）
 */
const computeDrain = (player: Player, fx: FxState, diff: DifficultyDef | null): { player: Player; drain: { hp: number; mn: number } | null } => {
  const base = diff ? diff.modifiers.drainMod : -1;
  let hpD = 0, mnD = fx.drainImmune ? 0 : base;
  for (const s of player.statuses) {
    const tick = STATUS_META[s]?.tick;
    if (!tick) continue;
    let h = tick.hp;
    const m = tick.mn;
    if (s === "出血" && fx.bleedReduce) h = Math.round(h * 0.5);
    hpD += h; mnD += m;
  }
  if (hpD === 0 && mnD === 0) return { player, drain: null };
  return {
    player: { ...player, hp: clamp(player.hp + hpD, 0, player.maxHp), mn: clamp(player.mn + mnD, 0, player.maxMn) },
    drain: { hp: hpD, mn: mnD },
  };
};

/** ダメージ/回復のインパクトを分類する */
const classifyImpact = (hp: number, mn: number): string | null => {
  if (hp < -15) return "bigDmg";
  if (hp < 0 || mn < -10) return "dmg";
  if (hp > 0) return "heal";
  return null;
};

/** イベント定義 */
export interface GameEvent {
  id: string;
  fl: number[];
  tp: string;
  sit: string;
  ch: Choice[];
  chainOnly?: boolean;
  metaCond?: (meta: MetaState) => boolean;
}

/** イベント種別定義 */
export interface EventTypeDef {
  label: string;
  colors: readonly string[];
}

/** ビネット視覚効果をプレイヤーのHPから計算 */
export const computeVignette = (player: Player | null): CSSProperties => {
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
export const parseChainFlag = (flag: string | undefined | null): string | null => {
  if (!flag) return null;
  if (flag.startsWith("chain:")) return flag.slice(6);
  return null;
};

/**
 * プレイヤーの選択を処理 — 純粋計算、副作用なし。
 * @pre event と player が non-null、0 <= choiceIdx < event.ch.length
 * @post UI コールバックに必要な全派生データを返す
 */
export const processChoice = (event: GameEvent, choiceIdx: number, player: Player, fx: FxState, diff: DifficultyDef | null) => {
  invariant(event && player, "processChoice", "event and player required");
  invariant(choiceIdx >= 0 && choiceIdx < event.ch.length, "processChoice", `invalid index ${choiceIdx}`);
  const choice  = event.ch[choiceIdx];
  const outcome = resolveOutcome(choice, player, fx);
  const mods    = applyModifiers(outcome, fx, diff, player.statuses);
  const chainId = parseChainFlag(outcome.fl ?? null);
  let playerFlag: string | null = chainId ? null : (outcome.fl ?? null);
  if (fx.curseImmune && playerFlag === "add:呪い") playerFlag = null;
  const updated  = applyToPlayer(player, mods, playerFlag);
  const { player: drained, drain } = computeDrain(updated, fx, diff);
  const impact   = classifyImpact(mods.hp, mods.mn);
  return { choice, outcome, mods, chainId, playerFlag, drained, drain, impact };
};

/** ロード時にイベントデータをバリデーション（フェイルファスト DbC） */
export const validateEvents = (events: GameEvent[], EVENT_TYPE: Record<string, EventTypeDef>): GameEvent[] => {
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
export const pickEvent = (events: GameEvent[], floor: number, usedIds: string[], meta: MetaState, fx: FxState, rng?: RandomSource): GameEvent | null => {
  const pool = events.filter(e =>
    e.fl.includes(floor) && !usedIds.includes(e.id) && !e.chainOnly
    && (!e.metaCond || e.metaCond(meta))
  );
  if (pool.length === 0) return null;
  // 重み付けプールを構築
  const weighted: GameEvent[] = [];
  for (const e of pool) {
    weighted.push(e);
    // chainBoost: チェイン開始イベントの重みを倍にする
    if (fx?.chainBoost) {
      const hasChain = e.ch?.some(c => c.o?.some(o => o.fl?.startsWith("chain:")));
      if (hasChain) weighted.push(e);
    }
    // 安息イベントの出現確率を上げる
    if (e.tp === "rest") weighted.push(e);
  }
  // 乱数ソースが指定されていればそれを使い、なければ旧来のshuffleを使用
  if (rng) return shuffleWith(weighted, rng)[0];
  return shuffle(weighted)[0];
};

/** IDでチェインイベントを検索 */
export const findChainEvent = (events: GameEvent[], id: string): GameEvent | null => events.find(e => e.id === id) ?? null;
