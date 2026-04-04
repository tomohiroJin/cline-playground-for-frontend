# Air Hockey S8 — 技術仕様書

> 作成日: 2026-04-04

---

## S8-1: AirHockeyGame.tsx Hook 分割リファクタリング仕様

### 現状

- `AirHockeyGame.tsx`: 586 行
- useState: 10 個、useRef: 12 個、useCallback: 25+ 個、useMemo: 14 個
- 責務が混在: UI 状態管理 + ストーリー派生データ + フリーバトル派生データ + 2v2 セットアップ + イベントハンドラ

### 目標

- AirHockeyGame.tsx を **350 行以下** に削減
- 各 Hook は **単一責務** を持つ
- **外部動作に変更なし**（pure refactoring）

### Hook 仕様

#### 1. `useUIOverlayState()`

**ファイル**: `presentation/hooks/useUIOverlayState.ts`

```typescript
type UseUIOverlayStateReturn = {
  // ヘルプ
  showHelp: boolean;
  setShowHelp: (v: boolean) => void;
  // チュートリアル
  showTutorial: boolean;
  setShowTutorial: (v: boolean) => void;
  isHelpMode: boolean;
  setIsHelpMode: (v: boolean) => void;
  handleTutorialComplete: () => void;
  // 設定
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  // 終了確認
  showExitConfirm: boolean;
  setShowExitConfirm: (v: boolean) => void;
  // キャラ図鑑
  selectedCharacterId: string | undefined;
  setSelectedCharacterId: (id: string | undefined) => void;
};
```

**責務**: モーダル/オーバーレイの表示状態管理。`handleTutorialComplete` はチュートリアル完了時のヘルプモード解除ロジックを含む。

#### 2. `useStoryScreen(mode)`

**ファイル**: `presentation/hooks/useStoryScreen.ts`

```typescript
type UseStoryScreenParams = {
  currentStage: StageDefinition | undefined;
};

type UseStoryScreenReturn = {
  cpuCharacter: Character | undefined;
  storyCharacters: { player: Character; cpu: Character } | undefined;
  stageBackgroundUrl: string | undefined;
  hasNextStage: boolean;
  storyAiConfig: AiBehaviorConfig | undefined;
};
```

**責務**: ストーリーモード画面で必要な派生データの算出。すべて useMemo で実装。

#### 3. `useFreeBattleScreen(mode)`

**ファイル**: `presentation/hooks/useFreeBattleScreen.ts`

```typescript
type UseFreeBattleScreenParams = {
  difficulty: Difficulty;
  selectedCpuCharacter: Character | undefined;
  unlockedIds: string[];
};

type UseFreeBattleScreenReturn = {
  freeBattleAiConfig: AiBehaviorConfig;
  freeBattleCpuCharacter: Character;
  freeBattleSelectableCharacters: Character[];
};
```

**責務**: フリーバトル画面で必要な AI 設定・キャラリストの算出。

#### 4. `usePairMatchSetup(mode, freeBattleSelectableCharacters)`

**ファイル**: `presentation/hooks/usePairMatchSetup.ts`

```typescript
type UsePairMatchSetupReturn = {
  pairAlly: Character;
  pairEnemy1: Character;
  pairEnemy2: Character;
  resultPlayerCharacter: Character;
  resultOpponentCharacter: Character;
  currentCpuName: string;
};
```

**責務**: 2v2 ペアマッチのデフォルトキャラ算出とリザルト画面用キャラ解決。

#### 5. `useGameHandlers(...)`

**ファイル**: `presentation/hooks/useGameHandlers.ts`

```typescript
type UseGameHandlersParams = {
  mode: UseGameModeReturn;
  nav: UseScreenNavigationReturn;
  ui: UseUIOverlayStateReturn;
  audio: UseAudioManagerReturn;
  dex: UseCharacterDexReturn;
  story: UseStoryScreenReturn;
  freeBattle: UseFreeBattleScreenReturn;
  pairMatch: UsePairMatchSetupReturn;
  gameRefs: GameLoopRefs;
  startGame: (fieldOverride?: FieldConfig, gameModeOverride?: GameMode) => void;
};

type UseGameHandlersReturn = {
  // メニュー系
  handleFreeStart: () => void;
  handleStoryClick: () => void;
  handleDailyChallengeClick: () => void;
  handleDailyChallengeStart: () => void;
  handleBackToMenu: () => void;
  handleBackFromDex: () => void;
  // ストーリー系
  handleSelectStage: (stage: StageDefinition) => void;
  handleStoryReset: () => void;
  handleBackFromStageSelect: () => void;
  handleBackToStageSelect: () => void;
  handleNextStage: () => void;
  handlePostDialogueComplete: () => void;
  // VS 画面系
  handleVsComplete: () => void;
  handlePairMatchVsComplete: () => void;
  // ゲーム中
  handleGameMenuClick: () => void;
  handleExitConfirm: () => void;
  handleExitCancel: () => void;
  handleScreenChange: (newScreen: string) => void;
  // キャラ選択系
  handleFreeBattleCharacterConfirm: (character: Character) => void;
  handleStartBattle: (config: TwoPlayerConfig) => void;
  handleBackToCharacterSelect: () => void;
  // 2v2 系
  handleTwoPlayerClick: () => void;
  handlePairMatchClick: () => void;
  handlePairMatchStart: () => void;
  handleBackToTeamSetup: () => void;
  // リザルト系
  handleResultBackToMenu: () => void;
  handleAcceptDifficulty: (d: Difficulty) => void;
};
```

**責務**: 全イベントハンドラの集約。AirHockeyGame.tsx の useCallback 群をそのまま移動。

> **注意**: 実装後に useGameHandlers が 200 行を超えた場合は、以下の二次分割を検討する:
> - `useMenuHandlers` — メニュー遷移系（handleFreeStart, handleStoryClick 等）
> - `useGameSessionHandlers` — ゲーム中操作系（handleGameMenuClick, handleExitConfirm 等）
> - `useStoryHandlers` — ストーリー固有系（handleSelectStage, handleNextStage 等）
>
> ただしまずは 1 Hook に集約し、行数で判断する段階的アプローチを採用。

### リファクタリング手順

1. `useUIOverlayState` を抽出 → CI 確認
2. `useStoryScreen` を抽出 → CI 確認
3. `useFreeBattleScreen` を抽出 → CI 確認
4. `usePairMatchSetup` を抽出 → CI 確認
5. `useGameHandlers` を抽出 → CI 確認
6. AirHockeyGame.tsx の最終整理 → CI 確認

---

## S8-2: ConfirmDialog CSS Transition アニメーション仕様

### 現状

- `isOpen === false` のとき `return null`（即座に DOM から除去）
- アニメーションなし

### 設計

#### 状態遷移

```
closed → opening → open → closing → closed
         (200ms)          (150ms)
```

#### CSS プロパティ

```css
/* opening → open */
.confirm-dialog-overlay {
  opacity: 0 → 1;
  transition: opacity 200ms ease-out;
}

.confirm-dialog-box {
  transform: scale(0.95) → scale(1);
  opacity: 0 → 1;
  transition: transform 200ms ease-out, opacity 200ms ease-out;
}

/* open → closing */
.confirm-dialog-overlay {
  opacity: 1 → 0;
  transition: opacity 150ms ease-in;
}

.confirm-dialog-box {
  transform: scale(1) → scale(0.95);
  opacity: 1 → 0;
  transition: transform 150ms ease-in, opacity 150ms ease-in;
}

/* prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .confirm-dialog-overlay,
  .confirm-dialog-box {
    transition-duration: 0ms;
  }
}
```

#### 実装方針

- `isOpen` が true になったとき、DOM をマウントし `requestAnimationFrame` で opening クラスを付与
- `isOpen` が false になったとき、closing クラスを付与し `onTransitionEnd` で DOM アンマウント
- **操作ブロック**: `closing` フェーズ中はオーバーレイとボタンに `pointer-events: none` を適用し、`onConfirm` / `onCancel` の再発火を防止
- **フォールバック**: `setTimeout(200)` で `onTransitionEnd` が発火しなかった場合を処理
- styled-components は使わず、インラインスタイル + state で管理（既存パターンに合わせる）

#### フォーカストラップ

現在の実装は暗黙的なフォーカス管理（cancelRef への初期フォーカスのみ）。明示的なフォーカストラップを追加:

```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') { onCancel(); return; }
  if (e.key === 'Tab') {
    const focusable = [cancelRef.current, confirmRef.current].filter(Boolean);
    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
    if (e.shiftKey) {
      // 前へ: 先頭なら末尾に
      const nextIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
      focusable[nextIndex]?.focus();
    } else {
      // 次へ: 末尾なら先頭に
      const nextIndex = currentIndex >= focusable.length - 1 ? 0 : currentIndex + 1;
      focusable[nextIndex]?.focus();
    }
    e.preventDefault();
  }
};
```

#### Transition タイミングの根拠

| パラメータ | 値 | 根拠 |
|-----------|-----|------|
| opening duration | 200ms | Material Design standard easing 推奨範囲（150-300ms） |
| closing duration | 150ms | closing は opening より短い: ユーザー意図の結果であり確認時間不要（Nielsen Norman Group） |
| opening easing | ease-out | 「現れる」動作は減速して着地する方が自然 |
| closing easing | ease-in | 「消える」動作は加速して退場する方が自然 |

#### テスト追加

- ダイアログ開閉アニメーション状態のテスト（opening → open → closing → closed）
- `prefers-reduced-motion` 時の動作テスト（`matchMedia` モック）
- フォールバック timer のテスト
- closing フェーズ中のクリック無視テスト
- フォーカストラップのテスト（Tab / Shift+Tab でボタン間ループ）

---

## S8-3: ストーリー Chapter 2 実装仕様

### 新規ファイル

| ファイル | 内容 |
|---------|------|
| `core/chapter2-dialogue-data.ts` | Chapter 2 全ステージのダイアログデータ |
| `core/chapter2-stages.ts` | Chapter 2 のステージ定義（StageDefinition[]） |

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `core/characters.ts` | カナタ・リク・シオンのキャラクター定義追加 |
| `core/character-ai-profiles.ts` | カナタの AI プロファイル追加 |
| `core/story-balance.ts` | Stage 2-1〜2-4 のバランス設定追加 |
| `core/story.ts` | Chapter 2 ステージの登録（STAGES 配列に追加） |
| `core/config.ts` | ~~新フィールド追加~~ → **不要**（zigzag, fortress, bastion, pillars は定義済み。バランス微調整が必要な場合のみ変更） |

### キャラクター定義

#### カナタ（白波カナタ）— フル実装

```typescript
{
  id: 'kanata',
  name: 'カナタ',
  icon: '/assets/characters/kanata.png',
  color: '#1abc9c',
  reactions: {
    onScore: ['あはは、引っかかった♪', 'ね、読めなかったでしょ？'],
    onConcede: ['お、見抜かれた。やるじゃん', 'へぇ…面白いね'],
    onWin: ['楽しかったよ。またやろ？'],
    onLose: ['あはは、読まれちゃったか。キミ、面白いね'],
  },
  portrait: {
    normal: '/assets/portraits/kanata-normal.png',
    happy: '/assets/portraits/kanata-happy.png',
  },
  vsImage: '/assets/vs/kanata-vs.png',
}
```

#### リク（風早リク）— ダイアログ出演のみ（フリーバトル非対象）

```typescript
{
  id: 'riku',
  name: 'リク',
  icon: '/assets/characters/riku.png',
  color: '#f39c12',
  reactions: {
    onScore: ['速さが勝負だ！', 'ついてこれるか？'],
    onConcede: ['く…！', 'まだまだ…！'],
    onWin: ['スピードが全てだ', '俺の速さ、見えたか？'],
    onLose: ['速さだけじゃ…ダメなのか', '…次は負けない'],
  },
  portrait: {
    normal: '/assets/portraits/riku-normal.png',
    happy: '/assets/portraits/riku-happy.png',
  },
  vsImage: '/assets/vs/riku-vs.png',
}
```

#### シオン（朝霧シオン）— ダイアログ出演のみ（フリーバトル非対象）

```typescript
{
  id: 'shion',
  name: 'シオン',
  icon: '/assets/characters/shion.png',
  color: '#bdc3c7',
  reactions: {
    onScore: ['…予定通り', 'データ通りの軌道ね'],
    onConcede: ['…興味深い', '…想定外の変数ね'],
    onWin: ['データ通りの結果ね', '分析は正確だった'],
    onLose: ['…想定外。もっとデータが必要ね', '…面白い。次はもっと精度を上げる'],
  },
  portrait: {
    normal: '/assets/portraits/shion-normal.png',
    happy: '/assets/portraits/shion-happy.png',
  },
  vsImage: '/assets/vs/shion-vs.png',
}
```

### AI プロファイル（カナタ）

```typescript
kanata: {
  aggressiveness: 0.4,
  defenseStyle: 'wide',
  deflectionBias: 0.6,       // 壁バウンスを多用
  reactionDelay: 100,
  teamRole: 'balanced',
  sidePreference: 0.0,
  adaptability: 0.5,
}
```

### ステージバランス設定

#### Stage 2-1: 嵐の前の一打（練習試合 vs ソウタ）

```typescript
'2-1': {
  ai: {
    maxSpeed: 1.8,
    predictionFactor: 1.0,
    wobble: 35,
    skipRate: 0.05,
    centerWeight: 0.7,
    wallBounce: false,
    playStyle: CHARACTER_AI_PROFILES['rookie'],
  },
  itemSpawnInterval: 5000,
  comebackThreshold: 3,
  comebackMalletBonus: 0.1,
  comebackGoalReduction: 0.1,
}
```

#### Stage 2-2: 堅実なる壁（1 回戦 vs ケンジ）

```typescript
'2-2': {
  ai: {
    maxSpeed: 3.5,
    predictionFactor: 6,
    wobble: 8,
    skipRate: 0.01,
    centerWeight: 0.4,
    wallBounce: false,
    playStyle: CHARACTER_AI_PROFILES['regular'],
  },
  itemSpawnInterval: 5000,
  comebackThreshold: 3,
  comebackMalletBonus: 0.1,
  comebackGoalReduction: 0.1,
}
```

#### Stage 2-3: 幻惑の罠（準決勝 vs カナタ）

```typescript
'2-3': {
  ai: {
    maxSpeed: 3.8,
    predictionFactor: 5,
    wobble: 20,
    skipRate: 0,
    centerWeight: 0.1,
    wallBounce: true,
    playStyle: CHARACTER_AI_PROFILES['kanata'],
  },
  itemSpawnInterval: 3500,
  comebackThreshold: 2,
  comebackMalletBonus: 0.15,
  comebackGoalReduction: 0.1,
}
```

#### Stage 2-4: 氷の頂へ（決勝 vs レン）

```typescript
'2-4': {
  ai: {
    maxSpeed: 6.5,
    predictionFactor: 13,
    wobble: 0,
    skipRate: 0,
    centerWeight: 0,
    wallBounce: true,
    playStyle: CHARACTER_AI_PROFILES['ace'],
  },
  itemSpawnInterval: 5000,
  comebackThreshold: 2,
  comebackMalletBonus: 0.2,
  comebackGoalReduction: 0.15,
}
```

### フィールド定義（既存を使用）

以下のフィールドは `config.ts` に **定義済み**。新規作成は不要:

| Field | 既存 obstacles | goalSize | 色 | destructible |
|-------|---------------|----------|-----|-------------|
| zigzag | 3 個（(150,360,r24), (450,600,r24), (150,840,r24)） | 180 | #ffaa00 | No |
| fortress | 4 個（ゴール前コーナー配置、r21） | 140 | #ff4488 | Yes（HP3, 5s respawn） |
| bastion | 7 個（上下壁 + 中央ブロック、r23-30） | 160 | #ff8800 | Yes（HP3, 5s respawn） |
| pillars | 5 個（対称配置、r27-33） | 160 | #ff00ff | No |

> バランステスト後に微調整が必要な場合のみ、障害物の位置・サイズを変更する。

### ダイアログデータ構造

各ステージで以下のダイアログ配列を定義:

- `preDialogue`: 試合前会話（3〜6 行）
- `postWinDialogue`: 勝利後会話（3〜5 行）
- `postLoseDialogue`: 敗北後会話（2〜4 行）

**Stage 2-4 特殊**:
- `isChapterFinale: true` — 勝利時に VictoryCutIn を表示
- 勝利後にシオンの 1 行台詞を追加
- 敗北後にもシオンの別台詞を追加

### キャラクター図鑑（CharacterDex）解放条件

| キャラ | 解放条件 | フリーバトル選択可能 |
|--------|---------|-------------------|
| カナタ | Stage 2-3 クリア | はい（wallBounce 特化 AI） |
| リク | Stage 2-4 クリア（観客席登場） | いいえ（Chapter 3 以降で対戦予定） |
| シオン | Stage 2-4 クリア（エピローグ台詞） | いいえ（Chapter 3 以降で対戦予定） |

> `characters.ts` の解放判定ロジックにステージ ID ベースの条件を追加する。
> リク・シオンは `ALWAYS_UNLOCKED_IDS` に含めず、図鑑では「???」表示にする。

### アセット対応

**Phase S8-3 では画像ファイルを作成しない。`CharacterAvatar` の既存フォールバック機能を活用**:

- キャラアイコン: 画像パスは設定するが、ファイル未配置 → `onError` で `CharacterAvatar` のイニシャル + テーマカラー背景フォールバックが表示される
- ポートレート: 同上（`DialogueOverlay` のフォールバック表示に依存）
- VS 画像: 同上
- 背景画像: 既存背景を流用

> 画像の作成・差し替えは別タスクで AI 生成ツールを使用して対応する。

### VictoryCutIn Chapter 2 演出差分

Chapter 1 と Chapter 2 で達成の文脈が異なるため、演出に差分を設ける:

| 要素 | Chapter 1（部活内） | Chapter 2（地区大会優勝） |
|------|-------------------|------------------------|
| 背景色 | オレンジ/ゴールド（温かみ） | ゴールド + 白（華やかさ） |
| パーティクル | 標準量 | 1.5 倍量（紙吹雪演出） |
| テキスト | 「第1章 クリア！」 | 「地区大会 優勝！」 |

### テスト方針

- 新規ステージ定義のバリデーションテスト（ID 一意性、必須フィールド）
- ダイアログデータの整合性テスト:
  - `characterId` が有効なキャラ ID であること
  - 各ダイアログ配列が空でないこと
  - 連続する同一 `characterId` の台詞がないこと（不自然な独白防止）
- AI バランス設定のテスト（パラメータ範囲チェック）
- ストーリー進行テスト（2-1 → 2-2 → 2-3 → 2-4 のアンロック順序）
- 新キャラの AI プロファイルテスト
- キャラ図鑑解放テスト（カナタは 2-3 クリアで解放、リク・シオンは 2-4 クリアで解放）
