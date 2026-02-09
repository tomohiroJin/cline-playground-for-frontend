import type {
  StageConfig,
  StyleDef,
  ShopItem,
  ModDef,
  PerkDef,
  HelpSection,
  RankEntry,
  RuntimeStageConfig,
  GameState,
  LaneIndex,
} from '../types';
import { Rand } from '../utils/random';

// 基本定数
export const ROWS = 8;
export const LANE_COUNT = 3;
export const LANES: readonly LaneIndex[] = [0, 1, 2];
export const LANE_LABELS: readonly string[] = ['L', 'C', 'R'];

// セーブキー
export const SAVE_KEY = 'rlcd12';
export const LEGACY_KEYS: readonly string[] = ['rlcd10', 'rlcd11'];

// スタッカブルパーク
export const STACKABLE_PERKS = new Set(['shield', 'vis_up', 'score_up', 'combo_up']);

// ステージ定義
export const STG: readonly StageConfig[] = [
  { cy: 8, spd: 2600, si: 1, fk: false },
  { cy: 10, spd: 2200, si: 1, fk: false },
  { cy: 12, spd: 1850, si: 2, fk: false },
  { cy: 14, spd: 1550, si: 2, fk: true },
  { cy: 16, spd: 1250, si: 2, fk: true },
  { cy: 20, spd: 1050, si: 2, fk: true },
];

// プレイスタイル定義
export const STY: Record<string, StyleDef> = {
  standard: {
    nm: 'STANDARD',
    bf: ['バランス型'],
    df: [],
    mu: [1, 2, 4],
    rs: [],
    wm: 0,
    cm: 0,
    sh: 0,
    sp: 0,
    db: 0,
    cb: 0,
    bfSet: [0, 4, 6],
  },
  highrisk: {
    nm: 'ハイリスク信者',
    bf: ['最大×8', '死亡PT+50%'],
    df: ['1レーン避難所化'],
    mu: [1, 2, 8],
    rs: [],
    wm: 0,
    cm: 0,
    sh: 0,
    sp: 0,
    db: 0.5,
    cb: 0,
    bfSet: [0, 4, 6],
    autoBlock: 1,
  },
  cautious: {
    nm: '慎重派',
    bf: ['安全×3', 'CLEAR+100%'],
    df: ['他×1~2'],
    mu: [3, 1, 2],
    rs: [],
    wm: 0,
    cm: 0,
    sh: 0,
    sp: 0,
    db: 0,
    cb: 1,
    bfSet: [0, 4, 6],
  },
  quickjudge: {
    nm: '瞬間判断型',
    bf: ['移動CD-40%', '予告+2'],
    df: ['加速+25%'],
    mu: [1, 2, 4],
    rs: [],
    wm: -0.25,
    cm: -0.4,
    sh: 0,
    sp: 0,
    db: 0,
    cb: 0,
    bfSet: [0, 2, 4],
  },
  reversal: {
    nm: '一発逆転型',
    bf: ['各ST1回シールド'],
    df: ['発動後5CY凍結'],
    mu: [1, 2, 4],
    rs: [],
    wm: 0,
    cm: 0,
    sh: 1,
    sp: 5,
    db: 0,
    cb: 0,
    bfSet: [0, 4, 6],
  },
};
export const STY_KEYS = Object.keys(STY);

// ショップアイテム
export const SHP: readonly ShopItem[] = [
  { id: 'highrisk', tp: 's', nm: 'ハイリスク信者', ds: '最大×8/1レーン避難所化/死亡PT+50%', co: 100 },
  { id: 'cautious', tp: 's', nm: '慎重派', ds: '安全×3/クリアBONUS+100%', co: 100 },
  { id: 'quickjudge', tp: 's', nm: '瞬間判断型', ds: '予告UP/CD高速/加速', co: 200 },
  { id: 'reversal', tp: 's', nm: '一発逆転型', ds: '各ST1回シールド', co: 300 },
  { id: 'ui_danger', tp: 'u', nm: '危険強調', ds: '障害レーンのセグ列を強調', co: 50 },
  { id: 'ui_timing', tp: 'u', nm: 'タイミングバー+', ds: 'ビートバー高視認性', co: 80 },
  { id: 'ui_art', tp: 'u', nm: 'アート強化', ds: 'コンボ/シールド時キャラ変化', co: 120 },
  { id: 'start_shield', tp: 'u', nm: '初期シールド', ds: '開始時シールド+1', co: 250 },
  { id: 'slot2', tp: 'u', nm: 'スタイル複合', ds: 'PLAYスタイルを2つ装備可能', co: 350 },
  { id: 'perk4', tp: 'u', nm: '選択肢拡張', ds: 'パーク選択が3→4択に', co: 400 },
  { id: 'score_base', tp: 'u', nm: '基本報酬UP', ds: '全レーン基本得点+5', co: 500 },
  { id: 'slot3', tp: 'u', nm: 'スタイル三重', ds: 'PLAYスタイルを3つ装備可能', co: 700 },
  { id: 'stage6', tp: 'u', nm: '裏ステージ', ds: 'STAGE 6が解禁', co: 800 },
  { id: 'oracle', tp: 'u', nm: '神託の目', ds: '全予告が+2段になる', co: 1500 },
  { id: 'gold', tp: 'u', nm: '黄金のオーラ', ds: '獲得PT永久×2', co: 3000 },
];

// ステージ修飾（モディファイア）
export const MODS: readonly ModDef[] = [
  {
    id: 'double',
    nm: 'DOUBLE THREAT',
    ds: '同時障害+50%',
    fn: (c: RuntimeStageConfig) => {
      c._dblChance = 0.5;
    },
  },
  {
    id: 'rush',
    nm: 'RUSH HOUR',
    ds: '速度+20%',
    fn: (c: RuntimeStageConfig) => {
      c.spd = Math.floor(c.spd * 0.8);
    },
  },
  {
    id: 'bonus',
    nm: 'BONUS ROUND',
    ds: '全得点×2',
    fn: (c: RuntimeStageConfig) => {
      c._scoreMod = 2;
    },
  },
  {
    id: 'fog',
    nm: 'FOG OF WAR',
    ds: '予告-1段',
    fn: (c: RuntimeStageConfig) => {
      c._fogShift = 1;
    },
  },
  {
    id: 'calm',
    nm: 'CALM BEFORE STORM',
    ds: '前半緩/終盤加速',
    fn: (c: RuntimeStageConfig) => {
      c._calm = true;
      c.spd = Math.floor(c.spd * 1.15);
    },
  },
];

// パーク定義
export const PERKS: readonly PerkDef[] = [
  {
    id: 'vis_up',
    nm: '鷹の目',
    ds: '全レーン予告+1段',
    tp: 'buff',
    ic: '◉',
    fn: (g: GameState) => {
      g.bfAdj--;
    },
  },
  {
    id: 'score_up',
    nm: '欲深き者',
    ds: '全スコア×1.3',
    tp: 'buff',
    ic: '$',
    fn: (g: GameState) => {
      g.scoreMult *= 1.3;
    },
  },
  {
    id: 'combo_up',
    nm: '連鎖増幅',
    ds: 'コンボ倍率+0.5',
    tp: 'buff',
    ic: '⚡',
    fn: (g: GameState) => {
      g.comboBonus += 0.5;
    },
  },
  {
    id: 'shield',
    nm: '緊急防壁',
    ds: 'シールド+1',
    tp: 'buff',
    ic: '◆',
    fn: (g: GameState) => {
      g.shields++;
      g.st.sh++;
    },
  },
  {
    id: 'slow',
    nm: '時の砂',
    ds: '速度-15%',
    tp: 'buff',
    ic: '◷',
    fn: (g: GameState) => {
      g.slowMod += 0.15;
    },
  },
  {
    id: 'heal',
    nm: '不屈の魂',
    ds: '死亡時1回復活',
    tp: 'buff',
    ic: '♥',
    fn: (g: GameState) => {
      g.revive++;
    },
  },
  {
    id: 'right_x2',
    nm: '高倍強化',
    ds: '最大倍率レーン×2',
    tp: 'buff',
    ic: '▶',
    fn: (g: GameState) => {
      const mx = Math.max(...g.st.mu);
      g.st.mu[g.st.mu.indexOf(mx)] *= 2;
    },
  },
  {
    id: 'left_x2',
    nm: '安全投資',
    ds: '最低倍率レーン×2',
    tp: 'buff',
    ic: '◀',
    fn: (g: GameState) => {
      const mn = Math.min(...g.st.mu.filter(m => m > 0));
      const i = g.st.mu.indexOf(mn);
      if (i >= 0) g.st.mu[i] = Math.max(g.st.mu[i] * 2, 2);
    },
  },
  {
    id: 'gamble',
    nm: 'ギャンブラー',
    ds: 'スコア×1.8 予告-1段',
    tp: 'risk',
    ic: '!',
    fn: (g: GameState) => {
      g.scoreMult *= 1.8;
      g.bfAdj++;
    },
  },
  {
    id: 'speed_score',
    nm: '加速報酬',
    ds: '速度+20% スコア×1.5',
    tp: 'risk',
    ic: '»',
    fn: (g: GameState) => {
      g.speedMod -= 0.2;
      g.scoreMult *= 1.5;
    },
  },
  {
    id: 'blind_any',
    nm: '盲目の道',
    ds: 'ランダム1レーン予告-3 ×1.4',
    tp: 'risk',
    ic: '✕',
    fn: (g: GameState) => {
      g.bfAdj_lane = Rand.int(3);
      g.bfAdj_extra = 3;
      g.scoreMult *= 1.4;
    },
  },
  {
    id: 'narrow',
    nm: '狭路',
    ds: '1レーンが避難所化(安全/×0点) ×1.6',
    tp: 'risk',
    ic: '▌',
    fn: (g: GameState) => {
      const c = LANES.filter(
        l => !g.st.sf.includes(l) && !g.st.rs.includes(l)
      );
      if (c.length >= 2) {
        const pick = Rand.pick(c);
        g.st.sf.push(pick);
        g.scoreMult *= 1.6;
      } else {
        g.scoreMult *= 1.3;
      }
    },
  },
];

// ヘルプセクション
export const HELP_SECTIONS: readonly HelpSection[] = [
  {
    cat: '基本ルール',
    items: [
      {
        nm: 'ゲーム概要',
        ds: '3レーンを左右移動し、上から降る障害を避ける。各ステージ規定サイクルをクリアすると次へ進む。',
      },
      {
        nm: 'レーン倍率',
        ds: '各レーンに×1~×8の倍率が設定。高倍率レーンで避けるほど高得点。倍率はヘッダーに表示。',
      },
      {
        nm: '予告(警告段)',
        ds: '障害が降る前に上段から警告表示。段数が多いほど早く気づける。段数はステージ毎にランダム配置。',
      },
      { nm: 'コンボ', ds: '連続回避でコンボ。3連続で×1.5、5連続で×2倍。被弾やシールド発動でリセット。' },
      { nm: 'ニアミス', ds: '障害の隣レーンで回避成功すると「NEAR!」発生。3回以上でクリアボーナス+50。' },
      {
        nm: 'ステージ修飾',
        ds: 'ST2以降60%の確率でランダム修飾が付く。DOUBLE THREAT(障害増),RUSH HOUR(加速),BONUS ROUND(得点×2)等。',
      },
    ],
  },
  {
    cat: 'パーク一覧 (BUFF)',
    items: [
      { nm: '◉ 鷹の目', ds: '全レーンの予告段数+1。重複可能。' },
      { nm: '$ 欲深き者', ds: '全スコア×1.3倍。重複可能。' },
      { nm: '⚡ 連鎖増幅', ds: 'コンボ倍率+0.5。3コンボ以上で効果発揮。' },
      { nm: '◆ 緊急防壁', ds: 'シールド+1。被弾を1回無効化。' },
      { nm: '◷ 時の砂', ds: 'ゲーム速度-15%。判断時間が増える。' },
      { nm: '♥ 不屈の魂', ds: '死亡時に1回復活。' },
      { nm: '▶ 高倍強化', ds: '最大倍率レーン×2。ハイリスク信者と相性◎。' },
      { nm: '◀ 安全投資', ds: '最低倍率レーン×2。慎重派と好相性。' },
    ],
  },
  {
    cat: 'パーク一覧 (RISK)',
    items: [
      { nm: '! ギャンブラー', ds: 'スコア×1.8だが予告-1段。' },
      { nm: '» 加速報酬', ds: '速度+20%だがスコア×1.5。' },
      { nm: '✕ 盲目の道', ds: 'ランダム1レーンの予告が-3段。×1.4倍。' },
      { nm: '▌ 狭路', ds: '1レーンが避難所化(安全だが×0点)。×1.6倍。' },
    ],
  },
  {
    cat: 'PLAYスタイル',
    items: [
      { nm: 'STANDARD', ds: 'バランス型。倍率×1/×2/×4。' },
      { nm: 'ハイリスク信者', ds: '最大×8。1レーン避難所化(安全/×0)。死亡PT+50%。' },
      { nm: '慎重派', ds: '安全レーン×3。クリアBONUS+100%。' },
      { nm: '瞬間判断型', ds: '移動CD-40%/予告+2/加速+25%。' },
      { nm: '一発逆転型', ds: '各ST1回シールド。発動後5CY凍結。' },
      { nm: '複数装備', ds: 'UNLOCKで「スタイル複合」「三重」購入で複数装備可能。' },
    ],
  },
  {
    cat: 'ポイント&UNLOCK',
    items: [
      { nm: 'ポイント獲得', ds: '終了時スコア10%をPT加算。死亡PTボーナスや黄金のオーラで増加。' },
      { nm: 'セーブ', ds: 'PT・購入済み・装備はブラウザのローカルストレージに自動保存。' },
      { nm: 'おすすめ順', ds: '危険強調(50)→タイミングバー(80)→スタイル→複合(350)→拡張(400)→裏ST(800)' },
      { nm: '高額アイテム', ds: '神託の目(1500):全予告+2段。黄金のオーラ(3000):獲得PT永久×2。' },
    ],
  },
];

// ランクテーブル
export const RANK_TABLE: readonly RankEntry[] = [
  { test: (s, c) => c && s >= 5000, g: 'S+', c: '伝説のビルド。世界が恐怖した。' },
  { test: (s, c) => c && s >= 4000, g: 'S', c: '完璧なビルド。闘を支配する者。' },
  { test: (s, c) => c && s >= 2500, g: 'A', c: '見事な戦略。恐怖と共に歩む者。' },
  { test: (_s, c) => c, g: 'B', c: 'クリアおめでとう。ビルドを見直してみては？' },
  { test: (s, _c, t) => t >= 3 && s >= 800, g: 'B', c: '惜しい！ビルド次第で届く。' },
  { test: (s, _c, t) => t >= 2 && s >= 400, g: 'C', c: '悪くない。パークを活かせ。' },
  { test: s => s >= 150, g: 'D', c: 'まだまだこれから。' },
];

// メニュー項目
export const MENUS: readonly string[] = ['GAME START', 'PLAY STYLE', 'UNLOCK', 'HELP'];
