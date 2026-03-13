# RISK LCD リファクタリング タスクリスト

## 凡例

- [ ] 未着手
- [~] 進行中
- [x] 完了
- [!] ブロック中

優先度: P0（必須）> P1（重要）> P2（推奨）

---

## Phase 1: ドメインロジックの純粋関数化

### 1.1 被弾判定の抽出 [P0]

- [x] `useRunningPhase.ts` の `resolve` 関数を読み込み、ドメインロジック部分を特定
- [x] `domain/judgment.ts` を作成
- [x] `judgeCycle` 純粋関数を実装
- [x] 単体テスト: 障害物がプレイヤーレーンにある場合 → 被弾（死亡/シールド/リバイブ）
- [x] 単体テスト: 障害物がプレイヤーレーンにない場合 → 回避 + スコア加算
- [x] 単体テスト: 隣接レーンに障害物 → ニアミス判定
- [x] 単体テスト: シールド保持中の被弾 → シールド消費
- [x] 単体テスト: シェルターレーンでの被弾 → シェルター回避
- [x] 単体テスト: フリーズ中の判定
- [x] 単体テスト: リスクスコア判定
- [x] 単体テスト: コンボ更新
- [x] `useRunningPhase.ts` の `resolve` から `judgeCycle` を呼び出すよう変更
- [x] 全既存テスト通過を確認（142テスト）

### 1.2 スコア計算の移行・拡充 [P0]

- [x] `domain/scoring.ts` を作成
- [x] `game-logic.ts` の全関数を `domain/scoring.ts` に移行（clamp, computeRank, comboMult, calcEffBf, visLabel, wPick, computePoints, computeStageBonus, buildSummary, isAdjacentTo）
- [x] `game-logic.ts` は `domain/scoring.ts` + `domain/style-merge.ts` からの re-export に変更（後方互換性）
- [x] `calculateDailyReward` を新規実装（useStore.recordDailyPlay から報酬計算を抽出）
- [x] 単体テスト: calculateDailyReward（初回/更新/非更新/同点/初回+更新）
- [x] 既存テスト（game-logic.test.ts）がそのまま通過することを確認
- [x] 全既存テスト通過を確認

### 1.3 障害物配置の抽出 [P0]

- [x] `useRunningPhase.ts` の `pickObs` 関数を読み込み
- [x] `domain/obstacle.ts` を作成
- [x] `placeObstacles` 純粋関数を実装
- [x] 単体テスト: 単一障害物の配置（各レーンの重み付き選択）
- [x] 単体テスト: ダブル障害物の確率（si>=2 + chance 成功/失敗）
- [x] 単体テスト: _dblChance パラメータの反映
- [x] 単体テスト: 障害物の範囲検証（0-2）
- [x] `useRunningPhase.ts` から `placeObstacles` を呼び出すよう変更
- [x] 全既存テスト通過を確認

### 1.4 ステージ進行の抽出 [P1]

- [x] `domain/stage-progress.ts` を作成
- [x] `isStageCleared` 純粋関数を実装・テスト
- [x] `createStageConfig` 純粋関数を実装・テスト（モディファイア適用、カスタムステージ）
- [x] `useRunningPhase.ts` の `cont` から `isStageCleared` を呼び出すよう変更
- [x] `useRunningPhase.ts` の `announce` から `createStageConfig` を呼び出すよう変更
- [x] 全既存テスト通過を確認

### 1.5 スタイルマージの移行 [P1]

- [x] `domain/style-merge.ts` を作成
- [x] `game-logic.ts` の `mergeStyles` を移行
- [x] `game-logic.ts` は re-export に変更
- [x] 単体テスト: 単一スタイル（standard, highrisk, reversal）
- [x] 単体テスト: 複数スタイルのマージ（倍率: max、速度修飾: 加算、クリアボーナス: max、予告セット: sum小）
- [x] 単体テスト: 空配列でエラー
- [x] 単体テスト: 存在しないスタイルIDの無視
- [x] 全既存テスト通過を確認

### 1.6 DbC アサーション関数 [P2]

- [ ] `domain/assertions.ts` を作成
- [ ] `assertGameStateInvariant` を実装（開発環境のみ有効）
- [ ] useRunningPhase の resolve 後に呼び出しを追加
- [ ] 単体テスト: 不正な値で console.assert が発火すること

---

## Phase 2: インターフェース導入と useStore 改善

### 2.1 インターフェースの定義 [P1]

- [x] `interfaces/rng.ts` を作成（既存 RngApi を昇格）
- [x] `interfaces/storage.ts` を作成
- [x] `interfaces/audio.ts` を作成（Note 型を正として定義）
- [x] `interfaces/index.ts` バレルエクスポート作成
- [x] 既存の `phases/types.ts` の RngApi を `interfaces/rng.ts` からの re-export に変更
- [x] 全既存テスト通過を確認（4477テスト）

### 2.2 useStore のヘルパー関数分離 [P0]

- [x] `hooks/store-helpers/` ディレクトリを作成
- [x] `point-ops.ts` を作成（addPoints, spendPoints 純粋関数）
- [x] `style-ops.ts` を作成（toggleEquip, maxEquipSlots 純粋関数）
- [x] `daily-ops.ts` を作成（recordDaily 純粋関数、domain/scoring の calculateDailyReward を使用）
- [x] 各ヘルパーの単体テスト作成（24テスト: point-ops 7, style-ops 7, daily-ops 7 + 不変性テスト3）
- [x] `useStore.ts` をヘルパー関数呼び出しに変更（公開 API は維持）
- [x] 既存の useStore.test.ts が通過することを確認
- [x] 全既存テスト通過を確認（4477テスト）

### 2.3 useAudio のマジックナンバー定数化 [P1]

- [x] `constants/audio-config.ts` に音声設定定数オブジェクトを定義（16種 SE、型安全な設定）
- [x] useAudio.ts の beep 呼び出しを定数参照に変更
- [x] Note 型を interfaces/audio.ts に統一（重複定義を解消）
- [x] seq 関数のパラメータを readonly Note[] に変更（不要なスプレッド + キャストを除去）
- [x] 全既存テスト通過を確認（risk-lcd 166テスト）

---

## Phase 3: useRunningPhase の責務分割

### 3.1 セグメント初期化の共通関数化 [P0]

- [x] 4箇所で重複するセグメント初期化ロジックを特定（initRender, clearSegs, nextCycle×2）
- [x] `createSegments` 共通関数を作成（segment-helpers.ts）
- [x] `createSegTexts` 共通関数を作成（segment-helpers.ts）
- [x] 4箇所を共通関数呼び出しに変更
- [x] 単体テスト作成（6テスト: 避難所あり/なし、配列独立性）
- [x] 全既存テスト通過を確認（172テスト→通過）

### 3.2 resolve の副作用分離 [P0]

- [x] resolve 内を3段階に分離: (1) 純粋関数呼び出し → (2) 状態更新 → (3) UI 更新
- [x] `applyHitStateUpdate` ヘルパー関数を作成（resolve-helpers.ts、被弾時の状態更新）
- [x] `applyDodgeStateUpdate` ヘルパー関数を作成（resolve-helpers.ts、回避時の状態更新）
- [x] `renderHitEffect` / `renderDodgeEffect` を外部モジュールに抽出（render-effects.ts）
- [x] 単体テスト作成（9テスト: シールド/リバイブ/死亡/コンボ/ニアミス/リスク/フリーズ/シェルター/zeroed）
- [x] 全既存テスト通過を確認（181テスト→通過）

### 3.3 nextCycle のタイマー整理 [P1]

- [x] `calcCycleTiming` 純粋関数を作成（cycle-helpers.ts、速度計算の抽出）
- [x] `pickFakeObstacle` 純粋関数を作成（cycle-helpers.ts、フェイク障害物判定の抽出）
- [x] `renderCascadeFrame` / `renderFinalFrame` 純粋関数を作成（cascade-renderer.ts、描画ロジック抽出）
- [x] 単体テスト作成（18テスト: タイミング計算5, フェイク判定4, カスケード5, ファイナル4）
- [x] 全既存テスト通過を確認（190テスト→通過）

### 3.4 useGameEngine の dispatch 整理 [P1]

- [x] dispatch 内の switch/case を名前付き関数で構造化
- [x] `dispatchTitle`, `handleMenuSelect`, `dispatchDaily`, `dispatchTutorial`, `dispatchResult` を抽出
- [x] 全既存テスト通過を確認（190テスト→通過）

### 3.5 循環依存の改善 [P2]

- [x] `PhaseCallbacks` インターフェースを定義（types.ts、依存構造を一元管理）
- [x] 3つの ref（endGameRef, showPerksRef, announceRef）を1つの `callbacksRef` に統合
- [x] useRunningPhase, usePerkPhase のパラメータを簡素化
- [x] 全既存テスト通過を確認（199テスト→通過）

### 3.6 追加リファクタリング

- [x] `createGameState` ファクトリ関数を別ファイルに抽出（create-game-state.ts）
- [x] useRunningPhase: 589行 → 388行（34%削減）
- [x] 全プロジェクト 4510テスト通過
- [x] TypeScript コンパイルエラーゼロ
- [ ] ブラウザでの動作確認（通常/デイリー/ショップ/チュートリアル）

**レビュー指摘対応済み**:
- H-1/H-4: render-effects.ts のパラメータオブジェクト化 + `Partial<RenderState>` 型安全化
- H-2: resolve-helpers.ts の docstring「副作用なし」→「GameState を直接ミューテーションする」に修正
- M-1: calcCycleTiming の5引数 → CycleTimingParams パラメータオブジェクトに変更
- M-2: announce 内の `setTimeout(audio.mod, 300)` → `addTimer` に統一
- M-3: renderDodgeEffect のシェルター吸収条件を変数に抽出

**注記**: 目標300行に対し388行で着地。残りはタイマーオーケストレーション（nextCycle, announce）とゲーム制御（startGame, movePlayer）であり、これ以上の分割はコンテキスト共有の複雑化を招くため留めた。仕様書記載の「タイマーベースのアニメーション制御は本質的にある程度の長さが必要」に該当。

---

## Phase 4: テスト強化

### 4.1 統合テスト基盤の構築 [P0]

- [x] テスト用のモック RNG 生成ユーティリティを作成（シード固定）
- [x] テスト用の localStorage モックを整備
- [x] テスト用の AudioContext モックを整備
- [x] `renderHook` + `useFakeTimers` のテストパターンを確立

### 4.2 統合テスト実装 [P0]

- [x] ゲーム開始テスト: dispatch('act') でゲームが開始されること
- [x] サイクル進行テスト: タイマー進行でサイクルが完了すること
- [x] 回避テスト: 障害物のないレーンにいるとスコアが加算されること
- [x] 被弾テスト: 障害物レーンにいるとゲームオーバーになること（フェーズ遷移テストで検証）
- [x] ステージクリアテスト: 全サイクル完了でステージが進むこと（フェーズ遷移テストで検証）
- [x] デイリーモードテスト: シード固定で再現性があること

### 4.3 コンポーネントテスト [P1]

- [x] TitleScreen のテスト（メニュー項目の表示・選択操作）— 10テスト
- [x] ResultScreen のテスト（スコア・ランクの表示）— 17テスト
- [x] PerkSelectScreen のテスト（パーク一覧の表示・選択）— 10テスト
- [x] StyleListScreen のテスト（スタイル一覧・装備トグル）— 11テスト
- [x] UnlockShopScreen のテスト（ショップ一覧・購入）— 9テスト

### 4.4 既存テストの改善 [P1]

- [x] random.test.ts に確率分布テストを追加（chance 分布 + int 均等分布）
- [x] RiskLcdGame.test.tsx に画面遷移テストを追加（PLAY STYLE, UNLOCK）
- [x] scoring.test.ts に wPick・buildSummary のテストを追加

### 4.5 カバレッジ設定 [P0]

- [x] jest.config.js に RISK LCD のカバレッジ閾値を追加
  - [x] domain/: branches 85%, functions 85%, lines 90%, statements 90%
  - [x] risk-lcd 全体: branches 50%, functions 60%, lines 60%, statements 60%
- [x] バレルファイル（index.ts）をカバレッジ対象から除外

**レビュー指摘対応済み**:
- M-1: `createMockStore` の自己参照型を `MockStore` インターフェースに分離
- M-2: `as never` キャストを `Parameters<typeof useGameEngine>` 型に置換
- M-3: `mockMathRandom` を `jest.spyOn(Math, 'random')` に変更
- M-4: TitleScreen.test.tsx の未使用変数 `menuItems` を削除
- L-1: ResultScreen.test.tsx の未使用インポート `RuntimeStageConfig` を削除

---

## Phase 5: 仕上げ

### 5.1 DRY 違反の最終チェック [P1]

- [x] isShelter チェックの共通化（cascade-renderer から isShelter 関数パラメータを除去、shelterLanes.includes() に統一）
- [x] isRestricted 関数パラメータも同様に restrictedLanes 配列に統一
- [x] PhaseContext から isShelter / isRestricted を削除、useGameEngine のヘルパー関数も削除
- [x] useRunningPhase 内の isShelter/isRestricted を g.st.sf/g.st.rs の直接参照に変更
- [x] 全箇所をレビュー
- [x] 全既存テスト通過を確認（298テスト）

### 5.2 マジックナンバーの排除 [P1]

- [x] タイミング関連の数値を定数化（constants/game-config.ts に15定数を追加）
  - render-effects.ts: HIT_SHAKE_MS/HIT_FLASH_MS/SHIELD_RESUME_MS/REVIVE_RESUME_MS/DEATH_EFFECT_MS/SHELTER_ART_MS/DODGE_ART_MS
  - useRunningPhase.ts: STAGE_CLEAR_MS/ANNOUNCE_MOD_DELAY_MS/ANNOUNCE_WITH_MOD_MS/ANNOUNCE_BASE_MS
- [x] cycle-helpers.ts の `0.7` を CALM_THRESHOLD_RATIO / CALM_SPEED_FACTOR に分離
- [x] render-effects.ts のコンボ閾値 `3` を COMBO_THRESHOLD 定数に統一
- [x] COMBO_THRESHOLD / NEAR_MISS_THRESHOLD を constants/ に移動（useRunningPhase のローカル定義を削除）
- [x] 全箇所をレビュー
- [x] 全既存テスト通過を確認（298テスト）

### 5.3 パフォーマンス最適化 [P2]

- [x] wPick の excludes を Set 対応に変更（`number[] | ReadonlySet<number>` Union 型、内部で Set に変換）
- [x] 不要な re-render の特定と React.memo 適用検討 → 主要ゲームコンポーネントは毎フレーム Props 変更のため効果なし。条件付きレンダリングで既に最適化済み。現状維持
- [x] バンドルサイズへの影響確認 → 定数追加と関数パラメータ変更のみ、影響は軽微

### 5.4 クリーンアップ [P1]

- [x] 旧 utils/game-logic.ts が re-export のみになっていることを確認
- [x] 未使用の import の削除（obstacle.test.ts: PlaceObstaclesParams、cascade-renderer.test.ts: LANES/SegState、useRunningPhase.ts: GameState）
- [x] ESLint エラー・警告の解消（4エラー → 0エラー）
- [x] TypeScript コンパイルエラーの解消（autoBlock プロパティ不足を修正）

### 5.5 最終確認 [P0]

- [x] 全単体テスト通過（298テスト）
- [x] 全統合テスト通過
- [x] カバレッジ閾値達成（domain: stmts 97.94%, branches 95.45%, funcs 92.3%, lines 98.36%）
- [x] ESLint エラーゼロ
- [x] TypeScript コンパイルエラーゼロ
- [x] `any` 型使用ゼロ
- [x] useRunningPhase: 401行（Phase 3 注記通り、タイマーオーケストレーションの分割限界。388行+import定数追加分）
- [ ] ブラウザでの動作確認（通常/デイリー/ショップ/チュートリアル）

### 5.6 レビュー指摘対応

**H-1**: `computeStageBonus` / `comboMult` 内のコンボ・ニアミス閾値をスコア計算用定数として定数化
- [x] `HIGH_COMBO_THRESHOLD = 5` / `NEAR_MISS_BONUS_THRESHOLD = 3` を constants に追加（`COMBO_THRESHOLD` は既存を再利用）
- [x] `comboMult` の閾値を `COMBO_THRESHOLD` / `HIGH_COMBO_THRESHOLD` に置換
- [x] `computeStageBonus` の閾値を `HIGH_COMBO_THRESHOLD` / `COMBO_THRESHOLD` / `NEAR_MISS_BONUS_THRESHOLD` に置換
- [x] 既存テスト通過を確認（298テスト）

**M-1**: `wPick` で空配列の場合の Set 生成スキップ最適化
- [x] 空配列 / 空 Set の場合は `undefined` にして Set 生成・map をスキップ

**M-2**: `cycle-helpers.ts` の `1.8`（解決フェーズの追加ステップ数）を定数化
- [x] `CYCLE_TAIL_STEPS = 1.8` を constants に追加、cycle-helpers.ts で使用

**M-3**: `useRunningPhase.ts` の `50`（ビートアニメーション余白）を定数化
- [x] `BEAT_ANIMATION_MARGIN_MS = 50` を constants に追加、useRunningPhase.ts で使用

**L-1**: `renderFinalFrame` 内の `shelterLanes.includes(l)` 重複呼び出しを変数に抽出
- [x] forEach 内で `isShl` 変数に格納して再利用

**L-2**: `useRunningPhase.ts` の `0.9` / `0.8`（解決タイミング係数）を定数化
- [x] `RESOLVE_PAUSE_RATIO = 0.9` / `RESOLVE_DELAY_OFFSET = 0.8` を constants に追加、useRunningPhase.ts で使用

全指摘対応後: 298テスト全パス / TypeScript エラーゼロ / ESLint エラーゼロ

---

## 依存関係

```
Phase 1 ──→ Phase 3（ドメイン関数を使って resolve を分割）
Phase 1 ──→ Phase 4（ドメイン関数のテスト + 統合テスト）
Phase 2 ──→ Phase 4（useStore ヘルパーのテスト）
Phase 3 ──→ Phase 5（分割後のクリーンアップ）
Phase 4 ──→ Phase 5（テスト完了後の仕上げ）
```

- Phase 1 と Phase 2 は **並行して着手可能**（相互依存なし）
- Phase 3 は Phase 1 完了後に着手（domain/ の純粋関数が必要）
- Phase 4 は Phase 1, 2 の完了後に統合テスト着手（部分的に並行可能）
- Phase 5 は全フェーズの仕上げ

## タスク数サマリー

| Phase | タスク数 | 規模感 |
|-------|---------|--------|
| Phase 1 | 33 | 中（純粋関数の抽出が核心） |
| Phase 2 | 16 | 小（インターフェース定義 + ヘルパー分離） |
| Phase 3 | 15 | 中（useRunningPhase の責務分割） |
| Phase 4 | 18 | 中（統合テスト + コンポーネントテスト） |
| Phase 5 | 12 | 小（仕上げ） |
| **合計** | **94** | |
