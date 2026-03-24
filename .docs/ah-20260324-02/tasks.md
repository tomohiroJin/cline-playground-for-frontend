# Step 3: フリー対戦のキャラ選択 — タスクチェックリスト

## 進捗サマリー

| フェーズ | ステータス | タスク数 | 完了日 |
|---------|-----------|---------|--------|
| S3-1 状態管理・型の拡張 | [ ] 未着手 | 5 | |
| S3-2 キャラ選択 UI | [ ] 未着手 | 4 | |
| S3-3 ゲームプレイへの反映 | [ ] 未着手 | 5 | |
| S3-4 テスト・品質保証 | [ ] 未着手 | 8 | |

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

- [ ] `selectedCpuCharacter: Character | undefined` 状態を追加
- [ ] `setSelectedCpuCharacter` セッターを公開
- [ ] `resetToFree()` 時に `undefined` にリセット

### S3-1-2: フリー対戦用 AI 設定構築関数

- [ ] `core/story-balance.ts` に `buildFreeBattleAiConfig(difficulty, characterId?)` を追加
- [ ] `AI_BEHAVIOR_PRESETS[difficulty]` の基本パラメータ + `getCharacterAiProfile(characterId)` の playStyle を合成
- [ ] `characterId` 未指定時は `AI_BEHAVIOR_PRESETS[difficulty]` をそのまま返す

### S3-1-3: 画面遷移に 'freeBattleCharacterSelect' を追加

- [ ] 画面状態に `'freeBattleCharacterSelect'` を追加
- [ ] `handleFreeStart` を `navigateTo('freeBattleCharacterSelect')` に変更

**確認**:
- [ ] `tsc --noEmit` で型エラーなし

---

## Phase S3-2: キャラ選択 UI

### S3-2-1: FreeBattleCharacterSelect コンポーネント作成

- [ ] `components/FreeBattleCharacterSelect.tsx` を新規作成
- [ ] Props: `characters`, `unlockedIds`, `difficulty`, `onConfirm`, `onBack`
- [ ] キャラクターグリッド表示（アイコン + 名前）
- [ ] 未解放キャラのロック表示（グレーアウト + タップ不可）
- [ ] 選択中キャラのハイライト（キャラカラーのボーダー）
- [ ] 選択中キャラの詳細表示（名前 + プレイスタイル概要）
- [ ] 難易度に応じたデフォルト選択（easy→ルーキー, normal→レギュラー, hard→エース）
- [ ] 「対戦開始！」確定ボタン
- [ ] 「戻る」ボタン

### S3-2-2: AirHockeyGame にキャラ選択画面を統合

- [ ] `freeBattleCharacterSelect` 画面のレンダリングを追加
- [ ] 利用可能キャラリスト: `getBattleCharacters()` + 図鑑解放済みストーリーキャラ
- [ ] `handleFreeBattleCharacterConfirm` コールバックを実装
- [ ] 「戻る」で `'menu'` に遷移

**確認**:
- [ ] `tsc --noEmit` で型エラーなし
- [ ] キャラ選択画面が正しく表示される

---

## Phase S3-3: ゲームプレイへの反映

### S3-3-1: フリー対戦で選択キャラの aiConfig をゲームループに渡す

- [ ] `useGameLoop` の `config.aiConfig` にフリー対戦用 AI 設定を設定
- [ ] `buildFreeBattleAiConfig(difficulty, selectedCpuCharacter.id)` を使用
- [ ] キャラ未選択時は `undefined`（従来のプリセットフォールバック）

### S3-3-2: フリー対戦に VS 画面を追加

- [ ] キャラ選択確定後に VsScreen を表示
- [ ] VsScreen に「プレイヤー（アキラ）vs 選択キャラ」を表示
- [ ] VS 演出完了後に `startGame()` を呼ぶ

### S3-3-3: リザルト画面で選択キャラを表示

- [ ] `ResultScreen` の `cpuCharacter` にフリー対戦でも選択キャラを渡す
- [ ] 選択キャラ未設定時は従来の `freeBattleCpuCharacter` にフォールバック

**確認**:
- [ ] `tsc --noEmit` で型エラーなし
- [ ] ゲーム中に選択キャラの AI 個性が反映される

---

## Phase S3-4: テスト・品質保証

### S3-4-1: AI 設定構築関数のテスト

- [ ] `core/story-balance.test.ts` に `buildFreeBattleAiConfig` テストを追加
  - [ ] 難易度の基本パラメータ（maxSpeed 等）が維持される
  - [ ] 選択キャラの playStyle が反映される
  - [ ] characterId 未指定で AI_BEHAVIOR_PRESETS をそのまま返す
  - [ ] 未知 characterId で DEFAULT_PLAY_STYLE にフォールバック

### S3-4-2: キャラ選択コンポーネントのテスト

- [ ] `components/FreeBattleCharacterSelect.test.tsx` を新規作成
  - [ ] 全キャラクターが表示される
  - [ ] 未解放キャラがタップ不可
  - [ ] キャラ選択で onConfirm が呼ばれる
  - [ ] 戻るボタンで onBack が呼ばれる

### S3-4-3: 既存テスト全パス確認

- [ ] `npm test` で全テストパス
- [ ] `tsc --noEmit` で型エラーなし

### S3-4-4: ビルド確認

- [ ] `npm run build` でビルド成功

---

## 各フェーズの共通完了条件

各フェーズ完了時に以下をすべて確認:

- [ ] `tsc --noEmit` で型エラーなし
- [ ] 既存モード（フリー対戦、ストーリー、2P、デイリー、図鑑）に影響なし
