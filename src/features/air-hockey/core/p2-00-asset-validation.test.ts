/**
 * P2-00: 画像アセット準備のテスト
 * Phase 2: キャラクター図鑑・ゲーム内紹介
 *
 * 全キャラクターのアセットパスが正しく設定されていることを検証する
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  PLAYER_CHARACTER,
  FREE_BATTLE_CHARACTERS,
  STORY_CHARACTERS,
  findCharacterById,
} from './characters';

// アセットディレクトリのルートパス
const ASSETS_DIR = path.resolve(__dirname, '../../../../public/assets');

// 全キャラクターを配列化
const ALL_CHARACTERS = [
  PLAYER_CHARACTER,
  ...Object.values(FREE_BATTLE_CHARACTERS),
  ...Object.values(STORY_CHARACTERS),
];

// 期待するキャラクター ID 一覧（8名）
const EXPECTED_CHARACTER_IDS = [
  'player', 'rookie', 'regular', 'ace',
  'hiro', 'misaki', 'takuma', 'yuu',
];

// キャラ名一覧（ファイル名用）
const CHARACTER_NAMES = [
  'akira', 'hiro', 'misaki', 'takuma',
  'yuu', 'rookie', 'regular', 'ace',
];

describe('P2-00: 画像アセット準備', () => {
  // ── アイコン（128x128）──────────────────────────────
  describe('アイコン画像（characters/*.png）', () => {
    it.each(CHARACTER_NAMES)(
      'アイコン %s.png が存在する',
      (name) => {
        const filePath = path.join(ASSETS_DIR, 'characters', `${name}.png`);
        expect(fs.existsSync(filePath)).toBe(true);
      }
    );

    it.each(ALL_CHARACTERS.map(c => [c.id, c.icon]))(
      'キャラ %s の icon パスが正しい形式を持つ',
      (_id, icon) => {
        expect(icon).toMatch(/^\/assets\/characters\/.+\.png$/);
      }
    );
  });

  // ── 立ち絵（512x1024）──────────────────────────────
  describe('立ち絵（portraits/*.png）', () => {
    const portraitFiles = CHARACTER_NAMES.flatMap(name =>
      ['normal', 'happy'].map(expr => `${name}-${expr}.png`)
    );

    it.each(portraitFiles)(
      '立ち絵 %s が存在する',
      (file) => {
        const filePath = path.join(ASSETS_DIR, 'portraits', file);
        expect(fs.existsSync(filePath)).toBe(true);
      }
    );

    it.each(ALL_CHARACTERS.map(c => [c.id, c]))(
      'キャラ %s の portrait パスが正しい形式を持つ',
      (_id, char) => {
        expect(char.portrait).toBeDefined();
        expect(char.portrait?.normal).toMatch(/^\/assets\/portraits\/.+-normal\.png$/);
        expect(char.portrait?.happy).toMatch(/^\/assets\/portraits\/.+-happy\.png$/);
      }
    );
  });

  // ── VS 画像（256x512）──────────────────────────────
  describe('VS 画像（vs/*.png）', () => {
    it.each(CHARACTER_NAMES)(
      'VS 画像 %s-vs.png が存在する',
      (name) => {
        const filePath = path.join(ASSETS_DIR, 'vs', `${name}-vs.png`);
        expect(fs.existsSync(filePath)).toBe(true);
      }
    );

    it.each(ALL_CHARACTERS.map(c => [c.id, c.vsImage]))(
      'キャラ %s の vsImage パスが正しい形式を持つ',
      (_id, vsImage) => {
        expect(vsImage).toBeDefined();
        expect(vsImage).toMatch(/^\/assets\/vs\/.+-vs\.png$/);
      }
    );

    it('ユウの VS 画像が設定されている', () => {
      const yuu = findCharacterById('yuu');
      expect(yuu).toBeDefined();
      expect(yuu?.vsImage).toBe('/assets/vs/yuu-vs.png');
    });
  });

  // ── 背景画像 ───────────────────────────────────────
  describe('背景画像（backgrounds/*.webp）', () => {
    it.each(['bg-clubroom.webp', 'bg-gym.webp', 'bg-school-gate.webp'])(
      '背景 %s が存在する',
      (file) => {
        const filePath = path.join(ASSETS_DIR, 'backgrounds', file);
        expect(fs.existsSync(filePath)).toBe(true);
      }
    );
  });

  // ── 全キャラクターの完全性 ──────────────────────────
  describe('全キャラクターアセットの完全性', () => {
    it.each(EXPECTED_CHARACTER_IDS)(
      'キャラ %s が定義されている',
      (id) => {
        expect(findCharacterById(id)).toBeDefined();
      }
    );

    it.each(EXPECTED_CHARACTER_IDS)(
      'キャラ %s に icon, portrait, vsImage が揃っている',
      (id) => {
        const char = findCharacterById(id);
        expect(char).toBeDefined();
        expect(char?.icon).toBeTruthy();
        expect(char?.portrait).toBeDefined();
        expect(char?.portrait?.normal).toBeTruthy();
        expect(char?.portrait?.happy).toBeTruthy();
        expect(char?.vsImage).toBeTruthy();
      }
    );
  });
});
