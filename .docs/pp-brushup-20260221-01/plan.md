# Picture Puzzle ブラッシュアップ - 実装計画

## 1. コンテキスト

### なぜこの変更を行うか

Picture Puzzle は堅牢なパズルロジック（逆操作によるシャッフルで解法保証）と 9 段階の難易度（2x2〜32x32）を持つが、以下の課題がある:

- **ゲームプレイの薄さ**: クリック→スライド→完成の単調ループで、緊張感や達成の波がない
- **リプレイ動機の欠如**: スコアやランクがなく「もう一度遊びたい」と思わせる仕組みがない
- **画像アップロードの不安定性**: ユーザー画像の品質・サイズが不安定（オーナー指示により削除）
- **デフォルト画像の不足**: 6 枚のみ（アップロード削除後はさらに不足）
- **BGM なし**: 没入感が低い
- **操作の制約**: クリックのみ（スワイプ・キーボード非対応）
- **著作権リスク**: alt テキストに実在の人名・作品名あり（北斎、タイムズスクエア）
- **手数カウントなし**: 効率的にクリアしたかの指標がない

### コンセプト

**「一枚の絵が完成する喜びを、何度でも、心地よい音楽と共に」**

キーワード: テーマコレクション × スコアアタック × BGM × 段階的アンロック

---

## 2. 実装フェーズ

### Phase 1: 基盤整備（Foundation）

| # | 項目 | 概要 |
|---|------|------|
| 1-1 | 画像アップロード機能の削除 | `ImageUploader` コンポーネント、トグル UI、`imageSourceMode` 状態、`checkFileSize` 関数、`extractImageName` の data URL 分岐を削除 |
| 1-2 | 著作権リスクのあるファイル名・alt テキストのリネーム | `hokusai_kangchenjunga` → `snowy_mountain_ukiyoe`、`midnight_times_square` → `midnight_neon_street` に変更。画像・動画・コード内の参照すべてを更新 |
| 1-3 | 手数カウンター＆進捗表示 | StatusBar を 3 列に拡張（経過時間 / 手数 / 正解率%）。`moveCountAtom`、`correctRateAtom` を追加 |
| 1-4 | スコアリングシステム | スコア計算ロジック、ランク判定（3 つ星〜クリア）、`shuffleMoves` の記録 |
| 1-5 | リザルト画面の強化 | 画像名・難易度・タイム・手数・スコア・ランク・ベストスコア更新表示・SNS シェア改善 |

### Phase 2: サウンド＆操作改善（Sound & Controls）

| # | 項目 | 概要 |
|---|------|------|
| 2-1 | BGM システム（4 トラック） | Tone.js によるオシレーターベースの BGM。トラック選択・再生/停止・音量調整 UI |
| 2-2 | SE＆アニメーション | スライド SE・正解位置 SE・完成 SE。正解位置の緑ボーダーフラッシュ、完成時パーティクルアニメーション |
| 2-3 | スワイプ操作 | タッチデバイス向け。30px 閾値でスワイプ方向を検出し、空白位置に対応するピースを移動 |
| 2-4 | キーボード操作 | Arrow/WASD で移動、H でヒント、R でリセット、M で BGM トグル |

### Phase 3: コンテンツ＆リプレイ性（Content & Replay）

| # | 項目 | 概要 |
|---|------|------|
| 3-1 | テーマコレクション | 6 テーマ × 画像群。アンロック条件（クリア回数/テーマ制覇）による段階的解放 |
| 3-2 | ベストスコアボード | 画像×難易度ごとのベストスコア・ベストランク・ベストタイム・クリア回数を管理。既存の `ClearHistory` から `PuzzleRecord` へ移行 |
| 3-3 | ランクバッジ表示 | 画像選択画面にクリア済みランクバッジを表示。コレクション進捗の可視化 |

---

## 3. 実装順序と依存関係

```
Phase 1（直列）:
  1-1 アップロード削除 ──→ 1-2 リネーム ──→ 1-3 手数カウンター ──→ 1-4 スコア ──→ 1-5 リザルト画面
                                                  │
Phase 2（1-3 完了後に着手可能）:                     │
  2-1 BGM ──→ 2-2 SE&アニメ                        │
  2-3 スワイプ（独立）                               │
  2-4 キーボード（独立）                              │
                                                  │
Phase 3（1-5 完了後に着手可能）:                     │
  3-1 テーマコレクション ──→ 3-3 ランクバッジ         │
  3-2 ベストスコアボード ←─────────────────────────────┘
```

### 依存関係の詳細

| タスク | 依存先 | 理由 |
|--------|--------|------|
| 1-2 リネーム | 1-1 完了 | アップロード削除後にファイル参照が単純化される |
| 1-4 スコア | 1-3 完了 | 手数カウント・正解率がスコア計算の入力 |
| 1-5 リザルト | 1-4 完了 | スコア・ランクの表示が必要 |
| 2-1 BGM | 1-3 完了 | StatusBar の変更が安定してから UI を追加 |
| 2-2 SE | 2-1 完了 | AudioContext の共有・GainNode 分離の設計を BGM で確立 |
| 3-1 テーマ | 1-5 完了 | 画像選択 UI の全面改修が必要 |
| 3-2 ベストスコア | 1-5 完了 | スコア保存の仕組みが必要 |
| 3-3 バッジ | 3-1 完了 | テーマ UI 上にバッジを表示 |

---

## 4. 並列化可能な作業ストリーム

4 つの独立した作業ストリームを並列で進行可能:

### Stream A: コード実装（開発者）
- Phase 1 → Phase 2 → Phase 3 を順次実装
- 本計画書の対象

### Stream B: 画像アセット制作（デザイナー/AI）
- 12 枚の新規画像を制作（既存 6 枚に追加）
- テーマ別に制作可能、コード実装と独立
- 詳細は `tasks.md` のアセットチケットを参照

### Stream C: 動画アセット制作（デザイナー/AI）
- 新規画像に対応する完成演出動画を制作
- 画像完成後に着手（Stream B に依存）

### Stream D: BGM 作曲（サウンドデザイナー/AI）
- 4 トラックを Tone.js 用 MIDI ノート配列として作曲
- コード実装と独立（Phase 2-1 で統合）

```
時間軸 →
Stream A: [===Phase 1===][===Phase 2===][===Phase 3===]
Stream B: [====画像制作=====]
Stream C:                 [==動画制作==]
Stream D: [==BGM 作曲==]
```

---

## 5. ファイル一覧

### 5.1 主要修正ファイル

| ファイル | 変更内容 |
|----------|----------|
| `src/store/atoms.ts` | `moveCountAtom`, `shuffleMovesAtom`, `correctRateAtom`, `scoreAtom`, `bgmTrackIdAtom`, `bgmVolumeAtom`, `bgmPlayingAtom` 等を追加 |
| `src/hooks/usePuzzle.ts` | 手数カウント、シャッフル手数記録、正解率計算を追加 |
| `src/hooks/useGameState.ts` | `imageSourceMode` 削除、スコア・BGM 状態の統合、スワイプ/キーボードハンドラ追加 |
| `src/components/organisms/PuzzleBoard.tsx` | StatusBar 3 列化、SE 再生、正解位置アニメ、完成アニメ、スワイプイベント、キーボードイベント |
| `src/components/organisms/PuzzleBoard.styles.ts` | 3 列 StatusBar、アニメーション keyframes、正解位置ボーダー |
| `src/components/PuzzleSections.tsx` | アップロードトグル削除、テーマ選択 UI、リザルト画面強化 |
| `src/components/molecules/DefaultImageSelector.tsx` | テーマコレクション UI に全面改修、ランクバッジ表示 |
| `src/components/molecules/DefaultImageSelector.styles.ts` | テーマ UI スタイル |
| `src/pages/PuzzlePage.tsx` | BGM コントロール UI 統合、ClearHistoryList → ベストスコアボード |
| `src/pages/PuzzlePage.styles.ts` | BGM コントロール、リザルト画面スタイル |
| `src/utils/storage-utils.ts` | `PuzzleRecord` 型追加、ベストスコア保存/取得、データマイグレーション |
| `src/utils/puzzle-utils.ts` | `checkFileSize` 削除、スコア計算関数・正解率計算関数追加 |
| `src/hooks/useVideoPlayback.ts` | `validFilenames` 配列のリネーム反映、新規画像対応 |
| `src/components/molecules/ShareButton.tsx` | シェアテキストにスコア・ランクを追加 |

### 5.2 新規作成ファイル

| ファイル | 内容 |
|----------|------|
| `src/hooks/useBgm.ts` | BGM 再生管理フック（Tone.js） |
| `src/hooks/useSePlayer.ts` | SE 再生管理フック（Tone.js） |
| `src/hooks/useSwipe.ts` | スワイプ操作検出フック |
| `src/hooks/useKeyboard.ts` | キーボード操作フック |
| `src/utils/bgm-data.ts` | 4 トラックのメロディ/ベースデータ（MIDI ノート配列） |
| `src/utils/score-utils.ts` | スコア計算・ランク判定ユーティリティ |
| `src/types/puzzle.ts` | `PuzzleImage`, `Theme`, `ThemeId`, `PuzzleScore`, `PuzzleRecord`, `BgmTrack` 等の型定義 |
| `src/components/molecules/BgmController.tsx` | BGM コントロール UI コンポーネント |
| `src/components/molecules/BgmController.styles.ts` | BGM コントロールスタイル |
| `src/components/molecules/ResultScreen.tsx` | リザルト画面コンポーネント |
| `src/components/molecules/ResultScreen.styles.ts` | リザルト画面スタイル |
| `src/components/molecules/ThemeSelector.tsx` | テーマコレクション選択 UI |
| `src/components/molecules/ThemeSelector.styles.ts` | テーマ選択スタイル |
| `src/data/themes.ts` | テーマ・画像定義データ |
| `public/images/default/` (新規画像 12 枚) | テーマ別画像アセット |
| `public/videos/default/` (新規動画 12 本) | 完成演出動画アセット |

### 5.3 削除ファイル

| ファイル | 理由 |
|----------|------|
| `src/components/molecules/ImageUploader.tsx` | アップロード機能削除 |
| `src/components/molecules/ImageUploader.styles.ts` | アップロード機能削除 |
| `src/components/molecules/ImageUploader.test.tsx` | アップロード機能削除 |
| `public/images/default/hokusai_kangchenjunga.webp` | リネーム（→ `snowy_mountain_ukiyoe.webp`） |
| `public/images/default/midnight_times_square.webp` | リネーム（→ `midnight_neon_street.webp`） |
| `public/videos/default/hokusai_kangchenjunga.mp4` | リネーム（→ `snowy_mountain_ukiyoe.mp4`） |
| `public/videos/default/midnight_times_square.mp4` | リネーム（→ `midnight_neon_street.mp4`） |

---

## 6. 技術的リスクと対策

| リスク | 影響度 | 対策 |
|--------|--------|------|
| **ブラウザ自動再生制限** | 高 | ユーザー操作（ゲーム開始ボタン）で `Tone.start()` を呼び AudioContext を初期化。初期化前は BGM UI を無効化 |
| **BGM + SE 同時再生の負荷** | 中 | BGM と SE で別々の GainNode を使用し独立制御。SE は短時間のワンショットでリソース消費を最小化 |
| **BGM ループの継ぎ目** | 低 | シーケンスインデックスを 0 に戻すだけのシームレスループ。フェードイン/アウトで聴覚的な不自然さを軽減 |
| **画像アセット調達** | 高 | AI 生成画像を活用。アセット制作は独立チケットとして切り出し、コード実装と並列進行 |
| **スワイプとクリックの競合** | 中 | 30px 移動閾値を設定。閾値未満はクリックとして処理、以上はスワイプとして処理 |
| **localStorage データマイグレーション** | 中 | 既存の `ClearHistory` を新しい `PuzzleRecord` 形式に自動変換するマイグレーション関数を実装。旧データは変換後も保持 |
| **32x32 での正解率計算パフォーマンス** | 低 | `useMemo` で正解率を計算し、pieces 変更時のみ再計算。1024 ピースの比較は十分高速 |
| **Tone.js の初回ロードサイズ** | 中 | 動的 import（`import('tone')`）を使用し、BGM 初期化時にのみロード |

---

## 7. 検証手順

### Phase 1 完了時の検証

- [ ] アップロード UI が完全に削除されていること
- [ ] デフォルト画像選択画面に直接遷移すること
- [ ] `hokusai_kangchenjunga` → `snowy_mountain_ukiyoe` のリネームが全ファイルに反映されていること
- [ ] `midnight_times_square` → `midnight_neon_street` のリネームが全ファイルに反映されていること
- [ ] リネーム後の画像・動画が正常に表示/再生されること
- [ ] StatusBar に経過時間・手数・正解率が表示されること
- [ ] 手数がスライド操作ごとに 1 ずつ増加すること
- [ ] 正解率が正しく計算されること（正解ピース数 / 非空ピース数 × 100）
- [ ] パズル完成時にスコアが正しく計算されること
- [ ] ランク判定が正しいこと（3 つ星 >= 8000、2 つ星 >= 5000、1 つ星 >= 2000）
- [ ] リザルト画面にすべての情報が表示されること
- [ ] SNS シェアテキストにスコアとランクが含まれること
- [ ] 既存のテスト（`jest`）がすべてパスすること
- [ ] `checkFileSize` が削除されていること

### Phase 2 完了時の検証

- [ ] BGM が 4 トラック切り替え可能で正常にループ再生されること
- [ ] BGM 音量スライダーが機能し、設定が localStorage に保存されること
- [ ] ブラウザ自動再生制限が適切にハンドリングされること（ユーザー操作後に再生開始）
- [ ] スライド SE が 600Hz/0.05s で再生されること
- [ ] 正解位置 SE が 880Hz/0.12s で再生されること
- [ ] 完成 SE が 523Hz/0.3s で再生されること
- [ ] BGM と SE が同時に正常に再生されること
- [ ] 正解位置で緑ボーダーが 0.5s フラッシュすること
- [ ] 完成時にパーティクルアニメーションが表示されること
- [ ] スワイプ操作で正しい方向にピースが移動すること
- [ ] スワイプ閾値（30px）未満の動きがクリックとして処理されること
- [ ] キーボード操作（Arrow/WASD/H/R/M）が正常に機能すること
- [ ] モバイル端末での動作確認（iOS Safari、Android Chrome）

### Phase 3 完了時の検証

- [ ] 6 テーマがすべて表示されること
- [ ] 初期解放テーマ（イラストギャラリー、世界の風景、ノスタルジー）が選択可能であること
- [ ] 「海と空」が 5 回クリアで解放されること
- [ ] 「四季」が 10 回クリアで解放されること
- [ ] 「ミステリー」が全テーマ 1 回以上クリアで解放されること
- [ ] ベストスコアボードが画像×難易度ごとに正しく表示されること
- [ ] ベストスコア更新時に UI でハイライトされること
- [ ] ランクバッジが画像選択画面に正しく表示されること
- [ ] 既存の `ClearHistory` データが `PuzzleRecord` に正しくマイグレーションされること
- [ ] 新規画像 12 枚がすべて正常に表示されること
- [ ] 新規動画 12 本がすべて正常に再生されること

---

## 8. 変更しないもの

以下は本ブラッシュアップの対象外とし、現行のまま維持する:

- Jotai によるグローバル状態管理
- CSS Grid + background-position によるピースレンダリング
- styled-components によるスタイリング
- 難易度レンジ（2x2〜32x32 の 9 段階）
- SNS シェア機能（テキスト内容のみ拡充）
- 動画再生機能（新規画像への対応のみ追加）
- 逆操作シャッフルロジック（解法保証アルゴリズム）
- React Router によるルーティング（`/puzzle` パス）
