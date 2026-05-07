# Racing Game ファミコン風キャンペーン — 実装タスク

> `plan.md` と `spec.md` を前提とした実装可能粒度のチェックリスト。
> 各タスクは TDD（Red → Green → Refactor）で進める。
> 1 タスク = 1 PR ではなく、Phase 単位 or 論理単位で PR を切ってよい。

凡例:
- 🟦 ドメイン層
- 🟩 ユースケース層
- 🟨 インフラ層
- 🟧 プレゼンテーション層
- 📝 設定・データ
- 🧪 テスト
- 📚 ドキュメント

---

## Phase 0 — 事前調査・確認（着手前）

実装計画を最終確定させるための、コードリーディング中心のタスク。

- [ ] 📚 spec.md §12 のチェック項目を順に実施し、結果を `.docs/rg-20260508-01/precheck-notes.md` に追記する
  - [ ] `RaceConfig` の現フィールドを列挙
  - [ ] `GamePhase` Sum 型の定義位置と現メンバ
  - [ ] `race-handler.ts` のラップ完了時 draft トリガ箇所（行番号付き）
  - [ ] `score-repository` の保存キー命名規則
  - [ ] `cardsEnabled` の全参照箇所（grep で網羅）
  - [ ] チェックポイントヒット検出箇所（時間延長フックポイント候補）
- [ ] 📝 上記調査結果に応じて spec.md を補正（必要なら）
- [ ] 📝 ステージカタログ（spec.md §2.2）の数値（時間・ボーナス）を **プレイテストなしの初期案** として確定。Phase 2 のチューニングで調整する前提を明文化

---

## Phase 1 — コアキャンペーン（必須）

### 1.1 ドメイン層

- [ ] 🟦 `domain/race/stage.ts` 型定義
  - [ ] `StageId` / `StageDifficultyHint` / `Branch` / `Stage` 型を spec §2.1 のとおり定義
  - [ ] バリデーション関数 `assertValidStage(stage: Stage): void`（不変条件: `silverRankTimeSec > goldRankTimeSec`、`initialTimeSec > 0` 等）
- [ ] 🟦 `domain/race/stage-catalog.ts` データ
  - [ ] spec §2.2 の 8 ステージを定義（Phase 1 では分岐は無し or 片側固定で OK）
  - [ ] エクスポート: `getStage(id: StageId): Stage` / `getNextStage(id: StageId): Stage | undefined`
- [ ] 🟦 `domain/race/time-limit.ts`
  - [ ] `tickTime(remaining, dt)`: 残時間減算
  - [ ] `isTimeUp(remaining)`: 境界判定
  - [ ] 🧪 `time-limit.test.ts`: 正常減算 / 0 クランプ / 境界
- [ ] 🟦 `domain/race/checkpoint-bonus.ts`
  - [ ] `applyCheckpointBonus(remaining, bonus)`: 加算
  - [ ] 🧪 `checkpoint-bonus.test.ts`: 加算正常 / 0 加算 / 残 0 から加算
- [ ] 🟦 `domain/race/rank.ts`
  - [ ] `judgeRank(goalTime, stage)`: GOLD/SILVER/BRONZE 判定
  - [ ] 🧪 `rank.test.ts`: 境界（等号挙動）/ 各ランクの代表値
- [ ] 🟦 `domain/race/stage-progress.ts`
  - [ ] `StageOutcome` 型と `evaluateStage(runtime, hasCrossedFinish)`
  - [ ] 🧪 `stage-progress.test.ts`: cleared / time_up / in_progress の 3 分岐
- [ ] 🟦 `domain/race/campaign-progress.ts`
  - [ ] `StageRecord` / `StageRank` / `CampaignProgress` 型
  - [ ] `unlockNextStage(progress, clearedId)` 純粋関数
  - [ ] `updateBestRecord(progress, stageId, newRecord)` 純粋関数（ベスト更新条件: `newTime < oldTime`）
  - [ ] `isCampaignCompleted(progress)`: 全 8 クリア判定
  - [ ] 🧪 `campaign-progress.test.ts`: アンロック / ベスト更新 / 完了判定
- [ ] 🟦 `domain/race/lives.ts`（軽量）
  - [ ] `decrementLives` / `isGameOver`
  - [ ] 🧪 `lives.test.ts`

### 1.2 ユースケース層

- [ ] 🟩 `application/campaign-runtime.ts`
  - [ ] `CampaignRuntime` 型 + 生成関数 `createCampaignRuntime(stage: Stage, lives: number): CampaignRuntime`
- [ ] 🟩 `application/use-cases/start-campaign-stage.ts`
  - [ ] 引数: `stage: Stage`、戻り値: 初期 `CampaignRuntime` と `RaceConfig（mode='campaign', cardsEnabled=false, maxLaps=stage.lapsToClear）`
  - [ ] 🧪 単体テスト
- [ ] 🟩 `application/use-cases/advance-stage-time.ts`
  - [ ] 引数: 現 runtime + dt、戻り値: 更新後 runtime
  - [ ] 🧪 単体テスト
- [ ] 🟩 `application/use-cases/checkpoint-time-bonus.ts`
  - [ ] 引数: runtime、戻り値: ボーナス加算後 runtime + ボーナス値（UI 表示用）
  - [ ] 🧪 単体テスト
- [ ] 🟩 `application/use-cases/handle-stage-clear.ts`
  - [ ] ステージクリア時の進捗更新（ベストタイム / アンロック次ステージ）
  - [ ] 🧪 単体テスト
- [ ] 🟩 `application/use-cases/handle-game-over.ts`
  - [ ] 残機 0 時の処理（ステージ 1 リセット or 選択画面に戻る）
  - [ ] 🧪 単体テスト
- [ ] 🟩 `application/use-cases/complete-campaign.ts`
  - [ ] エンディング遷移（completed フラグ立てる）
  - [ ] 🧪 単体テスト
- [ ] 🟩 `application/ports/campaign-progress-port.ts`
  - [ ] Interface 定義: `load(): CampaignProgress` / `save(p: CampaignProgress): void` / `clear(): void`

### 1.3 race-handler への分岐追加

- [ ] 🟩 `application/race-handler.ts` 修正（最小）
  - [ ] `RaceConfig.mode === 'campaign'` のときのみ:
    - 毎フレーム `tickTime` で残り時間を減らす
    - チェックポイントヒット時に `checkpointTimeBonus` Use Case を呼ぶ
    - `evaluateStage` の結果に応じて `stage_clear` / `game_over` フェーズへ遷移
  - [ ] 🧪 既存の race-handler 関連テスト全件パスを確認
  - [ ] 🧪 新規: campaign モードでのフロー統合テスト

### 1.4 GamePhase 拡張

- [ ] 🟦 `GamePhase` Sum 型に `stage_select` / `stage_clear` / `game_over` / `ending` を追加
  - [ ] `stage_intro` は Phase 2 で追加（Phase 1 では countdown 直行）
  - [ ] 🧪 既存のフェーズ遷移テストが影響を受けるか確認、必要に応じてテスト追加

### 1.5 インフラ層

- [ ] 🟨 `infrastructure/storage/campaign-progress-repository.ts`
  - [ ] localStorage 保存キー: `racing-campaign-progress-v1`
  - [ ] schema バージョン 1 のみサポート
  - [ ] 不正 JSON は警告ログ + デフォルト返却
  - [ ] 🧪 ラウンドトリップ / 未保存 → デフォルト / 不正データ復旧

### 1.6 プレゼンテーション層

- [ ] 🟧 メニュー画面に **CAMPAIGN** ボタン追加（既存メニューコンポーネントに 1 行）
- [ ] 🟧 `components/StageSelectScreen.tsx`
  - [ ] 8 ステージのグリッド表示
  - [ ] アンロック状態 / ベストタイム / ランクアイコン表示
  - [ ] 選択 → ステージ開始
- [ ] 🟧 `components/StageHud.tsx`
  - [ ] 残り時間表示（10 秒以下で点滅）
  - [ ] ステージ番号 / 1 ラップ進捗
- [ ] 🟧 `components/CheckpointBonusToast.tsx`
  - [ ] チェックポイントヒット時に `+12 SECONDS` 表示
- [ ] 🟧 `components/StageClearOverlay.tsx`
  - [ ] タイム表示 + ランク表示 + Continue ボタン
- [ ] 🟧 `components/GameOverOverlay.tsx`
  - [ ] Retry / Stage Select ボタン
- [ ] 🟧 `components/EndingScreen.tsx`（簡易版）
  - [ ] "CONGRATULATIONS! YOU CLEARED ALL 8 STAGES." + メニューに戻るボタン
- [ ] 🟧 `presentation/RacingGameCampaign.tsx`
  - [ ] 既存 `RacingGameNew.tsx` のロジックを流用しつつ、フェーズ遷移をキャンペーン版に差し替え

### 1.7 受け入れテスト（Phase 1 完了基準）

- [ ] メニューから「CAMPAIGN」を選び、ステージ 1〜8 を順に走破できる
- [ ] チェックポイント通過時に時間が延長される
- [ ] 制限時間切れで GAME OVER 画面に遷移する
- [ ] 残機 3 を使い切ると STAGE SELECT に戻る
- [ ] 全 8 ステージクリアでエンディング画面（簡易版）が出る
- [ ] ブラウザを閉じて再度開いてもアンロック状態とベストタイムが復元される
- [ ] 既存 ソロ / 2P / CPU モードが従来どおり動作する
- [ ] 既存テスト全 28 件が無変更で緑

---

## Phase 2 — 演出強化（推奨）

### 2.1 ステージ間ナラティブ

- [ ] 🟧 `components/StageIntroOverlay.tsx`
  - [ ] ステージ番号 + タイトル + intro テキスト 1〜2 行
  - [ ] 4 秒で自動進行 / 任意キーで即 countdown
- [ ] 🟦 `GamePhase` に `stage_intro` を追加し、`stage_select` → `stage_intro` → `countdown` の順序に変更
- [ ] 🧪 フェーズ遷移テスト追加

### 2.2 タイムランク表示の演出

- [ ] 🟧 `StageClearOverlay.tsx` の演出強化
  - [ ] ランク表示時に星アイコンが点滅で出現する 1 秒のアニメーション
  - [ ] BGM のクリアファンファーレと同期

### 2.3 BGM / SE 統合

- [ ] 🟨 既存 `audio-engine.ts` を拡張、ステージ別 BGM の再生を追加（リソースが揃わない場合は難度別 3 種で開始）
- [ ] 🟨 警告音: 残り 10 秒以下で 1 秒ごとに「ピッピッ」
- [ ] 🟨 クリアファンファーレ / ゲームオーバー音 / エンディング BGM
- [ ] 🧪 audio-engine の単体テスト（鳴らす Trigger が呼ばれること）

### 2.4 エンディング本実装

- [ ] 🟧 `EndingScreen.tsx` を強化
  - [ ] 黒背景フェードイン → 1 行独白 × 3 → "THANK YOU FOR PLAYING" → クレジットロール
  - [ ] スキップ可能
- [ ] 🟧 ステージ一覧 + 自分の記録（ベストタイム + ランク）も表示

### 2.5 タイマー切れ後の Grace 期間（Rad Racer 模倣）

- [ ] 🟦 `domain/race/grace-period.ts`
  - [ ] 残時間 0 後に約 5 秒の惰性区間を導入。速度を線形に減衰
  - [ ] 🧪 単体テスト
- [ ] 🟩 `race-handler.ts` の `evaluateStage` を grace 対応に拡張
- [ ] 🧪 grace 期間中にゴール到達 → cleared、grace 切れ → time_up

---

## Phase 3 — 分岐ルートと仕上げ（任意）

### 3.1 分岐ルート

- [ ] 🟦 `Stage.branch` を持つステージ（3 / 5 / 8）のデータを spec §2.2 に従って定義
- [ ] 🟧 `components/BranchSelectScreen.tsx` 新規（ステージ開始前に挿入）
- [ ] 🟦 `GamePhase` に `branch_select` を追加
- [ ] 🟩 `start-campaign-stage` Use Case が `branch` 選択結果を受け取って `RaceConfig.courseId` を決める
- [ ] 🟨 `CampaignProgress.records[id].chosenBranch` の保存・復元
- [ ] 🧪 分岐ステージのフロー統合テスト

### 3.2 難易度選択（NORMAL / HARD）

- [ ] 🟦 `Stage` 型に `difficultyMultiplier` ベースの計算ヘルパを追加 OR 新フィールド `hardModeOverrides` を導入
  - 推奨: 難易度別カタログを別途用意するのではなく、係数で時間と CPU 速度を調整
- [ ] 🟧 メニューでキャンペーン難易度を選択する画面追加（NORMAL がデフォルト）
- [ ] 🟨 進捗保存に難易度別レコードを保持（`Record<Difficulty, CampaignProgress>`）
- [ ] 🧪 各難易度でステージ 1 を完走するテスト

### 3.3 仕上げ・QA

- [ ] 🧪 E2E（Playwright）: 「メニュー → キャンペーン → ステージ 1 完走 → 結果画面」
- [ ] 🧪 E2E: 「ステージ選択画面でロックされたステージを選んだ際の挙動」
- [ ] 🧪 E2E: 「全クリア → エンディング表示」（短縮版でよい）
- [ ] 🧪 既知バグ確認: 2P 入力周辺（プレイテストでキャンペーンに影響しないことを確認）
- [ ] 🧪 既知バグ確認: 高フレームレート環境（120Hz など）での挙動
- [ ] 📚 README へのキャンペーンモード追記
- [ ] 📚 SEO ページの更新（キャンペーン要素を含む説明）

---

## 進捗追跡

このタスクリストはチェックリストとしてそのまま使う。完了したら `[ ]` を `[x]` に変更してコミットする。

PR 単位の目安:

| PR # | スコープ | 対応タスク |
|------|---------|----------|
| PR-1 | Phase 0 + Phase 1.1〜1.2（ドメイン + 主要 Use Case） | TDD で純粋関数 + テスト |
| PR-2 | Phase 1.3〜1.5（race-handler 分岐 + Phase 拡張 + 永続化） | 既存テスト全件緑を必須 |
| PR-3 | Phase 1.6〜1.7（UI と受け入れテスト） | プレイ可能な状態に到達 |
| PR-4 | Phase 2.1〜2.2（ステージ intro + ランク演出） |  |
| PR-5 | Phase 2.3〜2.4（BGM + エンディング） |  |
| PR-6 | Phase 2.5（grace 期間） | Rad Racer 風の 5 秒惰性 |
| PR-7 | Phase 3.1（分岐） |  |
| PR-8 | Phase 3.2（難易度） |  |
| PR-9 | Phase 3.3（QA + E2E） |  |

---

## メモ

- 各 PR の Description 冒頭で `plan.md` の該当セクションへのリンクを必ず貼る
- ドメイン層は **すべて純粋関数** を維持し、テストは Jest で網羅
- UI コンポーネントの単体テストは React Testing Library で記述
- E2E はキャンペーン全 8 ステージ完走を必須テストにしない（時間がかかりすぎる）。短縮版の通しと、各画面遷移の単発確認に留める
