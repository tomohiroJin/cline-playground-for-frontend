/** 迷宮の残響 - 第6階層（終章）モデル */

/** 最後の決断 */
export type FinaleDecision = 'inherit' | 'sever';

/** 終章ビートの選択肢（最終ビートのみ decision を持つ） */
export interface FinaleChoice {
  readonly label: string;
  /** 最終ビートの分岐。非分岐ビートは undefined（前進のみ） */
  readonly decision?: FinaleDecision;
}

/** 終章の固定ビート */
export interface FinaleBeat {
  readonly id: string;
  readonly title: string;
  readonly text: string;
  readonly choices: readonly FinaleChoice[];
}
