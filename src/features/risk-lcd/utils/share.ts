// リザルト共有URL生成・パース・ビルドコード

import type { PerkDef } from '../types';
import { STY, PERKS } from '../constants/game-config';

// 共有パラメータ
export interface ShareParams {
  daily?: string;
  score: number;
  build: string;
  ghost?: string;
}

// スタイルIDの短縮コード
const STYLE_CODES: Record<string, string> = {
  standard: 'St',
  highrisk: 'HR',
  cautious: 'Ca',
  quickjudge: 'QJ',
  reversal: 'Re',
};

// 逆引きスタイルコード
const STYLE_FROM_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(STYLE_CODES).map(([k, v]) => [v, k]),
);

// パークIDの短縮コード
const PERK_CODES: Record<string, string> = {
  vis_up: 'Vu',
  score_up: 'Su',
  combo_up: 'Cu',
  shield: 'Sh',
  slow: 'Sl',
  heal: 'He',
  right_x2: 'Rx',
  left_x2: 'Lx',
  gamble: 'Gk',
  speed_score: 'Ss',
  blind_any: 'Ba',
  narrow: 'Nw',
};

// 逆引きパークコード
const PERK_FROM_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(PERK_CODES).map(([k, v]) => [v, k]),
);

/**
 * 共有URLを生成
 */
export function encodeShareUrl(params: ShareParams): string {
  const u = new URLSearchParams();
  u.set('rlcd', '1');
  if (params.daily) u.set('daily', params.daily);
  u.set('score', String(params.score));
  u.set('build', params.build);
  if (params.ghost) u.set('ghost', params.ghost);

  const origin = typeof window !== 'undefined'
    ? window.location.origin + window.location.pathname
    : '';
  return origin + '?' + u.toString();
}

/**
 * URLクエリから共有データをパース
 */
export function decodeShareUrl(search: string): ShareParams | null {
  try {
    const u = new URLSearchParams(search);
    if (u.get('rlcd') !== '1') return null;

    const scoreStr = u.get('score');
    if (!scoreStr) return null;
    const score = parseInt(scoreStr, 10);
    if (isNaN(score)) return null;

    const build = u.get('build');
    if (!build) return null;

    const result: ShareParams = { score, build };
    const daily = u.get('daily');
    if (daily) result.daily = daily;
    const ghost = u.get('ghost');
    if (ghost) result.ghost = ghost;

    return result;
  } catch {
    return null;
  }
}

/**
 * ビルド情報をコードに変換
 * スタイルID + パークIDの短縮コード化
 */
export function encodeBuild(styles: string[], perks: PerkDef[]): string {
  const styleCode = styles
    .map(id => STYLE_CODES[id] || id.slice(0, 2).toUpperCase())
    .join('.');
  const perkCode = perks
    .map(p => PERK_CODES[p.id] || p.id.slice(0, 2).toUpperCase())
    .join('.');

  return `s:${styleCode}_p:${perkCode}`;
}

/**
 * ビルドコードを表示用に復元
 */
export function decodeBuild(code: string): { styles: string[]; perks: string[] } {
  const result = { styles: [] as string[], perks: [] as string[] };

  try {
    const parts = code.split('_');
    for (const part of parts) {
      if (part.startsWith('s:')) {
        const codes = part.slice(2).split('.');
        result.styles = codes
          .map(c => {
            const id = STYLE_FROM_CODE[c];
            return id ? (STY[id]?.nm ?? id) : c;
          });
      } else if (part.startsWith('p:')) {
        const codes = part.slice(2).split('.').filter(Boolean);
        result.perks = codes
          .map(c => {
            const id = PERK_FROM_CODE[c];
            if (id) {
              const perk = PERKS.find(p => p.id === id);
              return perk?.nm ?? id;
            }
            return c;
          });
      }
    }
  } catch {
    // パース失敗時は空を返す
  }

  return result;
}
