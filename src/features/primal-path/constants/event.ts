/**
 * イベント関連の定数
 */
import type { RandomEventDef } from '../types';

/** イベント発生確率（30%） */
export const EVENT_CHANCE = 0.3;

/** イベント発生不可の最低バトル数（序盤を除外） */
export const EVENT_MIN_BATTLES = 1;

/** ランダムイベント定義（8種） */
export const RANDOM_EVENTS: readonly RandomEventDef[] = Object.freeze([
  Object.freeze({
    id: 'bone_merchant' as const,
    name: '骨の商人',
    description: '奇妙な商人が骨と引き換えに力を分けてくれるという。',
    situationText: '取引に応じるか？',
    choices: Object.freeze([
      Object.freeze({ label: '骨10で取引する', description: '骨を消費してATK+4を得る', effect: Object.freeze({ type: 'stat_change' as const, stat: 'atk' as const, value: 4 }), riskLevel: 'safe' as const, cost: Object.freeze({ type: 'bone' as const, amount: 10 }) }),
      Object.freeze({ label: '骨25で大取引する', description: '骨を多く消費して大きな力を得る', effect: Object.freeze({ type: 'stat_change' as const, stat: 'atk' as const, value: 10 }), riskLevel: 'risky' as const, cost: Object.freeze({ type: 'bone' as const, amount: 25 }) }),
      Object.freeze({ label: '立ち去る', description: '何も起こらない', effect: Object.freeze({ type: 'nothing' as const }), riskLevel: 'safe' as const }),
    ]),
  }),
  Object.freeze({
    id: 'ancient_shrine' as const,
    name: '古代の祠',
    description: '苔むした祠から微かな光が漏れている。祈りを捧げるか？',
    situationText: '神秘的な力を感じる…',
    choices: Object.freeze([
      Object.freeze({ label: '祈りを捧げる', description: '最もレベルの高い文明が1上がる', effect: Object.freeze({ type: 'civ_level_up' as const, civType: 'dominant' as const }), riskLevel: 'safe' as const }),
      Object.freeze({ label: '祠を調べる', description: 'ランダムな進化を得るかもしれない', effect: Object.freeze({ type: 'random_evolution' as const }), riskLevel: 'risky' as const }),
      Object.freeze({ label: '通り過ぎる', description: '何も起こらない', effect: Object.freeze({ type: 'nothing' as const }), riskLevel: 'safe' as const }),
    ]),
  }),
  Object.freeze({
    id: 'lost_ally' as const,
    name: '迷い仲間',
    description: '傷ついた仲間が助けを求めている。助けるには体力を消耗するが…',
    situationText: 'どうする？',
    choices: Object.freeze([
      Object.freeze({ label: '助ける', description: '仲間が加入するがHP-15のダメージを受ける', effect: Object.freeze({ type: 'add_ally' as const, allyTemplate: 'random' }), riskLevel: 'risky' as const, cost: Object.freeze({ type: 'hp_damage' as const, amount: 15 }) }),
      Object.freeze({ label: '薬草を渡す', description: 'HP-5で仲間を回復させ、DEF+3を得る', effect: Object.freeze({ type: 'stat_change' as const, stat: 'def' as const, value: 3 }), riskLevel: 'safe' as const, cost: Object.freeze({ type: 'hp_damage' as const, amount: 5 }) }),
      Object.freeze({ label: '立ち去る', description: '見捨てた罪悪感…骨を10拾う', effect: Object.freeze({ type: 'bone_change' as const, amount: 10 }), riskLevel: 'safe' as const }),
    ]),
  }),
  Object.freeze({
    id: 'poison_swamp' as const,
    name: '毒沼',
    description: '足元に毒々しい沼が広がっている。突っ切るか迂回するか…',
    situationText: '危険な道を選ぶか？',
    choices: Object.freeze([
      Object.freeze({ label: '突っ切る', description: 'HP-20ダメージを受けるがATK+5を得る', effect: Object.freeze({ type: 'stat_change' as const, stat: 'atk' as const, value: 5 }), riskLevel: 'dangerous' as const, cost: Object.freeze({ type: 'hp_damage' as const, amount: 20 }) }),
      Object.freeze({ label: '迂回して薬草を探す', description: 'HPを回復できるかもしれない', effect: Object.freeze({ type: 'heal' as const, amount: 15 }), riskLevel: 'safe' as const }),
      Object.freeze({ label: '毒を採取する', description: '危険だが骨15を得る', effect: Object.freeze({ type: 'bone_change' as const, amount: 15 }), riskLevel: 'risky' as const, cost: Object.freeze({ type: 'hp_damage' as const, amount: 10 }) }),
    ]),
    biomeAffinity: Object.freeze(['grassland' as const]),
  }),
  Object.freeze({
    id: 'mystery_fossil' as const,
    name: '謎の化石',
    description: '地面に埋まった巨大な化石を発見した。',
    situationText: 'どう活用する？',
    choices: Object.freeze([
      Object.freeze({ label: '掘り出す', description: 'DEFが上がるかもしれない', effect: Object.freeze({ type: 'stat_change' as const, stat: 'def' as const, value: 5 }), riskLevel: 'safe' as const }),
      Object.freeze({ label: '骨として持ち帰る', description: '骨を入手する', effect: Object.freeze({ type: 'bone_change' as const, amount: 20 }), riskLevel: 'safe' as const }),
      Object.freeze({ label: '調べて立ち去る', description: '知見を得て文明レベル+1', effect: Object.freeze({ type: 'civ_level_up' as const, civType: 'dominant' as const }), riskLevel: 'safe' as const }),
    ]),
  }),
  Object.freeze({
    id: 'beast_den' as const,
    name: '獣の巣穴',
    description: '巨大な獣の巣穴を見つけた。中に何かありそうだが…',
    situationText: '危険を冒すか？',
    choices: Object.freeze([
      Object.freeze({ label: '探索する', description: 'HP-20ダメージを受けるがATK+12を得る', effect: Object.freeze({ type: 'stat_change' as const, stat: 'atk' as const, value: 12 }), riskLevel: 'dangerous' as const, cost: Object.freeze({ type: 'hp_damage' as const, amount: 20 }) }),
      Object.freeze({ label: '罠を仕掛ける', description: '骨を消費して安全にATK+6', effect: Object.freeze({ type: 'stat_change' as const, stat: 'atk' as const, value: 6 }), riskLevel: 'safe' as const, cost: Object.freeze({ type: 'bone' as const, amount: 8 }) }),
      Object.freeze({ label: '見なかったことにする', description: '安全に立ち去り、DEF+2を得る', effect: Object.freeze({ type: 'stat_change' as const, stat: 'def' as const, value: 2 }), riskLevel: 'safe' as const }),
    ]),
    biomeAffinity: Object.freeze(['volcano' as const]),
    minBiomeCount: 1,
  }),
  Object.freeze({
    id: 'starry_night' as const,
    name: '星降る夜',
    description: '空一面の星明かりの下、不思議な力が身体を包む。',
    situationText: '星の力をどう使う？',
    choices: Object.freeze([
      Object.freeze({ label: '瞑想する', description: 'HPを回復する', effect: Object.freeze({ type: 'heal' as const, amount: 25 }), riskLevel: 'safe' as const }),
      Object.freeze({ label: '星に願いをかける', description: 'ランダムな進化を得る', effect: Object.freeze({ type: 'random_evolution' as const }), riskLevel: 'risky' as const }),
      Object.freeze({ label: '星を観察する', description: '知恵を得てDEF+3', effect: Object.freeze({ type: 'stat_change' as const, stat: 'def' as const, value: 3 }), riskLevel: 'safe' as const }),
    ]),
  }),
  Object.freeze({
    id: 'cave_painting' as const,
    name: '古代の壁画',
    description: '洞窟の壁に文明の記録が描かれている。',
    situationText: 'どの壁画を読み解く？',
    choices: Object.freeze([
      Object.freeze({ label: '技術の壁画を読む', description: '技術レベル+1', effect: Object.freeze({ type: 'civ_level_up' as const, civType: 'tech' as const }), riskLevel: 'safe' as const }),
      Object.freeze({ label: '生活の壁画を読む', description: '生活レベル+1', effect: Object.freeze({ type: 'civ_level_up' as const, civType: 'life' as const }), riskLevel: 'safe' as const }),
      Object.freeze({ label: '儀式の壁画を読む', description: '儀式レベル+1', effect: Object.freeze({ type: 'civ_level_up' as const, civType: 'rit' as const }), riskLevel: 'safe' as const }),
    ]),
    biomeAffinity: Object.freeze(['glacier' as const]),
  }),
]);
