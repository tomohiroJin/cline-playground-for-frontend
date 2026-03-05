// ドラフトカードシステム

import type { Card, CardEffect, CardRarity, DeckState } from './types';

// === T-101: カードデータ定義（15枚） ===

/** レアリティごとのドロー確率 */
const RARITY_PROB: Record<CardRarity, number> = {
  R: 0.6,
  SR: 0.3,
  SSR: 0.1,
};

/** 全15枚のカードデータ */
export const ALL_CARDS: readonly Card[] = Object.freeze([
  // スピード系（5枚）
  {
    id: 'SPD_01',
    name: 'ニトロブースト',
    category: 'speed',
    rarity: 'R',
    description: '最高速度 +15%（1ラップ）',
    effect: { speedMultiplier: 1.15 },
    icon: '🚀',
  },
  {
    id: 'SPD_02',
    name: 'ターボチャージ',
    category: 'speed',
    rarity: 'SR',
    description: '加速力 +25%（1ラップ）',
    effect: { accelMultiplier: 1.25 },
    icon: '⚡',
  },
  {
    id: 'SPD_03',
    name: 'スリップストリーム',
    category: 'speed',
    rarity: 'R',
    description: '相手の後方で速度 +10%',
    effect: { speedMultiplier: 1.10, specialType: 'slipstream' },
    icon: '💨',
  },
  {
    id: 'SPD_04',
    name: 'ロケットスタート',
    category: 'speed',
    rarity: 'SR',
    description: 'ラップ開始直後3秒間、速度 +30%',
    effect: { speedMultiplier: 1.30, duration: 3 },
    icon: '🔥',
  },
  {
    id: 'SPD_05',
    name: 'オーバードライブ',
    category: 'speed',
    rarity: 'SSR',
    description: '最高速度 +10%、加速力 +10%、ドリフトブースト +20%',
    effect: { speedMultiplier: 1.10, accelMultiplier: 1.10, driftBoostMultiplier: 1.20 },
    icon: '⭐',
  },
  // ハンドリング系（4枚）
  {
    id: 'HDL_01',
    name: 'グリップタイヤ',
    category: 'handling',
    rarity: 'R',
    description: '旋回速度 +20%',
    effect: { turnMultiplier: 1.20 },
    icon: '🛞',
  },
  {
    id: 'HDL_02',
    name: 'ドリフトマスター',
    category: 'handling',
    rarity: 'SR',
    description: 'ドリフトブースト +50%、ドリフト最低速度条件 -20%',
    effect: { driftBoostMultiplier: 1.50, specialType: 'drift_master' },
    icon: '🏎️',
  },
  {
    id: 'HDL_03',
    name: 'エアロパーツ',
    category: 'handling',
    rarity: 'R',
    description: 'コーナリング中の減速 -30%',
    effect: { specialType: 'aero' },
    icon: '🪶',
  },
  {
    id: 'HDL_04',
    name: 'フルチューン',
    category: 'handling',
    rarity: 'SSR',
    description: '旋回速度 +15%、ドリフトブースト +30%、壁減速 -20%',
    effect: { turnMultiplier: 1.15, driftBoostMultiplier: 1.30, wallDamageMultiplier: 0.80 },
    icon: '🔧',
  },
  // 防御系（3枚）
  {
    id: 'DEF_01',
    name: 'バンパーガード',
    category: 'defense',
    rarity: 'R',
    description: '壁ヒット減速を50%軽減',
    effect: { wallDamageMultiplier: 0.50 },
    icon: '🛡️',
  },
  {
    id: 'DEF_02',
    name: 'シールド',
    category: 'defense',
    rarity: 'SR',
    description: '次の1回の衝突（壁/車）を完全無効化',
    effect: { shieldCount: 1 },
    icon: '🔰',
  },
  {
    id: 'DEF_03',
    name: 'リカバリーブースト',
    category: 'defense',
    rarity: 'R',
    description: '壁ヒット後に小ブースト（0.15、0.3秒）',
    effect: { specialType: 'recovery_boost' },
    icon: '💫',
  },
  // 特殊系（2枚）
  {
    id: 'SPC_01',
    name: 'HEAT チャージャー',
    category: 'special',
    rarity: 'SR',
    description: 'HEAT 蓄積速度 ×2',
    effect: { heatGainMultiplier: 2.0 },
    icon: '🌡️',
  },
  {
    id: 'SPC_03',
    name: 'ワイルドカード',
    category: 'special',
    rarity: 'SSR',
    description: 'ランダムに2枚のカード効果を同時発動',
    effect: { specialType: 'wildcard' },
    icon: '🃏',
  },
]) as Card[];

// === T-102: デッキ管理ロジック ===

/** シャッフル（Fisher-Yates） */
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** 全15枚からデッキ生成・シャッフル */
export const createDeck = (): DeckState => ({
  pool: shuffle([...ALL_CARDS]),
  hand: [],
  active: [],
  history: [],
});

/** 確率ベースの3枚ドロー */
export const drawCards = (deck: DeckState, count: number = 3): DeckState => {
  const pool = deck.pool.length >= count ? [...deck.pool] : shuffle([...ALL_CARDS]);

  // レアリティ確率に基づいてドロー
  const hand: Card[] = [];
  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    let targetRarity: CardRarity;
    if (roll < RARITY_PROB.SSR) {
      targetRarity = 'SSR';
    } else if (roll < RARITY_PROB.SSR + RARITY_PROB.SR) {
      targetRarity = 'SR';
    } else {
      targetRarity = 'R';
    }

    // 対象レアリティのカードをプールから検索
    const idx = pool.findIndex(c => c.rarity === targetRarity);
    if (idx >= 0) {
      hand.push(pool[idx]);
      pool.splice(idx, 1);
    } else {
      // 対象レアリティがなければプールの先頭から取得
      if (pool.length > 0) {
        hand.push(pool[0]);
        pool.splice(0, 1);
      }
    }
  }

  return { ...deck, pool, hand };
};

/** カード選択・デッキ更新 */
export const selectCard = (deck: DeckState, cardId: string): DeckState => {
  const selected = deck.hand.find(c => c.id === cardId);
  if (!selected) return deck;

  // 残り2枚はプールに戻す
  const remaining = deck.hand.filter(c => c.id !== cardId);
  const newPool = [...deck.pool, ...remaining];

  // デッキが3枚未満なら全15枚で再生成
  const pool = newPool.length < 3 ? shuffle([...ALL_CARDS]) : newPool;

  // ワイルドカード処理: ランダムに2枚の効果を選択
  let effects: CardEffect[];
  if (selected.effect.specialType === 'wildcard') {
    const others = ALL_CARDS.filter(c => c.id !== 'SPC_03');
    const picked: Card[] = [];
    const candidates = [...others];
    for (let i = 0; i < 2 && candidates.length > 0; i++) {
      const idx = Math.floor(Math.random() * candidates.length);
      picked.push(candidates[idx]);
      candidates.splice(idx, 1);
    }
    effects = [...deck.active, ...picked.map(c => c.effect)];
  } else {
    effects = [...deck.active, selected.effect];
  }

  return {
    pool,
    hand: [],
    active: effects,
    history: [...deck.history, selected],
  };
};

/** 適用中効果の集計（加算合算） */
export const getActiveEffects = (deck: DeckState): CardEffect => {
  if (deck.active.length === 0) {
    return {};
  }

  const merged: CardEffect = {};
  for (const eff of deck.active) {
    // 乗算系は加算合算（1.0 ベースからのずれを足す）
    if (eff.speedMultiplier !== undefined) {
      merged.speedMultiplier = (merged.speedMultiplier ?? 1) + (eff.speedMultiplier - 1);
    }
    if (eff.accelMultiplier !== undefined) {
      merged.accelMultiplier = (merged.accelMultiplier ?? 1) + (eff.accelMultiplier - 1);
    }
    if (eff.turnMultiplier !== undefined) {
      merged.turnMultiplier = (merged.turnMultiplier ?? 1) + (eff.turnMultiplier - 1);
    }
    if (eff.driftBoostMultiplier !== undefined) {
      merged.driftBoostMultiplier = (merged.driftBoostMultiplier ?? 1) + (eff.driftBoostMultiplier - 1);
    }
    if (eff.wallDamageMultiplier !== undefined) {
      // 壁ダメージ軽減は乗算ではなく、割合の加算
      merged.wallDamageMultiplier = (merged.wallDamageMultiplier ?? 1) + (eff.wallDamageMultiplier - 1);
    }
    if (eff.heatGainMultiplier !== undefined) {
      merged.heatGainMultiplier = (merged.heatGainMultiplier ?? 1) + (eff.heatGainMultiplier - 1);
    }
    if (eff.shieldCount !== undefined) {
      merged.shieldCount = (merged.shieldCount ?? 0) + eff.shieldCount;
    }
    // specialType は最後のものを保持
    if (eff.specialType !== undefined) {
      merged.specialType = eff.specialType;
    }
    // duration は最大値を保持
    if (eff.duration !== undefined) {
      merged.duration = Math.max(merged.duration ?? 0, eff.duration);
    }
  }

  return merged;
};

/** ラップ終了時の効果解除 */
export const clearActiveEffects = (deck: DeckState): DeckState => ({
  ...deck,
  active: [],
});

// === T-103: カード効果適用ロジック ===

/** 効果をプレイヤーの activeCards に適用 */
export const applyCardEffects = (effects: CardEffect): {
  speedMul: number;
  accelMul: number;
  turnMul: number;
  driftBoostMul: number;
  wallDamageMul: number;
  heatGainMul: number;
  shieldCount: number;
} => ({
  speedMul: effects.speedMultiplier ?? 1,
  accelMul: effects.accelMultiplier ?? 1,
  turnMul: effects.turnMultiplier ?? 1,
  driftBoostMul: effects.driftBoostMultiplier ?? 1,
  wallDamageMul: effects.wallDamageMultiplier ?? 1,
  heatGainMul: effects.heatGainMultiplier ?? 1,
  shieldCount: effects.shieldCount ?? 0,
});

/** CPU のカード自動選択ロジック */
export const cpuSelectCard = (deck: DeckState, skill: number): DeckState => {
  if (deck.hand.length === 0) return deck;

  // スキルが高いほどレアリティの高いカードを選ぶ傾向
  const sorted = [...deck.hand].sort((a, b) => {
    const rarityOrder: Record<CardRarity, number> = { R: 1, SR: 2, SSR: 3 };
    return rarityOrder[b.rarity] - rarityOrder[a.rarity];
  });

  // skill に応じた選択（高スキル = 最高レアリティ、低スキル = ランダム）
  const idx = Math.random() < skill ? 0 : Math.floor(Math.random() * sorted.length);
  return selectCard(deck, sorted[idx].id);
};

export const DraftCards = {
  ALL_CARDS,
  createDeck,
  drawCards,
  selectCard,
  getActiveEffects,
  clearActiveEffects,
  applyCardEffects,
  cpuSelectCard,
};
