/**
 * イベントサービス
 *
 * ランダムイベントの発生判定、選択肢の効果適用、結果表示を担当する。
 */
import type {
  RunState, BiomeId, EventChoice, EventCost, EventEffect, RandomEventDef,
} from '../../types';
import { CIV_KEYS, ALT, EVOS, RANDOM_EVENTS, EVENT_CHANCE, EVENT_MIN_BATTLES } from '../../constants';
import { dominantCiv } from '../shared/civ-utils';
import { applyStatFx, getSnap, writeSnapToRun, deepCloneRun } from '../shared/utils';

/**
 * バトル後にイベントを発生させるか判定する
 */
export function rollEvent(
  r: RunState,
  rng: () => number = Math.random,
): RandomEventDef | undefined {
  // 序盤はイベント発生しない
  if (r.btlCount < EVENT_MIN_BATTLES) return undefined;

  // 確率チェック
  if (rng() >= EVENT_CHANCE) return undefined;

  // バイオームアフィニティを考慮して候補をフィルタ
  const currentBiome = r.cBT;
  const candidates = RANDOM_EVENTS.filter(e => {
    if (e.minBiomeCount && r.bc < e.minBiomeCount) return false;
    return true;
  });

  // バイオームアフィニティがあるイベントを優先（2倍の重み）
  const weighted: RandomEventDef[] = [];
  for (const evt of candidates) {
    weighted.push(evt);
    if (evt.biomeAffinity?.includes(currentBiome as BiomeId)) {
      weighted.push(evt);
    }
  }

  if (weighted.length === 0) return undefined;
  const idx = Math.floor(rng() * weighted.length);
  return weighted[idx];
}

/**
 * イベント選択肢の効果を適用する
 */
export function applyEventChoice(
  r: RunState,
  choice: EventChoice,
  rng: () => number = Math.random,
): RunState {
  const next = deepCloneRun(r);
  const eff = choice.effect;

  switch (eff.type) {
    case 'stat_change':
      if (eff.stat === 'hp') next.mhp += eff.value;
      if (eff.stat === 'atk') next.atk += eff.value;
      if (eff.stat === 'def') next.def += eff.value;
      break;
    case 'heal':
      next.hp = Math.min(next.mhp, next.hp + eff.amount);
      break;
    case 'damage':
      next.hp = Math.max(1, next.hp - eff.amount);
      break;
    case 'bone_change':
      next.bE += eff.amount;
      break;
    case 'add_ally': {
      const aliveCount = next.al.length;
      if (aliveCount < next.mxA) {
        const civType = dominantCiv(next);
        const templates = ALT[civType];
        const tmpl = templates[Math.floor(rng() * templates.length)];
        next.al.push({
          n: tmpl.n, hp: tmpl.hp, mhp: tmpl.hp, atk: tmpl.atk,
          t: tmpl.t, a: 1, h: tmpl.h, tk: tmpl.tk,
        });
      }
      break;
    }
    case 'random_evolution': {
      const pool = EVOS.filter(e => !e.e.revA);
      if (pool.length > 0) {
        const evo = pool[Math.floor(rng() * pool.length)];
        next.evs.push(evo);
        const snap = applyStatFx(getSnap(next), evo.e);
        writeSnapToRun(next, snap);
        const key = CIV_KEYS[evo.t];
        next[key] += 1;
      }
      break;
    }
    case 'civ_level_up': {
      const targetCiv = eff.civType === 'dominant'
        ? dominantCiv(next)
        : eff.civType;
      if (targetCiv === 'tech') next.cT += 1;
      else if (targetCiv === 'life') next.cL += 1;
      else if (targetCiv === 'rit') next.cR += 1;
      break;
    }
    case 'nothing':
      break;
  }

  next.eventCount += 1;
  return next;
}

/** エフェクトタイプに対応するヒントカラーを返す */
export function getEffectHintColor(effect: EventEffect): string {
  switch (effect.type) {
    case 'heal': return '#50e090';
    case 'damage': return '#f05050';
    case 'stat_change': return '#f0c040';
    case 'add_ally': return '#50a0e0';
    case 'random_evolution': return '#c060f0';
    case 'civ_level_up': return '#f0c040';
    case 'bone_change': return '#c0a040';
    case 'nothing': return '#606060';
  }
}

/** エフェクトタイプに対応するヒントアイコンを返す */
export function getEffectHintIcon(effect: EventEffect): string {
  switch (effect.type) {
    case 'heal': return '💚';
    case 'damage': return '💔';
    case 'stat_change': return '📈';
    case 'add_ally': return '🤝';
    case 'random_evolution': return '🧬';
    case 'civ_level_up': return '🏛️';
    case 'bone_change': return '🦴';
    case 'nothing': return '…';
  }
}

/** イベント効果の結果メッセージを生成 */
export function formatEventResult(
  effect: EventEffect,
  cost?: EventCost,
  evoName?: string,
): { icon: string; text: string } {
  let base: { icon: string; text: string };
  switch (effect.type) {
    case 'stat_change': {
      const statName = effect.stat === 'hp' ? '最大HP' : effect.stat === 'atk' ? 'ATK' : 'DEF';
      const icon = effect.stat === 'hp' ? '❤️' : effect.stat === 'atk' ? '💪' : '🛡️';
      const sign = effect.value >= 0 ? '+' : '';
      base = { icon, text: `${statName} ${sign}${effect.value}!` };
      break;
    }
    case 'heal':
      base = { icon: '💚', text: `HP ${effect.amount} 回復!` };
      break;
    case 'damage':
      base = { icon: '💔', text: `${effect.amount} ダメージを受けた!` };
      break;
    case 'bone_change': {
      const bSign = effect.amount >= 0 ? '+' : '';
      base = { icon: '🦴', text: `骨 ${bSign}${effect.amount}!` };
      break;
    }
    case 'add_ally':
      base = { icon: '🤝', text: '仲間が加わった!' };
      break;
    case 'random_evolution':
      base = { icon: '🧬', text: evoName ? `${evoName} を獲得!` : 'ランダムな進化を獲得!' };
      break;
    case 'civ_level_up':
      base = { icon: '📈', text: '文明レベルが上がった!' };
      break;
    case 'nothing':
      base = { icon: '…', text: '何も起こらなかった' };
      break;
  }

  // コスト情報を付記
  if (cost) {
    if (cost.type === 'hp_damage') {
      base.text += ` (HP -${cost.amount})`;
    } else if (cost.type === 'bone') {
      base.text += ` (骨 -${cost.amount})`;
    }
  }

  return base;
}

/** イベント選択の結果を事前計算（コスト適用 + 効果適用 + メタデータ取得） */
export function computeEventResult(
  run: RunState,
  choice: EventChoice,
  rng: () => number = Math.random,
): { nextRun: RunState; evoName?: string } {
  // コスト適用
  const costApplied = deepCloneRun(run);
  if (choice.cost?.type === 'bone') {
    costApplied.bE = Math.max(0, costApplied.bE - choice.cost.amount);
  } else if (choice.cost?.type === 'hp_damage') {
    costApplied.hp = Math.max(1, costApplied.hp - choice.cost.amount);
  }

  // 効果適用前の進化数を記録
  const evsBefore = costApplied.evs.length;

  // 効果適用
  const nextRun = applyEventChoice(costApplied, choice, rng);

  // ランダム進化の場合、新たに追加された進化名を取得
  const evoName = nextRun.evs.length > evsBefore
    ? nextRun.evs[nextRun.evs.length - 1]?.n
    : undefined;

  return { nextRun, evoName };
}
