# Racing Game ファミコン風キャンペーン — 実装仕様

> 本書は `plan.md` を前提とする実装仕様書。データ構造・状態遷移・UI 仕様・既存ドメインへの差分を詳述する。
> Phase 1 を主、Phase 2/3 の仕様は末尾に追記する。

---

## 1. 全体像

### 1.1 フェーズ遷移図

既存フェーズに **キャンペーン専用フェーズ** を追加する。フェーズ Sum 型はキャンペーンと既存モードで共有する。

#### Phase 1 のフロー（`stage_intro` 無し）

```
[menu]
   │
   ├── (mode=solo|2p|cpu) ─────────────────────────────► (既存フロー)
   │
   └── (mode=campaign) ─► [stage_select]  ◄───────────────┐
                              │                            │
                              ▼ (lives=3 にリセット)       │
                          [countdown]                      │
                              │                            │
                              ▼                            │
                          [race] ◄── CP 通過で時間延長     │
                              │                            │
                ┌─────────────┼──────────────┐             │
                ▼             ▼              ▼             │
          ゴールイン     時間切れ        (進行中)          │
                │             │                            │
                ▼             ▼                            │
          [stage_clear]   lives--                         │
                │       ┌─────┴────┐                      │
                │     残>0       残=0                     │
                │       │          │                      │
                │       ▼          ▼                      │
                │    [retry]?  [game_over]                │
                │       │          │                      │
                │       └──────────┘──────────────────────┤
                ▼                                          │
         次ステージ有?                                     │
              │                                            │
       Yes ───┤ No                                         │
              │  └──► [ending] ───────────────────────────┤
              ▼                                            │
        次ステージへ (countdown)                           │
              │                                            │
              └────────────────────────────────────────────┘
```

#### Phase 2 のフロー（`stage_intro` 挿入）

Phase 1 のフローのうち、`stage_select → countdown` の間に `stage_intro` を挟む。
ステージ番号 + タイトル + intro テキストを 4 秒間表示し、任意キーでスキップ可能。

```
... [stage_select] → [stage_intro] → [countdown] → [race] → ...
```

その他の遷移は Phase 1 と同一。

### 1.2 既存 `GamePhase` への追加

```ts
// 既存（推測）: 'menu' | 'countdown' | 'race' | 'draft' | 'result'
type GamePhase =
  | 'menu'
  | 'stage_select'   // 追加: キャンペーンのステージ選択
  | 'stage_intro'    // 追加（Phase 2）: ステージ開始時のナラティブ
  | 'countdown'
  | 'race'
  | 'draft'          // キャンペーンでは到達しない（cardsEnabled=false）
  | 'stage_clear'    // 追加: ステージクリア表示
  | 'game_over'      // 追加: 残機 0 で全リセット
  | 'ending'         // 追加: 全 8 ステージクリア演出
  | 'result';        // 既存（フリー対戦・2P・CPU 用）
```

---

## 2. データモデル

### 2.1 ステージ定義

```ts
// src/features/racing-game/domain/race/stage.ts

export type StageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type StageDifficultyHint = 'easy' | 'normal' | 'hard' | 'extreme';

export type Branch = {
  /** プレイヤーに見せる選択肢のラベル（例: "海岸線ルート"） */
  readonly label: string;
  /** 採用する既存コース ID */
  readonly courseId: CourseId;
};

export type Stage = {
  readonly id: StageId;
  /** ステージタイトル（英大文字想定。8bit タイポで表示） */
  readonly title: string;
  /** ステージ番号表記（"STAGE 1" 等） */
  readonly numberLabel: string;
  /** Phase 2 で intro テキストに使う 1〜2 行のナラティブ */
  readonly intro: string;
  /** 既存の CourseId。分岐ステージでは未定義（branch を見る） */
  readonly courseId?: CourseId;
  /** 分岐ステージのみ */
  readonly branch?: { readonly a: Branch; readonly b: Branch };
  /** 難易度ヒント（UI と時間係数で使用） */
  readonly difficulty: StageDifficultyHint;
  /** ステージ開始時の残り時間（秒） */
  readonly initialTimeSec: number;
  /** チェックポイント 1 個通過で増える時間（秒） */
  readonly checkpointBonusSec: number;
  /** GOLD ランク到達タイム（秒）。ゴールタイム ≤ goldRankTimeSec */
  readonly goldRankTimeSec: number;
  /** SILVER ランク到達タイム（秒）。 silverRankTimeSec 未満なら SILVER */
  readonly silverRankTimeSec: number;
  /** クリア必須のラップ数。本キャンペーンは原則 1 ラップでステージクリア */
  readonly lapsToClear: number;
};
```

### 2.2 ステージカタログ（初期案）

| # | タイトル | コース | 分岐 | 初期時間 | CP 延長 | GOLD/SILVER | 難易度 |
|---|---------|-------|-----|--------|--------|------------|-------|
| 1 | FOREST CALLING | Forest (16pt) | — | 80s | +12s | 50/65 | easy |
| 2 | BEACHSIDE RALLY | Beach (16pt) | — | 72s | +11s | 48/62 | easy |
| 3 | NEON STREET | City (16pt) | A: 大通り / B: 路地裏ショート | 66s | +10s | 44/58 | normal |
| 4 | MOUNTAIN PASS | Mountain (20pt) | — | 70s | +10s | 56/68 | normal |
| 5 | WHITE OUT | Snow (18pt) | A: 凍結ロング / B: 雪原ショート | 60s | +9s | 50/62 | hard |
| 6 | MIDNIGHT CHASE | Night (20pt) | — | 58s | +8s | 52/64 | hard |
| 7 | GRAND PRIX FINAL | Forest 高難度版 (16pt) | — | 50s | +7s | 38/50 | extreme |
| 8 | OVERDRIVE | Mountain 高難度版 (20pt) | A: 標準 / B: ショート & 障害物多 | 46s | +6s | 50/60 | extreme |

> **設計意図（カーブ調整、#15・#16 対応）**:
> - 初期時間は単調減少にせず、**コース距離（コース長 = ポイント数）に応じて変動**させる（#18 対応）。Stage 4・5・6・8 は 18-20pt の長距離コースなので時間を多めに付与
> - チェックポイント延長は **ステージが進むほど減少**（+12 → +6）させ、終盤ほど 1 ミスが致命的になる
> - Stage 7・8 で延長時間を **+7 / +6** に分け、最終ステージを最難関に（旧仕様では 7・8 が同じ +8 で同難度になっていた）
>
> **「高難度バリアント」の実装方針**: 新規コースは作らず、既存コースに対して `wallDensity` / `decorationDensity` / `cpuDifficulty` 等を上げる「ステージ修飾子」を `stage.ts` 内で定義する。
>
> **Phase 0 で確定すべき係数**: tasks.md Phase 0 で各既存コースの実距離を計測し、`initialTimeSec = baseTimePerPoint[difficulty] × coursePoints` の式で再算出する。本表の値は **その計測前の暫定値** であり、Phase 0 完了後に上書きする。

### 2.3 キャンペーン進捗（永続化対象）

```ts
// src/features/racing-game/domain/race/campaign-progress.ts

export type StageRank = 'GOLD' | 'SILVER' | 'BRONZE' | 'NONE';

export type StageRecord = {
  /** ベストタイム（秒）。未クリアは undefined */
  readonly bestTimeSec?: number;
  /** ベストランク。未クリアは 'NONE' */
  readonly rank: StageRank;
  /**
   * 分岐ステージの場合に選択された側。Phase 1〜2 では分岐ステージは a を既定とし
   * 必ず 'a' を記録する。Phase 3 で B を選んだ場合に 'b' を保存する。
   * 既存セーブで undefined が混在した場合、読み込み時に 'a' とみなしてマイグレーションする
   * （§5.4 参照）
   */
  readonly chosenBranch?: 'a' | 'b';
};

export type CampaignProgress = {
  /** ステージ ID → 記録 */
  readonly records: Record<StageId, StageRecord>;
  /** 解放されている最大ステージ ID */
  readonly highestUnlocked: StageId;
};

/**
 * 「キャンペーン全クリア」は派生プロパティとして関数で求める（Single Source of Truth）。
 * `completed` を別フィールドとして持たせると更新漏れによる不整合を生むため避ける。
 */
export const isCampaignCompleted = (p: CampaignProgress): boolean =>
  p.highestUnlocked === 8 && p.records[8]?.rank !== 'NONE';
```

### 2.4 ランタイム状態（**非永続**）

```ts
// src/features/racing-game/application/campaign-runtime.ts

export type CampaignRuntime = {
  readonly stage: Stage;
  /** 残り時間（秒、float 可） */
  readonly timeRemainingSec: number;
  /** 通過済みチェックポイントの累計 */
  readonly checkpointsHit: number;
  /** ステージ開始からの経過時間 */
  readonly elapsedSec: number;
  /** 残機（セッション内のみ保持。永続化しない） */
  readonly livesRemaining: number;
};
```

#### 残機（lives）の意味論

ファミコン時代のクリア型ゲーム感を出すため、残機は以下のルールで扱う。

| ルール | 内容 |
|--------|------|
| 機数 | キャンペーン突入時に 3 機 |
| 範囲 | **キャンペーン 1 回（STAGE SELECT 入場〜エンディング or GAME OVER）** で共有 |
| 永続化 | **しない**（`StoredProgress` には含めない） |
| リセットタイミング | 以下のいずれかで 3 にリセット<br>① メニューから "CAMPAIGN" を選んで STAGE SELECT に入った瞬間<br>② GAME OVER 後に STAGE SELECT へ戻った瞬間<br>③ ENDING を見て STAGE SELECT へ戻った瞬間 |
| 減算タイミング | ステージで時間切れ → 1 機減らす → 残機 > 0 なら同ステージリトライ確認、残機 0 なら GAME OVER フェーズへ |

> **設計理由**: 永続化しないことで、ブラウザを閉じたあとに再開したプレイヤーが「前回の残機 0 で詰んでいる」状態を回避できる。一方でセッション内では緊張感を保つ。

---

## 3. 進行ロジック（純粋関数）

### 3.1 残り時間の更新

```ts
// src/features/racing-game/domain/race/time-limit.ts

export const tickTime = (
  timeRemainingSec: number,
  dt: number
): number => Math.max(0, timeRemainingSec - dt);

export const isTimeUp = (timeRemainingSec: number): boolean =>
  timeRemainingSec <= 0;
```

### 3.2 チェックポイントボーナス

```ts
// src/features/racing-game/domain/race/checkpoint-bonus.ts

export const applyCheckpointBonus = (
  timeRemainingSec: number,
  bonusSec: number
): number => timeRemainingSec + bonusSec;
```

### 3.3 ランク判定

```ts
// src/features/racing-game/domain/race/rank.ts

export const judgeRank = (
  goalTimeSec: number,
  stage: Stage
): StageRank => {
  if (goalTimeSec <= stage.goldRankTimeSec) return 'GOLD';
  if (goalTimeSec <= stage.silverRankTimeSec) return 'SILVER';
  return 'BRONZE';
};
```

### 3.4 ステージ進行

```ts
// src/features/racing-game/domain/race/stage-progress.ts

export type StageOutcome =
  | { readonly kind: 'cleared'; readonly goalTimeSec: number; readonly rank: StageRank }
  | { readonly kind: 'time_up' }
  | { readonly kind: 'in_progress' };

export const evaluateStage = (
  runtime: CampaignRuntime,
  hasCrossedFinishLine: boolean
): StageOutcome => {
  if (hasCrossedFinishLine) {
    const rank = judgeRank(runtime.elapsedSec, runtime.stage);
    return { kind: 'cleared', goalTimeSec: runtime.elapsedSec, rank };
  }
  if (isTimeUp(runtime.timeRemainingSec)) {
    return { kind: 'time_up' };
  }
  return { kind: 'in_progress' };
};
```

### 3.5 残機とゲームオーバー

```ts
// 既存ドメイン未追加なので新規
export const decrementLives = (n: number): number => Math.max(0, n - 1);
export const isGameOver = (n: number): boolean => n <= 0;
```

> **Rad Racer 模倣**: 制限時間が尽きても、車両が即停止せず **約 5 秒間惰性で進む** 余地を Phase 2 で与えてもよい（時間切れ後に「IN GRACE」フラグ立てて速度を線形減衰、ゴール到達で救済）。Phase 1 では実装しない。

---

## 4. 既存ドメインへの差分

### 4.1 race-handler.ts への分岐追加（最小）

擬似コード:

```ts
// race-handler.ts
const updateRace = (state, input, dt) => {
  // 既存の更新ロジック
  state = updatePhysics(state, input, dt);
  state = checkCollisions(state);
  const checkpointHit = checkCheckpoint(state);

  // ★ キャンペーンモードのみ追加
  if (state.mode === 'campaign') {
    state = tickCampaignTime(state, dt);  // 残り時間を減らす
    if (checkpointHit) {
      state = grantCheckpointBonus(state);  // 時間延長
    }
    const outcome = evaluateStage(state.campaign, hasCrossedFinishLine);
    if (outcome.kind === 'cleared') return transitionToStageClear(state, outcome);
    if (outcome.kind === 'time_up') return transitionToGameOver(state);
  }

  // 既存の draftQueue 等の処理は cardsEnabled=false の場合スキップされるため
  // キャンペーンでは追加変更なし（既に分岐済み）
  return state;
};
```

### 4.2 RaceConfig 拡張

```ts
// 既存: { cardsEnabled, maxLaps, ... }
type RaceConfig = {
  readonly cardsEnabled: boolean;
  readonly maxLaps: number;
  // ★ 追加
  readonly mode: 'free' | 'campaign';
  readonly campaignStage?: Stage;
};
```

キャンペーン突入時の生成例（**`stage.lapsToClear` を `RaceConfig.maxLaps` にマッピングする** — #4 対応）:

```ts
const config: RaceConfig = {
  cardsEnabled: false,
  maxLaps: stage.lapsToClear,  // 例: 全ステージ 1 周（lapsToClear: 1）
  mode: 'campaign',
  campaignStage: stage,
};
```

> 本キャンペーンは原則 **全ステージ 1 周でクリア** とする。`Stage.lapsToClear` を残す理由は、将来 Phase 3 以降で「ファイナルだけ 2 周」を導入する余地を残すため。Phase 1〜2 ではすべて `1` で実装する。

### 4.3 既存 use-cases の不変条件

- `complete-puzzle.ts` 等とは違うが、Racing の既存ハンドラ（`race-handler.ts` / `draft-handler.ts`）の **既存テストは全件無変更で通る** ことを必須条件とする

---

## 5. 永続化（localStorage）

### 5.1 保存キー

```
racing-campaign-progress-v1
```

### 5.2 保存スキーマ

```ts
type StoredProgress = {
  version: 1;
  records: Record<StageId, StageRecord>;
  highestUnlocked: StageId;
  completed: boolean;
};
```

### 5.3 既存 score-repository との関係（#20 対応）

責務を明確に分離する:

| リポジトリ | 役割 | 対象 |
|-----------|------|------|
| `score-repository`（既存） | フリー対戦・2P・CPU 戦のハイスコアと記録 | 無変更 |
| `campaign-progress-repository`（新規） | キャンペーンの進捗・ベストタイム・ランク | 新規 |

**規約**: キャンペーンのベストタイムは `campaign-progress-repository` が **単独で管理** し、`score-repository` には書き込まない。両方に書き込む実装は禁止。

### 5.4 保存タイミング（#21 対応）

| イベント | 保存有無 | 理由 |
|---------|---------|------|
| ステージクリア（ベスト更新時） | **保存** | ベストタイム / ランク / `chosenBranch` を確定 |
| ステージクリア（ベスト未更新時） | 保存（記録上書き） | ステージのアンロック更新（`highestUnlocked`）のため |
| GAME OVER | **保存しない** | セッション中の中間データ（チェックポイント通過時刻等）は破棄。プレイヤーが「失敗の悔いを残さず再挑戦できる」体験を優先 |
| RESET PROGRESS 確定時 | 保存（消去） | localStorage キーを削除 |

### 5.5 マイグレーション（#5 対応）

- `version: 1` のみ
- 既存セーブで分岐ステージの `chosenBranch` が `undefined` の場合、読み込み時に `'a'`（既定値）として扱う
- 将来 `version: 2` を導入する場合は v1 を読み込んで変換するアダプタを `infrastructure/storage/` に置く

---

## 6. UI / 画面設計

### 6.1 メニュー画面

既存メニュー画面に **「CAMPAIGN」** ボタンを追加する。配置はメニュー先頭。

```
┌─────────────────────┐
│   RACING GAME       │
│                     │
│   ▶ CAMPAIGN        │  ← 新規（先頭、強調）
│     SOLO            │
│     2P MATCH        │
│     VS CPU          │
│     OPTIONS         │
└─────────────────────┘
```

### 6.2 ステージセレクト画面

**この画面に到達した瞬間に lives を 3 にリセットする**（§2.4 残機の意味論）。

#### 6.2.1 画面構成（M1 対応 — 1 画面 1 目的の徹底）

主目的は **「ステージを選ぶ」** のみ。それ以外の機能は視覚階層を下げる。

```
┌────────────────────────────────────────────┐
│  STAGE SELECT                  ⚙ OPTIONS  │ ← 歯車は最小サイズ・右上隅
│                                            │
│   [ 01 ]  [ 02 ]  [ 03 ]  [ 04 ]           │
│   ★★★    ★★·    ★★★    ★··             │
│   FOREST  BEACH  CITY    MOUNT             │ ← タイトル下にベストタイムも表示
│   01:23   01:45  01:38   02:01             │
│                                            │
│   [ 05 ]  [ 06 ]  [ 07 ]  [ 08 ]           │
│   ···    🔒      🔒       🔒               │
│   SNOW   ?????   ?????    ?????            │
│                                            │
│              [ BACK TO MENU ]              │ ← メイン領域に唯一のナビゲーション
└────────────────────────────────────────────┘
```

#### 6.2.2 ステージカードの表示要素（M3 + S4 対応）

各セルの構成:

| 領域 | 内容 |
|------|------|
| 1 行目 | `[ NN ]` のステージ番号（英ピクセルフォント、`--text-primary`） |
| 2 行目 | **ランクアイコン**（後述、★ 3 段階表現で BRONZE 視認性問題を解消） |
| 3 行目 | ステージタイトル（短縮 6〜8 字、英大文字） |
| 4 行目 | ベストタイム（`MM:SS` 等幅、未クリアは `--:--`） |
| 5 行目（任意・S4） | `LAST: M/D` の最後にプレイした日付（記録があれば。最も薄い半透明） |

#### 6.2.3 ランク表記（M3 対応）

中点 `·` ではなく **ドット 3 個セット** で BRONZE と未クリアを明確に区別する:

| 状態 | 表示 | 色 |
|------|------|-----|
| GOLD | `★★★` | `--accent-gold` |
| SILVER | `★★·` | `--accent-silver` |
| BRONZE | `★··` | `--accent-bronze` |
| 未クリア | `···` | `--text-secondary`（半透明） |
| ロック中 | `🔒` 1 個 | グレースケール |

> 形（埋まっている星の数）と色の **両方** で識別できるため、色覚多様性にも対応する。

#### 6.2.4 ロック中ステージのクリック挙動

1. 短い `DENIED` SE を 1 回再生（仕様は §7.2 SE トーン体系を参照）
2. 画面下部に `STAGE LOCKED — CLEAR STAGE N FIRST` を 1.5 秒表示してフェードアウト
3. 画面遷移しない

#### 6.2.5 キーボード操作（R5 対応）

| キー | 動作 |
|------|------|
| `←` `↑` `→` `↓` | グリッドのフォーカス移動。エッジで停止（ループしない） |
| `Enter` / `Space` | フォーカスしているステージを選択（ロック中なら DENIED） |
| `Esc` | BACK TO MENU 相当 |
| `Tab` | グリッド → BACK TO MENU → OPTIONS の順にフォーカス |

フォーカス枠:
- `--focus-ring` カラーの **2px 二重枠**
- `:focus-visible` のみ表示（マウスクリック直後は出さない）
- ステージカードでは枠の内側に 4px インセットで表示し、レイアウトシフトを防ぐ

#### 6.2.6 OPTIONS / ENDING への導線（M2 + R7 対応）

- 右上隅の歯車アイコン `⚙ OPTIONS`（最小タッチ領域 44×44px）から、**進捗リセット** と **エンディング再視聴** の 2 機能にアクセスする
- OPTIONS 画面（モーダル）の構成:
  - `[ ▶ REPLAY ENDING ]` — `isCampaignCompleted(progress)` が true のとき有効、それ以外グレーアウト
  - `[ ⚠ RESET PROGRESS ]` — `--accent-danger` の警告色枠付きボタン
  - `[ CLOSE ]`
- **R7 のレイアウトシフト対策**: REPLAY ENDING ボタンは常に領域確保し、未達成時は disabled スタイルでグレー表示する（要素自体を消さない）
- **M2 の二重確認**: RESET PROGRESS タップで「`DELETE ALL RECORDS? Y / N`」のモーダル。`Y` 確定で消去、`N` でキャンセル

```
┌──── OPTIONS ────────────────────┐
│                                 │
│  [ ▶ REPLAY ENDING ]            │ ← completed=true のときのみ有効
│  [ ⚠ RESET PROGRESS ]           │ ← 警告色枠
│                                 │
│            [ CLOSE ]            │
└─────────────────────────────────┘
```

#### 6.2.7 レスポンシブ（R6 対応）

- 横画面 (`≥ 768px`): 4×2 グリッド
- 縦画面 (`< 768px`): **2×4 グリッド**（縦に長くスクロール、各カードを大きく取る）
- すべてのカード・ボタンは最小 44×44 CSS px
- 画面回転時にフォーカスしていたステージ ID を保持して再レイアウト

#### 6.2.8 全クリア後の挙動

`isCampaignCompleted(progress) === true` のとき:
- 画面上部に `ALL CLEAR!` リボン（`--accent-gold` ボーダーのみ。背景大面積は使わない、§6.8.4 排他ルール）
- ENDING はいつでも `OPTIONS → REPLAY ENDING` から再視聴可能

### 6.3 ステージ実走 HUD

最重要要素は TIME。視覚階層を **2.5 倍以上** 開けて優先順位を明確にする（R8 対応）。

```
              ┌────────────┐
              │  TIME 0:42 │ ← 48px / `--text-primary` / 残 10 秒以下で `--accent-danger` に変色 + 点滅
              └────────────┘
                                              LIVES ●●●  ← 16px / 右上
 SPEED 180         STAGE 3/8                            ← 18px / `--text-secondary`（70% 不透明）
```

#### 6.3.1 表示要素と階層（R1 + R4 + R8 対応）

| 要素 | 配置 | フォントサイズ | 色 | 表示条件 |
|------|------|--------------|-----|---------|
| TIME | 中央上 | 48px | `--text-primary` / 残 10s 以下で `--accent-danger` | 常時 |
| STAGE 3/8 | 左下 | 18px | `--text-secondary` | 常時 |
| SPEED 180 | 左下（STAGE の上） | 18px | `--text-secondary` | 常時 |
| LIVES ●●● | 右上（OPTIONS と被らない位置） | 16px | 通常 `--text-primary` / 残 1 で `--accent-danger` 点滅 | キャンペーンモード時のみ |
| LAP N/M | 中央下（小） | 14px | `--text-secondary` | **`stage.lapsToClear > 1` のときのみ表示**（R1 対応。常時 1 周のステージでは非表示） |

#### 6.3.2 LIVES のドット表記（R4 対応）

- 残機 3: `●●●`（`--text-primary`）
- 残機 2: `●●·`
- 残機 1: `●··` を `--accent-danger` で点滅（reduced-motion 時は色のみ赤、点滅無し）
- 残機 0: 表示せず GAME OVER フェーズへ

#### 6.3.3 HUD と Canvas の干渉防止

- HUD はすべて Canvas の **上にオーバーレイ** する DOM 要素として実装
- HUD のクリックはレースコントロールに伝播しない（`pointer-events: none` を要素ごとに調整）
- セーフゾーン: TIME カウンタの直下（中央上 12% の高さ）にはレース描画も避けるよう Canvas 側でオフセット

### 6.4 チェックポイント通過時（R3 対応 — 共通運命の法則）

トーストを **TIME カウンタの直下** に出現させ、上方向（TIME に向かって）にフロートしながらフェードアウトさせる。同時に TIME カウンタは数値がカウントアップ。「ボーナスが TIME に吸い込まれる」ことを共通運命で表現する。

```
              ┌────────────┐
              │  TIME 0:54 │ ← +12 されて 0:42 → 0:54 にカウントアップ（0.5s）
              └────────────┘
                  +12 SECONDS  ← 開始位置はカウンタ直下、24px 上方へフロート
                                    1.0s で完全消去
```

仕様:

| 項目 | 値 |
|------|-----|
| トースト初期位置 | TIME カウンタの真下、4px 下 |
| アニメ | translateY(0 → -24px) + opacity(1 → 0)、1.0s ease-out |
| TIME 数値カウントアップ | 0.5s で旧値 → 新値（reduced-motion 時は即時置換） |
| 色 | `--accent-gold`（達成系） |
| フォント | `--font-en-pixel` 24px |
| reduced-motion | フロート無し、0.5s で表示 → 即消去（§6.9） |

### 6.5 ステージクリア画面

```
┌──────────────────────────┐
│      STAGE CLEAR!        │
│                          │
│   TIME    1:23:45        │
│   RANK    ★ GOLD ★        │
│                          │
│   [CONTINUE]             │
└──────────────────────────┘
```

### 6.6 ゲームオーバー画面

残機 0 で時間切れとなった場合に表示される。**STAGE SELECT に戻った瞬間に lives は 3 にリセット**される（§2.4）。

```
┌──────────────────────────┐
│       GAME OVER          │
│                          │
│   STAGE 5 / 8            │
│                          │
│   [STAGE SELECT]         │
└──────────────────────────┘
```

> **注**: GAME OVER 画面では `RETRY STAGE` を出さず、必ず STAGE SELECT に戻る。理由: lives リセット規則を 1 ヶ所（STAGE SELECT 入場時）に統一するため。リトライしたければプレイヤーは STAGE SELECT から同じステージを選び直せばよい。

### 6.7 エンディング画面（Phase 2 で本実装、Phase 1 は簡易版）

簡易版（Phase 1）: "CONGRATULATIONS!" + "YOU CLEARED ALL 8 STAGES" + STAGE SELECT へ戻るボタン

本実装（Phase 2）:
- 黒背景 → ドライバーの独白テキスト 3 画面分（構成は §6.7.2 のテンプレに従う）
- "THANK YOU FOR PLAYING" 大型タイポ
- 各ステージのタイトル + プレイヤーの記録（タイム + ランク）一覧表示
- ランク集計表示（GOLD ×N / SILVER ×N / BRONZE ×N）— #13 対応
- クレジットロール（仕様は §6.7.4）
- **隠しメニュー: SOUND TEST**（§6.7.5 / S6 対応）

#### 6.7.4 クレジットロール仕様（R9 対応）

| 項目 | 通常 | reduced-motion |
|------|------|----------------|
| 所要時間 | 30〜45 秒 | ページング（スペースで進める） |
| スキップ | いつでも `Esc` / タップで「SKIP?」確認 → スキップ可 | ページめくりで実質スキップ可能 |
| 早送り | 既視のプレイヤー（completed=true で 2 回目以降）は **デフォルト 4 倍速**。`Shift` 押下で通常速 | 影響なし |
| BGM | 連動。クレジット終了で次フェーズ（STAGE SELECT に戻る） | 影響なし |
| 終了動作 | STAGE SELECT に戻る | 同左 |

#### 6.7.5 SOUND TEST（S6 対応 / 隠し機能）

ファミコン王道の隠しメニュー。エンディング初回視聴後にアンロックする。

- アンロック条件: `isCampaignCompleted(progress) === true`
- 入口: ENDING 画面のクレジット最終フレームに小さな `▶ SOUND TEST` を 3 秒だけ表示。クリックで遷移
- 機能: BGM 全曲 + 効果音をプレイヤーが任意に再生できる Famicom 風 UI
- 実装: 既存 audio-engine の薄いラッパとして提供。新規ドメイン追加なし
- 終了: `BACK` ボタンで STAGE SELECT に戻る

#### 6.7.1 ドライバー（主人公）キャラクターシート（#10 対応）

| 項目 | 設定 |
|------|------|
| 名前 | 設定しない（プレイヤー自身を投影できる空白） |
| 性別 | 中性的（テキストで断定しない） |
| 年齢 | 中性的（特定しない） |
| 一人称 | **「俺」** |
| 二人称 | 「お前」「あんた」（場面で使い分け） |
| 文体 | **常体（だ・である）**。タメ口、感嘆符は控えめ |
| 性格 | 寡黙・冷静・自己評価が辛口。レースに対しては勝ち負けより「走り切ること」を優先 |
| 動機 | 「なぜ走るのか」を **明示しない**。プレイヤーに想像の余地を残す |
| 縦糸シンボル | **「夜明け」** — 各ステージ intro に最低 1 度、夜明け／光／東の空 を想起させる単語を含める。エンディングで回収する |
| してはいけない | 自虐的になる / 観客や審判に語りかける / 競争相手を貶す / プレイヤーキャラ自身を「俺たち」と複数形にする |

> **記述のブレ防止**: ナラティブ執筆時は本シートを必ず参照する。複数の AI / 人間ライターで分担する場合も、シートを唯一の真実とする。

#### 6.7.2 エンディング独白の構成テンプレ（#14 対応）

3 画面構成。各画面 60 字以内（全角）。

| 画面 | 役割 | 内容ガイド |
|------|------|-----------|
| 1 | 旅の振り返り | "8 ステージを走り抜けたこと" を、固有名詞ではなく感覚で描く（風 / 光 / アスファルト 等） |
| 2 | 今の感情 | 達成感ではなく **「夜明けがまだ来ない」「もう一度スタートラインに立ちたい」** に寄せる。ドライバーの動機の核心に触れない |
| 3 | プレイヤーへの一言 | "ここまで走ってくれて、ありがとう" を直接的でなく寡黙に。最後の一文で **「夜明け」** を回収する |

> 例（参考、最終版ではない）:
> - 1: 「風の温度が、最初のステージとは違っていた。」
> - 2: 「夜明けは、まだ来ない。」
> - 3: 「だが、お前と走ったこの道は、確かに東を向いていた。」

#### 6.7.3 ステージ間ナラティブ（intro）の指針

- 各ステージ `Stage.intro` は **1〜2 行 / 1 行 = 全角 28 文字、最大 56 文字**（#17 対応）
- ドライバーシート（§6.7.1）の文体に従う
- 各 intro に **最低 1 度、縦糸シンボル「夜明け」関連語**（夜明け / 朝 / 東 / 光 / 影 / 闇）を含める（#11 伏線対応）
- ステージごとの舞台描写を主にし、内省は短く

例:
- Stage 1 FOREST: 「霧の向こうで、東の空がうっすらと白んでいる。」
- Stage 8 OVERDRIVE: 「夜明けまで、あとひと走りだ。」

### 6.8 タイポと配色

#### 6.8.1 タイポ基本方針

- 主要英文テキストは **大文字**（ファミコン感）
- 数字は等幅。1 桁は ` 0` のようにスペース埋め

#### 6.8.2 フォントスタック（M6 対応）

3 系統を CSS 変数として固定する:

```css
/* 英タイトル・HUD のステータスラベル */
--font-en-pixel: 'Press Start 2P', 'Silkscreen', 'Courier New', monospace;

/* 日本語ナラティブ（intro / 独白 / システム UI） */
--font-jp-narrative: 'DotGothic16', 'PixelMplus10', 'Noto Sans JP', sans-serif;

/* タイム・スピード等の等幅数字 */
--font-mono-numeric: 'Silkscreen', 'Roboto Mono', 'SF Mono', monospace;
```

注意点:
- 上記英ピクセルフォントは Google Fonts から `font-display: swap` で読み込み、FOIT を回避
- 日本語フォントは初回ロード重量を抑えるため、必要なグリフだけ動的サブセット化（`unicode-range`）
- ライセンス（OFL 等）と容量を Phase 0 で確認

#### 6.8.3 カラートークン（M5 対応）

ベースカラーから HSB で派生（S1 対応）させ、状態バリエーションを統一する:

| 用途 | トークン | HEX 例 | HSB ベース | コントラスト要件 |
|------|---------|-------|-----------|----------------|
| ドミナント (60%) | `--bg-primary` | `#0E1530` | hsl(228, 56%, 12%) | — |
| セカンダリ (30%) | `--bg-panel` | `#1E2856` | hsl(228, 48%, 23%) | — |
| 主文字 | `--text-primary` | `#F5F5F5` | hsl(0, 0%, 96%) | 対 `--bg-primary` ≥ 4.5:1 |
| 副次文字（半透明） | `--text-secondary` | `rgba(245,245,245,0.7)` | — | 対 `--bg-primary` ≥ 4.5:1 |
| 警告 / 危険 | `--accent-danger` | `#E63946` | hsl(355, 78%, 56%) | 対 `--bg-primary` ≥ 4.5:1 |
| 達成 / GOLD | `--accent-gold` | `#FFD166` | hsl(43, 100%, 70%) | 対 `--bg-primary` ≥ 4.5:1 |
| SILVER | `--accent-silver` | `#C8C8C8` | hsl(0, 0%, 78%) | 対 `--bg-primary` ≥ 4.5:1 |
| BRONZE | `--accent-bronze` | `#CD7F32` | hsl(30, 61%, 50%) | 対 `--bg-primary` ≥ 4.5:1 |
| フォーカス枠 | `--focus-ring` | `#7DD3FC` | hsl(199, 95%, 74%) | 視認性 3:1 以上 |

> **HEX 値は初期案**。Phase 0 で Figma または DevTools の Contrast Checker で実測し、4.5:1 を割る組合せがあれば lightness を 5〜10% 単位で調整して上書きする。

##### 状態バリエーションの自動生成（S1 対応）

各アクセントカラーから以下のバリエーションを HSB の lightness/saturation 操作で派生:

```css
--accent-gold-hover:    hsl(43, 100%, 75%);  /* +5% lightness */
--accent-gold-active:   hsl(43, 100%, 65%);  /* -5% lightness */
--accent-gold-disabled: hsl(43, 30%, 50%);   /* -70% saturation */
```

#### 6.8.4 60-30-10 ルールの適用（R10 対応）

- **60% ドミナント** = `--bg-primary`（画面の地）
- **30% セカンダリ** = `--bg-panel`（カード・オーバーレイ）
- **10% アクセント** = 主文字白 + 警告赤 + 達成金 + SILVER + BRONZE の **総量で 10% 以下**

排他使用ルール:
- 警告赤と達成金を **同一画面で大面積で同時に出さない**
- 達成金と SILVER は ENDING のランク集計画面のみ同時表示を許可
- 通常 HUD では「警告赤」優先（タイマー残 10 秒以下）。GOLD は STAGE CLEAR 画面のみ

#### 6.8.5 ライトモード方針（S3 対応）

**本キャンペーンはダークモードのみを提供する**。理由:

- Famicom コンセプトとの一致（当時のテレビ画面の暗さを再現）
- 配色トークンの 60-30-10 設計が暗背景を前提に最適化されている
- ライトモード追加は配色全面再設計が必要

ただし以下は将来検討余地として記録する:
- 高輝度環境（屋外・明るい部屋）でのプレイ視認性
- 視覚過敏で暗背景を好まないユーザーへの配慮

将来 Issue 化する場合は CSS 変数の置換だけで実装できる構造を維持する。

#### 6.8.6 CRT スキャンライン演出（任意・S2 対応）

レトロ感強化のオプション機能。

- 実装: 全画面 fixed の `::after` 擬似要素に repeating-linear-gradient
- 既定: **OFF**
- OPTIONS 画面で ON/OFF 切替
- `prefers-reduced-motion: reduce` のとき自動 OFF（§6.9 参照）
- パフォーマンス影響を最小化するため `will-change` は使わず、ぼかし系フィルタも使わない

#### 6.8.7 タッチターゲットとレスポンシブ（R6 対応）

- すべてのインタラクティブ要素は **最小 44×44 CSS px**（WCAG 2.5.5）
- ステージグリッド:
  - 横画面 (≥768px): 4×2
  - 縦画面 (<768px): **2×4**（縦長で 1 ステージ 1 行に近い表示）
- 画面回転で再レイアウトされる際、フォーカス位置を保持する

### 6.9 モーション仕様（M4 対応）

`prefers-reduced-motion: reduce` への対応を以下のとおり標準化する。

| 演出 | 通常 | reduced-motion |
|------|------|----------------|
| TIME 残 10 秒以下の点滅 | 2Hz（500ms 周期）で透明度 1 → 0.3 → 1 | 1Hz の透明度変化に置換（より穏やか） |
| CHECKPOINT BONUS トースト | 上方向に 24px フロート + 1.0s フェード | フロート無し、0.5s で表示 → 即消去 |
| ステージタイトル拡大表示（intro） | 0.4s ease-out で 0.7→1.0 倍 | スケール無し、即時表示 |
| 結果画面ランクアイコンの登場 | 1s かけて点滅で出現 | 点滅無し、即時表示 |
| エンディングのクレジットロール | 連続スクロール（30〜45 秒） | ページング表示（スペースキーで進める） |
| TIME カウンタの増加アニメ | カウントアップで +N 表示 | 数字置換のみ |
| CRT スキャンライン | OPTIONS で ON 可 | 自動 OFF |
| ステージカードのホバー浮き上がり | 0.2s ease | 即時色変化のみ |

実装ガイドライン:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
  /* 個別の代替挙動は各コンポーネントで明示的に定義 */
}
```

---

## 7. 演出仕様（Phase 2）

### 7.1 ステージタイトル表示（R2 対応）

`stage_intro` フェーズで実装。

#### 7.1.1 表示シーケンス

1. 黒フェードイン（0.3s）
2. ステージ番号 + タイトル + intro 1〜2 行を表示
3. 開始 0.5s 後に画面右下に `▶ PRESS ANY KEY TO SKIP` をフェードイン表示（小さく、`--text-secondary`）
4. 全体時間経過で countdown へ自動進行

#### 7.1.2 表示時間（R2 対応 — リプレイ疲労回避）

| プレイ状態 | 表示時間 |
|-----------|---------|
| 当該ステージ未クリア（初見） | **4.0 秒** |
| 当該ステージ既クリア（リプレイ） | **1.5 秒**（短縮） |
| OPTIONS で「INTRO SKIP: ALWAYS」を ON | **0 秒**（即 countdown） |

#### 7.1.3 スキップ操作

- 任意キー / 任意タップで即 countdown へ進む
- スキップヒント `▶ PRESS ANY KEY TO SKIP` は常時画面右下（フォーカス枠と被らない位置）

#### 7.1.4 reduced-motion 対応

- 拡大アニメーション無し、即時表示
- フェードイン 0.1s に短縮

### 7.2 BGM 仕様

| シーン | 仕様 | 備考 |
|--------|------|------|
| メニュー | チップチューン中速 | 既存 audio-engine.ts に追加 |
| キャンペーンレース中 | ステージごとに 8bit BGM 8 種 | リソースが用意できなければステージ難度別 3 種で開始 |
| ステージクリア | 短いファンファーレ（2 秒） | |
| ゲームオーバー | 短い悲しい SE（1.5 秒） | |
| エンディング | 落ち着いた長尺 BGM | 30 秒以上、クレジットロール（§6.7.4）と尺を合わせる |

#### 7.2.1 SE トーン体系（S5 対応 — Famicom 矩形波 2ch + ノイズ 1ch）

実装時に判断がブレないよう、SE は以下のトーン定義に従う。`audio-engine.ts` の薄い API として宣言する。

| SE 名 | 用途 | 波形 | 周波数 | 持続 | 音量 |
|-------|------|------|------|------|------|
| `info` | ステージ選択時の確認音 | 矩形波 ch1 | 800 Hz | 50 ms | -12dB |
| `warn-tick` | TIME 残 10 秒以下の毎秒警告 | 矩形波 ch1 | 1200 Hz | 100 ms | -10dB |
| `bonus` | チェックポイント時間延長 | 矩形波 ch2 | 1500→1800 Hz スイープ | 200 ms | -8dB |
| `denied` | ロックステージクリック | ノイズ | — | 50 ms | -10dB |
| `clear-fanfare` | ステージクリア | 矩形波 ch1+ch2 アルペジオ | 5 ノート | 2.0 s | -6dB |
| `gameover` | 残機 0 | 矩形波 ch1（下降） | 880→220 Hz | 1.5 s | -8dB |
| `lives-warn` | 残機 1 になった瞬間 | 矩形波 ch2 | 600 Hz × 3 ビート | 600 ms | -10dB |

実装ガイドライン:
- すべて Web Audio API + OscillatorNode（矩形波） + AudioBufferSourceNode（ホワイトノイズ）で生成
- 音源ファイル不要（生成型）→ ペイロード増加なし
- マスター音量と SE/BGM 個別音量を OPTIONS から調整可能

### 7.3 タイマー警告音（#19 対応）

Excitebike / F-Zero 模倣の警告音。動作規則:

- 状態: `isWarning = timeRemainingSec <= 10`
- `isWarning === true` の間、毎秒 1 回「ピッ」を再生（タイマーは整数秒の境界をまたいだタイミング）
- **チェックポイント通過で残り時間が +N されて `isWarning === false` に戻った場合、即座に警告音を停止する**
- 再び 10 秒以下に減少したら自動的に再開

実装位置: `application/use-cases/advance-stage-time.ts` から `audio-port.playWarningTick()` を呼び、停止判断もそこで行う。

---

## 8. 分岐ルート（Phase 3）

### 8.1 対象ステージ

ステージ 3 / 5 / 8 の 3 箇所（Phase 1 では 1 ルート固定で実装）。

### 8.2 UI

```
┌──────────────────────────┐
│   STAGE 3 - NEON STREET  │
│                          │
│   ▶ A: 大通りルート       │
│     B: 路地裏ショートカット│
└──────────────────────────┘
```

### 8.3 データ駆動

`Stage.branch` を参照し、選択された側の `courseId` を採用する。新コース生成は禁止（既存 6 コースのいずれか + 修飾子で実現する）。

### 8.4 進捗保存

`StageRecord.chosenBranch` に保存。次回プレイ時に「前回選んだルート」をデフォルト選択にする。

---

## 9. ディレクトリと新規ファイル一覧

```
src/features/racing-game/
├── domain/
│   └── race/
│       ├── stage.ts                       # 新規 §2.1
│       ├── stage-catalog.ts               # 新規 §2.2 のデータ
│       ├── stage-progress.ts              # 新規 §3.4
│       ├── time-limit.ts                  # 新規 §3.1
│       ├── checkpoint-bonus.ts            # 新規 §3.2
│       ├── rank.ts                        # 新規 §3.3
│       └── campaign-progress.ts           # 新規 §2.3
├── application/
│   ├── use-cases/
│   │   ├── start-campaign-stage.ts        # 新規
│   │   ├── advance-stage-time.ts          # 新規
│   │   ├── checkpoint-time-bonus.ts       # 新規
│   │   ├── handle-stage-clear.ts          # 新規
│   │   ├── handle-game-over.ts            # 新規
│   │   └── complete-campaign.ts           # 新規
│   ├── ports/
│   │   └── campaign-progress-port.ts      # 新規
│   └── campaign-runtime.ts                # 新規 §2.4
├── infrastructure/
│   └── storage/
│       └── campaign-progress-repository.ts  # 新規 §5
├── components/
│   ├── CampaignMenuButton.tsx             # 新規（メニュー §6.1）
│   ├── StageSelectScreen.tsx              # 新規 §6.2
│   ├── StageIntroOverlay.tsx              # 新規（Phase 2 §7.1）
│   ├── StageHud.tsx                       # 新規 §6.3
│   ├── CheckpointBonusToast.tsx           # 新規 §6.4
│   ├── StageClearOverlay.tsx              # 新規 §6.5
│   ├── GameOverOverlay.tsx                # 新規 §6.6
│   └── EndingScreen.tsx                   # 新規 §6.7
└── presentation/
    └── RacingGameCampaign.tsx             # 新規（既存 RacingGameNew.tsx を流用、ラップ）
```

---

## 10. 受け入れ基準（テスト）

### 10.1 ドメイン単体テスト（必須）

| ファイル | テスト観点 |
|---------|----------|
| `time-limit.test.ts` | tickTime: 正常減算 / 0 でクランプ。isTimeUp: 境界 0 / 0.0001 / -1 |
| `checkpoint-bonus.test.ts` | applyCheckpointBonus: 加算正常 / 0 加算 / 残時間 0 から加算 |
| `rank.test.ts` | judgeRank: GOLD/SILVER/BRONZE 境界 / 等号挙動 |
| `stage-progress.test.ts` | evaluateStage: cleared / time_up / in_progress の 3 分岐 |
| `campaign-progress.test.ts` | アンロック / ベストタイム更新 / ランク格上げ更新 |

### 10.2 ユースケース統合テスト

- ステージ開始 → チェックポイント 4 回通過 → ゴールイン の正常フロー
- ステージ開始 → チェックポイント未通過で時間切れ → game_over フェーズ
- 全 8 ステージ連続クリア → ending フェーズ

### 10.3 Repository テスト

- localStorage への保存と読み込みのラウンドトリップ
- 未保存 → デフォルト進捗（ステージ 1 のみアンロック）が返る
- 不正データ（壊れた JSON）→ 例外を握りつぶしてデフォルトを返す

### 10.4 既存テストの不変

既存の Domain / Application / Infrastructure テスト 28 件は **無変更で全件パス**。

### 10.5 E2E（Phase 3 で導入）

- Playwright で「メニュー → キャンペーン → ステージ 1 開始 → コース完走 → 結果表示」を 1 シナリオ
- 「ステージ選択画面でロック中ステージはクリック無視」
- 「全クリア → エンディング表示」（時間がかかるため抽象化）

---

## 11. 既知の前提・制約

- **物理は固定タイムステップ（1/60s）** を継続。フレームレート可変対応は本計画スコープ外
- **ドラフトカードはキャンペーンで完全無効**。`cardsEnabled: false` の挙動は既存テストでカバー済（と仮定）。実装時に再確認
- **2P 入力周辺の既知未確認リスク**（`feature/games-brushup-plan-20260507` の調査でフラグ済）はキャンペーン側に影響しない（キャンペーンはソロのみ）

---

## 12. 既存実装で確認しておくべき箇所（実装着手前チェック）

実装に入る前に、以下を grep / コードリーディングで再確認する:

- [ ] `RaceConfig` の現在のフィールド一覧（`mode` 追加が衝突しないか）
- [ ] `GamePhase` Sum 型の正確な定義場所
- [ ] `race-handler.ts` のフェーズ遷移箇所（ラップ完了時の draft トリガ）
- [ ] `score-repository` の保存キー命名規則（`racing-campaign-progress-v1` が衝突しないか）
- [ ] 既存 `cardsEnabled` フラグの全参照箇所
- [ ] チェックポイントヒットイベントの出力場所（時間延長 Use Case をどこから呼ぶか）

これらの結果をふまえ、`tasks.md` の最初のタスク群「事前調査」を実施する。
