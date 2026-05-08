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

実装計画を最終確定させるための、コードリーディング・デザイン基礎決定タスク。

### 0.1 実装着手前のコードリーディング

- [ ] 📚 spec.md §12 のチェック項目を順に実施し、結果を一時ファイル `.docs/rg-20260508-01/pre-implementation-notes.md`（仮称）に追記する
  - [ ] `RaceConfig` の現フィールドを列挙
  - [ ] `GamePhase` Sum 型の定義位置と現メンバ
  - [ ] `race-handler.ts` のラップ完了時 draft トリガ箇所（行番号付き）
  - [ ] `score-repository` の保存キー命名規則
  - [ ] `cardsEnabled` の全参照箇所（grep で網羅）
  - [ ] チェックポイントヒット検出箇所（時間延長フックポイント候補）
  - [ ] **既存コースの実距離計測**（spec.md §2.2 注釈の `baseTimePerPoint × coursePoints` で `initialTimeSec` を再算出）
- [ ] 📝 上記調査結果に応じて spec.md を補正
  - [ ] §2.2 ステージカタログの初期時間・チェックポイント延長を計測値ベースで上書き
  - [ ] §12 のチェック結果（fact）を spec.md 該当節に取り込む
- [ ] 📝 ステージカタログ（spec.md §2.2）の数値が Phase 0 の計測で確定する前提を明文化（暫定値は **初期案** と明示済 — §2.2 注釈参照）
- [ ] 🗑️ Phase 0 完了時、`pre-implementation-notes.md` の **重要な結論を spec.md に取り込んだ上で原本を削除する**（中間生成物の永続化を避ける、#23 対応）

### 0.2 デザイン基礎の確定（デザインレビュー反映）

- [ ] 📝 spec §6.8.3 のカラートークン HEX 値を Figma / DevTools で実測し、4.5:1 を割る組合せを補正
- [ ] 📝 フォントスタック（spec §6.8.2）のライセンス確認とロード戦略確定
  - [ ] Press Start 2P / Silkscreen / DotGothic16 のライセンス OK 確認
  - [ ] サブセット化方針（unicode-range / `font-display: swap`）を確定
- [ ] 📝 spec §7.2.1 SE トーン体系（矩形波・ノイズ）を audio-engine の既存実装と突き合わせ、API 差異を文書化
- [ ] 📝 60-30-10 ルール適合チェック: 主要 6 画面（メニュー / STAGE SELECT / レース HUD / STAGE CLEAR / GAME OVER / ENDING）でアクセント色が 10% 以下か Figma 上で計測

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
  - [ ] `StageRecord` / `StageRank` / `CampaignProgress` 型（`completed` フィールドは持たない、§2.3）
  - [ ] `unlockNextStage(progress, clearedId)` 純粋関数
  - [ ] `updateBestRecord(progress, stageId, newRecord)` 純粋関数（ベスト更新条件: `newTime < oldTime`）
  - [ ] **派生関数** `isCampaignCompleted(progress)`: 全 8 クリア判定（`highestUnlocked === 8 && records[8].rank !== 'NONE'`）
  - [ ] **派生関数** `resetProgress()`: 初期進捗を返す（RESET PROGRESS 動作用）
  - [ ] 🧪 `campaign-progress.test.ts`: アンロック / ベスト更新 / 完了判定 / リセット
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
  - [ ] 4×2 グリッド（横画面） / 2×4 グリッド（縦画面、< 768px、R6 対応）
  - [ ] **ランク 4 段階表示**（★★★ / ★★· / ★·· / ··· / 🔒、M3 対応）
  - [ ] LAST: M/D 表示（記録があれば、S4 対応）
  - [ ] 画面到達時に lives を 3 にリセット（spec §2.4）
  - [ ] ロックステージのクリック挙動（`denied` SE + トースト 1.5 秒、spec §6.2.4）
  - [ ] `[BACK TO MENU]` をメイン領域に唯一のナビゲーションとして配置（M1 対応）
  - [ ] 右上に `⚙ OPTIONS` 歯車アイコン（44×44px、R6 対応）
  - [ ] **キーボード操作**（←↑→↓ + Enter + Esc + Tab、R5 対応）
  - [ ] フォーカス枠 2px 二重枠（`:focus-visible` のみ表示、R5 対応）
  - [ ] 全クリア時に `ALL CLEAR!` リボン
- [ ] 🟧 `components/OptionsModal.tsx`（M2 + R7 対応）
  - [ ] `[ ▶ REPLAY ENDING ]` ボタン（completed=true で有効、未達成ならグレーアウト維持・領域確保）
  - [ ] `[ ⚠ RESET PROGRESS ]` ボタン（`--accent-danger` 警告色枠）
  - [ ] RESET タップで「DELETE ALL RECORDS? Y / N」モーダル
  - [ ] `[ CLOSE ]` ボタン
  - [ ] サウンド設定（マスター / BGM / SE 音量）も同モーダルに集約
- [ ] 🟧 `components/StageHud.tsx`
  - [ ] 残り時間表示（中央上 48px、10 秒以下で `--accent-danger` に変色 + 点滅、R8 対応）
  - [ ] ステージ番号（左下 18px、`--text-secondary`、R8 対応）
  - [ ] SPEED 表示（左下 18px、`--text-secondary`）
  - [ ] LIVES ●●● ドット表記（右上 16px、残機 1 で `--accent-danger` 点滅、R4 対応）
  - [ ] **`stage.lapsToClear > 1` のときのみ LAP N/M 表示**（R1 対応）
  - [ ] HUD は Canvas 上の DOM オーバーレイ、`pointer-events: none` 適用
- [ ] 🟧 `components/CheckpointBonusToast.tsx`
  - [ ] チェックポイントヒット時に `+N SECONDS` 表示
  - [ ] **TIME カウンタ直下に出現 → 上方向 24px フロート + 1.0s フェードアウト**（R3 対応）
  - [ ] 連動して TIME カウンタが 0.5s で旧値→新値にカウントアップ
  - [ ] `--accent-gold` カラー、`--font-en-pixel` 24px
  - [ ] reduced-motion 時はフロート無し、0.5s で消去（spec §6.9）
- [ ] 🟧 `components/StageClearOverlay.tsx`
  - [ ] タイム表示 + ランク表示 + Continue ボタン
- [ ] 🟧 `components/GameOverOverlay.tsx`
  - [ ] `[STAGE SELECT]` ボタンのみ（Retry は出さない、spec §6.6）
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

### 2.1 ステージ間ナラティブ（R2 対応）

- [ ] 🟧 `components/StageIntroOverlay.tsx`
  - [ ] ステージ番号 + タイトル + intro テキスト 1〜2 行
  - [ ] **未クリアは 4 秒・既クリアは 1.5 秒・OPTIONS で常時スキップも可** で自動進行
  - [ ] 開始 0.5s 後に右下に `▶ PRESS ANY KEY TO SKIP` を表示（R2 対応）
  - [ ] 任意キー / タップで即 countdown
  - [ ] reduced-motion 時は拡大アニメ無し、フェード 0.1s（spec §6.9）
- [ ] 🟦 `GamePhase` に `stage_intro` を追加し、`stage_select` → `stage_intro` → `countdown` の順序に変更
- [ ] 🟨 OPTIONS に「INTRO SKIP: ALWAYS」設定を追加（spec §7.1.2）
- [ ] 🧪 フェーズ遷移テスト追加

### 2.2 タイムランク表示の演出

- [ ] 🟧 `StageClearOverlay.tsx` の演出強化
  - [ ] ランク表示時に星アイコンが点滅で出現する 1 秒のアニメーション
  - [ ] BGM のクリアファンファーレと同期

### 2.3 BGM / SE 統合（S5 対応）

- [ ] 🟨 既存 `audio-engine.ts` を拡張、ステージ別 BGM の再生を追加（リソースが揃わない場合は難度別 3 種で開始）
- [ ] 🟨 **SE トーン体系の実装**（spec §7.2.1）
  - [ ] `info` / `warn-tick` / `bonus` / `denied` / `clear-fanfare` / `gameover` / `lives-warn` の 7 種を Web Audio API（OscillatorNode + ホワイトノイズ Buffer）で生成
  - [ ] マスター音量 / BGM 音量 / SE 音量を OPTIONS から個別調整可能に
- [ ] 🟨 警告音 `warn-tick`: 残り 10 秒以下で 1 秒ごとに再生、CP 通過で 10 秒超に戻ったら即座に停止（spec §7.3）
- [ ] 🟨 残機 1 になった瞬間の `lives-warn` 通知音
- [ ] 🧪 audio-engine の単体テスト（各 SE の Trigger / 警告音停止条件 / 音量設定）

### 2.4 エンディング本実装（R9 + S6 対応）

- [ ] 📚 ドライバーキャラクターシート（spec §6.7.1）に従って独白テキストを執筆
  - [ ] 各ステージ `Stage.intro` を最終決定（縦糸シンボル「夜明け」関連語を含む、最大全角 56 字）
  - [ ] エンディング独白 3 画面（spec §6.7.2 のテンプレに準拠、各 60 字以内）
- [ ] 🟧 `EndingScreen.tsx` を強化
  - [ ] 黒背景フェードイン → 独白 × 3 → "THANK YOU FOR PLAYING" → クレジットロール
  - [ ] **クレジットロール 30〜45 秒、`Esc`/タップで「SKIP?」確認 → スキップ可**（R9 対応）
  - [ ] **2 回目以降のプレイヤーはデフォルト 4 倍速、`Shift` 押下で通常速**（R9 対応）
  - [ ] reduced-motion 時はページング表示（スペースで進む）
- [ ] 🟧 ステージ一覧 + 自分の記録（ベストタイム + ランク）表示
- [ ] 🟧 ランク集計表示（GOLD ×N / SILVER ×N / BRONZE ×N）
- [ ] 🟧 `components/SoundTestScreen.tsx`（S6 対応 / 隠し機能）
  - [ ] エンディング初回視聴後にアンロック
  - [ ] クレジット最終フレームに 3 秒間 `▶ SOUND TEST` を表示
  - [ ] BGM 全曲 + SE 一覧の試聴 UI
  - [ ] 既存 audio-engine の薄いラッパとして実装（新規ドメイン無し）

### 2.5 CRT スキャンライン演出（任意・S2 対応）

- [ ] 🟧 全画面 fixed の `::after` 擬似要素で repeating-linear-gradient のスキャンライン
- [ ] 🟧 OPTIONS で ON/OFF 切替（既定 OFF、spec §6.8.6）
- [ ] 🟧 `prefers-reduced-motion: reduce` のとき自動 OFF（§6.9）
- [ ] 🧪 OPTIONS で切替できることの単体テスト

### 2.6 reduced-motion 全体対応（M4 対応）

- [ ] 🟧 グローバル CSS に `@media (prefers-reduced-motion: reduce)` の基本ルールを追加
- [ ] 🟧 各演出（タイマー点滅 / トーストフロート / クレジットロール / カウントアップ / ホバー浮き上がり）の代替挙動を実装（spec §6.9 表に従う）
- [ ] 🧪 jsdom + matchMedia モックで reduced-motion 時の挙動を検証
- [ ] 🧪 E2E（Playwright）の `emulateMedia({ reducedMotion: 'reduce' })` を 1 シナリオで使用

### 2.7 タイマー切れ後の Grace 期間（Rad Racer 模倣）

- [ ] 🟦 `domain/race/grace-period.ts`
  - [ ] 残時間 0 後に約 5 秒の惰性区間を導入。速度を線形に減衰
  - [ ] 🧪 単体テスト
- [ ] 🟩 `race-handler.ts` の `evaluateStage` を grace 対応に拡張
- [ ] 🧪 grace 期間中にゴール到達 → cleared、grace 切れ → time_up

### 2.8 PR 順の更新（PR 表に CRT / reduced-motion / Sound Test を追加）

- [ ] 📚 `tasks.md` 末尾の PR 表を最新状態に更新（PR 番号は流動的、必要に応じてリネーム）

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

PR 単位の目安と依存関係（#22 対応）:

| PR # | スコープ | 対応タスク | 依存（前提となる PR） |
|------|---------|----------|--------------------|
| PR-1 | Phase 0 + Phase 1.1〜1.2（ドメイン + 主要 Use Case） | TDD で純粋関数 + テスト。デザイン基礎決定（§0.2）を含む | — |
| PR-2 | Phase 1.3〜1.5（race-handler 分岐 + Phase 拡張 + 永続化） | 既存テスト全件緑を必須 | PR-1 |
| PR-3 | Phase 1.6〜1.7（UI と受け入れテスト） | プレイ可能な状態に到達。デザイントークン適用済 | PR-2 |
| PR-4 | Phase 2.1〜2.2（ステージ intro + ランク演出） |  | PR-3 |
| PR-5 | Phase 2.3〜2.4（BGM + SE トーン体系 + エンディング + Sound Test） | キャラシート §6.7.1 / 独白テンプレ §6.7.2 / SE トーン §7.2.1 を厳守 | PR-3 |
| PR-6 | Phase 2.5（CRT スキャンライン） |  | PR-3 |
| PR-7 | Phase 2.6（reduced-motion 全体対応） |  | PR-3〜PR-6 のいずれか終了後（演出が出揃ってから） |
| PR-8 | Phase 2.7（grace 期間） | Rad Racer 風の 5 秒惰性 | PR-2 |
| PR-9 | Phase 3.1（分岐） |  | PR-1（ドメイン拡張） + PR-3（UI 基盤） |
| PR-10 | Phase 3.2（難易度） |  | PR-1 + PR-3 |
| PR-11 | Phase 3.3（QA + E2E） |  | PR-3 以降のすべて |

> 並列着手可能性: PR-4 / PR-5 / PR-6 / PR-8 は PR-3 完了後に **並列着手可能**。PR-7（reduced-motion）は演出系 PR が出揃った段階で総点検する位置付け。PR-9 / PR-10 は PR-1 のドメイン拡張内容に依存。

---

## メモ

- 各 PR の Description 冒頭で `plan.md` の該当セクションへのリンクを必ず貼る
- ドメイン層は **すべて純粋関数** を維持し、テストは Jest で網羅
- UI コンポーネントの単体テストは React Testing Library で記述
- E2E はキャンペーン全 8 ステージ完走を必須テストにしない（時間がかかりすぎる）。短縮版の通しと、各画面遷移の単発確認に留める
