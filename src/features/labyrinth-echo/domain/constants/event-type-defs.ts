/**
 * 迷宮の残響 - イベント種別定義
 *
 * イベントの種別ラベルと表示色を定義する。
 */

/** イベント種別定義 */
export interface EventTypeDef {
  readonly label: string;
  readonly colors: readonly string[];
}

/** イベント種別定義一覧 */
export const EVENT_TYPE: Readonly<Record<string, EventTypeDef>> = Object.freeze({
  exploration: { label: "探 索", colors: ["#38bdf8", "rgba(56,189,248,0.08)",  "rgba(56,189,248,0.2)"]  },
  encounter:   { label: "遭 遇", colors: ["#fbbf24", "rgba(251,191,36,0.08)",  "rgba(251,191,36,0.2)"]  },
  trap:        { label: "罠",    colors: ["#f87171", "rgba(248,113,113,0.08)", "rgba(248,113,113,0.2)"] },
  rest:        { label: "安 息", colors: ["#4ade80", "rgba(74,222,128,0.08)",  "rgba(74,222,128,0.2)"]  },
});
