/**
 * 灰燼の城壁 - 乱数関数型
 *
 * domain 層は application/ports に依存できないため、
 * 乱数は「0以上1未満を返す関数」としてのみ受け取る。
 */
export type RandomFn = () => number;
