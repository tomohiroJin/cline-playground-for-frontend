# Step 3: フリー対戦のキャラ選択 — 仕様書

## S-01: AI 設定構築関数

### buildFreeBattleAiConfig

```typescript
// core/story-balance.ts に追加
export const buildFreeBattleAiConfig = (
  difficulty: Difficulty,
  characterId?: string
): AiBehaviorConfig => {
  const base = AI_BEHAVIOR_PRESETS[difficulty];
  if (!characterId) return base;
  return {
    ...base,
    playStyle: getCharacterAiProfile(characterId),
  };
};
```

- 難易度の基本パラメータ（maxSpeed, predictionFactor, wobble 等）は維持
- 選択キャラの playStyle のみ差し替え
- `characterId` 未指定時は従来通りのプリセットを返す

---

## S-02: useGameMode 拡張

### 追加状態

```typescript
// selectedCpuCharacter: フリー対戦で選択した CPU キャラクター
selectedCpuCharacter: Character | undefined;
setSelectedCpuCharacter: (character: Character | undefined) => void;
```

### resetToFree 更新

```typescript
const resetToFree = () => {
  // 既存のリセット処理...
  setSelectedCpuCharacter(undefined);  // キャラ選択もリセット
};
```

---

## S-03: 画面遷移

### 追加画面状態

`'freeBattleCharacterSelect'` を画面遷移に追加する。

### フロー

```
TitleScreen
  ↓ 「フリーたいせん」
'freeBattleCharacterSelect'（CPU キャラ選択）
  ↓ キャラ選択 + 「対戦開始！」
'vsScreen'（VS 演出）
  ↓ 演出完了
'game'（ゲーム開始）
```

### 「戻る」フロー

```
'freeBattleCharacterSelect' → 「戻る」 → 'menu'（TitleScreen）
```

---

## S-04: FreeBattleCharacterSelect コンポーネント

### Props

```typescript
type FreeBattleCharacterSelectProps = {
  /** 選択可能なキャラクターリスト */
  characters: Character[];
  /** 解放済みキャラクター ID のセット */
  unlockedIds: string[];
  /** 現在の難易度（表示用） */
  difficulty: Difficulty;
  /** キャラ選択確定コールバック */
  onConfirm: (character: Character) => void;
  /** 戻るボタンコールバック */
  onBack: () => void;
};
```

### UI レイアウト

```
┌─────────────────────────────────┐
│ ← 戻る    対戦相手を選べ！       │  ヘッダー
├─────────────────────────────────┤
│ 難易度: ★★☆ ふつう              │  難易度表示
├─────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐      │
│ │ icon │ │ icon │ │ icon │      │  キャラグリッド
│ │ルーキー│ │レギュラー│ │エース│      │  （4列、スクロール可能）
│ └──────┘ └──────┘ └──────┘      │
│ ┌──────┐ ┌──────┐ ┌──────┐      │
│ │🔒icon│ │🔒icon│ │🔒icon│      │  未解放はグレーアウト
│ │ ヒロ │ │ミサキ│ │タクマ│      │
│ └──────┘ └──────┘ └──────┘      │
├─────────────────────────────────┤
│         ┌──────────────┐         │
│ [icon]  │ キャラ名      │         │  選択中キャラの詳細
│         │ プレイスタイル │         │
│         └──────────────┘         │
├─────────────────────────────────┤
│     ［ 対戦開始！ ］             │  確定ボタン
└─────────────────────────────────┘
```

### キャラカードの状態

| 状態 | 表示 |
|------|------|
| 選択可能 | アイコン + 名前、タップで選択 |
| 選択中 | ハイライトボーダー（キャラカラー） |
| 未解放 | グレーアウト + 鍵アイコン、タップ不可 |

### 選択可能判定

```typescript
const isUnlocked = (character: Character): boolean => {
  // フリー対戦キャラ（rookie, regular, ace）は常に選択可能
  const freeBattleIds = ['rookie', 'regular', 'ace'];
  if (freeBattleIds.includes(character.id)) return true;
  // ストーリーキャラは図鑑解放済みのみ選択可能
  return unlockedIds.includes(character.id);
};
```

### デフォルト選択

- 画面表示時、難易度に対応するキャラがデフォルト選択される
  - easy → ルーキー
  - normal → レギュラー
  - hard → エース

---

## S-05: AirHockeyGame 統合

### handleFreeStart 変更

```typescript
// Before:
const handleFreeStart = () => { mode.setGameMode('free'); startGame(); };

// After:
const handleFreeStart = () => { mode.setGameMode('free'); navigateTo('freeBattleCharacterSelect'); };
```

### handleFreeBattleCharacterConfirm 追加

```typescript
const handleFreeBattleCharacterConfirm = (character: Character) => {
  mode.setSelectedCpuCharacter(character);
  navigateTo('vsScreen');
};
```

### handleVsComplete 拡張

```typescript
// フリー対戦とストーリーモードの両方に対応
const handleVsComplete = () => {
  const sf = mode.currentStage
    ? (FIELDS.find(f => f.id === mode.currentStage!.fieldId) ?? FIELDS[0])
    : mode.field;
  startGame(sf);
};
```

### useGameLoop config 更新

```typescript
config: {
  difficulty: mode.difficulty,
  field: mode.field,
  winScore: mode.winScore,
  aiConfig: mode.gameMode === 'story'
    ? storyAiConfig
    : mode.selectedCpuCharacter
      ? buildFreeBattleAiConfig(mode.difficulty, mode.selectedCpuCharacter.id)
      : undefined,
  // ...
}
```

### ResultScreen cpuCharacter 更新

```typescript
cpuCharacter: mode.gameMode === 'story'
  ? cpuCharacter
  : mode.selectedCpuCharacter ?? freeBattleCpuCharacter
```

### VsScreen 表示条件

```typescript
// フリー対戦 + キャラ選択済みの場合も VS 画面を表示
{screen === 'vsScreen' && (
  mode.gameMode === 'story' && mode.currentStage && cpuCharacter
    ? <VsScreen playerCharacter={PLAYER_CHARACTER} cpuCharacter={cpuCharacter} ... />
    : mode.selectedCpuCharacter
      ? <VsScreen playerCharacter={PLAYER_CHARACTER} cpuCharacter={mode.selectedCpuCharacter} ... />
      : null
)}
```

---

## S-06: テスト仕様

### buildFreeBattleAiConfig テスト

| テスト名 | 検証内容 |
|---------|---------|
| 難易度の基本パラメータが維持される | maxSpeed, predictionFactor 等が AI_BEHAVIOR_PRESETS と一致 |
| 選択キャラの playStyle が反映される | playStyle が getCharacterAiProfile の結果と一致 |
| characterId 未指定で AI_BEHAVIOR_PRESETS をそのまま返す | デフォルトプリセットと同一 |
| 未知の characterId で DEFAULT_PLAY_STYLE にフォールバック | playStyle が DEFAULT_PLAY_STYLE |

### FreeBattleCharacterSelect テスト

| テスト名 | 検証内容 |
|---------|---------|
| 全キャラクターが表示される | 渡された characters の名前が全て表示される |
| 未解放キャラがタップ不可 | unlockedIds に含まれないキャラのボタンが disabled |
| キャラ選択で onConfirm が呼ばれる | 解放済みキャラクリック → onConfirm(character) |
| 戻るボタンで onBack が呼ばれる | 戻るクリック → onBack() |
| 難易度に応じたデフォルト選択 | 初期表示で難易度対応キャラがハイライト |
