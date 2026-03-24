# Step 3: フリー対戦のキャラ選択 — 実装計画

## 概要

フリー対戦モードに CPU キャラクター選択機能を追加する。
現在のフリー対戦は難易度（easy/normal/hard）を選ぶと自動的にルーキー/レギュラー/エースが対戦相手に割り当てられるが、
Step 2 で実装したキャラ個性（ヒロ/ミサキ/タクマ/ユウ）を含む全キャラから選べるようにする。

## 目標

1. **フリー対戦 CPU キャラ選択画面の追加**: 難易度選択の後にキャラ選択画面を表示
2. **全キャラクターをフリー対戦で使用可能にする**: ストーリーキャラは図鑑解放後に選択可能
3. **選択したキャラの AI プロファイルをゲームに反映**: playStyle を反映
4. **VS 画面の表示**: 2P 対戦と同様にキャラ VS 演出を追加
5. **既存モードの非破壊**: ストーリー・2P・デイリー・図鑑に影響なし

## 現状分析

### フリー対戦の現在の画面フロー

```
TitleScreen（難易度・フィールド・スコア選択）
    ↓ 「フリーたいせん」ボタン
handleFreeStart()
    ↓ mode.setGameMode('free') → startGame()
ゲーム画面（CPU = getCharacterByDifficulty(difficulty)）
```

### 目標の画面フロー

```
TitleScreen（難易度・フィールド・スコア選択）
    ↓ 「フリーたいせん」ボタン
FreeBattleCharacterSelect（CPU キャラ選択）
    ↓ キャラ選択 → 「対戦開始！」
VsScreen（VS 演出）
    ↓ 演出完了
ゲーム画面（CPU = 選択したキャラ + playStyle 反映）
```

### 利用可能なキャラクター

| キャラ | ID | 解放条件 | AI プロファイル |
|--------|-----|---------|----------------|
| ルーキー | rookie | 最初から | ビギナー |
| レギュラー | regular | 最初から | オールラウンダー |
| エース | ace | 最初から | エリート |
| ヒロ | hiro | 図鑑解放済み | ストレートシューター |
| ミサキ | misaki | 図鑑解放済み | テクニシャン |
| タクマ | takuma | 図鑑解放済み | パワーバウンサー |
| ユウ | yuu | 図鑑解放済み | アナライザー |

### 既存の関連実装

- **2P 対戦のキャラ選択**: `CharacterSelectScreen.tsx` が存在するが、2P 専用設計（1P/2P スロット切り替え、`TwoPlayerConfig` 出力）。フリー対戦用には別コンポーネントが適切。
- **AI プロファイル統合**: Step 2 で `GameLoopConfig.aiConfig` を実装済み。キャラ ID から `getCharacterAiProfile(id)` で取得可能。
- **`getStoryStageBalance`**: ステージ別の AI 設定取得（ストーリーモード用）。フリー対戦では `AI_BEHAVIOR_PRESETS[difficulty]` + 選択キャラの playStyle を組み合わせる。

## 設計

### キャラ選択時の AI 設定構築

フリー対戦でキャラを選択した場合、**難易度の基本パラメータ + キャラの playStyle** を組み合わせる。

```typescript
// 難易度の基本パラメータ（速度・精度等）はそのまま
const baseConfig = AI_BEHAVIOR_PRESETS[difficulty];

// 選択キャラの playStyle で上書き
const aiConfig: AiBehaviorConfig = {
  ...baseConfig,
  playStyle: getCharacterAiProfile(selectedCharacterId),
};
```

これにより「easy のミサキ（揺さぶるが精度が低い）」「hard のユウ（高精度 + 高適応）」のように、
難易度 × キャラ個性の掛け合わせが実現する。

### 画面遷移の設計

```
AirHockeyGame.tsx のスクリーン状態に追加:
  'freeBattleCharacterSelect' — フリー対戦 CPU キャラ選択

handleFreeStart:
  mode.setGameMode('free')
  navigateTo('freeBattleCharacterSelect')  // ← 変更点

新規: handleFreeBattleCharacterSelect(character):
  mode.setSelectedCpuCharacter(character)
  navigateTo('vsScreen')  // VS 演出を表示

handleVsComplete:
  既存のストーリーモード用 + フリー対戦にも対応
  startGame()
```

### useGameMode への追加

```typescript
// 選択した CPU キャラクターを保持するための状態
selectedCpuCharacter: Character | undefined;
setSelectedCpuCharacter: (c: Character | undefined) => void;
```

---

## フェーズ計画

### 全体構成

```
Phase S3-1（状態管理・型の拡張）
  ├── S3-1-1: useGameMode に selectedCpuCharacter 状態を追加
  ├── S3-1-2: フリー対戦用 AI 設定構築関数
  └── S3-1-3: 画面遷移に 'freeBattleCharacterSelect' を追加
        ↓
Phase S3-2（キャラ選択 UI）
  ├── S3-2-1: FreeBattleCharacterSelect コンポーネント作成
  └── S3-2-2: AirHockeyGame にキャラ選択画面を統合
        ↓
Phase S3-3（ゲームプレイへの反映）
  ├── S3-3-1: フリー対戦で選択キャラの aiConfig をゲームループに渡す
  ├── S3-3-2: フリー対戦に VS 画面を追加
  └── S3-3-3: リザルト画面で選択キャラを表示
        ↓
Phase S3-4（テスト・品質保証）
  ├── S3-4-1: AI 設定構築関数のテスト
  ├── S3-4-2: キャラ選択コンポーネントのテスト
  ├── S3-4-3: 画面遷移の統合テスト
  ├── S3-4-4: 既存テスト全パス確認
  └── S3-4-5: ビルド確認
```

---

### Phase S3-1: 状態管理・型の拡張

**目的**: フリー対戦キャラ選択に必要な型とデータ基盤を整備する

#### S3-1-1: useGameMode に selectedCpuCharacter 状態を追加

- `useGameMode` フックに `selectedCpuCharacter` 状態を追加
- `setSelectedCpuCharacter` セッターを公開
- `resetToFree()` 時に `undefined` にリセット

#### S3-1-2: フリー対戦用 AI 設定構築関数

- `core/story-balance.ts` に `buildFreeBattleAiConfig(difficulty, characterId)` を追加
- `AI_BEHAVIOR_PRESETS[difficulty]` の基本パラメータ + `getCharacterAiProfile(characterId)` の playStyle を組み合わせ
- キャラ未選択時は従来通り `AI_BEHAVIOR_PRESETS[difficulty]` をそのまま返す

#### S3-1-3: 画面遷移に 'freeBattleCharacterSelect' を追加

- 画面状態の型に `'freeBattleCharacterSelect'` を追加
- `handleFreeStart` をキャラ選択画面への遷移に変更

**成果物**: 更新された useGameMode, story-balance.ts
**完了条件**: `tsc --noEmit` で型エラーなし

---

### Phase S3-2: キャラ選択 UI

**目的**: フリー対戦の CPU キャラ選択画面を作成する

#### S3-2-1: FreeBattleCharacterSelect コンポーネント作成

- `components/FreeBattleCharacterSelect.tsx` を新規作成
- Props:
  - `characters: Character[]` — 選択可能なキャラクターリスト
  - `difficulty: Difficulty` — 選択中の難易度（表示用）
  - `onSelect: (character: Character) => void` — キャラ選択コールバック
  - `onBack: () => void` — 戻るボタン
- UI 構成:
  - ヘッダー: 「対戦相手を選べ！」+ 戻るボタン
  - キャラクターグリッド: アイコン + 名前 + プレイスタイル概要
  - 未解放キャラはロック表示（アイコングレーアウト + 鍵マーク）
  - 選択中キャラのハイライト
  - 「対戦開始！」ボタン
- 既存の `CharacterSelectScreen.tsx` のスタイルを参考にする（統一感）

#### S3-2-2: AirHockeyGame にキャラ選択画面を統合

- `freeBattleCharacterSelect` 画面をレンダリング
- `handleFreeStart` を `navigateTo('freeBattleCharacterSelect')` に変更
- キャラ選択後の遷移: `handleFreeBattleCharacterConfirm` → VsScreen → ゲーム開始
- 利用可能キャラリスト: `getBattleCharacters()` + 図鑑解放済みストーリーキャラ

**成果物**: 新規 FreeBattleCharacterSelect.tsx, 更新 AirHockeyGame.tsx
**完了条件**: キャラ選択画面が表示されキャラを選べる

---

### Phase S3-3: ゲームプレイへの反映

**目的**: 選択したキャラの AI 個性をゲームに反映し、演出を追加する

#### S3-3-1: フリー対戦で選択キャラの aiConfig をゲームループに渡す

- `AirHockeyGame.tsx` の `useGameLoop` に渡す `config.aiConfig` を設定
- フリー対戦 + キャラ選択済み: `buildFreeBattleAiConfig(difficulty, characterId)`
- フリー対戦 + キャラ未選択: `undefined`（従来通り）
- ストーリーモード: 既存の `storyAiConfig`（変更なし）

#### S3-3-2: フリー対戦に VS 画面を追加

- キャラ選択確定後に VsScreen を表示
- `handleVsComplete` を拡張: フリー対戦でも `startGame()` に遷移
- VS 画面にはプレイヤー（アキラ）vs 選択キャラを表示

#### S3-3-3: リザルト画面で選択キャラを表示

- `ResultScreen` の `cpuCharacter` にフリー対戦でも選択キャラを渡す
- 現在は `freeBattleCpuCharacter`（難易度固定）→ 選択キャラに切り替え

**成果物**: 更新 AirHockeyGame.tsx
**完了条件**: 選択キャラの AI 個性がゲームに反映される

---

### Phase S3-4: テスト・品質保証

**目的**: フリー対戦キャラ選択の品質保証と既存機能の非破壊確認

#### S3-4-1: AI 設定構築関数のテスト

- `buildFreeBattleAiConfig` のユニットテスト
  - 難易度の基本パラメータが維持される
  - 選択キャラの playStyle が反映される
  - 未知キャラ ID で DEFAULT_PLAY_STYLE にフォールバック

#### S3-4-2: キャラ選択コンポーネントのテスト

- `FreeBattleCharacterSelect` のレンダリングテスト
  - 全キャラクターが表示される
  - 未解放キャラがロック表示される
  - キャラ選択時にコールバックが呼ばれる

#### S3-4-3: 画面遷移の統合テスト

- フリー対戦の画面遷移フローが正しい
- ストーリーモードの画面遷移に影響がない
- 2P 対戦の画面遷移に影響がない

#### S3-4-4: 既存テスト全パス確認

- `npm test` で全テストパス
- `tsc --noEmit` で型エラーなし

#### S3-4-5: ビルド確認

- `npm run build` でビルド成功

**成果物**: テストファイル群
**完了条件**: 全テストパス、ビルド成功

---

## 影響範囲

| ファイル | 変更内容 |
|---------|---------|
| `core/story-balance.ts` | `buildFreeBattleAiConfig` 関数を追加 |
| `components/FreeBattleCharacterSelect.tsx` | 新規: フリー対戦キャラ選択画面 |
| `presentation/AirHockeyGame.tsx` | 画面遷移・キャラ選択統合 |
| `presentation/hooks/useGameMode.ts` | `selectedCpuCharacter` 状態追加 |
| `core/types.ts` | 画面状態型に `'freeBattleCharacterSelect'` 追加（該当箇所があれば） |

## リスク管理

| リスク | 影響度 | 対策 |
|--------|--------|------|
| キャラ選択画面が 2P 用と混同される | 低 | 別コンポーネントとして実装し責務を明確に分離 |
| 難易度 × キャラ個性の組み合わせがバランスを崩す | 中 | 難易度パラメータ（速度・精度）は固定、playStyle のみ差し替え |
| 図鑑未解放キャラのロック表示が複雑になる | 低 | 既存の dex.unlockedIds を流用 |
| VS 画面追加でフリー対戦の開始が冗長に感じる | 低 | VS 画面は短めの演出（既存の VsScreen を再利用） |

## 完了後の状態

- フリー対戦で CPU キャラクターを7キャラから選択できる
- ストーリーキャラは図鑑解放後に選択可能
- 選択キャラの AI 個性がゲーム中に反映される
- VS 画面で対戦相手が表示される
- 既存モード（ストーリー・2P・デイリー・図鑑）に影響なし

---

## Phase S3-5: UI 改善（フィードバック対応）

**目的**: フリー対戦キャラ選択画面の見た目を 2P 対戦と統一し、品質を向上させる

### 背景

打鍵確認で以下のフィードバックがあった:

1. キャラカードの表示が簡素すぎる（文字1文字のみ）→ `character.icon`（アイコン画像）を使う
2. 「戻る」ボタンと「対戦相手を選べ！」がくっついている → ヘッダーレイアウトの改善
3. 画面サイズが小さく他画面と不揃い → レスポンシブ対応
4. 全体的に 2P 対戦画面と見た目を統一する

### S3-5-1: キャラカードにアイコン画像を使用

- `character.icon` を `<img>` タグで表示（2P 対戦の `styles.cardIcon` と同じパターン）
- ロック時はグレーフィルター + 鍵アイコンオーバーレイ
- カードサイズを 2P 対戦に合わせる（`CARD_SIZE = 80`, `CARD_ICON_SIZE = 36`）

### S3-5-2: ヘッダーレイアウト改善

- 「← 戻る」ボタンのスタイルを 2P 対戦と統一
- タイトルとの間にスペースを確保
- ヘッダー下部にセクション区切り線を追加

### S3-5-3: レスポンシブ対応

- `container` を `overflow: hidden` に（2P 対戦と統一）
- グリッドを `repeat(4, CARD_SIZE px)` + `justifyContent: 'center'` に変更
  - 2P 対戦と同じ固定サイズ + 中央寄せパターン
- 選択中キャラの詳細エリアを拡充
- 「対戦開始！」ボタンを 2P 対戦の `startButton` スタイル（`width: 100%`, グラデーション）に統一

### S3-5-4: 選択中キャラの詳細表示を充実

- アイコン画像（大）+ 名前 + キャラカラーのアクセント表示
- 2P 対戦の `playerPanel` に近いビジュアル

### 参考: 2P 対戦 CharacterSelectScreen のスタイルパターン

```
PANEL_ICON_SIZE = 48    // VS パネルのアイコンサイズ
CARD_ICON_SIZE = 36     // グリッドカードのアイコンサイズ
CARD_SIZE = 80          // カードの固定サイズ
GRID_GAP = 8            // グリッドギャップ

container: overflow: hidden
header: justifyContent: space-between
backButton: 「← 戻る」テキスト
grid: repeat(4, 80px) + justifyContent: center
card: 80px 固定高さ + 2px ボーダー + transition
cardIcon: img タグ + borderRadius: 50% + objectFit: cover
startButton: width: 100% + linear-gradient(135deg, #e67e22, #d35400)
```

**成果物**: 更新 FreeBattleCharacterSelect.tsx
**完了条件**: 2P 対戦と統一された見た目、レスポンシブ対応
