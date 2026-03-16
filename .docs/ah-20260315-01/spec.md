# Phase 2: キャラクター図鑑・ゲーム内紹介 — 仕様書

## 概要

Phase 2 では、キャラクター図鑑画面・プロフィールカード・アンロックシステムを実装し、リザルト画面にキャラ表情差分を追加する。
本仕様書は、各成果物の技術仕様・インターフェース・設計制約を定義する。

## 成果物一覧

| ID | 成果物 | 種類 | 配置先 |
|----|--------|------|--------|
| S-01 | データ層拡張 | コード変更 | `core/types.ts`, 新規 `core/dex-data.ts` |
| S-02 | アンロックシステム | 新規モジュール | 新規 `core/dex.ts`, `hooks/useCharacterDex.ts` |
| S-03 | キャラクター図鑑画面 | 新規コンポーネント | `components/CharacterDexScreen.tsx` |
| S-04 | キャラクタープロフィールカード | 新規コンポーネント | `components/CharacterProfileCard.tsx` |
| S-05 | リザルト画面改修 | コード変更 | `components/ResultScreen.tsx` |
| S-06 | タイトル画面改修 | コード変更 | `components/TitleScreen.tsx` |
| S-07 | 遷移管理統合 | コード変更 | `AirHockeyGame.tsx` |

---

## S-01: データ層拡張

### 型定義の追加（types.ts）

#### CharacterProfile 型

```typescript
// キャラクターのプロフィール情報（図鑑表示用）
export type CharacterProfile = {
  characterId: string;         // Character.id と紐づく
  fullName: string;            // フルネーム（例: '蒼葉 アキラ'）
  reading: string;             // 読み（例: 'あおば あきら'）
  grade: string;               // 学年（例: '1年生'）
  age: number;                 // 年齢
  birthday: string;            // 誕生日（例: '4月8日'）
  height: string;              // 身長（例: '165cm'）
  school: string;              // 所属校名（例: '蒼風館高校'）
  club: string;                // 部活名（例: 'エアホッケー部'）
  personality: string[];       // 性格キーワード（例: ['素直', '負けず嫌い', '行動派']）
  quote: string;               // 代表セリフ（例: 'エアホッケーって、こんなに熱くなれるんだ'）
  playStyle: string;           // プレイスタイル名（例: 'オールラウンダー'）
  specialMove: string;         // 得意技名（例: 'ライジングショット'）
  specialMoveDesc: string;     // 得意技説明
  description: string;         // キャラクター紹介文（2-3文）
};
```

#### アンロック関連型

```typescript
// アンロック条件
export type UnlockCondition =
  | { type: 'default' }                        // 初期解放
  | { type: 'story-clear'; stageId: string }   // ストーリークリアで解放
  | { type: 'hidden' };                        // 現時点では解放不可（将来のアップデートで解放条件を追加予定）

// 図鑑エントリ（プロフィール + アンロック条件の組み合わせ）
export type DexEntry = {
  profile: CharacterProfile;
  unlockCondition: UnlockCondition;
};

// 図鑑の永続化データ
export type DexProgress = {
  unlockedCharacterIds: string[];  // アンロック済みキャラID一覧
  newlyUnlockedIds: string[];      // 未確認の新規アンロックID一覧
};
```

#### ScreenType の追加

```typescript
export type ScreenType =
  | 'menu'
  | 'game'
  | 'result'
  | 'achievements'
  | 'daily'
  | 'stageSelect'
  | 'chapterTitle'
  | 'preDialogue'
  | 'vsScreen'
  | 'postDialogue'
  | 'victoryCutIn'
  | 'characterDex';    // 新規: キャラクター図鑑
```

### 図鑑データ（dex-data.ts）

```typescript
// core/dex-data.ts

import { DexEntry } from './types';

export const DEX_ENTRIES: DexEntry[] = [
  // 蒼風館エアホッケー部
  {
    profile: {
      characterId: 'player',
      fullName: '蒼葉 アキラ',
      reading: 'あおば あきら',
      grade: '1年生',
      age: 15,
      birthday: '4月8日',
      height: '165cm',
      school: '蒼風館高校',
      club: 'エアホッケー部',
      personality: ['素直', '負けず嫌い', '行動派'],
      quote: 'エアホッケーって、こんなに熱くなれるんだ',
      playStyle: 'オールラウンダー',
      specialMove: 'ライジングショット',
      specialMoveDesc: '相手の意表を突く、直感的なタイミングで放つ速射',
      description: '入学式の帰り道、エアホッケー部の練習を見てその場で入部を決意した1年生。考えるより先に体が動くタイプで、対戦相手から技を吸収して成長する。',
    },
    unlockCondition: { type: 'default' },
  },
  // ... 他キャラクターも同様に定義（計8名）
];

// ヘルパー関数
export function getDexEntryById(characterId: string): DexEntry | undefined;
export function getAllDexEntries(): DexEntry[];
```

**対象キャラクターとアンロック条件**:

| キャラID | キャラ名 | アンロック条件 | stageId |
|----------|---------|---------------|---------|
| `player` | 蒼葉 アキラ | 初期解放（default） | — |
| `yuu` | 柊 ユウ | 隠しキャラ（hidden） | — |
| `hiro` | 日向 ヒロ | ステージ 1-1 クリア | `'1-1'` |
| `misaki` | 水瀬 ミサキ | ステージ 1-2 クリア | `'1-2'` |
| `takuma` | 鷹見 タクマ | ステージ 1-3 クリア | `'1-3'` |
| `rookie` | 春日 ソウタ | 隠し（hidden） | — |
| `regular` | 秋山 ケンジ | 隠し（hidden） | — |
| `ace` | 氷室 レン | 隠し（hidden） | — |

> **設計判断（更新: 2026-03-16）**: アキラのみ初期解放。ユウは隠しキャラとして将来のアップデートで登場予定。ストーリーモードの対戦相手（ヒロ・ミサキ・タクマ）は対戦して「知る」体験に合わせてクリア解放。フリー対戦キャラ（ソウタ・ケンジ・レン）は現状では解放不可（hidden）で、将来のアップデートで解放条件を追加予定。

---

## S-02: アンロックシステム

### dex.ts モジュール

```typescript
// core/dex.ts

const DEX_STORAGE_KEY = 'ah_dex_progress';

// デフォルトの初期状態（初期解放キャラを含む）
const DEFAULT_DEX_PROGRESS: DexProgress = {
  unlockedCharacterIds: ['player'],
  newlyUnlockedIds: [],
};

// localStorage から図鑑進行を読み込み
export function loadDexProgress(): DexProgress;

// localStorage に図鑑進行を保存
export function saveDexProgress(progress: DexProgress): void;

// 図鑑進行のリセット
export function resetDexProgress(): void;

// ストーリー進行状態から新規アンロック対象を判定
// 戻り値: 新しくアンロックされたキャラID の配列
export function checkNewUnlocks(
  storyProgress: StoryProgress,
  currentDexProgress: DexProgress
): string[];

// 新規アンロック通知を既読にする
export function markAsViewed(
  progress: DexProgress,
  characterIds: string[]
): DexProgress;
```

**永続化仕様**:
- ストレージキー: `'ah_dex_progress'`
- 形式: JSON 文字列
- 破損時のフォールバック: `DEFAULT_DEX_PROGRESS` を返す（try-catch 付き）
- バリデーション: `unlockedCharacterIds` が配列であることを確認

### useCharacterDex フック

```typescript
// hooks/useCharacterDex.ts

export function useCharacterDex(): {
  // 状態
  dexEntries: DexEntry[];                       // 全図鑑エントリ
  unlockedIds: string[];                        // アンロック済みID
  newlyUnlockedIds: string[];                   // 未確認の新規アンロックID
  completionRate: number;                       // コンプリート率（0-1）

  // アクション
  checkAndUnlock: (storyProgress: StoryProgress) => string[];  // アンロックチェック
  markViewed: (characterIds: string[]) => void;                // 既読処理
  isUnlocked: (characterId: string) => boolean;                // 個別判定
  getNewUnlockCount: () => number;                             // 未確認数取得
};
```

---

## S-03: キャラクター図鑑画面

### Props

```typescript
type CharacterDexScreenProps = {
  dexEntries: DexEntry[];
  unlockedIds: string[];
  newlyUnlockedIds: string[];
  characters: Record<string, Character>;    // アイコン・カラー参照用
  completionRate: number;
  onSelectCharacter: (characterId: string) => void;
  onBack: () => void;
  onMarkViewed: (characterIds: string[]) => void;
};
```

### レイアウト構造

```
┌──────────────────────────────┐
│  ← 戻る        キャラクター図鑑  │
│                              │
│  コンプリート率: ████░░ 5/8   │
│                              │
│  ┌──────┐  ┌──────┐          │
│  │ アキラ │  │ ヒロ  │          │
│  │ [icon]│  │ [icon]│          │
│  │  NEW  │  │      │          │
│  └──────┘  └──────┘          │
│  ┌──────┐  ┌──────┐          │
│  │ミサキ │  │タクマ │          │
│  │ [icon]│  │ [🔒] │          │
│  └──────┘  └──────┘          │
│  ┌──────┐  ┌──────┐          │
│  │ ユウ  │  │ソウタ │          │
│  │ [icon]│  │ [icon]│          │
│  └──────┘  └──────┘          │
│  ┌──────┐  ┌──────┐          │
│  │ケンジ │  │ レン  │          │
│  │ [icon]│  │ [icon]│          │
│  └──────┘  └──────┘          │
└──────────────────────────────┘
```

### 表示仕様

| 要素 | 仕様 |
|------|------|
| 画面背景 | ダークグラデーション（既存の menu 背景に準拠） |
| ヘッダー | 「キャラクター図鑑」タイトル + 戻るボタン |
| コンプリート率 | プログレスバー（テーマカラー #3498db）+ テキスト（例: '5/8'） |
| カードグリッド | 2列グリッド、カード間マージン 12px |
| アンロック済みカード | アイコン（64x64）+ 名前 + テーマカラーのボーダー、タップで詳細表示 |
| ロック中カード | グレースケール + シルエット + 「???」表示、タップ不可 |
| NEW バッジ | 赤背景 + 白文字「NEW」、カード右上に配置 |
| カードサイズ | 幅: calc((100% - 12px) / 2)、高さ: 120px |

### アニメーション

| 対象 | アニメーション |
|------|-------------|
| カード一覧 | 画面表示時に各カードが下から順にフェードイン（stagger: 50ms） |
| NEW バッジ | パルスアニメーション（scale 1.0→1.1→1.0、1秒周期） |
| カードタップ | タップ時にスケールダウン（0.95、100ms）→ リリースで戻る |

---

## S-04: キャラクタープロフィールカード

### Props

```typescript
type CharacterProfileCardProps = {
  entry: DexEntry;
  character: Character;          // アイコン・カラー・立ち絵参照用
  onClose: () => void;
};
```

### レイアウト構造

```
┌──────────────────────────────┐
│  暗めオーバーレイ（背景タップで閉じる）│
│  ┌────────────────────────┐  │
│  │ ✕ ボタン               │  │
│  │                        │  │
│  │    ┌──────────┐        │  │
│  │    │  立ち絵   │        │  │
│  │    │（タップで  │        │  │
│  │    │ 表情切替）│        │  │
│  │    └──────────┘        │  │
│  │                        │  │
│  │  「代表セリフ」         │  │
│  │                        │  │
│  │  ────────────────      │  │
│  │  蒼葉 アキラ            │  │
│  │  あおば あきら           │  │
│  │  ────────────────      │  │
│  │  1年生 | 15歳 | 165cm   │  │
│  │  4月8日生 | 蒼風館高校   │  │
│  │  ────────────────      │  │
│  │  [素直] [負けず嫌い]     │  │
│  │  [行動派]               │  │
│  │  ────────────────      │  │
│  │  プレイスタイル:          │  │
│  │  オールラウンダー         │  │
│  │  得意技: ライジングショット│  │
│  │  説明テキスト...          │  │
│  │  ────────────────      │  │
│  │  紹介文テキスト...        │  │
│  │                        │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### 表示仕様

| 要素 | 仕様 |
|------|------|
| オーバーレイ | 全画面、rgba(0,0,0,0.6)、タップで閉じる |
| カードコンテナ | 中央配置、幅 90%、最大高さ 85vh、角丸 16px、背景白、スクロール可能 |
| 立ち絵 | 中央配置、最大幅 200px、最大高さ 300px、タップで normal ⇔ happy 切替 |
| 表情切替ヒント | 立ち絵下に「タップで表情変更」テキスト（小さめ、半透明） |
| 代表セリフ | イタリック、テーマカラー、引用マーク付き |
| キャラ名 | 太字 24px + 読み 14px（グレー） |
| 基本情報 | 小さめテキスト、「|」区切りで1-2行に収める |
| 性格タグ | 角丸チップ（テーマカラー薄め背景 + テーマカラー文字） |
| プレイスタイル | セクションヘッダー付き、スタイル名は太字 |
| 得意技 | スタイル名の下、名前 + 説明を表示 |
| 紹介文 | 本文テキスト、左揃え |
| 閉じるボタン | カード右上、× アイコン |

### アニメーション

| 対象 | アニメーション |
|------|-------------|
| オーバーレイ | フェードイン 200ms |
| カード | 下からスライドアップ + フェードイン 300ms（ease-out） |
| 閉じる | フェードアウト 200ms → `onClose()` |
| 表情切替 | クロスフェード 150ms |

### 立ち絵の表情切替仕様

- デフォルト: `normal` 表情
- タップ/クリック: `happy` 表情に切替（トグル）
- `portrait` が未定義のキャラ: アイコンの拡大表示（64px → 128px）、表情切替なし
- 切替時にクロスフェード（150ms）

---

## S-05: リザルト画面改修仕様

### 追加する Props

```typescript
// 既存 Props に追加
type ResultScreenProps = {
  // ... 既存 Props ...
  cpuCharacter?: Character;                // 対戦キャラクター情報
  playerCharacter?: Character;             // プレイヤーキャラクター情報
  newlyUnlockedCharacterName?: string;     // 新規アンロックされたキャラ名（通知用）
};
```

### レイアウト変更

```
┌──────────────────────────────┐
│                              │
│     YOU WIN! / YOU LOSE...   │
│                              │
│  ┌────────┐   ┌────────┐    │
│  │プレイヤー│   │ 対戦   │    │
│  │ 立ち絵  │   │ キャラ  │    │
│  │(happy/  │   │(normal/ │    │
│  │ normal) │   │ happy)  │    │
│  └────────┘   └────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │ 🔓 ヒロが図鑑に       │    │
│  │    追加されました！    │    │
│  └──────────────────────┘    │
│                              │
│  スコア・統計・実績...        │
│                              │
└──────────────────────────────┘
```

### 表示仕様

| 要素 | 仕様 |
|------|------|
| キャラ立ち絵 | 左: プレイヤー、右: 対戦キャラ、各最大幅 150px |
| 勝利時表情 | プレイヤー: happy、対戦キャラ: normal |
| 敗北時表情 | プレイヤー: normal、対戦キャラ: happy |
| 立ち絵フォールバック | `portrait` 未定義時は表示しない（既存レイアウト維持） |
| アンロック通知 | 金色ボーダーのバナー、🔓アイコン + テキスト |
| 通知表示タイミング | スコアカウントアップ完了後に 500ms ディレイでフェードイン |
| 通知自動消去 | なし（画面遷移まで表示継続） |

### 後方互換性

- `cpuCharacter` / `playerCharacter` が未指定の場合、立ち絵表示をスキップ（既存レイアウト維持）
- `newlyUnlockedCharacterName` が未指定の場合、アンロック通知を非表示
- フリー対戦時は `cpuCharacter` のみ渡す（`playerCharacter` は `PLAYER_CHARACTER` を使用）

---

## S-06: タイトル画面改修仕様

### 追加する Props

```typescript
// 既存 Props に追加
type TitleScreenProps = {
  // ... 既存 Props ...
  onCharacterDexClick: () => void;    // キャラクター図鑑ボタンのハンドラ
  newUnlockCount: number;             // 未確認の新規アンロック数（0 の場合バッジ非表示）
};
```

### ボタン配置

```
既存レイアウト:
  [フリー対戦開始]
  [ストーリーモード]
  [実績] [デイリー] [設定] [?]

変更後:
  [フリー対戦開始]
  [ストーリーモード]
  [キャラクター]           ← 新規追加
  [実績] [デイリー] [設定] [?]
```

### ボタン仕様

| 要素 | 仕様 |
|------|------|
| ボタンテキスト | 「キャラクター」 |
| ボタンスタイル | フリー対戦・ストーリーと同じスタイル（幅100%、角丸、グラデーション背景）— 3つのメインボタンは幅を統一 |
| ボタンカラー | #9b59b6（紫系、ストーリーの青とは別色で視覚的に区別） |
| 通知バッジ | 赤丸（直径 20px）+ 白文字の数字、ボタン右上に配置 |
| バッジ表示条件 | `newUnlockCount > 0` の場合のみ表示 |
| バッジアニメーション | パルス（scale 1.0→1.15→1.0、1.5秒周期） |

---

## S-07: 遷移管理統合

### 遷移フロー（更新後）

```
menu
  ├── handleFreeStart() → game（フリー対戦）
  ├── handleStoryClick() → stageSelect（ストーリーモード）
  ├── handleCharacterDexClick() → characterDex     ← 新規
  ├── handleShowAchievements() → achievements
  └── handleDailyChallenge() → daily

characterDex                                        ← 新規
  ├── handleSelectCharacter(id) → プロフィールモーダル表示（画面遷移なし）
  └── handleBackFromDex() → menu

result（ストーリーモード）
  ├── [ストーリークリア時] → アンロックチェック実行 → 新規アンロック情報をResultScreenに渡す
  └── 以下は既存フローと同じ
```

### 新規ハンドラ

```typescript
// 図鑑画面への遷移
function handleCharacterDexClick(): void {
  setScreen('characterDex');
}

// 図鑑画面から戻る
function handleBackFromDex(): void {
  setScreen('menu');
}
```

### ストーリークリア時のアンロック統合

```typescript
// handleGameFinish() 内 or handlePostDialogueComplete() 内で実行
// ストーリーモードでプレイヤーが勝利した場合のみ
if (gameMode === 'story' && winner === 'Player') {
  const newUnlocks = checkAndUnlock(storyProgress);
  if (newUnlocks.length > 0) {
    // リザルト画面に新規アンロック情報を渡す
    setNewlyUnlockedName(findCharacterById(newUnlocks[0])?.name);
  }
}
```

---

## 設計制約（まとめ）

1. **後方互換性**: 新 Props はすべてオプショナル（`?`）。未指定時は既存動作を維持
2. **パフォーマンス**: 図鑑画面の立ち絵はプロフィールカード表示時にオンデマンドロード
3. **アクセシビリティ**: カードのタップ/クリック、モーダルの閉じるボタン、キーボード操作（Escape で閉じる）すべて対応
4. **レスポンシブ**: Canvas の 450x900 内部解像度に合わせた相対配置
5. **データ拡張性**: `DexEntry` 配列に要素を追加するだけで第2章キャラに対応可能
6. **ストレージ分離**: 図鑑進行（`ah_dex_progress`）はストーリー進行（`ah_story_progress`）と別キーで管理
