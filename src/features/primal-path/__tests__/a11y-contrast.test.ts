/**
 * 可読性ガードレール: UI テキスト色が WCAG AA(4.5:1) を満たすことを検証する。
 *
 * 面白さ検証 UX レビューで指摘された「極小テキスト＋低コントラスト」の回帰防止。
 * 最悪ケース背景＝ゲームシェル背景 #12121e に対して評価する（#0a0a12 はより暗く高コントラスト）。
 */
import { contrastRatio } from './helpers/contrast';
import { SYNERGY_TAG_INFO } from '../constants';

/** 最悪ケースのテキスト背景（ゲームシェル） */
const SHELL_BG = '#12121e';
const AA = 4.5;

describe('可読性ガードレール — テキスト色の WCAG AA', () => {
  describe('シナジータグ色', () => {
    for (const [tag, info] of Object.entries(SYNERGY_TAG_INFO)) {
      it(`${tag}(${info.cl}) が ${AA}:1 以上`, () => {
        expect(contrastRatio(info.cl, SHELL_BG)).toBeGreaterThanOrEqual(AA);
      });
    }
  });

  describe('主要テキスト色', () => {
    // 低コントラストとして報告された色（是正後は AA を満たすこと）
    const TEXT_COLORS: Readonly<Record<string, string>> = {
      textDim: '#988070',   // ← Task2 で AA 準拠値へ更新
      civTech: '#f08050',   // ← Task2 で更新
      civBal: '#e0c060',    // ← Task2 で更新
    };
    for (const [name, hex] of Object.entries(TEXT_COLORS)) {
      it(`${name}(${hex}) が ${AA}:1 以上`, () => {
        expect(contrastRatio(hex, SHELL_BG)).toBeGreaterThanOrEqual(AA);
      });
    }
  });
});
