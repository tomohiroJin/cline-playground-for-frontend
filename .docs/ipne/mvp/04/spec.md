# 仕様・要件定義（IPNE MVP4）

## 1. 目的

MVP3（成長・職業差・罠拡張）をベースに、
**MVP4（仕上げ・演出・リプレイ価値）** を現行プロダクトへ追加する。

- 「ゲームをプレイし続けられる完成形に寄せる」ことを検証する
- リプレイ動機が生まれるか確認する
- 初見でルールが理解できるか確認する
- 演出が気持ちよさに寄与するか確認する

### MVP4の本質

> MVP4は新規システム追加のフェーズではない。
> **分かりやすさ・気持ちよさ・再挑戦動機・安定運用** を優先するフェーズである。

---

## 2. ゲーム概要（MVP4）

### 2.1 コンセプト

自動生成された迷路を探索し、職業の特性を活かしながら、
成長選択と罠の利用を判断してゴールを目指す
**リプレイ性のある探索プロトタイプ**。

### 2.2 プレイ時間

- 1プレイ：5〜10分程度
- 迷路サイズ：80x80タイル（MVP3と同じ）

### 2.3 MVP3との違い

| 項目 | MVP3 | MVP4 |
|------|------|------|
| タイマー | なし | クリアタイム計測 |
| 記録 | なし | ベスト記録保存 |
| リザルト | 簡易 | タイム/Lv/撃破数/評価 |
| エンディング | 1種 | 5段階分岐（S/A/B/C/D） |
| チュートリアル | なし | 初回のみ表示 |
| フィードバック | 最小限 | SE/エフェクト追加 |
| SPECIMEN | メリット薄 | 回復ドロップ |
| 生成 | 運任せ | 安定化検証あり |
| ヘルプ | なし | 操作説明/Entity Guide |

---

## 3. 画面構成

1. **タイトル画面**
2. **職業選択画面**
3. **プロローグ画面**（開始直後1回）
4. **チュートリアル画面**（初回のみ、新規）
5. **ゲーム画面**（+ マップオーバーレイ + HP/能力値表示 + タイマー）
6. **レベルアップ画面**（オーバーレイ）
7. **ヘルプ画面**（オーバーレイ、新規）
8. **クリア画面**（リザルト拡張）
9. **ゲームオーバー画面**（リザルト拡張）

---

## 4. タイマー仕様

### 4.1 タイマー型定義

```typescript
interface GameTimer {
  startTime: number;       // 計測開始時刻
  pausedTime: number;      // 一時停止中の累積時間
  isPaused: boolean;       // 一時停止フラグ
  pauseStartTime: number;  // 一時停止開始時刻
}
```

### 4.2 タイマー動作

| 項目 | 値 |
|------|-----|
| 計測開始 | 操作可能になった瞬間 |
| 計測停止 | ゴール到達 または HP<=0 |
| 一時停止 | レベルアップUI表示中 |
| 表示形式 | mm:ss.ms |

### 4.3 タイマー関数

```typescript
// タイマー生成
createTimer(): GameTimer

// タイマー開始
startTimer(timer: GameTimer): GameTimer

// タイマー一時停止
pauseTimer(timer: GameTimer): GameTimer

// タイマー再開
resumeTimer(timer: GameTimer): GameTimer

// 経過時間取得（ミリ秒）
getElapsedTime(timer: GameTimer): number

// 表示用フォーマット（mm:ss.ms）
formatTime(ms: number): string
```

---

## 5. 記録仕様

### 5.1 記録型定義

```typescript
interface GameRecord {
  time: number;            // クリアタイム（ミリ秒）
  level: number;           // 到達レベル
  killCount: number;       // 撃破数
  playerClass: PlayerClassValue;  // 職業
  rating: RatingValue;     // 評価（S/A/B/C/D）
  timestamp: number;       // 記録日時
}

const Rating = {
  S: 's',
  A: 'a',
  B: 'b',
  C: 'c',
  D: 'd',
} as const;

type RatingValue = (typeof Rating)[keyof typeof Rating];

interface BestRecords {
  warrior: GameRecord | undefined;
  thief: GameRecord | undefined;
  overall: GameRecord | undefined;
}
```

### 5.2 localStorage キー

| キー | 内容 |
|------|------|
| `ipne_best_warrior` | 戦士ベスト記録 |
| `ipne_best_thief` | 盗賊ベスト記録 |
| `ipne_best_overall` | 総合ベスト記録 |
| `ipne_tutorial_completed` | チュートリアル完了フラグ |

### 5.3 記録関数

```typescript
// 記録保存
saveRecord(record: GameRecord): void

// 記録読み込み
loadBestRecords(): BestRecords

// ベスト判定
isBestRecord(record: GameRecord, best: BestRecords): boolean

// 記録クリア
clearRecords(): void
```

---

## 6. エンディング分岐仕様

### 6.1 評価基準

| 評価 | 条件（クリアタイム） | ミリ秒 | エピローグ |
|------|---------------------|--------|-----------|
| S | 0〜2分 | 0〜120,000ms | 迷宮の支配者 |
| A | 2〜3分 | 120,001〜180,000ms | 熟練の生還者 |
| B | 3〜5分 | 180,001〜300,000ms | 堅実な踏破者 |
| C | 5〜8分 | 300,001〜480,000ms | 辛勝の脱出者 |
| D | 8分以上 | 480,001ms〜 | 瀕死の帰還者 |

### 6.2 評価閾値定数

```typescript
const RATING_THRESHOLDS = {
  S: 120000,   // 2分
  A: 180000,   // 3分
  B: 300000,   // 5分
  C: 480000,   // 8分
  // D: それ以上
} as const;
```

### 6.3 エピローグテキスト

```typescript
const EPILOGUE_TEXT = {
  s: {
    title: '迷宮の支配者',
    text: `2分以内に迷宮を踏破した者は、過去100年で数えるほどしかいない。
あなたは迷宮を"攻略した"のではない——"支配した"のだ。
迷宮の核が砕け、標本たちは永遠の眠りについた。
この日より、あなたの名は『迷宮破りの英雄』として語り継がれる。`,
  },
  a: {
    title: '熟練の生還者',
    text: `見事な脱出だ。迷宮の試練を、あなたは鮮やかにくぐり抜けた。
標本たちは追いつけず、罠は無力化された。
迷宮はあなたを『価値ある挑戦者』と認め、解放した。
外の世界が、再びあなたを迎える。`,
  },
  b: {
    title: '堅実な踏破者',
    text: `無事に迷宮を抜けた。焦らず、着実に進んだ結果だ。
あなたは生還者として、迷宮の記録に名を刻んだ。
標本となることなく、この試練を乗り越えた。
次の挑戦者に語り継げる経験を、あなたは手に入れた。`,
  },
  c: {
    title: '辛勝の脱出者',
    text: `……生きて、出られた。それだけで十分だ。
傷は深く、消耗は激しい。だが、命だけは繋いだ。
迷宮は最後の最後まであなたを試したが、
あなたは諦めなかった。その意志こそが、唯一の勝利条件だった。`,
  },
  d: {
    title: '瀕死の帰還者',
    text: `……もう、動けない。だが、出口は目の前だ。
迷宮に飲み込まれる寸前、ぎりぎりで脱出した。
体も心も限界を超えた。回復には長い時間がかかるだろう。
それでも——あなたは標本にならなかった。それだけは、確かな勝利だ。`,
  },
} as const;

const GAME_OVER_TEXT = {
  title: '新たな標本',
  text: `……意識が、遠のいていく。
迷宮は新たな標本を得た。
あなたの記憶は薄れ、体は硬質化し、やがてこの場所の一部となる。
次の挑戦者が来るとき、あなたは彼らを追う側になっているだろう。

——迷宮は、決して獲物を逃さない。`,
} as const;
```

### 6.4 エンディング画像イメージ（ビジュアル参考）

| 評価 | 画像イメージ |
|------|-------------|
| S | 主人公が迷宮の頂点に立ち、光が差し込む出口の前で振り返る。足元には倒れた敵の影。背景には崩れゆく迷宮。 |
| A | 主人公が出口の光の中を歩いていく後ろ姿。迷宮の入り口が背後で閉じていく。 |
| B | 主人公が出口の前で一息ついている。傷は少なく、表情は落ち着いている。 |
| C | 主人公が傷だらけで出口にたどり着く。片膝をついて息を切らしている。夕暮れの光。 |
| D | 主人公が這うようにして出口から転がり出る。体は傷だらけ、装備はボロボロ。夜明け前の薄暗い光。 |
| ゲームオーバー | 主人公が闇の中で倒れている。周囲には光る瞳を持つ標本たちが見下ろしている。主人公の体が徐々にガラスのように透明になっていく。 |

### 6.5 評価関数

```typescript
// タイムから評価を計算
calculateRating(timeMs: number): RatingValue

// エピローグテキスト取得
getEpilogueText(rating: RatingValue): { title: string; text: string }

// ゲームオーバーテキスト取得
getGameOverText(): { title: string; text: string }
```

### 6.6 Sランク特別動画（将来実装）

#### コンセプト：「迷宮崩壊 - The Labyrinth Falls」

**演出内容**（30〜60秒想定）：

1. **オープニング（0〜5秒）**
   - 画面が白くフェードイン
   - 「CLEAR TIME: 1:XX」が金色で表示

2. **迷宮崩壊シーン（5〜20秒）**
   - 上空から見た迷宮全体が映る
   - 主人公が踏破したルートが光の線で描かれる
   - 迷宮の壁が内側から光を放ち、崩れ始める
   - 標本たちが光に包まれて消えていく

3. **主人公ハイライト（20〜35秒）**
   - 主人公が出口に向かって歩く（スローモーション）
   - 背後で迷宮が崩壊していく
   - 職業に応じた演出（戦士：剣を掲げる / 盗賊：マントをはためかせる）

4. **エンディングカット（35〜50秒）**
   - 出口の光の中へ主人公が歩み出す
   - 迷宮が完全に崩壊し、更地になる
   - 「THE LABYRINTH HAS FALLEN」のテキスト表示

5. **クレジット（50〜60秒）**
   - 「迷宮破りの英雄」の称号が表示
   - プレイ統計（タイム、撃破数、レベル）が金色で表示
   - 「Thank you for playing」

#### 動画の特別要素
- **BGM**: 壮大なオーケストラ調のファンファーレ
- **カラー**: 全体的に金色の光が溢れる演出
- **エフェクト**: パーティクル（光の粒子）が舞い上がる

---

## 7. チュートリアル仕様

### 7.1 チュートリアル型定義

```typescript
const TutorialStep = {
  MOVE: 'move',
  ATTACK: 'attack',
  MAP: 'map',
  TRAP: 'trap',
  COMPLETE: 'complete',
} as const;

type TutorialStepValue = (typeof TutorialStep)[keyof typeof TutorialStep];

interface TutorialState {
  currentStep: TutorialStepValue;
  isActive: boolean;
  isCompleted: boolean;
}
```

### 7.2 チュートリアルステップ

| ステップ | 内容 | 完了条件 |
|---------|------|---------|
| MOVE | 「WASDまたは矢印キーで移動」 | 4回移動 |
| ATTACK | 「スペースキーで攻撃」 | 1回攻撃 |
| MAP | 「Mキーでマップ切替」 | マップ表示切替 |
| TRAP | 「罠は再使用される。盗賊は罠が見える」 | 確認ボタン |
| COMPLETE | チュートリアル完了 | 自動 |

### 7.3 チュートリアル関数

```typescript
// チュートリアル状態初期化
initTutorial(): TutorialState

// チュートリアル完了判定
isTutorialCompleted(): boolean

// チュートリアル完了保存
saveTutorialCompleted(): void

// ステップ進行
advanceTutorialStep(state: TutorialState, action: string): TutorialState

// スキップ
skipTutorial(state: TutorialState): TutorialState
```

---

## 8. フィードバック仕様

### 8.1 フィードバック型定義

```typescript
const FeedbackType = {
  DAMAGE: 'damage',
  TRAP: 'trap',
  LEVEL_UP: 'levelUp',
  ITEM: 'item',
} as const;

type FeedbackTypeValue = (typeof FeedbackType)[keyof typeof FeedbackType];

interface FeedbackEffect {
  type: FeedbackTypeValue;
  startTime: number;
  duration: number;
  data?: Record<string, unknown>;
}
```

### 8.2 フィードバック一覧

| イベント | 視覚効果 | 音声効果 | 時間 |
|---------|---------|---------|------|
| 被弾 | 画面赤フラッシュ | 短いダメージSE | 100ms |
| 罠発動 | 足元エフェクト | 種類別SE | 200ms |
| レベルアップ | 通知ポップ | ファンファーレSE | 500ms |
| アイテム取得 | 小さなポップ | 取得SE | 300ms |

### 8.3 フィードバック関数

```typescript
// フィードバック生成
createFeedback(type: FeedbackTypeValue, data?: Record<string, unknown>): FeedbackEffect

// フィードバック有効判定
isFeedbackActive(effect: FeedbackEffect, currentTime: number): boolean

// 画面フラッシュ描画
drawDamageFlash(ctx: CanvasRenderingContext2D, alpha: number): void

// ポップアップ描画
drawPopup(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void
```

---

## 9. SPECIMEN価値付け仕様

### 9.1 ドロップ仕様

| 項目 | 値 |
|------|-----|
| ドロップ確率 | 30% |
| ドロップアイテム | 回復小（+3 HP） |
| 判定タイミング | 撃破時 |

### 9.2 ドロップ関数

```typescript
// ドロップ判定
shouldDropItem(enemyType: EnemyTypeValue): boolean

// ドロップアイテム生成
createDropItem(x: number, y: number): Item
```

---

## 10. 生成安定化仕様

### 10.1 検証ルール

| 項目 | 条件 |
|------|------|
| スタート周辺 | 半径3タイル以内にボス・チャージ・ダメージ罠なし |
| 再生成上限 | 最大5回 |
| 検証対象 | 敵配置、罠配置 |

### 10.2 検証関数

```typescript
// 生成検証
validateGeneration(
  startPos: Position,
  enemies: Enemy[],
  traps: Trap[]
): boolean

// 安全生成（検証付き）
generateSafeMaze(
  config: MazeConfig,
  maxRetries: number
): GenerationResult
```

---

## 11. リザルト仕様

### 11.1 クリア画面

| 項目 | 内容 |
|------|------|
| タイム | mm:ss.ms 形式 |
| 評価 | S/A/B/C/D |
| レベル | 到達レベル |
| 撃破数 | 敵撃破数 |
| 職業 | 戦士/盗賊 |
| ベスト更新 | 新記録時に表示 |
| エピローグ | 評価別テキスト |

ボタン：
- リトライ
- タイトルへ

### 11.2 ゲームオーバー画面

| 項目 | 内容 |
|------|------|
| タイム | mm:ss.ms 形式 |
| レベル | 到達レベル |
| 撃破数 | 敵撃破数 |
| 職業 | 戦士/盗賊 |
| テキスト | ゲームオーバー用テキスト |

ボタン：
- リトライ
- タイトルへ

---

## 12. 操作仕様（MVP3から継承 + ヘルプ追加）

### 12.1 移動操作

#### PC
- 移動：WASD または 矢印キー
- 連続移動：キー押し続けで自動移動

#### モバイル
- D-padタップで移動
- 連続移動：D-pad押し続けで自動移動

### 12.2 攻撃操作

#### PC
- 攻撃：スペースキー

#### モバイル
- 攻撃：D-pad中央の攻撃ボタンタップ

### 12.3 マップ操作

- PC：`M` キーでマップ表示切替
- モバイル：マップアイコンタップで切替

### 12.4 ヘルプ操作（新規）

- PC：`H` キーでヘルプ表示切替
- モバイル：ヘルプアイコンタップで切替

---

## 13. UI仕様（拡張）

### 13.1 タイマー表示

| 項目 | 値 |
|------|-----|
| 位置 | 画面右上 |
| 形式 | mm:ss.ms |
| サイズ | 16px |
| 色 | 白（#ffffff） |

### 13.2 リザルト画面

| 項目 | 値 |
|------|-----|
| タイミング | クリア/ゲームオーバー時 |
| 内容 | タイム、評価、Lv、撃破数、職業 |
| ベスト表示 | 新記録時に「NEW RECORD!」 |

### 13.3 チュートリアルUI

| 項目 | 値 |
|------|-----|
| 位置 | 画面中央下 |
| 背景 | 半透明黒（rgba(0,0,0,0.7)） |
| 文字色 | 白 |
| スキップ | 「スキップ」ボタン |

### 13.4 ヘルプUI

| 項目 | 値 |
|------|-----|
| タイプ | オーバーレイ |
| 内容 | 操作説明、Entity Guide要約 |
| 閉じる | 「×」ボタン または Hキー |

---

## 14. ビジュアル仕様（拡張）

### 14.1 フィードバックエフェクト

| エフェクト | 色/形状 |
|-----------|--------|
| 被弾フラッシュ | 赤オーバーレイ（rgba(255,0,0,0.3)） |
| 罠発動 | 罠色の円形波紋 |
| レベルアップ | 金色のポップアップ |
| アイテム取得 | 白色の小さなポップ |

### 14.2 評価表示色

| 評価 | 色 | 説明 |
|------|-----|------|
| S | 金色（#fbbf24） | 最高評価 |
| A | 銀色（#94a3b8） | 優秀 |
| B | 銅色（#b45309） | 堅実 |
| C | 青色（#3b82f6） | 辛勝 |
| D | 灰色（#6b7280） | 瀕死 |

---

## 15. 技術/アーキテクチャ要件

### 15.1 ファイル構成（新規・変更）

```
src/
├── pages/
│   └── IpnePage.tsx           # タイマー/リザルト/チュートリアル/ヘルプUI追加
├── features/
│   └── ipne/
│       ├── index.ts           # エクスポート更新
│       ├── types.ts           # 新規型追加
│       ├── timer.ts           # 新規：タイマーシステム
│       ├── record.ts          # 新規：記録管理
│       ├── tutorial.ts        # 新規：チュートリアル
│       ├── feedback.ts        # 新規：フィードバック
│       ├── ending.ts          # 新規：エンディング分岐
│       ├── enemy.ts           # 変更：SPECIMENドロップ追加
│       ├── mazeGenerator.ts   # 変更：生成検証追加
│       └── __tests__/
│           ├── timer.test.ts
│           ├── record.test.ts
│           ├── tutorial.test.ts
│           ├── ending.test.ts
│           └── mazeValidation.test.ts
```

### 15.2 コーディング規約

- `any` 不使用
- `null` 不使用
- `as const` と Union 型で定数管理
- 純粋ロジックは `src/features/ipne/` に分離（TDD対象）
- コメント・docstringは日本語

---

## 16. ゲームフロー

### 16.1 状態遷移

```
TITLE → CLASS_SELECT → PROLOGUE → (TUTORIAL) → GAME → CLEAR
                                                 ↓
                                           (LEVEL_UP) ← 一時停止オーバーレイ
                                                 ↓
                                            GAME_OVER → GAME (リトライ)
                                                 ↓
                                               TITLE
```

### 16.2 ゲームオーバー条件

- HP <= 0

### 16.3 クリア条件

- ゴールタイル到達

---

## 17. テスト要件（TDD）

### 17.1 タイマーシステムテスト

- タイマーが正しく開始される
- タイマーが正しく停止される
- 一時停止/再開が正しく動作する
- 経過時間が正しく計算される
- フォーマットが正しい

### 17.2 記録システムテスト

- 記録が正しく保存される
- 記録が正しく読み込まれる
- ベスト判定が正しい
- localStorage エラー時に例外が発生しない

### 17.3 エンディングテスト

- 各タイムで正しい評価が返る
- 境界値での評価が正しい
- エピローグテキストが正しく取得される

### 17.4 チュートリアルテスト

- 初期状態が正しい
- ステップが正しく進行する
- 完了フラグが正しく保存される
- スキップが正しく動作する

### 17.5 生成検証テスト

- スタート周辺の敵配置が検証される
- スタート周辺の罠配置が検証される
- 違反時に再生成される
- 再生成上限で停止する

---

## 18. 受け入れ基準

- [ ] クリアタイムが計測・表示される
- [ ] ベスト記録が保存される
- [ ] クリアタイムで評価（S/A/B/C/D）が決まる
- [ ] エピローグが評価で分岐する
- [ ] チュートリアルが初回のみ表示される
- [ ] チュートリアルをスキップできる
- [ ] 被弾時にフィードバックがある
- [ ] 罠発動時にフィードバックがある
- [ ] SPECIMENを倒すとドロップがある
- [ ] スタート周辺に危険な配置がない
- [ ] ヘルプで操作説明が見られる
- [ ] プレイ時間が5〜10分に収まる
- [ ] テストが追加され `npm test` が通る

---

## 19. 実装しない要素（明確化）

MVP4では以下は **実装しない**。

- 装備/クラフト/スキルツリー
- 新職業
- 新敵タイプ追加
- マルチプレイ
- セーブ&ロード（ラン単位の継続）
- 本格的な物語分岐
- 高コストなアート大量投入
- 実績システム
- リーダーボード

---

## 20. 評価観点（MVP4完了後）

以下を必ず確認する。

- 初見でルールが理解できたか
- リトライ動機が生まれたか
- 極端な事故が減ったか
- 演出が気持ちよさに寄与したか
- クラッシュ/ハマりがなかったか

### NG例

- チュートリアルが邪魔 → 簡潔化/スキップ強調
- タイムを気にしない → 評価表示の強調
- 初手理不尽が残る → 検証条件の追加
- フィードバックがうるさい → 控えめに調整
- ヘルプが分かりにくい → 文言改善
