/**
 * 灰燼の城壁 - styled-components が実際に適用した CSS を読むテスト補助
 *
 * **テスト専用。** 製品コードからは import しない。
 *
 * 「テストのためだけに置いた data 属性」を突き合わせても、実際に効くのは
 * transient prop（`$...`）が生成した CSS のほうなので、prop だけを別物へ
 * 差し替えた退行を検出できない（最終レビュー指摘 H-5）。ここでは要素に
 * 付いたクラス名から styled-components が注入した `<style>` の宣言を引き、
 * **本当に効いている値**を読む。
 */

/** 動きを止めるメディアクエリ。styled-components は原文の空白を保って出力する */
const REDUCED_MOTION_HEADER = '@media (prefers-reduced-motion: reduce){';

/** 注入済みの CSS をすべて連結する */
const allInjectedCss = (): string =>
  Array.from(document.querySelectorAll('style'))
    .map((el) => el.textContent ?? '')
    .join('');

/** `open` の位置にある `{` に対応する `}` の index（見つからなければ -1） */
const matchingBraceIndexOf = (css: string, open: number): number => {
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
};

/** `css` の中から `.className{...}` の中身をすべて取り出す */
const blocksOf = (css: string, className: string): string[] => {
  const blocks: string[] = [];
  const selector = `.${className}{`;
  let from = 0;
  for (;;) {
    const start = css.indexOf(selector, from);
    if (start < 0) return blocks;
    const open = start + selector.length - 1;
    const close = matchingBraceIndexOf(css, open);
    if (close < 0) return blocks;
    blocks.push(css.slice(open + 1, close));
    from = close + 1;
  }
};

/** 注入済み CSS を「動きを減らす指定の内側」と「その外側」に分ける */
const splitByReducedMotion = (): { outside: string; reduced: string } => {
  const css = allInjectedCss();
  let outside = '';
  let reduced = '';
  let from = 0;
  for (;;) {
    const header = css.indexOf(REDUCED_MOTION_HEADER, from);
    if (header < 0) {
      outside += css.slice(from);
      return { outside, reduced };
    }
    const open = header + REDUCED_MOTION_HEADER.length - 1;
    const close = matchingBraceIndexOf(css, open);
    outside += css.slice(from, header);
    if (close < 0) return { outside, reduced };
    reduced += css.slice(open + 1, close);
    from = close + 1;
  }
};

/** 要素のクラスに対応する宣言（メディアクエリの外）を連結して返す */
export const appliedCssOf = (element: Element): string => {
  const { outside } = splitByReducedMotion();
  return element.className
    .split(' ')
    .filter(Boolean)
    .flatMap((className) => blocksOf(outside, className))
    .join('');
};

/** 要素のクラスに対応する宣言のうち、動きを減らす指定の内側だけを返す */
export const appliedCssUnderReducedMotionOf = (element: Element): string => {
  const { reduced } = splitByReducedMotion();
  return element.className
    .split(' ')
    .filter(Boolean)
    .flatMap((className) => blocksOf(reduced, className))
    .join('');
};

/** 宣言ブロックから property の値をすべて拾う（後勝ちの上書きを見るため順序を保つ） */
const declarationValuesOf = (block: string, property: string): string[] => {
  const values: string[] = [];
  const key = `${property}:`;
  let from = 0;
  for (;;) {
    const at = block.indexOf(key, from);
    if (at < 0) return values;
    // `width` が `max-width` の一部として当たらないよう、直前が区切りのときだけ採る
    if (at === 0 || block[at - 1] === ';') {
      const end = block.indexOf(';', at + key.length);
      values.push(block.slice(at + key.length, end < 0 ? block.length : end));
    }
    from = at + key.length;
  }
};

/**
 * 要素に実際に効いている property の値を返す（同じ property が複数あれば後勝ち）
 *
 * 見つからなければ undefined。
 */
export const appliedValueOf = (element: Element, property: string): string | undefined =>
  declarationValuesOf(appliedCssOf(element), property).pop();

/** 要素に実際に効いている長さを数値で返す（`46.6cqw` → 46.6） */
export const appliedLengthOf = (element: Element, property: string): number | undefined => {
  const value = appliedValueOf(element, property);
  if (value === undefined) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};
