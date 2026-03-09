/**
 * 実績・チャレンジ関連の定数
 */
import type { AchievementDef, ChallengeDef } from '../types';

/** 実績定義（15個） */
export const ACHIEVEMENTS: readonly AchievementDef[] = Object.freeze([
  Object.freeze({ id: 'first_clear', name: '原始の証', description: '初めてゲームをクリアする', icon: '🦴', condition: Object.freeze({ type: 'first_clear' as const }) }),
  Object.freeze({ id: 'clear_10', name: '歴戦の狩人', description: '10回クリアする', icon: '🏹', condition: Object.freeze({ type: 'clear_count' as const, count: 10 }) }),
  Object.freeze({ id: 'clear_hard', name: '氷河期の生存者', description: '難易度「氷河期」をクリアする', icon: '❄️', condition: Object.freeze({ type: 'clear_difficulty' as const, difficulty: 1 }) }),
  Object.freeze({ id: 'clear_nightmare', name: '大災厄を越えし者', description: '難易度「大災厄」をクリアする', icon: '🌋', condition: Object.freeze({ type: 'clear_difficulty' as const, difficulty: 2 }) }),
  Object.freeze({ id: 'clear_myth', name: '神話の刻印者', description: '難易度「神話世界」をクリアする', icon: '⚡', condition: Object.freeze({ type: 'clear_difficulty' as const, difficulty: 3 }) }),
  Object.freeze({ id: 'all_difficulties', name: '全知全能', description: '全難易度をクリアする', icon: '👑', condition: Object.freeze({ type: 'all_difficulties_cleared' as const }) }),
  Object.freeze({ id: 'all_awakenings', name: '覚醒の極み', description: '全種類の覚醒を達成する', icon: '✨', condition: Object.freeze({ type: 'all_awakenings' as const }) }),
  Object.freeze({ id: 'big_damage', name: '原始の一撃', description: '1回の攻撃で100ダメージを与える', icon: '💥', condition: Object.freeze({ type: 'max_damage' as const, threshold: 100 }) }),
  Object.freeze({ id: 'mass_slayer', name: '百獣の王', description: '累計100体の敵を撃破する', icon: '🦁', condition: Object.freeze({ type: 'total_kills' as const, count: 100 }) }),
  Object.freeze({ id: 'fire_master', name: '炎のシナジーマスター', description: '「火」シナジーTier2を発動する', icon: '🔥', condition: Object.freeze({ type: 'synergy_tier2' as const, tag: 'fire' as const }) }),
  Object.freeze({ id: 'all_synergies', name: 'シナジーコレクター', description: '全シナジーのTier1を発動する', icon: '🧬', condition: Object.freeze({ type: 'all_synergies_tier1' as const }) }),
  Object.freeze({ id: 'event_explorer', name: '好奇心旺盛', description: '累計10回イベントに遭遇する', icon: '🗺️', condition: Object.freeze({ type: 'event_count' as const, count: 10 }) }),
  Object.freeze({ id: 'speed_runner', name: '疾風のごとく', description: '5分以内にクリアする', icon: '🏃', condition: Object.freeze({ type: 'speed_clear' as const, maxSeconds: 300 }) }),
  Object.freeze({ id: 'bone_collector', name: '骨の収集家', description: '累計1000骨を集める', icon: '💀', condition: Object.freeze({ type: 'bone_hoarder' as const, amount: 1000 }) }),
  Object.freeze({ id: 'full_tree', name: '文明の完成者', description: '文明ツリーを全解放する', icon: '🌳', condition: Object.freeze({ type: 'full_tree' as const }) }),
]);

/** チャレンジ定義（4種） */
export const CHALLENGES: readonly ChallengeDef[] = Object.freeze([
  Object.freeze({
    id: 'fragile', name: '脆き肉体', description: '初期HPが半分。被ダメージ+25%。克服すれば真の強者。', icon: '💔',
    modifiers: Object.freeze([Object.freeze({ type: 'hp_multiplier' as const, value: 0.5 }), Object.freeze({ type: 'enemy_multiplier' as const, stat: 'atk' as const, value: 1.25 })]),
  }),
  Object.freeze({
    id: 'minimalist', name: '原始回帰', description: '進化は最大5回まで。限られた選択で最善を尽くせ。', icon: '🪨',
    modifiers: Object.freeze([Object.freeze({ type: 'max_evolutions' as const, count: 5 })]),
  }),
  Object.freeze({
    id: 'time_trial', name: '生存競争', description: '10分以内にクリアせよ。時間切れは即敗北。', icon: '⏱️',
    modifiers: Object.freeze([Object.freeze({ type: 'speed_limit' as const, maxSeconds: 600 })]),
  }),
  Object.freeze({
    id: 'endless', name: '無限の試練', description: '終わりなき戦い。どこまで生き延びられるか挑め。', icon: '♾️',
    modifiers: Object.freeze([Object.freeze({ type: 'endless' as const })]),
  }),
]);
