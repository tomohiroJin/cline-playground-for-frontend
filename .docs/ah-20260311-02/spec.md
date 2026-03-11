# Phase 1: ストーリービジュアル強化 — 仕様書

## 概要

Phase 1 では、ストーリーモードのビジュアル演出を強化する。
本仕様書は、各成果物の技術仕様・インターフェース・設計制約を定義する。

## 成果物一覧

| ID | 成果物 | 種類 | 配置先 |
|----|--------|------|--------|
| S-01 | データ層拡張 | コード変更 | `core/types.ts`, `core/characters.ts`, `core/dialogue-data.ts` |
| S-02 | 画像アセット | 画像ファイル | `public/assets/portraits/`, `backgrounds/`, `cutins/` |
| S-03 | 画像プリローダー | 新規フック | `hooks/useImagePreloader.ts` |
| S-04 | DialogueOverlay 改修 | コード変更 | `components/DialogueOverlay.tsx` |
| S-05 | VsScreen 演出強化 | コード変更 | `components/VsScreen.tsx` |
| S-06 | ChapterTitleCard | 新規コンポーネント | `components/ChapterTitleCard.tsx` |
| S-07 | VictoryCutIn | 新規コンポーネント | `components/VictoryCutIn.tsx` |
| S-08 | 遷移管理統合 | コード変更 | `AirHockeyGame.tsx` |

---

## S-01: データ層拡張

### 型定義の変更（types.ts）

#### Character 型

```typescript
export type PortraitSet = {
  normal: string;   // 通常表情の画像パス（例: '/assets/portraits/akira-normal.png'）
  happy: string;    // 嬉しい表情の画像パス
};

export type Character = {
  id: string;
  name: string;
  icon: string;            // 既存: 128px アイコン画像パス
  color: string;           // HEX カラー
  reactions: CharacterReaction;
  portrait?: PortraitSet;  // 新規: 立ち絵パス（Phase 1 で追加）
};
```

#### Dialogue 型

```typescript
export type DialogueExpression = 'normal' | 'happy';

export type Dialogue = {
  characterId: string;
  text: string;
  expression?: DialogueExpression;  // 新規: 表情指定（省略時 'normal'）
};
```

#### StageDefinition 型

```typescript
export type StageDefinition = {
  id: string;
  chapter: number;
  stageNumber: number;
  name: string;
  characterId: string;
  fieldId: string;
  difficulty: Difficulty;
  winScore: number;
  preDialogue: Dialogue[];
  postWinDialogue: Dialogue[];
  postLoseDialogue: Dialogue[];
  backgroundId?: string;         // 新規: ダイアログ背景ID
  chapterTitle?: string;         // 新規: チャプタータイトル（章の最初のステージのみ）
  chapterSubtitle?: string;      // 新規: サブタイトル
  isChapterFinale?: boolean;     // 新規: 章の最終ステージか（カットイン判定用）
};
```

#### ScreenType

```typescript
export type ScreenType =
  | 'menu'
  | 'game'
  | 'result'
  | 'achievements'
  | 'daily'
  | 'stageSelect'
  | 'chapterTitle'     // 新規
  | 'preDialogue'
  | 'vsScreen'
  | 'postDialogue'
  | 'victoryCutIn';    // 新規
```

### characters.ts の変更

#### フリー対戦カラー更新

| キャラID | 変更前 | 変更後 | 根拠 |
|----------|--------|--------|------|
| rookie（ソウタ） | `#e74c3c` | `#27ae60` | D-02 設計書 |
| regular（ケンジ） | `#e74c3c` | `#2c3e50` | D-02 設計書 |
| ace（レン） | `#e74c3c` | `#2c3e50` | D-02 設計書 |

#### ユウ（yuu）の追加

```typescript
// STORY_CHARACTERS に追加
yuu: {
  id: 'yuu',
  name: 'ユウ',
  icon: '/assets/characters/yuu.png',  // Phase 1 で生成
  color: '#2ecc71',
  reactions: {
    onScore: ['データ通りですね', '予測が的中しました'],
    onConcede: ['...修正が必要です', 'この変数は想定外...'],
    onWin: ['仮説が証明されました', 'QED'],
    onLose: ['データが不足していました', '次は別のアプローチで...'],
  },
  portrait: {
    normal: '/assets/portraits/yuu-normal.png',
    happy: '/assets/portraits/yuu-happy.png',
  },
}
```

#### 全キャラへの portrait 追加

既存の全キャラクター（akira, hiro, misaki, takuma, rookie, regular, ace）に `portrait` フィールドを追加。
パス命名規則: `/assets/portraits/{characterId}-{expression}.png`

### dialogue-data.ts の変更

#### 第1章ステージへの背景・タイトル追加

```typescript
// ステージ 1-1
{
  id: '1-1',
  chapterTitle: '第1章',
  chapterSubtitle: 'はじめの一打',
  backgroundId: 'bg-clubroom',
  isChapterFinale: false,
  // ... 既存フィールド
}

// ステージ 1-2
{
  id: '1-2',
  backgroundId: 'bg-gym',
  isChapterFinale: false,
  // ... 既存フィールド
}

// ステージ 1-3
{
  id: '1-3',
  backgroundId: 'bg-school-gate',
  isChapterFinale: true,
  // ... 既存フィールド
}
```

#### ダイアログへの expression 追加

既存のダイアログに `expression` を追加。基本方針:
- 通常の会話: `expression` 省略（デフォルト `'normal'`）
- 励まし・喜び・勝利: `expression: 'happy'`

---

## S-02: 画像アセット仕様

### 立ち絵（portraits/）

| 項目 | 仕様 |
|------|------|
| サイズ | 512 × 1024 px |
| フォーマット | PNG（透過背景） |
| 構図 | 膝上〜全身、5.5頭身 |
| 表情差分 | normal, happy の2パターン |
| 命名規則 | `{characterId}-{expression}.png` |
| 総数 | 16枚（8キャラ × 2表情） |

**対象キャラ一覧**:

| キャラID | キャラ名 | ファイル |
|----------|---------|---------|
| akira | 蒼葉アキラ | `akira-normal.png`, `akira-happy.png` |
| hiro | 日向ヒロ | `hiro-normal.png`, `hiro-happy.png` |
| misaki | 水瀬ミサキ | `misaki-normal.png`, `misaki-happy.png` |
| takuma | 鷹見タクマ | `takuma-normal.png`, `takuma-happy.png` |
| yuu | 柊ユウ | `yuu-normal.png`, `yuu-happy.png` |
| rookie | 春日ソウタ | `rookie-normal.png`, `rookie-happy.png` |
| regular | 秋山ケンジ | `regular-normal.png`, `regular-happy.png` |
| ace | 氷室レン | `ace-normal.png`, `ace-happy.png` |

### 背景（backgrounds/）

| 項目 | 仕様 |
|------|------|
| サイズ | 450 × 900 px |
| フォーマット | WebP |
| 総数 | 3枚 |

| 背景ID | 場面 | 説明 |
|--------|------|------|
| bg-clubroom | 部室 | 放課後の明るい部室、エアホッケー台2台、窓から夕焼け |
| bg-gym | 体育館 | 日中の体育館、広い空間、窓からの自然光 |
| bg-school-gate | 校門 | 朝〜昼、桜並木の校門、春の雰囲気 |

### 勝利カットイン（cutins/）

| 項目 | 仕様 |
|------|------|
| サイズ | 450 × 400 px |
| フォーマット | PNG |
| 総数 | 1枚（Phase 1） |

| ファイル | 説明 |
|---------|------|
| victory-ch1.png | アキラ中央で拳を突き上げ、背景にチームメイト4人（ヒロ・ミサキ・タクマ・ユウ） |

### 背景IDからパスへのマッピング

```typescript
export const BACKGROUND_MAP: Record<string, string> = {
  'bg-clubroom': '/assets/backgrounds/bg-clubroom.webp',
  'bg-gym': '/assets/backgrounds/bg-gym.webp',
  'bg-school-gate': '/assets/backgrounds/bg-school-gate.webp',
};
```

---

## S-03: 画像プリローダー

### useImagePreloader フック

```typescript
// hooks/useImagePreloader.ts

export function useImagePreloader(urls: string[]): {
  isLoaded: boolean;   // 全画像のロード完了
  progress: number;    // 0〜1 のロード進捗
  errors: string[];    // ロード失敗した URL リスト
};
```

**仕様**:
- `urls` 配列が変更されたときにプリロードを開始
- `Image` オブジェクトの `onload`/`onerror` でステータス追跡
- 空配列の場合は即座に `isLoaded: true`
- エラーが発生してもロード完了とみなす（フォールバック表示のため）
- メモリリーク防止: コンポーネントアンマウント時にクリーンアップ

### プリロード対象の収集

```typescript
// ステージ選択時に呼び出す関数
export function getStageAssetUrls(
  stage: StageDefinition,
  characters: Record<string, Character>
): string[];
```

**収集対象**:
- 該当ステージの背景画像
- プレイヤーキャラの立ち絵（normal, happy）
- 対戦相手キャラの立ち絵（normal, happy）
- 勝利カットイン画像（`isChapterFinale` の場合）

---

## S-04: DialogueOverlay 改修仕様

### レイアウト構造

```
┌──────────────────────────────┐
│                              │
│    背景画像（全画面）          │
│                              │
│                              │
│        ┌──────────┐          │
│        │  立ち絵   │          │
│        │          │          │
│        │          │          │
│        └──────────┘          │
│                              │
│  ┌──────────────────────────┐│
│  │ キャラ名                  ││
│  │ セリフテキスト ...         ││
│  │                          ││
│  └──────────────────────────┘│
└──────────────────────────────┘
```

### Props の変更

```typescript
type DialogueOverlayProps = {
  dialogues: Dialogue[];
  characters: Record<string, Character>;
  onComplete: () => void;
  backgroundUrl?: string;   // 新規: 背景画像URL
};
```

### 表示仕様

| 要素 | 仕様 |
|------|------|
| 背景画像 | 全画面表示、`object-fit: cover`、暗めのオーバーレイ（rgba(0,0,0,0.3)） |
| 背景フォールバック | 画像なし時は既存の暗い半透明背景を維持 |
| 立ち絵 | 中央配置、最大高さ 60vh、フェードイン 300ms |
| 立ち絵の切り替え | キャラ変更時にクロスフェード 200ms |
| 表情切り替え | 同キャラの表情変更時は即時切り替え（フェードなし） |
| テキストウィンドウ | 下部固定、半透明パネル（rgba(0,0,0,0.7)）、角丸 8px |
| キャラ名 | テキストウィンドウ上部、キャラカラーで表示 |
| テキスト送り | 既存と同じ（クリック/タップで全文表示 or 次へ） |

### 後方互換性

- `portrait` が未定義のキャラクターはアイコン表示にフォールバック
- `expression` が未指定のダイアログは `'normal'` 扱い
- `backgroundUrl` が未指定の場合は既存の暗い背景を維持

---

## S-05: VsScreen 演出強化仕様

### レイアウト構造

```
┌──────────────────────────────┐
│     エフェクト背景             │
│                              │
│  ←スライドイン  スライドイン→  │
│  ┌────┐          ┌────┐      │
│  │プレイ│          │CPU │      │
│  │ヤー  │  VS     │キャラ│     │
│  │立ち絵│          │立ち絵│     │
│  └────┘          └────┘      │
│                              │
│   プレイヤー名  vs  CPU名      │
│       ステージ名 / フィールド   │
└──────────────────────────────┘
```

### アニメーションシーケンス

| フェーズ | 時間 | 内容 |
|----------|------|------|
| 1. 背景表示 | 0ms | グラデーション背景のフェードイン |
| 2. キャラ登場 | 200ms〜800ms | 左右からスライドイン（ease-out） |
| 3. VS テキスト | 800ms | スケールアップ + バウンス |
| 4. 情報表示 | 1000ms | ステージ名・フィールド名のフェードイン |
| 5. 待機 | 1000ms〜2500ms | 全要素表示状態で待機 |
| 6. フェードアウト | 2500ms〜3000ms | 全体フェードアウト |
| 7. 完了 | 3000ms | `onComplete()` コールバック |

### Props（変更なし）

```typescript
type VsScreenProps = {
  playerCharacter: Character;
  cpuCharacter: Character;
  stageName: string;
  fieldName: string;
  onComplete: () => void;
};
```

### 表示仕様

| 要素 | 仕様 |
|------|------|
| 背景 | 2色グラデーション（左: プレイヤーカラー薄め、右: CPUカラー薄め） |
| 立ち絵 | 256x512相当で表示。`portrait` 未定義時はアイコンの拡大表示 |
| VS テキスト | フォントサイズ 72px、太字、白+影、バウンスアニメーション |
| キャラ名 | フォントサイズ 24px、各キャラカラー |
| ステージ情報 | フォントサイズ 16px、白半透明 |

---

## S-06: ChapterTitleCard 仕様

### Props

```typescript
type ChapterTitleCardProps = {
  chapter: number;         // 章番号
  title: string;           // チャプタータイトル（例: '第1章'）
  subtitle?: string;       // サブタイトル（例: 'はじめの一打'）
  backgroundUrl?: string;  // 背景画像URL（ぼかし付きで表示）
  onComplete: () => void;  // 表示完了時のコールバック
};
```

### アニメーションシーケンス

| フェーズ | 時間 | 内容 |
|----------|------|------|
| 1. 背景表示 | 0ms〜500ms | ぼかし背景のフェードイン |
| 2. タイトル | 500ms〜1000ms | 章番号 + タイトルのフェードイン |
| 3. サブタイトル | 1000ms〜1500ms | サブタイトルのフェードイン |
| 4. 待機 | 1500ms〜3500ms | 全要素表示状態で待機 |
| 5. フェードアウト | 3500ms〜4000ms | 全体フェードアウト |
| 6. 完了 | 4000ms | `onComplete()` コールバック |

### 表示仕様

| 要素 | 仕様 |
|------|------|
| 背景 | 画像（blur 10px） + 暗めオーバーレイ（rgba(0,0,0,0.5)）。画像なし時は黒背景 |
| 章番号 | フォントサイズ 18px、白半透明、上部 |
| タイトル | フォントサイズ 36px、白、太字、中央配置 |
| サブタイトル | フォントサイズ 20px、白半透明、タイトル下 |

### 表示条件

- `StageDefinition.chapterTitle` が定義されているステージのみ表示
- スキップ: 画面タップ/クリックで即座にフェードアウト→完了

---

## S-07: VictoryCutIn 仕様

### Props

```typescript
type VictoryCutInProps = {
  imageUrl: string;            // カットイン画像URL
  message?: string;            // テキスト（デフォルト: 'TO BE CONTINUED...'）
  onComplete: () => void;      // 完了時コールバック
};
```

### アニメーションシーケンス

| フェーズ | 時間 | 内容 |
|----------|------|------|
| 1. 暗転 | 0ms〜300ms | 黒背景のフェードイン |
| 2. 画像表示 | 300ms〜1000ms | カットイン画像のスケールアップ（0.8→1.0）+ フェードイン |
| 3. 待機 | 1000ms〜2500ms | 画像表示状態 |
| 4. テキスト | 2500ms〜3500ms | 「TO BE CONTINUED...」のフェードイン |
| 5. ユーザー入力待ち | 3500ms〜 | タップ/クリック/キー入力で次へ |
| 6. フェードアウト | 入力後 500ms | 全体フェードアウト |
| 7. 完了 | フェードアウト後 | `onComplete()` コールバック |

### 表示条件

- `StageDefinition.isChapterFinale === true` かつプレイヤー勝利時のみ表示

---

## S-08: 遷移管理統合

### ストーリーモード遷移フロー（更新後）

```
menu
  ↓ handleStoryClick()
stageSelect
  ↓ handleSelectStage(stage)
  ├── [chapterTitle が定義] → chapterTitle → handleChapterTitleComplete()
  └── [chapterTitle なし]  ─────────────────────────────────────────┐
                                                                    ↓
preDialogue → handlePreDialogueComplete()
  ↓
vsScreen → handleVsComplete()
  ↓
game (countdown → playing → finished)
  ↓
postDialogue → handlePostDialogueComplete()
  ├── [isChapterFinale && 勝利] → victoryCutIn → handleVictoryCutInComplete()
  └── [その他]  ────────────────────────────────────────────────────┐
                                                                    ↓
result
  ├── handleNextStage() → stageSelect
  ├── handleBackToStageSelect() → stageSelect
  └── handleBackToMenu() → menu
```

### 新規ハンドラ

```typescript
// チャプタータイトル完了
function handleChapterTitleComplete(): void {
  setScreen('preDialogue');
}

// 勝利カットイン完了
function handleVictoryCutInComplete(): void {
  setScreen('result');
}
```

### handlePostDialogueComplete の変更

```typescript
function handlePostDialogueComplete(): void {
  if (currentStage?.isChapterFinale && winner === 'Player') {
    setScreen('victoryCutIn');
  } else {
    setScreen('result');
  }
}
```

---

## 設計制約（まとめ）

1. **後方互換性**: 新フィールドはすべてオプショナル（`?`）。未定義時は既存動作を維持
2. **パフォーマンス**: 画像プリロードで遷移時のちらつきを防止。WebP 圧縮で帯域削減
3. **アクセシビリティ**: テキスト送りはクリック/タップ/キーボード（Enter/Space）すべて対応
4. **レスポンシブ**: Canvas の 450x900 内部解像度に合わせた相対配置
5. **テスト可能性**: アニメーション時間を定数化し、テスト時にオーバーライド可能に
