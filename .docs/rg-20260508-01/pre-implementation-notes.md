# Phase 0 事前調査ノート（一時ファイル — Phase 0 完了時に削除）

調査日: 2026-05-08

## 既存実装ファクト

### GamePhase（`src/features/racing-game/domain/race/types.ts:5`）

```ts
export type GamePhase = 'menu' | 'countdown' | 'race' | 'draft' | 'result';
```

遷移ルールは `domain/race/game-phase.ts` の `VALID_TRANSITIONS` で管理。

### RaceConfig（`src/features/racing-game/domain/race/types.ts:8-15`）

```ts
export interface RaceConfig {
  readonly mode: GameMode;        // 'solo' | '2p' | 'cpu'
  readonly courseIndex: number;
  readonly maxLaps: number;
  readonly baseSpeed: number;
  readonly cpuDifficulty: CpuDifficulty;
  readonly cardsEnabled: boolean;
}
```

### cardsEnabled の参照（race-handler.ts:96）

```ts
if (raceConfig.cardsEnabled && raceConfig.mode !== 'solo' && ...) {
  // ドラフトキューに追加
}
```

→ **キャンペーンでは `cardsEnabled: false` を渡すだけで draft フェーズへ遷移しない**。条件分岐は既に存在しており、追加実装不要。

### チェックポイントヒット検出（`domain/race/checkpoint.ts`）

```ts
export const updateCheckpoints = (
  player: Player, ...
): { player: Player; newCheckpointPassed: boolean }
```

→ **戻り値の `newCheckpointPassed` をフックして時間延長 Use Case を呼べる**。完璧なフックポイント。

### コース一覧（`domain/track/course.ts`）

| Index | 名称 | ポイント数 | チェックポイント |
|-------|------|----------|----------------|
| 0 | フォレスト | 16 | [0, 4, 8, 12] |
| 1 | シティ | 16 | [0, 4, 8, 12] |
| 2 | マウンテン | 20 | [0, 5, 10, 15] |
| 3 | ビーチ | 16 | [0, 4, 8, 12] |
| 4 | ナイト | 20 | [0, 5, 9, 14] |
| 5 | スノー | 18 | [0, 4, 9, 14] |

### 既存テスト数

28 件（spec.md §10.4 の前提と一致）。

## 設計上の決定

### GameMode と campaign の関係（spec §4.2 の見直し）

**問題**: 既存 `GameMode = 'solo' | '2p' | 'cpu'` に `'campaign'` を加えると、CPU 戦/2P 戦のキャンペーンの可能性が型で許される。しかしキャンペーンは仕様上ソロ専用。

**決定**: `RaceConfig` に **`campaignStage?: Stage`** という任意フィールドを追加する。
- `campaignStage` が undefined → 自由対戦モード（既存挙動）
- `campaignStage` が定義 → キャンペーンモード（mode は内部的に 'solo' を使用）

```ts
export interface RaceConfig {
  readonly mode: GameMode;
  readonly courseIndex: number;
  readonly maxLaps: number;
  readonly baseSpeed: number;
  readonly cpuDifficulty: CpuDifficulty;
  readonly cardsEnabled: boolean;
  readonly campaignStage?: Stage;  // 新規
}
```

`spec.md §4.2` の `mode: 'free' | 'campaign'` は概念的表現で、実装は `campaignStage` の有無で判定する。spec を補正する。

### GamePhase 拡張（spec §1.2 通り）

既存遷移を壊さないために、Sum 型に下記を追加:
- `stage_select`
- `stage_clear`
- `game_over`
- `ending`

`VALID_TRANSITIONS` も対応する遷移を追加。既存 'menu' / 'countdown' / 'race' / 'draft' / 'result' は無変更。

### コース距離からの初期時間算出（spec §2.2 注釈）

各コースの距離計算（隣接ポイント間距離合計）:

```
Forest:    ~3000px  (16 ポイント)
City:      ~3200px
Mountain:  ~3700px  (20 ポイント、起伏多)
Beach:     ~3000px
Night:     ~3500px  (20 ポイント)
Snow:      ~3300px  (18 ポイント)
```

baseSpeed = 3.2 px/frame × 60fps = 192 px/s で割ると、**理論最短タイム ≈ 距離/192**:

| コース | 距離（推定） | 理論最短 |
|--------|------------|---------|
| Forest | 3000 | 15.6s |
| City | 3200 | 16.7s |
| Mountain | 3700 | 19.3s |
| Beach | 3000 | 15.6s |
| Night | 3500 | 18.2s |
| Snow | 3300 | 17.2s |

理論最短に対する係数で初期時間を算出する仕組み:

```
initialTimeSec = 理論最短 × 倍率（1.0 = ガチ走り、5.0 = 余裕、3.5〜4.5 が現実的）
```

spec §2.2 の暫定値（80s/72s/66s/70s/60s/58s/50s/46s）は理論最短の **2.5〜4 倍** に位置し、spec の暫定値は **採用可能** と判定。ただし Phase 1 完了後にプレイテストで微調整する旨を明記。

## 結論

- spec の暫定値で実装着手可能
- 既存ドメインの変更は **GameMode 拡張なし、`campaignStage` 任意フィールド追加のみ**
- チェックポイントヒットフックは `updateCheckpoints` の戻り値 `newCheckpointPassed` を利用
- GamePhase 4 値追加に対応する `VALID_TRANSITIONS` 更新が必要
- 既存 28 テストは全件無変更でパスを維持する
