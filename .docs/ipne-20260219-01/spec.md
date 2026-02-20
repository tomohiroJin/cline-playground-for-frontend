# IPNE ビジュアル・ストーリー強化 — 仕様書

## 目次

1. [型定義の変更](#1-型定義の変更)
2. [画像レジストリ仕様](#2-画像レジストリ仕様)
3. [ストーリーテキスト全文](#3-ストーリーテキスト全文)
4. [スプライトアニメーション仕様](#4-スプライトアニメーション仕様)
5. [エフェクト仕様](#5-エフェクト仕様)
6. [コンポーネント変更仕様](#6-コンポーネント変更仕様)
7. [画像アセット仕様](#7-画像アセット仕様)

---

## 1. 型定義の変更

### 1.1 `StorySceneSlide` (新規)

**ファイル**: `src/features/ipne/types.ts`

```typescript
/** マルチシーン用のスライド */
export interface StorySceneSlide {
  /** スライド固有のタイトル（省略時はメインタイトルを使用） */
  title?: string;
  /** テキスト行 */
  lines: string[];
  /** 画像キー（画像レジストリ参照） */
  imageKey?: string;
}
```

### 1.2 `StoryScene` (変更)

**変更前**:
```typescript
export interface StoryScene {
  id: string;
  title: string;
  lines: string[];
  imageKey?: string;
}
```

**変更後**:
```typescript
export interface StoryScene {
  id: string;
  title: string;
  lines: string[];
  imageKey?: string;
  /** マルチシーン対応。設定時は slides を優先して表示する */
  slides?: StorySceneSlide[];
}
```

**後方互換**: `slides` は optional。未設定時は従来通り `title` + `lines` で表示する。コンポーネント側は `slides` が存在すれば `slides` を使用し、なければ既存の `title`/`lines`/`imageKey` にフォールバックする。

### 1.3 `EpilogueText` (変更)

**変更前**:
```typescript
export interface EpilogueText {
  title: string;
  text: string;
}
```

**変更後**:
```typescript
export interface EpilogueText {
  title: string;
  text: string;
  /** 複数段落の詳細テキスト。設定時は段階的にフェードイン表示する */
  paragraphs?: string[];
}
```

**後方互換**: `paragraphs` は optional。コンポーネント側は `paragraphs` があれば段階表示、なければ `text` 一括表示。

### 1.4 `EffectType` (追加)

**ファイル**: `src/features/ipne/presentation/effects/effectTypes.ts`

**追加値**:
```typescript
export const EffectType = {
  // 既存 8 種
  ATTACK_HIT: 'attack_hit',
  DAMAGE: 'damage',
  TRAP_DAMAGE: 'trap_damage',
  TRAP_SLOW: 'trap_slow',
  TRAP_TELEPORT: 'trap_teleport',
  ITEM_PICKUP: 'item_pickup',
  LEVEL_UP: 'level_up',
  BOSS_KILL: 'boss_kill',
  // 新規 4 種
  ENEMY_ATTACK: 'enemy_attack',
  SCREEN_SHAKE: 'screen_shake',
  LOW_HP_WARNING: 'low_hp_warning',
  STAGE_CLEAR: 'stage_clear',
} as const;
```

### 1.5 `GameEffect` (フィールド追加)

**追加フィールド**:
```typescript
export interface GameEffect {
  // 既存フィールド（省略）

  /** 画面シェイク強度 (px) */
  shakeIntensity?: number;
  /** 画面シェイク減衰率（秒あたり） */
  shakeDecay?: number;
  /** 低HP警告パルスの位相 (0.0〜2π) */
  pulsePhase?: number;
}
```

---

## 2. 画像レジストリ仕様

### 2.1 概要

**ファイル**: `src/features/ipne/storyImages.ts` (新規)

ストーリー画面・エンディング画面で使用する画像を一元管理するレジストリ。初期段階ではプレースホルダー画像を返し、本番アセット準備後に差し替える。

### 2.2 画像エントリ型

```typescript
export interface StoryImageEntry {
  /** 画像ソース (URL or data URI) */
  src: string;
  /** alt テキスト */
  alt: string;
  /** 表示幅 (px) */
  width: number;
  /** 表示高さ (px) */
  height: number;
}
```

### 2.3 画像キー一覧

| キー | 用途 | alt テキスト | サイズ |
|------|------|-------------|--------|
| `prologue_scene_1` | プロローグ シーン1 | 任務ブリーフィング | 480×270 |
| `prologue_scene_2` | プロローグ シーン2 | ダンジョン入口 | 480×270 |
| `prologue_scene_3` | プロローグ シーン3 | 閉じた入口 | 480×270 |
| `story_stage_1` | ステージ1クリア | 第一層突破 | 480×270 |
| `story_stage_2` | ステージ2クリア | 深部への接近 | 480×270 |
| `story_stage_3` | ステージ3クリア | 異変 | 480×270 |
| `story_stage_4` | ステージ4クリア | 最深部へ | 480×270 |
| `story_stage_5` | ステージ5クリア | 封鎖解除 | 480×270 |
| `game_over` | ゲームオーバー | 冒険の終わり | 480×270 |

※ エンディング画像（`ending_s` 〜 `ending_d`）は既存の `ending.ts` で管理済みのため、レジストリには含めない。

### 2.4 プレースホルダー生成仕様

プレースホルダーは Canvas API で動的生成し、data URI として返す。

```
背景色: #1a1a2e（暗い紺色）
テキスト色: #e2e8f0
フォント: 16px sans-serif
テキスト: "[画像準備中]\n{alt テキスト}"
枠線: 1px solid #4a5568
```

### 2.5 API

```typescript
/**
 * 画像キーからエントリを取得する
 * @param key 画像キー
 * @returns StoryImageEntry | undefined
 */
export function getStoryImage(key: string): StoryImageEntry | undefined;

/**
 * 画像キーが登録されているか確認する
 * @param key 画像キー
 * @returns boolean
 */
export function hasStoryImage(key: string): boolean;
```

### 2.6 命名規則

**画像ファイル** (本番アセット差し替え時):
```
src/assets/images/ipne_prologue_scene_{1-3}.webp
src/assets/images/ipne_story_stage_{1-5}.webp
src/assets/images/ipne_game_over_alt.webp
```

- プレフィックス: `ipne_`
- 用途: `prologue_scene_`, `story_stage_`, `game_over_`
- 拡張子: `.webp`
- サイズ: 960×540 (2x 表示用)

---

## 3. ストーリーテキスト全文

### 3.1 プロローグ（3シーン）

#### シーン 1: 任務前夜

```
title: "任務前夜"
imageKey: "prologue_scene_1"
lines:
  - "異常構造体『IPNE（イプネ）』。"
  - "出現から72時間。内部構造が絶えず変化するこの迷宮は、あらゆる調査隊の侵入を退けていた。"
  - "記録されたデータは断片的。帰還率は著しく低い。"
  - "だが、構造体の核を順次停止させれば、封鎖を解除できる可能性がある。"
  - "――今回の任務は、5つの核の無力化と封鎖解除だ。"
```

#### シーン 2: ダンジョン入口

```
title: "ダンジョン入口"
imageKey: "prologue_scene_2"
lines:
  - "構造体の外壁は、まるで生きているかのように脈打っている。"
  - "装備を確認し、記録装置を起動する。"
  - "入口の形状は不規則に変化し続けている。今なら、通れる。"
  - "一歩を踏み出した瞬間、背後の空気が変わった。"
```

#### シーン 3: 閉じた入口

```
title: "閉じた入口"
imageKey: "prologue_scene_3"
lines:
  - "振り返ると、入口はすでに塞がっていた。"
  - "壁面が滑らかに閉じ、外界との接続が完全に断たれる。"
  - "通信も途絶。記録装置だけが静かに動いている。"
  - "――進むしかない。"
  - "核は、この先の最深部にある。"
```

### 3.2 ステージ間ストーリー（5本）

#### ステージ 1 クリア: 第一層突破

```
title: "第一層突破"
imageKey: "story_stage_1"
lines:
  - "最初の核の反応が消えた。"
  - "制御装置に触れた瞬間、周囲の壁が微かに震え、やがて静まった。"
  - "だが、奥にはさらに深い層が続いている。"
  - "構造が安定しかけた壁の向こうに、新たな通路が開いた。"
  - "空気の組成が変わっている。温度も下がってきた。"
  - "記録装置が、第二層の構造パターンを捉え始めている。"
  - "――まだ、先がある。"
```

#### ステージ 2 クリア: 深部への接近

```
title: "深部への接近"
imageKey: "story_stage_2"
lines:
  - "二つ目の核も沈黙した。"
  - "核の停止と同時に、周囲の壁が一斉に収縮した。構造体が反応している。"
  - "迷宮の反応が明らかに変わっている。"
  - "壁の紋様が複雑になり、通路の構造が不規則になってきた。"
  - "まるで、侵入者を拒んでいるかのように。"
  - "通路の分岐が増え、一部は行き止まりに変化している。"
  - "――構造体は、学習しているのかもしれない。"
```

#### ステージ 3 クリア: 異変

```
title: "異変"
imageKey: "story_stage_3"
lines:
  - "三つ目の核を停止させた。"
  - "停止の衝撃で、近くの壁面にひびが入った。そこから微かな光が漏れている。"
  - "周囲の空気が変質している。壁が不自然に増殖している。"
  - "ここから先は、迷宮そのものが防衛行動を取っている。"
  - "反応体の動きも攻撃的になった。縄張り意識が強まっている。"
  - "残り二つ。だが、最深部に近づくほど構造体の抵抗は激しくなる。"
  - "慎重に、だが確実に進まなければならない。"
```

#### ステージ 4 クリア: 最深部へ

```
title: "最深部へ"
imageKey: "story_stage_4"
lines:
  - "四つ目の核が崩壊し、最後の封鎖が解けた。"
  - "崩壊の振動が全層に伝播した。構造体全体が不安定になっている。"
  - "この先に、迷宮の中枢がある。"
  - "今まで以上に強い反応体の気配。空間そのものが歪んでいる。"
  - "記録装置の信号が乱れている。磁場が異常だ。"
  - "壁面の脈動が目に見えるほど激しくなった。"
  - "最後の核は、構造体の心臓部にある。"
  - "――これが、最後の調査になる。"
```

#### ステージ 5 クリア: 封鎖解除

```
title: "封鎖解除"
imageKey: "story_stage_5"
lines:
  - "最後の核が停止した。"
  - "一瞬の静寂。そして、構造体全体が大きく震えた。"
  - "壁面の脈動が止まり、通路が一つずつ固定されていく。"
  - "迷宮全体が静まりかえった。"
  - "入口方向の封鎖が完全に解除された。"
  - "外界からの通信が回復し始める。救援信号を受信。"
  - "長い調査が、ようやく終わる。"
```

### 3.3 エンディングテキスト（5ランク）

#### S ランク: 伝説の調査記録

```
title: "伝説の調査記録"
text: "全5層を驚異的な速さで踏破した。この調査記録は、後の探索者たちの指針となるだろう。"
paragraphs:
  - "全5層の核を、想定外の速さで無力化した。"
  - "記録装置が捉えたデータは膨大にして精緻。構造体の挙動パターン、反応体の行動原理、核の停止シーケンス――すべてが克明に記録されている。"
  - "この調査記録は即座に最高機密に分類され、後の探索作戦の根幹を成す指針となった。"
  - "報告書の結語にはこう記されている。「調査員の判断速度と適応力は、人類の対構造体戦術を一世代進めた」と。"
```

#### A ランク: 優秀な調査報告

```
title: "優秀な調査報告"
text: "確かな実力で全層を制覇した。解析班からも高い評価が寄せられている。"
paragraphs:
  - "確かな実力をもって、全5層を着実に制覇した。"
  - "各層での核停止は的確で、無駄のない経路選択が記録に残されている。"
  - "解析班からは『極めて信頼性の高いデータ』との評価が寄せられ、次期調査計画の重要な基盤資料となった。"
```

#### B ランク: 堅実な踏破記録

```
title: "堅実な踏破記録"
text: "着実に5つの層を攻略した。得られたデータは今後の調査に大きく貢献する。"
paragraphs:
  - "決して速くはなかったが、5つの層を着実に攻略した。"
  - "取得されたデータは十分な精度を有し、構造体の基本的な挙動パターンの解明に大きく貢献した。"
  - "今後の調査に向けた貴重な一歩として、記録に刻まれている。"
```

#### C ランク: 生還報告

```
title: "生還報告"
text: "幾度も危機を乗り越え、全層を踏破した。何より、生きて帰れたことが最大の成果だ。"
paragraphs:
  - "調査は困難を極めた。何度も撤退を考え、それでも前に進んだ。"
  - "記録装置のデータは一部欠損しているが、核の停止に必要な情報は確保された。"
  - "何より、生きて帰還したこと。それ自体が、この構造体に対する最大の成果だ。"
```

#### D ランク: 辛勝の脱出記録

```
title: "辛勝の脱出記録"
text: "長い戦いの末、ようやく迷宮の封鎖が解除された。記録に残る限りの困難を極めた調査だった。"
paragraphs:
  - "極限状態の中、かろうじて全核を停止させた。"
  - "記録装置のデータは大部分が破損し、調査としての価値は限定的だ。"
  - "だが、封鎖は解除された。次の調査員は、もう少し楽に進めるはずだ。"
  - "報告書にはこう記されている。「帰還したことが、唯一にして十分な成果である」と。"
```

### 3.4 ゲームオーバーテキスト

```
title: "冒険の終わり"
text: "迷宮の闇に飲み込まれた。だが、これで終わりではない。再び挑戦しよう。"
paragraphs:
  - "意識が遠のいていく。構造体の壁が、ゆっくりと閉じていく。"
  - "記録装置だけが、最後まで動作を続けていた。"
  - "取得されたデータは、次の調査員へと引き継がれる。"
  - "この犠牲は、無駄にはならない。"
```

---

## 4. スプライトアニメーション仕様

### 4.1 共通仕様

| 項目 | 値 |
|------|-----|
| スプライトサイズ | 16×16 px |
| データ形式 | パレットインデックス配列 (`number[][]`) |
| パレット[0] | 常に透明 |
| 描画方式 | `ImageData` → Canvas 2D |

### 4.2 プレイヤー攻撃フレーム

**追加数**: 2クラス × 4方向 × 2フレーム = 16 スプライト

**戦士攻撃フレーム**:

| フレーム | 説明 | フレーム時間 |
|---------|------|-------------|
| attack_1 | 剣を振りかぶった構え。右手（パレット6:白/剣色）を頭上に掲げる | 100ms |
| attack_2 | 剣を振り下ろした姿勢。剣先が前方斜め下に伸びる | 150ms |

パレット: 既存の `WARRIOR_PALETTE` を使用
```
0: 透明, 1: #2d3a8c, 2: #4c51bf, 3: #667eea, 4: #818cf8, 5: #c7d2fe, 6: #f5f5f5, 7: #d4a574
```

デザイン要件:
- 下方向: 剣を正面に振り下ろす
- 上方向: 背面から頭上に振り上げる
- 左方向: 左手前に横薙ぎ
- 右方向: 右手前に横薙ぎ
- 腕（パレット7:肌色）と剣（パレット6:白）が大きく動く
- ボディ（パレット2-3）は軽く前傾

**盗賊攻撃フレーム**:

| フレーム | 説明 | フレーム時間 |
|---------|------|-------------|
| attack_1 | ダガーを引いた構え。手前に引く動き | 80ms |
| attack_2 | ダガーを突き出した姿勢 | 120ms |

パレット: 既存の `THIEF_PALETTE` を使用
```
0: 透明, 1: #4c1d95, 2: #6d28d9, 3: #a78bfa, 4: #c4b5fd, 5: #ddd6fe, 6: #f5f5f5, 7: #d4a574
```

デザイン要件:
- 戦士より素早い動き（フレーム時間が短い）
- 刺突モーション（斬撃ではなく突き）
- 体重移動が小さく、手首の動きが主

**SpriteSheet 定義**:
```typescript
export const WARRIOR_ATTACK_SPRITE_SHEETS: Record<Direction, SpriteSheetDefinition>;
export const THIEF_ATTACK_SPRITE_SHEETS: Record<Direction, SpriteSheetDefinition>;
```

### 4.3 プレイヤー被弾フレーム

**追加数**: 2クラス × 4方向 × 1フレーム = 8 スプライト

| フレーム | 説明 | 表示時間 |
|---------|------|---------|
| damage | のけぞりポーズ。頭と体が後方に傾く | 200ms (固定表示) |

デザイン要件:
- 向いている方向の逆にのけぞる
- 腕が広がる（衝撃表現）
- 全体的に1px 後ろにシフトした重心

**SpriteSheet 定義**:
```typescript
export const WARRIOR_DAMAGE_SPRITES: Record<Direction, SpriteDefinition>;
export const THIEF_DAMAGE_SPRITES: Record<Direction, SpriteDefinition>;
```

### 4.4 アイドルブリーズ

**追加数**: 2クラス × 4方向 × 1フレーム = 8 スプライト

既存の idle フレーム (frame 0) に対して、微かに身体が沈むブリーズフレームを追加。

| フレーム | 説明 | フレーム時間 |
|---------|------|-------------|
| idle (既存) | 通常の立ちポーズ | 800ms |
| breathe | 微かに肩が下がった/体が縮んだポーズ | 800ms |

デザイン要件:
- 変化は1-2ピクセルのみ（微動）
- 主に肩のライン（パレット2-3のアーマー/クローク部分）が1px 下がる
- 頭部（パレット7:肌色）は動かない

**SpriteSheet 更新**:
```typescript
// 既存のウォークスプライトシートとは別に、アイドル専用シートを定義
export const WARRIOR_IDLE_SPRITE_SHEETS: Record<Direction, SpriteSheetDefinition>;
export const THIEF_IDLE_SPRITE_SHEETS: Record<Direction, SpriteSheetDefinition>;
// frameDuration: 800ms
```

### 4.5 敵状態別フレーム

#### パトロール敵（スライム）

**追加**: +1 フレーム（攻撃）
```
既存 frame1: 通常の丸い形
既存 frame2: 潰れた形（バウンス）
新規 frame3: 膨張形（攻撃）— 全体が広がり、上部が尖る
```
パレット: `['', '#4c1d95', '#6b21a8', '#7c3aed', '#a78bfa']`

#### チャージ敵（ビースト）

**追加**: +1 フレーム（突進）
```
既存 frame1: 通常の立ちポーズ
既存 frame2: 構えポーズ
新規 frame3: 突進ポーズ — 体が前方に大きく傾き、四肢が後方に流れる
```
パレット: `['', '#7f1d1d', '#991b1b', '#dc2626', '#f87171']`

#### レンジ敵（メイジ）

**追加**: +1 フレーム（詠唱）
```
既存 frame1: 通常
既存 frame2: アイドル
新規 frame3: 詠唱ポーズ — 手を前方に掲げ、パレット上位色（明るい色）が増える
```

#### スペシメン

**追加**: +1 フレーム（変異）
```
新規 frame3: 形状が変わり、不規則なシルエットに変化
```

#### ボス / ミニボス / メガボス

**追加**: +2 フレーム（攻撃 + ダメージ）
```
新規 frame3: 攻撃 — 大振りのモーション
新規 frame4: ダメージ — のけぞり
```

**フレーム選択ロジック**:
```typescript
function getEnemyFrame(enemy: Enemy): number {
  switch (enemy.state) {
    case EnemyState.ATTACK:
      return ATTACK_FRAME_INDEX; // 新規フレーム
    case EnemyState.KNOCKBACK:
      return DAMAGE_FRAME_INDEX; // ボスのみ
    case EnemyState.CHASE:
    case EnemyState.CHARGE:
      return CHASE_FRAME_INDEX; // チャージ敵の突進フレーム
    default:
      // 既存の2フレームアニメーション
      return Math.floor(Date.now() / frameDuration) % 2;
  }
}
```

### 4.6 敵攻撃エフェクトスプライト

**ファイル**: `src/features/ipne/presentation/sprites/effectSprites.ts` に追記

#### 近接攻撃エフェクト

```
名前: ENEMY_MELEE_SLASH_SPRITE_SHEET
フレーム数: 3
サイズ: 16×16
フレーム時間: 80ms (合計 240ms)
パレット: ['', '#ff4444', '#ff8888', '#ffcccc', '#880000']
  0: 透明
  1: 赤（衝撃の中心）
  2: 明赤（衝撃の中間）
  3: 淡赤（衝撃の外縁）
  4: 暗赤（残光）
デザイン: 右から左への横薙ぎ弧（プレイヤー攻撃の赤版）
```

#### 遠距離攻撃エフェクト

```
名前: ENEMY_RANGED_SHOT_SPRITE_SHEET
フレーム数: 3
サイズ: 16×16
フレーム時間: 100ms (合計 300ms)
パレット: ['', '#f97316', '#fdba74', '#fff7ed', '#9a3412']
  0: 透明
  1: オレンジ（弾芯）
  2: 明オレンジ（弾のグロー）
  3: 白（発射閃光）
  4: 暗オレンジ（軌跡）
デザイン: 中央の光球が拡大→収縮→消散
```

---

## 5. エフェクト仕様

### 5.1 敵攻撃エフェクト (`ENEMY_ATTACK`)

**トリガー**: 敵が攻撃判定に成功した時

| パラメータ | 近接攻撃 | 遠距離攻撃 | ボス攻撃 |
|-----------|---------|-----------|---------|
| パーティクル数 | 8 | 6 | 16 |
| 持続時間 (ms) | 400 | 300 | 600 |
| 色 | `['#ef4444', '#dc2626', '#991b1b']` | `['#f97316', '#fdba74', '#fff7ed']` | `['#7c2d12', '#dc2626', '#f97316', '#ffffff']` |
| パターン | 放射状 (`createRadialParticles`) | 直線軌跡 (`createTrailParticles`) | パルス波 (`createPulseParticles`) |
| 速度 (px/s) | 40-100 | 60-120 | 80-200 |
| サイズ (px) | 2-4 | 1-3 | 3-6 |
| 減衰率 | 2.5 | 3.0 | 1.0 |

**追加ロジック** (`effectManager.ts`):

```typescript
case EffectType.ENEMY_ATTACK:
  // 敵タイプに基づくバリエーションは addEffect の引数拡張で対応
  // デフォルトは近接攻撃パラメータ
```

攻撃種別を区別するために、`addEffect` にオプション引数を追加:

```typescript
addEffect(
  type: EffectTypeValue,
  x: number,
  y: number,
  now?: number,
  options?: { variant?: 'melee' | 'ranged' | 'boss' }
): void;
```

### 5.2 画面シェイク (`SCREEN_SHAKE`)

**トリガー**: プレイヤーがダメージを受けた時

| パラメータ | 値 |
|-----------|-----|
| 持続時間 | 200ms |
| 最大振幅 | `min(damage * 1.5, 4)` px |
| 減衰 | リニア（duration で 0 へ） |
| 方向 | X, Y 同時（ランダム角度） |
| パーティクル | なし（シェイクのみ） |

**描画実装** (`effectManager.ts` の `draw` メソッド内):

```typescript
// シェイクエフェクトが存在する場合
for (const effect of this.effects) {
  if (effect.type === EffectType.SCREEN_SHAKE && effect.shakeIntensity) {
    const elapsed = now - effect.startTime;
    const progress = Math.min(1, elapsed / effect.duration);
    const currentIntensity = effect.shakeIntensity * (1 - progress);
    const angle = Math.random() * Math.PI * 2;
    const offsetX = Math.cos(angle) * currentIntensity;
    const offsetY = Math.sin(angle) * currentIntensity;
    ctx.translate(offsetX, offsetY);
  }
}
```

**Game.tsx 側の呼び出し**:

```typescript
// プレイヤーダメージ時
effectManager.addEffect(EffectType.SCREEN_SHAKE, 0, 0, now);
// → shakeIntensity は damage * 1.5 (max 4)
```

### 5.3 低HP警告 (`LOW_HP_WARNING`)

**トリガー**: `player.hp <= player.maxHp * 0.25`

| パラメータ | 値 |
|-----------|-----|
| 色 | `rgba(220, 38, 38, alpha)` (#dc2626) |
| パルス周期 | 1500ms |
| 最大 alpha | 0.25 |
| 最小 alpha | 0.05 |
| 描画方式 | ビネット（四辺からの内側グラデーション） |

**描画ロジック**:

```typescript
// LOW_HP_WARNING は GameEffect ではなく、Game.tsx で直接描画するオーバーレイ
function drawLowHpWarning(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  now: number
): void {
  const phase = (now % 1500) / 1500;
  const alpha = 0.05 + 0.20 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.3,
    width / 2, height / 2, Math.max(width, height) * 0.7
  );
  gradient.addColorStop(0, 'rgba(220, 38, 38, 0)');
  gradient.addColorStop(1, `rgba(220, 38, 38, ${alpha})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}
```

### 5.4 ステージクリア演出 (`STAGE_CLEAR`)

**トリガー**: ボス（またはメガボス）撃破後のステージクリア判定時

| パラメータ | 値 |
|-----------|-----|
| パーティクル数 | 32 |
| 持続時間 | 1500ms |
| パターン | 螺旋放射 (`createSpiralParticles`) |
| 速度 (px/s) | 100-250 |
| サイズ (px) | 3-6 |
| 重力 | 60 px/s² |
| フラッシュ | 300ms の白フラッシュ（alpha: 0.8 → 0） |

**色テーブル** (ステージ別):

| ステージ | 色 |
|---------|-----|
| 1 | `['#d4a574', '#c2956b', '#fbbf24', '#ffffff']` (土/金) |
| 2 | `['#94a3b8', '#cbd5e1', '#e2e8f0', '#ffffff']` (銀/石) |
| 3 | `['#22d3ee', '#67e8f9', '#a5f3fc', '#ffffff']` (水晶/シアン) |
| 4 | `['#a78bfa', '#c4b5fd', '#ddd6fe', '#ffffff']` (魔法/紫) |
| 5 | `['#fbbf24', '#f97316', '#ef4444', '#ffffff']` (最深部/炎) |

**追加: 「STAGE CLEAR」テキスト表示**:
```
フォント: bold 24px sans-serif
色: #ffffff
影: 2px 2px 4px rgba(0,0,0,0.8)
表示: 画面中央に 500ms フェードイン → 1000ms 維持 → フェードアウト
```

### 5.5 新パーティクルパターン

**ファイル**: `src/features/ipne/presentation/effects/particleSystem.ts` に追加

#### `createSpiralParticles`

```typescript
/**
 * 螺旋状に広がるパーティクルを生成する
 *
 * @param count パーティクル数
 * @param x 発生位置 X
 * @param y 発生位置 Y
 * @param colors 色配列
 * @param speedMin 最小速度 (px/s)
 * @param speedMax 最大速度 (px/s)
 * @param sizeMin 最小サイズ (px)
 * @param sizeMax 最大サイズ (px)
 * @param decay 減衰率
 * @param spiralFactor 螺旋の強さ (0.0-1.0)
 * @returns パーティクル配列
 */
export function createSpiralParticles(
  count: number, x: number, y: number,
  colors: string[],
  speedMin: number, speedMax: number,
  sizeMin: number, sizeMax: number,
  decay: number,
  spiralFactor: number = 0.5
): Particle[];
```

ロジック: 角度を `2π * i / count` で均等配分し、速度ベクトルに `spiralFactor` 分の接線方向成分を加算。

#### `createPulseParticles`

```typescript
/**
 * 中心から波紋状に広がるパーティクルを生成する
 *
 * @param count パーティクル数
 * @param x 発生位置 X
 * @param y 発生位置 Y
 * @param colors 色配列
 * @param speedMin 最小速度 (px/s)
 * @param speedMax 最大速度 (px/s)
 * @param sizeMin 最小サイズ (px)
 * @param sizeMax 最大サイズ (px)
 * @param decay 減衰率
 * @returns パーティクル配列
 */
export function createPulseParticles(
  count: number, x: number, y: number,
  colors: string[],
  speedMin: number, speedMax: number,
  sizeMin: number, sizeMax: number,
  decay: number
): Particle[];
```

ロジック: `createRadialParticles` と類似だが、全パーティクルの初速が同一（波紋として同時に広がる）。

#### `createTrailParticles`

```typescript
/**
 * 直線軌跡のパーティクルを生成する
 *
 * @param count パーティクル数
 * @param startX 開始位置 X
 * @param startY 開始位置 Y
 * @param targetX 目標位置 X
 * @param targetY 目標位置 Y
 * @param colors 色配列
 * @param speed 速度 (px/s)
 * @param sizeMin 最小サイズ (px)
 * @param sizeMax 最大サイズ (px)
 * @param decay 減衰率
 * @returns パーティクル配列
 */
export function createTrailParticles(
  count: number,
  startX: number, startY: number,
  targetX: number, targetY: number,
  colors: string[],
  speed: number,
  sizeMin: number, sizeMax: number,
  decay: number
): Particle[];
```

ロジック: start→target 方向のベクトルを正規化し、各パーティクルは start から target 間の等間隔位置に配置。速度は同一方向で若干のランダム散らし。

---

## 6. コンポーネント変更仕様

### 6.1 `Prologue.tsx` — マルチシーン対応

**変更概要**: `slides[]` が存在する場合はマルチシーン UI を表示。

**状態管理**:
```typescript
const [currentSlide, setCurrentSlide] = useState(0);
const [textIndex, setTextIndex] = useState(0);
```

**表示ロジック**:
1. `slides` がある場合:
   - `currentSlide` のスライドを表示
   - スライド内の `lines` を `textIndex` で逐次表示
   - 全行表示後、3秒で自動次スライド or 手動送り
   - 最終スライド完了後、`onSkip()` を呼び出し
2. `slides` がない場合:
   - 既存のロジック（後方互換）

**画像表示**:
- スライドの `imageKey` を `getStoryImage()` で解決
- テキストの上部に配置
- CSS `max-width: 100%`, `max-height: 200px`, `object-fit: contain`
- フェードインアニメーション: `opacity 0→1, 0.5s ease-in`

**UI追加**:
- スライドインジケーター（ドット: `● ○ ○`）— 画面下部
- 「次へ」ボタン — 全行表示後に出現
- 「スキップ」ボタン — 常時表示（画面右下）

### 6.2 `StageStory.tsx` — 画像表示対応

**変更概要**: `imageKey` を使って画像を表示。

**レイアウト変更**:
```
┌──────────────────────────┐
│        [画像エリア]        │  ← 新規追加
│      480×270 max          │
│                            │
│─────────────────────────── │
│   《ストーリータイトル》    │
│                            │
│   テキスト行1              │
│   テキスト行2              │
│   テキスト行3              │
│   ...                      │
│                            │
│      [次へ / スキップ]     │
└──────────────────────────┘
```

**画像取得ロジック**:
```typescript
const imageEntry = story.imageKey ? getStoryImage(story.imageKey) : undefined;
```

**画像スタイル**:
```css
max-width: 100%;
max-height: 200px;
object-fit: contain;
border-radius: 8px;
margin-bottom: 1.5rem;
opacity: 0;
animation: fadeIn 0.8s ease-in forwards;
```

### 6.3 `FinalClear.tsx` — 段階的演出

**変更概要**: エンディング要素を段階的にフェードインする。

**演出タイムライン**:

| 遅延 (ms) | 要素 | アニメーション |
|-----------|------|--------------|
| 0 | 背景暗転 | 0.3s fade |
| 300 | NEW BEST バッジ | 0.5s scale-in |
| 800 | レーティング文字 | 0.8s zoom-in |
| 1600 | クリアタイム | 0.5s fade-in |
| 2400 | エピローグタイトル | 0.5s fade-in |
| 3200 | エピローグ段落 1 | 0.5s fade-in |
| 3700 | エピローグ段落 2 | 0.5s fade-in |
| 4200 | エピローグ段落 3 | 0.5s fade-in |
| 4700 | エピローグ段落 4 | 0.5s fade-in (存在する場合) |
| 5500 | エンディング画像 | 1.0s blur→clear |
| 7000 | 操作ボタン | 0.5s fade-in |

**段落表示ロジック**:
```typescript
const [visibleElements, setVisibleElements] = useState(0);

useEffect(() => {
  const timers = TIMELINE.map((delay, i) =>
    setTimeout(() => setVisibleElements(i + 1), delay)
  );
  return () => timers.forEach(clearTimeout);
}, []);
```

**`paragraphs` 対応**:
- `paragraphs` があれば段落ごとにフェードイン
- なければ `text` を一括で表示（後方互換）

**スキップ**: 「スキップ」ボタンで全要素を即時表示。

### 6.4 `Game.tsx` — アニメーション・エフェクト統合

**変更概要**: 新しいアニメーションとエフェクトをゲームループに統合する。

#### アニメーション統合

**プレイヤースプライト選択ロジック** (描画時):
```typescript
function getPlayerSpriteSheet(player: Player, now: number): {
  sheet: SpriteSheetDefinition;
  frameOverride?: number;
} {
  // 1. 被弾中（200ms以内）→ ダメージフレーム
  if (player.isInvincible && now - player.invincibleUntil + INVINCIBLE_DURATION < 200) {
    return { sheet: getDamageSpriteSheet(player), frameOverride: 0 };
  }

  // 2. 攻撃クールダウン中 → 攻撃フレーム
  if (now < player.attackCooldownUntil) {
    return { sheet: getAttackSpriteSheet(player) };
  }

  // 3. 移動中 → 歩行フレーム（既存）
  if (isMoving(player)) {
    return { sheet: getWalkSpriteSheet(player) };
  }

  // 4. 待機中 → アイドルブリーズ
  return { sheet: getIdleSpriteSheet(player) };
}
```

**敵スプライト選択ロジック** (描画時):
```typescript
function getEnemySpriteFrame(enemy: Enemy, now: number): number {
  switch (enemy.state) {
    case EnemyState.ATTACK:
      return getAttackFrameIndex(enemy.type);
    case EnemyState.KNOCKBACK:
      return getDamageFrameIndex(enemy.type); // ボスのみ4フレーム目
    default:
      return getDefaultAnimFrame(enemy.type, now);
  }
}
```

#### エフェクト統合

**トリガーポイント**:

| イベント | エフェクト | トリガー場所 |
|---------|-----------|-------------|
| 敵攻撃ヒット | `ENEMY_ATTACK` | `resolvePlayerDamage` 後 |
| プレイヤー被弾 | `SCREEN_SHAKE` | `resolvePlayerDamage` 後 |
| HP 25%以下 | `LOW_HP_WARNING` | 描画ループ内で常時判定 |
| ステージクリア | `STAGE_CLEAR` | ゴール到達後 |

**画面シェイクの Canvas 統合**:
```typescript
// Game.tsx の描画ループ内
ctx.save();

// シェイクオフセットを適用
const shakeOffset = effectManager.getShakeOffset(now);
if (shakeOffset) {
  ctx.translate(shakeOffset.x, shakeOffset.y);
}

// 通常のゲーム描画
drawGame(ctx, ...);

ctx.restore();

// シェイクに影響されない UI の描画
drawHUD(ctx, ...);

// 低HP警告（シェイクの影響を受けない）
if (player.hp <= player.maxHp * 0.25) {
  drawLowHpWarning(ctx, canvasWidth, canvasHeight, now);
}
```

**EffectManager への新メソッド追加**:
```typescript
/**
 * 現在のシェイクオフセットを取得する
 * @returns {x, y} オフセット、またはシェイク中でなければ null
 */
getShakeOffset(now: number): { x: number; y: number } | null;
```

---

## 7. 画像アセット仕様

### 7.1 概要

フェーズ 1〜5 で Canvas API プレースホルダーとして実装されたストーリー画像を、画像生成 AI で作成した本番アセットに差し替える。詳細な画像生成プロンプト仕様は `images.md` を参照。

### 7.2 共通仕様

| 項目 | 値 |
|------|-----|
| **出力サイズ** | 960×540 px（表示は 480×270 に縮小、Retina 対応） |
| **出力形式** | WebP（品質 80〜85、ファイルサイズ目安 50〜150 KB） |
| **アスペクト比** | 16:9 |
| **配色トーン** | ダークファンタジー基調（深い青〜紫〜黒のグラデーション背景） |
| **画風** | アニメ調コンセプトアート。主線はやや太め。人物は登場させず構造物・風景を中心に描写 |
| **テキスト** | 画像内にはテキストを一切含めない |
| **構図** | 中央下部にストーリーテキストが重なるため、視覚的焦点は上半分〜中央寄りに配置 |

### 7.3 画像一覧

| # | ファイル名 | 画像キー | シーン | 主な配色 |
|---|-----------|---------|--------|---------|
| 1 | `ipne_story_prologue_1.webp` | `prologue_scene_1` | 任務ブリーフィング — 作戦室、ホログラフィック投影 | 暗い室内に青白い光源 |
| 2 | `ipne_story_prologue_2.webp` | `prologue_scene_2` | ダンジョン入口 — 脈動する外壁、薄紫の光 | 夜空と暗い岩盤、薄紫〜青紫 |
| 3 | `ipne_story_prologue_3.webp` | `prologue_scene_3` | 閉じた入口 — 滑らかに閉じた壁面、発光紋様 | 暗い壁面に淡い紫〜青 |
| 4 | `ipne_story_stage_1.webp` | `story_stage_1` | 第一層突破 — 停止した核、安定しかけた壁面 | 青〜シアン、核の残光オレンジ |
| 5 | `ipne_story_stage_2.webp` | `story_stage_2` | 深部への接近 — 複雑化した紋様、分岐路 | 紫〜ダークマゼンタ |
| 6 | `ipne_story_stage_3.webp` | `story_stage_3` | 異変 — ひび割れた壁面、有機的増殖 | 赤紫〜深紅 |
| 7 | `ipne_story_stage_4.webp` | `story_stage_4` | 最深部へ — 崩壊しかけた封鎖壁、歪んだ空間 | 深い暗黒に金〜オレンジ |
| 8 | `ipne_story_stage_5.webp` | `story_stage_5` | 封鎖解除 — 静まった壁面、出口の光 | 落ち着いた青〜白、暖色の光 |
| 9 | `ipne_story_game_over.webp` | `game_over` | 冒険の終わり — 閉じかけた壁面、薄れる光 | 暗黒、微かな赤い光 |

### 7.4 配置先

```
src/assets/images/
├── ipne_story_prologue_1.webp
├── ipne_story_prologue_2.webp
├── ipne_story_prologue_3.webp
├── ipne_story_stage_1.webp
├── ipne_story_stage_2.webp
├── ipne_story_stage_3.webp
├── ipne_story_stage_4.webp
├── ipne_story_stage_5.webp
└── ipne_story_game_over.webp
```

### 7.5 `storyImages.ts` 差し替え仕様

**変更前**: Canvas API でプレースホルダーを動的生成

**変更後**: import した実画像を返却

```typescript
// 実画像を import
import imgPrologue1 from '../../assets/images/ipne_story_prologue_1.webp';
import imgPrologue2 from '../../assets/images/ipne_story_prologue_2.webp';
import imgPrologue3 from '../../assets/images/ipne_story_prologue_3.webp';
import imgStage1 from '../../assets/images/ipne_story_stage_1.webp';
import imgStage2 from '../../assets/images/ipne_story_stage_2.webp';
import imgStage3 from '../../assets/images/ipne_story_stage_3.webp';
import imgStage4 from '../../assets/images/ipne_story_stage_4.webp';
import imgStage5 from '../../assets/images/ipne_story_stage_5.webp';
import imgGameOver from '../../assets/images/ipne_story_game_over.webp';

const IMAGE_SOURCES: Record<string, string> = {
  prologue_scene_1: imgPrologue1,
  prologue_scene_2: imgPrologue2,
  prologue_scene_3: imgPrologue3,
  story_stage_1: imgStage1,
  story_stage_2: imgStage2,
  story_stage_3: imgStage3,
  story_stage_4: imgStage4,
  story_stage_5: imgStage5,
  game_over: imgGameOver,
};

export function getStoryImage(key: string): StoryImageEntry | undefined {
  const def = IMAGE_DEFINITIONS[key];
  if (!def) return undefined;
  return {
    src: IMAGE_SOURCES[key],
    alt: def.alt,
    width: def.width,
    height: def.height,
  };
}
```

**変更不要な箇所**:
- `Prologue.tsx` — `getStoryImage()` 経由で取得するため変更不要
- `StageStory.tsx` — 同上
- `FinalClear.tsx` — `getEndingImage()` を使用（既存の実画像。今回の対象外）
- `story.ts` — `imageKey` 文字列のみ保持。変更不要

### 7.6 既存画像アセット一覧（参考）

以下は既に実画像として存在するアセット。今回の生成対象外:

| ファイル名 | 用途 |
|-----------|------|
| `ipne_title_bg.webp` / `_mobile.webp` | タイトル画面背景 |
| `ipne_prologue_bg.webp` / `_mobile.webp` | プロローグ画面背景 |
| `ipne_class_warrior.webp` / `_thief.webp` | 職業選択 |
| `ipne_ending_s/a/b/c/d.webp` | エンディング画像 |
| `ipne_game_over.webp` | ゲームオーバー画面（`ending.ts` 経由、今回の `game_over` キーとは別用途） |
| `ipne_ending_s.mp4` | Sランク特別動画 |

---

## 付録 A: ファイル変更マトリックス

| ファイル | Ph.1 | Ph.2 | Ph.3 | Ph.4 | Ph.5 | Ph.6 |
|---------|------|------|------|------|------|------|
| `types.ts` | **変更** | | | | | |
| `story.ts` | | **変更** | | | | |
| `ending.ts` | | **変更** | | | | |
| `storyImages.ts` | **新規** | 参照 | | | | **変更** |
| `Prologue.tsx` | | **変更** | | | テスト | |
| `StageStory.tsx` | | **変更** | | | テスト | |
| `FinalClear.tsx` | | **変更** | | | テスト | |
| `playerSprites.ts` | | | **変更** | | | |
| `enemySprites.ts` | | | **変更** | | | |
| `effectSprites.ts` | | | **変更** | | | |
| `effectTypes.ts` | **変更** | | | | | |
| `effectManager.ts` | | | | **変更** | テスト | |
| `particleSystem.ts` | | | | **変更** | テスト | |
| `Game.tsx` | | | **変更** | **変更** | テスト | |
| `assets/images/ipne_story_*.webp` | | | | | | **新規** |

## 付録 B: 定数一覧

| 定数名 | 値 | 用途 |
|--------|-----|------|
| `PROLOGUE_AUTO_ADVANCE_MS` | 2000 | プロローグ行の自動進行間隔 |
| `PROLOGUE_SLIDE_ADVANCE_MS` | 3000 | プロローグスライドの自動進行間隔 |
| `STORY_LINE_INTERVAL_MS` | 500 | ストーリー行のフェードイン間隔 |
| `ATTACK_ANIM_WARRIOR_F1_MS` | 100 | 戦士攻撃フレーム1の表示時間 |
| `ATTACK_ANIM_WARRIOR_F2_MS` | 150 | 戦士攻撃フレーム2の表示時間 |
| `ATTACK_ANIM_THIEF_F1_MS` | 80 | 盗賊攻撃フレーム1の表示時間 |
| `ATTACK_ANIM_THIEF_F2_MS` | 120 | 盗賊攻撃フレーム2の表示時間 |
| `DAMAGE_ANIM_MS` | 200 | 被弾フレームの表示時間 |
| `IDLE_BREATHE_MS` | 800 | アイドルブリーズのフレーム時間 |
| `SCREEN_SHAKE_DURATION_MS` | 200 | 画面シェイクの持続時間 |
| `SCREEN_SHAKE_MAX_PX` | 4 | 画面シェイクの最大振幅 |
| `LOW_HP_THRESHOLD` | 0.25 | 低HP警告の閾値（maxHP比） |
| `LOW_HP_PULSE_PERIOD_MS` | 1500 | 低HP警告のパルス周期 |
| `LOW_HP_ALPHA_MAX` | 0.25 | 低HP警告の最大透明度 |
| `LOW_HP_ALPHA_MIN` | 0.05 | 低HP警告の最小透明度 |
| `STAGE_CLEAR_PARTICLES` | 32 | ステージクリアのパーティクル数 |
| `STAGE_CLEAR_DURATION_MS` | 1500 | ステージクリア演出の持続時間 |
| `STAGE_CLEAR_GRAVITY` | 60 | ステージクリアパーティクルの重力 |
| `MAX_PARTICLES` | 200 | パーティクル上限数（既存） |
| `PLACEHOLDER_BG_COLOR` | `#1a1a2e` | プレースホルダー画像の背景色 |
| `PLACEHOLDER_TEXT_COLOR` | `#e2e8f0` | プレースホルダー画像のテキスト色 |
| `STORY_IMAGE_WIDTH` | 960 | ストーリー画像の生成幅 (px) |
| `STORY_IMAGE_HEIGHT` | 540 | ストーリー画像の生成高さ (px) |
| `STORY_IMAGE_DISPLAY_WIDTH` | 480 | ストーリー画像の表示幅 (px) |
| `STORY_IMAGE_DISPLAY_HEIGHT` | 270 | ストーリー画像の表示高さ (px) |
