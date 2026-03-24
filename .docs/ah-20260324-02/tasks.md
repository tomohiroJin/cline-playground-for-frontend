# Step 3: フリー対戦のキャラ選択 — タスクチェックリスト

## 進捗サマリー

| フェーズ | ステータス | タスク数 | 完了日 |
|---------|-----------|---------|--------|
| S3-1 状態管理・型の拡張 | [x] 完了 | 5 | 2026-03-24 |
| S3-2 キャラ選択 UI | [x] 完了 | 4 | 2026-03-24 |
| S3-3 ゲームプレイへの反映 | [x] 完了 | 5 | 2026-03-24 |
| S3-4 テスト・品質保証 | [x] 完了 | 8 | 2026-03-24 |
| S3-5a バグ修正（winScore） | [ ] 未着手 | 1 | |
| S3-5b UI 改善（FB対応） | [ ] 未着手 | 7 | |

### 並行作業ガイド

```
S3-1（状態管理・型の拡張）
  ├──→ S3-2（キャラ選択 UI）        ← S3-1 完了後に着手
  │     └──→ S3-3（ゲームプレイ反映） ← S3-2 完了後に着手
  └──→ S3-4-1（AI 設定テスト）       ← S3-1 完了後すぐ並行可
              └──→ S3-4-2〜5        ← S3-3 完了後に一括
```

---

## Phase S3-1: 状態管理・型の拡張

### S3-1-1: useGameMode に selectedCpuCharacter 状態を追加

- [x] `selectedCpuCharacter: Character | undefined` 状態を追加
- [x] `setSelectedCpuCharacter` セッターを公開
- [x] `resetToFree()` 時に `undefined` にリセット

### S3-1-2: フリー対戦用 AI 設定構築関数

- [x] `core/story-balance.ts` に `buildFreeBattleAiConfig(difficulty, characterId?)` を追加
- [x] `AI_BEHAVIOR_PRESETS[difficulty]` の基本パラメータ + `getCharacterAiProfile(characterId)` の playStyle を合成
- [x] `characterId` 未指定時は `AI_BEHAVIOR_PRESETS[difficulty]` をそのまま返す

### S3-1-3: 画面遷移に 'freeBattleCharacterSelect' を追加

- [x] 画面状態に `'freeBattleCharacterSelect'` を追加
- [x] `handleFreeStart` を `navigateTo('freeBattleCharacterSelect')` に変更

**確認**:
- [x] `tsc --noEmit` で型エラーなし

---

## Phase S3-2: キャラ選択 UI

### S3-2-1: FreeBattleCharacterSelect コンポーネント作成

- [x] `components/FreeBattleCharacterSelect.tsx` を新規作成
- [x] Props: `characters`, `unlockedIds`, `difficulty`, `onConfirm`, `onBack`
- [x] キャラクターグリッド表示（アイコン + 名前）
- [x] 未解放キャラのロック表示（グレーアウト + タップ不可）
- [x] 選択中キャラのハイライト（キャラカラーのボーダー）
- [x] 選択中キャラの詳細表示（名前）
- [x] 難易度に応じたデフォルト選択（easy→ルーキー, normal→レギュラー, hard→エース）
- [x] 「対戦開始！」確定ボタン
- [x] 「戻る」ボタン

### S3-2-2: AirHockeyGame にキャラ選択画面を統合

- [x] `freeBattleCharacterSelect` 画面のレンダリングを追加
- [x] 利用可能キャラリスト: フリー対戦キャラ + 図鑑解放済みストーリーキャラ
- [x] `handleFreeBattleCharacterConfirm` コールバックを実装
- [x] 「戻る」で `'menu'` に遷移

**確認**:
- [x] `tsc --noEmit` で型エラーなし

---

## Phase S3-3: ゲームプレイへの反映

### S3-3-1: フリー対戦で選択キャラの aiConfig をゲームループに渡す

- [x] `useGameLoop` の `config.aiConfig` にフリー対戦用 AI 設定を設定
- [x] `buildFreeBattleAiConfig(difficulty, selectedCpuCharacter.id)` を使用
- [x] キャラ未選択時は `undefined`（従来のプリセットフォールバック）

### S3-3-2: フリー対戦に VS 画面を追加

- [x] キャラ選択確定後に VsScreen を表示
- [x] VsScreen に「プレイヤー（アキラ）vs 選択キャラ」を表示
- [x] VS 演出完了後に `startGame()` を呼ぶ

### S3-3-3: リザルト画面で選択キャラを表示

- [x] `ResultScreen` の `cpuCharacter` にフリー対戦でも選択キャラを渡す
- [x] 選択キャラ未設定時は従来の `freeBattleCpuCharacter` にフォールバック

**確認**:
- [x] `tsc --noEmit` で型エラーなし

---

## Phase S3-4: テスト・品質保証

### S3-4-1: AI 設定構築関数のテスト

- [x] `core/story-balance.test.ts` に `buildFreeBattleAiConfig` テストを追加
  - [x] 難易度の基本パラメータ（maxSpeed 等）が維持される
  - [x] 選択キャラの playStyle が反映される
  - [x] characterId 未指定で AI_BEHAVIOR_PRESETS をそのまま返す
  - [x] 未知 characterId で DEFAULT_PLAY_STYLE にフォールバック

### S3-4-2: キャラ選択コンポーネントのテスト

- [x] `components/FreeBattleCharacterSelect.test.tsx` を新規作成
  - [x] 全キャラクターが表示される
  - [x] 未解放キャラがタップ不可
  - [x] キャラ選択で onConfirm が呼ばれる
  - [x] 戻るボタンで onBack が呼ばれる

### S3-4-3: 既存テスト全パス確認

- [x] `npm test` で全テストパス（7211 テスト全パス）
- [x] `tsc --noEmit` で型エラーなし

### S3-4-4: ビルド確認

- [x] `npm run build` でビルド成功

---

## Phase S3-5a: バグ修正 — winScore 未反映

### S3-5a-1: aiConfig の useMemo メモ化

- [ ] `buildFreeBattleAiConfig` の結果を `useMemo` でメモ化
- [ ] 依存配列: `[mode.difficulty, mode.selectedCpuCharacter]`
- [ ] `useGameLoop` に渡す `aiConfig` をメモ化した値に変更

**確認**:
- [ ] フリー対戦で winScore=3 のとき 3 点でゲーム終了する
- [ ] `tsc --noEmit` で型エラーなし
- [ ] 既存テストパス

---

## Phase S3-5b: UI 改善（フィードバック対応）

### S3-5-1: キャラカードにアイコン画像を使用

- [ ] `character.icon` を `<img>` で表示（2P 対戦の `styles.cardIcon` と同パターン）
- [ ] ロック時はグレーフィルター + 鍵アイコンオーバーレイ
- [ ] カードサイズを 2P 対戦に合わせる（`CARD_SIZE = 80`, `CARD_ICON_SIZE = 36`）

### S3-5-2: ヘッダーレイアウト改善

- [ ] 「← 戻る」ボタンのスタイルを 2P 対戦と統一
- [ ] タイトルとの間にスペースを確保
- [ ] セクション区切り線を追加（`sectionTitle` スタイル）

### S3-5-3: レスポンシブ・サイズ統一

- [ ] `container` を `overflow: hidden` に変更
- [ ] グリッドを `repeat(4, 80px)` + `justifyContent: 'center'` に変更
- [ ] 「対戦開始！」ボタンを `width: 100%` + グラデーション背景に統一

### S3-5-4: 選択中キャラの詳細表示を充実

- [ ] アイコン画像（大）+ 名前 + キャラカラーのアクセント表示

**確認**:
- [ ] `tsc --noEmit` で型エラーなし
- [ ] 既存テストパス
- [ ] 2P 対戦と見た目が統一されている

---

## 各フェーズの共通完了条件

各フェーズ完了時に以下をすべて確認:

- [x] `tsc --noEmit` で型エラーなし
- [x] 既存モード（フリー対戦、ストーリー、2P、デイリー、図鑑）に影響なし
