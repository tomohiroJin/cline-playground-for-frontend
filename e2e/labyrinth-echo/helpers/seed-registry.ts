/**
 * 迷宮の残響 E2E テスト用 seed レジストリ
 *
 * 各 seed で期待されるイベント列をコメントで記録。
 * SeededRandomSource（xorshift32）により決定論的な乱数列を保証する。
 */

/**
 * 基本フローの検証用 seed — 標準的なイベント列を生成
 *
 * 探索者難度でのイベント列（最初の選択肢を選んだ場合）:
 *   F1-S0: e072 [encounter] hp:0 mn:10
 *   F1-S1: e035 [encounter] hp:5 mn:-8
 *   F1-S2: e040 [exploration] hp:0 mn:-8
 *   F2-S0: e014 [rest] hp:12 mn:10
 *   F2-S1: e110 [rest] hp:3 mn:12
 *   F2-S2: e010 [encounter] hp:-3 mn:10
 *   F3-S0: e155 [trap] hp:-5 mn:0
 *   ... 以降 F5 まで継続
 */
export const SEED_BASIC_FLOW = 12345;

/**
 * ゲームオーバーの検証用 seed — 致死イベント列を生成
 * 修羅難度（HP:30, MN:15, drainMod:-3）と組み合わせて使用
 *
 * 修羅難度でのイベント列（最初の選択肢を選んだ場合）:
 *   F1-S0: e052 [rest] hp:10 mn:10 → HP:30/30 MN:15/15
 *   F1-S1: e008 [encounter] hp:18 mn:-9 → HP:30/30 MN:3/15
 *   F1-S2: e100 [encounter] hp:15 mn:5 → HP:30/30 MN:5/15
 *   F2-S0: e177 [encounter] hp:18 mn:3 → HP:30/30 MN:5/15
 *   F2-S1: e010 [encounter] hp:-3 mn:10 → HP:27/30 MN:12/15
 *   F2-S2: e145 [rest] hp:12 mn:8 → HP:30/30 MN:15/15
 *   F3-S0: e054 [rest] hp:12 mn:13 → HP:30/30 MN:15/15
 *   F3-S1: e143 [trap] hp:-20 mn:5 → HP:10/30 MN:15/15
 *   F3-S2: e149 [trap] hp:-8 mn:0 → HP:2/30 MN:12/15
 *   F4-S0: e124 [trap] hp:-8 mn:5 → HP:0/30 → 死亡（体力消耗）
 */
export const SEED_GAME_OVER = 67890;

/**
 * エンディング到達の検証用 seed — クリア可能なイベント列を生成
 * 探索者難度（HP:65, MN:40, drainMod:0）と組み合わせて使用
 *
 * 探索者難度でのイベント列（最初の選択肢を選んだ場合）:
 *   F1-S0: e052 [rest] hp:10 mn:10 → HP:65/65 MN:40/40
 *   F1-S1: e040 [exploration] hp:0 mn:-8 → HP:65/65 MN:29/40
 *   F1-S2: e053 [encounter] hp:0 mn:7 → HP:65/65 MN:33/40
 *   F2-S0: e122 [exploration] hp:-5 mn:5 → HP:60/65 MN:35/40
 *   ... F5 まで全イベント生存
 *   → 脱出イベント（e030）でエンディング到達
 */
export const SEED_ENDING = 11111;
