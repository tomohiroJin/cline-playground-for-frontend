/**
 * 迷宮の残響 - 真相レイヤー定義
 *
 * echoDepth に応じて段階的に開示される「迷宮の真相」テキスト。
 */

/** 真相レイヤー */
export interface TruthLayer {
  readonly id: string;
  /** レイヤー番号（1〜4） */
  readonly layer: number;
  /** この echoDepth 以上で開示 */
  readonly depthGate: number;
  readonly title: string;
  readonly text: string;
}

/** 真相レイヤー一覧（depthGate 昇順） */
export const TRUTH_LAYERS: readonly TruthLayer[] = Object.freeze([
  {
    id: 'truth_1',
    layer: 1,
    depthGate: 1,
    title: '残響の正体',
    text: '先人たちは実在した。壁の染み、遺された道具、掠れた文字――それらは確かに「誰か」がここにいた痕跡だ。迷宮は、訪れた者を忘れない。'
  },
  {
    id: 'truth_2',
    layer: 2,
    depthGate: 3,
    title: '迷宮の意図',
    text: '気づいてしまう。この迷宮は「忘れたくない者」を選んで招いている。死は終わりではなく、記憶の保存だ。残響とは、迷宮が刻んだ記録そのもの。'
  },
  {
    id: 'truth_3',
    layer: 3,
    depthGate: 5,
    title: 'お前という残響',
    text: 'なぜ自分は何度も戻れるのか。答えは単純で、残酷だ――お前もまた、迷宮に保存された残響の一つ。死と再挑戦の繰り返しは、迷宮が見せる記憶の再生なのだ。'
  },
  {
    id: 'truth_4',
    layer: 4,
    depthGate: 6,
    title: '始まりの願い',
    text: '始まりの探索者の声が聞こえる。迷宮は彼の「忘れたくない」という願いから生まれた。そしてお前は、その願いが見続けている夢の続き。――まだ、終わりではない。'
  }
]);
