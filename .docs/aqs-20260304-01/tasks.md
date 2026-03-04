# Agile Quiz Sugoroku ブラッシュアップ (Phase 3) - タスクチェックリスト

---

## Phase 3a: TEAM化＆SAVE機能

### 1. ドキュメント作成
- [x] `.docs/aqs-20260304-01/plan.md` 作成
- [x] `.docs/aqs-20260304-01/spec.md` 作成
- [x] `.docs/aqs-20260304-01/tasks.md` 作成

### 2. GOAL結果のTEAM化

#### 2.1 型定義の変更
- [ ] `types.ts` に `TeamType` インターフェース追加
- [ ] `types.ts` の `SavedGameResult` を `teamTypeId` / `teamTypeName` に変更
- [ ] `types.ts` の `GamePhase` に `'story'` を追加

#### 2.2 チームタイプ分類ロジック
- [ ] `team-classifier.ts` を新規作成（6種類のチームタイプ定義＋分類ロジック）
- [ ] `constants.ts` の `ENGINEER_TYPES` → `TEAM_TYPES` に変更
- [ ] `constants.ts` のグレードラベル変更（Legendary → Dream Team 等）
- [ ] `constants.ts` の `getSummaryText` をチーム視点のフィードバックに変更
- [ ] `engineer-classifier.ts` の参照を `team-classifier.ts` に変更
- [ ] 旧 `engineer-classifier.ts` の削除 or エイリアス化

#### 2.3 ResultScreen のTEAM化
- [ ] `ResultScreen.tsx` のヘッダーテキスト変更（「エンジニアタイプ」→「チームの成熟度」）
- [ ] `ResultScreen.tsx` のチームタイプ表示（名前、絵文字、説明文、フィードバック）
- [ ] `ResultScreen.tsx` のレーダーチャート軸ラベル変更
- [ ] `ResultScreen.tsx` のタカのフィードバックテキスト更新

#### 2.4 画像参照の変更
- [ ] `images.ts` のチームタイプ画像キー変更（`type_stable` → `type_synergy` 等）
- [ ] チームタイプ画像ファイルの追加/差し替え（ユーザー作業: 生成→配置）

#### 2.5 結果保存の更新
- [ ] `result-storage.ts` を `TeamType` 対応に更新
- [ ] 旧データ（`engineerTypeId`）の後方互換性処理追加

#### 2.6 テスト
- [ ] `team-classifier.ts` のユニットテスト作成（6タイプ全てのケース）
- [ ] 既存の `engineer-classifier` テストをTEAM版に移行
- [ ] `ResultScreen.tsx` のコンポーネントテスト更新
- [ ] `result-storage.ts` のテスト更新（後方互換性含む）
- [ ] `npm test` で全テストがパス

### 3. スプリント切れ目のSAVE/LOAD機能

#### 3.1 セーブマネージャー作成
- [ ] `types.ts` に `SaveState` インターフェース追加
- [ ] `save-manager.ts` を新規作成
  - [ ] `saveGameState()` 関数
  - [ ] `loadGameState()` 関数
  - [ ] `deleteSaveState()` 関数
  - [ ] `hasSaveState()` 関数
  - [ ] スキーマバージョン管理
  - [ ] エラーハンドリング（破損データ、localStorage不可）

#### 3.2 RetrospectiveScreen に保存ボタン追加
- [ ] 「保存して中断」ボタンの追加
- [ ] ボタン押下時のセーブ処理実装
- [ ] 保存完了トースト表示（2秒で自動消滅）
- [ ] セーブ後のタイトル画面遷移

#### 3.3 TitleScreen に「続きから」ボタン追加
- [ ] セーブデータ有無のチェックロジック
- [ ] 「続きから」ボタンの表示（保存日時・進捗表示付き）
- [ ] ロード処理の実装（次のスプリントから再開）
- [ ] 新規ゲーム開始時のセーブデータ上書き確認ダイアログ

#### 3.4 useGame フックの拡張
- [ ] セーブ状態からの復元ロジック追加
- [ ] `usedQuestions` の `Set` ⇔ 配列変換処理

#### 3.5 テスト
- [ ] `save-manager.ts` のユニットテスト作成
  - [ ] 正常系: 保存・読み込み・削除
  - [ ] 異常系: 破損データ、localStorage不可
  - [ ] バージョンマイグレーション
- [ ] `TitleScreen.tsx` のコンポーネントテスト更新（「続きから」ボタン）
- [ ] `RetrospectiveScreen.tsx` のコンポーネントテスト更新（保存ボタン）
- [ ] `npm test` で全テストがパス

---

## Phase 3b: ストーリー機能

### 4. スプリント間の成長物語

#### 4.1 ストーリーデータ定義
- [ ] `types.ts` に `StoryEntry`, `StoryLine` インターフェース追加
- [ ] `story-data.ts` を新規作成
  - [ ] 8スプリント分のストーリーデータ定義
  - [ ] スプリント数→ストーリーマッピング関数
  - [ ] 各ストーリーのタイトル、語り手、テキスト行

#### 4.2 StoryScreen コンポーネント
- [ ] `components/StoryScreen.tsx` を新規作成
  - [ ] ノベルゲーム風のテキスト表示（1行ずつフェードイン）
  - [ ] キャラクター発言時のアイコン＋名前表示
  - [ ] ナレーション表示（中央揃えイタリック）
  - [ ] 背景にストーリーイラスト（半透明オーバーレイ）
- [ ] `components/styles/StoryScreen.styled.ts` を新規作成
- [ ] スキップ機能実装
  - [ ] 「スキップ」ボタン（右上）
  - [ ] Escape キー対応
  - [ ] クリック / Enter / Space で次の行
- [ ] フェードイン/アウトのアニメーション

#### 4.3 ゲームフロー変更
- [ ] `AgileQuizSugorokuPage.tsx` にストーリーフェーズの遷移追加
- [ ] `useGame.ts` に `'story'` フェーズの処理追加
- [ ] フェーズ遷移: `retro → story → sprint-start`（最初のスプリント前にも表示）
- [ ] ストーリー完了/スキップ時の遷移処理

#### 4.4 テスト
- [ ] `story-data.ts` のユニットテスト（データ整合性チェック）
- [ ] `StoryScreen.tsx` のコンポーネントテスト
  - [ ] テキストが順次表示されること
  - [ ] スキップが機能すること
  - [ ] 完了時にコールバックが呼ばれること
- [ ] `npm test` で全テストがパス

---

## Phase 3c: 画像リニューアル

### 5. キャラクター以外の各種画像一新

#### 5.1 イベント画像（8枚）— ユーザー作業: 生成→配置
- [ ] `aqs_event_planning.webp` — チーム計画中のイラスト
- [ ] `aqs_event_impl1.webp` — ネコがコーディング中
- [ ] `aqs_event_test1.webp` — ウサギがバグ探索中
- [ ] `aqs_event_refinement.webp` — チーム議論中
- [ ] `aqs_event_impl2.webp` — ペアプロ中
- [ ] `aqs_event_test2.webp` — CI/CD実行中
- [ ] `aqs_event_review.webp` — デモ実施中
- [ ] `aqs_event_emergency.webp` — 緊急対応中

#### 5.2 UI画像（6枚）— ユーザー作業: 生成→配置
- [ ] `aqs_correct.webp` — ペンギンOKサイン
- [ ] `aqs_incorrect.webp` — ペンギン励ましの表情
- [ ] `aqs_timeup.webp` — ウサギが焦っている
- [ ] `aqs_build_success.webp` — チームハイタッチ
- [ ] `aqs_grade_celebration.webp` — トロフィーを掲げるチーム
- [ ] `aqs_retro.webp` — カフェでリラックスチーム

#### 5.3 チームタイプ画像（6枚）— ユーザー作業: 生成→配置
- [ ] `aqs_type_synergy.webp` — 手を合わせて光る5キャラ
- [ ] `aqs_type_resilient.webp` — 嵐の中で笑顔の5キャラ
- [ ] `aqs_type_evolving.webp` — 階段を上る5キャラ
- [ ] `aqs_type_agile.webp` — 風を切って走る5キャラ
- [ ] `aqs_type_struggling.webp` — 重い荷物を背負い前進する5キャラ
- [ ] `aqs_type_forming.webp` — 新芽の前に並ぶ5キャラ

#### 5.4 画像コード対応
- [ ] `images.ts` のチームタイプ画像キーを新ファイル名に変更
- [ ] 旧エンジニアタイプ画像の参照を削除

### 6. ストーリーイラスト（8枚）— ユーザー作業: 生成→配置
- [ ] `aqs_story_01.webp` — 5キャラの出会い
- [ ] `aqs_story_02.webp` — 意見対立
- [ ] `aqs_story_03.webp` — 最初の壁
- [ ] `aqs_story_04.webp` — 変わり始める空気
- [ ] `aqs_story_05.webp` — 助け合い
- [ ] `aqs_story_06.webp` — 自分たちのリズム
- [ ] `aqs_story_07.webp` — 嵐を超えて
- [ ] `aqs_story_08.webp` — 真のTeam
- [ ] `images.ts` にストーリー画像の import 追加

### 7. 背景画像（5枚）— ユーザー作業: 生成→配置
- [ ] `aqs_bg_office.webp` — オフィス/チームルーム
- [ ] `aqs_bg_planning.webp` — 会議室
- [ ] `aqs_bg_dev.webp` — 開発スペース
- [ ] `aqs_bg_emergency.webp` — 緊急対応空間
- [ ] `aqs_bg_retro.webp` — カフェスペース
- [ ] `images.ts` に背景画像の import 追加
- [ ] 背景切り替えロジックの実装（`EVENT_BACKGROUND_MAP`）
- [ ] `QuizScreen.tsx` に背景画像表示処理を追加
- [ ] フェードトランジション（0.5秒）の実装

### 8. 画像検証
- [ ] ブラウザで全画面の画像表示を目視確認
  - [ ] TitleScreen: タイトル背景
  - [ ] SprintStartScreen: 背景画像
  - [ ] QuizScreen: イベント別背景画像の切り替え
  - [ ] RetrospectiveScreen: 振り返り背景
  - [ ] ResultScreen: チームタイプ画像
  - [ ] StoryScreen: ストーリーイラスト
  - [ ] StudySelectScreen: キャラクター画像

---

## Phase 3d: 勉強会モード拡張

### 9. キャラクター別ジャンル絞り込みモード

#### 9.1 キャラクター×ジャンルマッピング定義
- [ ] `character-genre-map.ts` を新規作成
  - [ ] 5キャラクター×ジャンルのマッピング定義
  - [ ] マッピング取得関数

#### 9.2 StudySelectScreen UI変更
- [ ] キャラクターカード選択セクションの追加（5キャラ横並び）
- [ ] キャラクター選択時の関連ジャンル自動選択ロジック
- [ ] 複数キャラクター選択時の和集合処理
- [ ] キャラクター選択解除時のジャンル解除処理
- [ ] 手動ジャンル追加・削除との共存ロジック

#### 9.3 テスト
- [ ] `character-genre-map.ts` のユニットテスト
  - [ ] 全キャラクターのマッピングが定義されていること
  - [ ] マッピングのジャンルIDが `TAG_MASTER` に存在すること
- [ ] `StudySelectScreen.tsx` のコンポーネントテスト更新
  - [ ] キャラクター選択でジャンルが自動選択されること
  - [ ] 複数キャラクター選択で和集合になること
  - [ ] キャラクター選択後に手動でジャンル変更できること
- [ ] `npm test` で全テストがパス

---

## 最終検証

### 10. 全体テスト＆検証
- [ ] `npm test` で全テストがパス
- [ ] 全画面の目視確認完了
- [ ] セーブ/ロード機能の動作確認（複数ブラウザ）
- [ ] ストーリーの表示・スキップ確認
- [ ] TEAM判定の全6タイプ動作確認
- [ ] 勉強会モードのキャラクター絞り込み確認
- [ ] 背景画像の切り替え確認
- [ ] localStorage のエッジケース確認（容量制限、プライベートブラウジング）

---

## 今後の実装候補（Phase 4 以降）

- [ ] すごろく要素の強化（サイコロ演出 + マスの種類多様化）
- [ ] アイテムシステム（スプリント間で使えるパワーアップ）
- [ ] ボード全体のビジュアル表示（すごろくマップ俯瞰）
- [ ] マルチプレイヤー対応（チーム対抗戦）
- [ ] 問題データの外部API化（動的読み込み）
