/**
 * 迷宮の残響 - フロアメタ定義
 *
 * 各フロアの名前・説明・色を定義する。
 */

/** フロアメタ定義 */
export interface FloorMetaDef {
  readonly name: string;
  readonly desc: string;
  readonly color: string;
}

/** フロアメタ — 名前・説明・色はオリジナルデザインに準拠 */
export const FLOOR_META: Readonly<Record<number, FloorMetaDef>> = Object.freeze({
  1: { name: "表層回廊",   desc: "迷宮の入口。油断すれば、ここで終わる。",                            color: "#60a5fa" },
  2: { name: "灰色の迷路", desc: "光が途絶えた。静寂と恐怖が支配する灰色の世界。",                    color: "#a0a0b8" },
  3: { name: "深淵の間",   desc: "空間が歪む。常識が通用しない。帰還率は三割を切る。",                color: "#c084fc" },
  4: { name: "忘却の底",   desc: "記憶が曖昧になる。自分が何者か忘れていく。",                        color: "#f472b6" },
  5: { name: "迷宮の心臓", desc: "迷宮の核心。ここから生還した者は、極めて少ない。",                  color: "#fbbf24" },
});
