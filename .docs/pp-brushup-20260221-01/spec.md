# Picture Puzzle ブラッシュアップ - 技術仕様

## 1. データ型・インターフェース定義

### 1.1 パズル画像・テーマ関連

```typescript
// src/types/puzzle.ts

/** テーマ識別子 */
export type ThemeId =
  | 'illustration-gallery'
  | 'world-scenery'
  | 'nostalgia'
  | 'sea-and-sky'
  | 'four-seasons'
  | 'mystery';

/** アンロック条件 */
export type UnlockCondition =
  | { type: 'always' }                              // 初期解放
  | { type: 'clearCount'; count: number }            // 累計クリア回数
  | { type: 'themesClear'; themeIds: ThemeId[] };     // 指定テーマで各1回以上クリア

/** パズル画像定義 */
export interface PuzzleImage {
  id: string;                    // 一意識別子（例: 'snowy_mountain_ukiyoe'）
  filename: string;              // ファイル名（例: 'snowy_mountain_ukiyoe.webp'）
  alt: string;                   // alt テキスト（例: '雪山の浮世絵風イラスト'）
  themeId: ThemeId;              // 所属テーマ
  hasVideo: boolean;             // 完成動画の有無
}

/** テーマ定義 */
export interface Theme {
  id: ThemeId;
  name: string;                  // 表示名（例: 'イラストギャラリー'）
  description: string;           // テーマの説明
  unlockCondition: UnlockCondition;
  images: PuzzleImage[];
}
```

### 1.2 スコア関連

```typescript
// src/types/puzzle.ts

/** ランク */
export type PuzzleRank = '★★★' | '★★☆' | '★☆☆' | 'クリア';

/** スコア計算結果 */
export interface PuzzleScore {
  totalScore: number;            // 最終スコア（0以上）
  moveCount: number;             // 実際の手数
  elapsedTime: number;           // 経過秒数
  hintUsed: boolean;             // ヒント使用有無
  division: number;              // 難易度（分割数）
  rank: PuzzleRank;              // ランク
  shuffleMoves: number;          // シャッフル手数（= optimalMoves）
}

/** 難易度別乗数 */
export const DIVISION_MULTIPLIERS: Record<number, number> = {
  2: 0.3,
  3: 0.5,
  4: 1.0,
  5: 1.5,
  6: 2.0,
  8: 3.5,
  10: 5.0,
  16: 10.0,
  32: 20.0,
};

/** ランク閾値 */
export const RANK_THRESHOLDS = {
  THREE_STAR: 8000,
  TWO_STAR: 5000,
  ONE_STAR: 2000,
};
```

### 1.3 ストレージ関連

```typescript
// src/types/puzzle.ts

/** ベストスコア記録（画像×難易度ごと） */
export interface PuzzleRecord {
  imageId: string;               // 画像ID
  division: number;              // 難易度
  bestScore: number;             // ベストスコア
  bestRank: PuzzleRank;          // ベストランク
  bestTime: number;              // ベストタイム（秒）
  bestMoves: number;             // ベスト手数
  clearCount: number;            // クリア回数
  lastClearDate: string;         // 最終クリア日時（ISO形式）
}
```

### 1.4 BGM 関連（除外）

> **除外（2026-02-21）**: Tone.js を使った BGM・SE 機能（Phase 2-1, 2-2）を実装したが、ブラウザの自動再生ポリシーにより音が鳴らない問題を解決できなかった。プリロード、async/await 排除、AudioContext 再開ロジック等、複数回の修正を試みたが改善せず、BGM・SE 関連のコード・型定義・アトムをすべて除外した。スワイプ操作（Phase 2-3）、キーボード操作（Phase 2-4）、アニメーション等の他の Phase 2 機能はそのまま維持。`package.json` の Tone.js 依存は他ゲームが使用しているため維持。

~~以下は除外された仕様です（参考として残す）:~~

```typescript
// 除外: src/types/puzzle.ts から削除済み

/** MIDI ノートシーケンス（number = MIDI ノート番号, null = 休符） */
export type NoteSequence = (number | null)[];

/** BGM トラック定義 */
export interface BgmTrack {
  id: string;                    // 一意識別子
  name: string;                  // 表示名
  bpm: number;                   // テンポ
  bars: number;                  // 小節数
  melody: NoteSequence;          // メロディノート列
  bass: NoteSequence;            // ベースノート列
  melodyWaveform: OscillatorType;  // メロディ波形
  bassWaveform: OscillatorType;    // ベース波形
  melodyGain: number;            // メロディ音量（0.0〜1.0）
  bassGain: number;              // ベース音量（0.0〜1.0）
}

/** BGM エンジンインターフェース */
export interface BgmEngine {
  init(): Promise<void>;         // AudioContext 初期化
  play(trackId: string): void;   // 再生開始
  stop(): void;                  // 再生停止
  setVolume(volume: number): void; // 音量設定（0〜100）
  getCurrentTrack(): string | null;
  isPlaying(): boolean;
}
```

---

## 2. 状態管理（Jotai アトム）設計

### 2.1 新規追加アトム

```typescript
// src/store/atoms.ts に追加

// === Phase 1: 手数・スコア ===

/** 現在の手数 */
export const moveCountAtom = createAtom<number>(0);

/** シャッフル時の手数（= optimalMoves 基準値） */
export const shuffleMovesAtom = createAtom<number>(0);

/** 正解位置にあるピースの割合（0〜100） */
export const correctRateAtom = createAtom<number>(0);

/** ヒント使用フラグ */
export const hintUsedAtom = createAtom<boolean>(false);

// === Phase 2: BGM === （除外済み）
// bgmTrackIdAtom, bgmVolumeAtom, bgmPlayingAtom は除外
```

### 2.2 既存アトムの変更

| アトム | 変更内容 |
|--------|----------|
| `puzzleCompletedAtom` | 変更なし（スコア計算のトリガーとして利用） |
| `hintModeEnabledAtom` | トグル時に `hintUsedAtom` を `true` に設定する副作用を追加 |

### 2.3 状態フロー

```
ゲーム開始:
  imageUrlAtom ← 選択画像URL
  puzzleDivisionAtom ← 分割数
  puzzlePiecesAtom ← シャッフル済みピース
  emptyPiecePositionAtom ← 空白位置
  puzzleStartTimeAtom ← Date.now()
  moveCountAtom ← 0
  shuffleMovesAtom ← calculateShuffleMoves(division)
  correctRateAtom ← 初期正解率
  hintUsedAtom ← false

ピース移動:
  puzzlePiecesAtom ← 更新後ピース
  emptyPiecePositionAtom ← 新空白位置
  moveCountAtom ← prev + 1
  correctRateAtom ← 再計算

ヒント表示:
  hintModeEnabledAtom ← true
  hintUsedAtom ← true  // 一度でも使ったらtrue固定

パズル完成:
  puzzleCompletedAtom ← true
  → スコア計算 → PuzzleRecord 保存 → リザルト画面表示
```

---

## 3. コンポーネント設計

### 3.1 StatusBar（Phase 1: 拡張）

**現状**: 経過時間 + ヒントボタンの 2 要素

**変更後**: 3 列グリッド

```
┌─────────────┬──────────┬──────────────┐
│ ⏱ 03:45     │ 👣 42手  │ 📊 正解率 65%│
└─────────────┴──────────┴──────────────┘
[    ヒントを表示    ]
```

**Props 追加**:
```typescript
// PuzzleBoard.tsx の StatusBar 部分
// 既存: elapsedTime, hintMode, onToggleHint
// 追加:
moveCount: number;        // 手数
correctRate: number;      // 正解率（0〜100）
```

### 3.2 ResultScreen（Phase 1: 新規）

```
┌─────────────────────────────────┐
│         🎉 パズル完成！          │
│                                 │
│  📷 雪山の浮世絵風イラスト       │
│  🧩 難易度: 4×4                 │
│  ⏱ タイム: 03:45               │
│  👣 手数: 42 / 最適 32          │
│  📊 スコア: 7,250               │
│  ⭐ ランク: ★★☆                │
│                                 │
│  🏆 ベストスコア更新！           │  ← bestScore 更新時のみ表示
│                                 │
│  [🐦 シェア]  [🔄 もう一度]     │
│          [🏠 設定に戻る]        │
└─────────────────────────────────┘
```

**Props**:
```typescript
interface ResultScreenProps {
  imageAlt: string;              // 画像名
  division: number;              // 難易度
  score: PuzzleScore;            // スコア計算結果
  isBestScore: boolean;          // ベストスコア更新フラグ
  onShare: () => void;           // シェアボタン
  onRetry: () => void;           // もう一度
  onBackToSetup: () => void;     // 設定に戻る
}
```

### 3.3 BgmController（除外）

> BGM 機能の除外に伴い、BgmController コンポーネントも除外。

### 3.4 ThemeSelector（Phase 3: 新規）

`DefaultImageSelector` を置き換え。

```
┌─────────────────────────────────────┐
│  [イラストギャラリー] [世界の風景]    │
│  [ノスタルジー] [🔒 海と空]          │
│  [🔒 四季] [🔒 ミステリー]           │
├─────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ img1 │ │ img2 │ │ img3 │        │
│  │ ★★★  │ │ ★★☆  │ │      │        │
│  └──────┘ └──────┘ └──────┘        │
│  ┌──────┐                           │
│  │ img4 │                           │
│  │ ★☆☆  │                           │
│  └──────┘                           │
└─────────────────────────────────────┘
```

**Props**:
```typescript
interface ThemeSelectorProps {
  themes: Theme[];
  unlockedThemes: ThemeId[];
  records: PuzzleRecord[];       // ランクバッジ表示用
  onImageSelect: (image: PuzzleImage) => void;
}
```

---

## 4. ユーティリティ関数仕様

### 4.1 スコア計算（`src/utils/score-utils.ts`）

```typescript
/**
 * スコアを計算する
 *
 * @param actualMoves - 実際の手数
 * @param optimalMoves - シャッフル手数（基準値）
 * @param elapsedSeconds - 経過秒数
 * @param hintUsed - ヒント使用有無
 * @param division - 分割数
 * @returns PuzzleScore
 */
export const calculateScore = (
  actualMoves: number,
  optimalMoves: number,
  elapsedSeconds: number,
  hintUsed: boolean,
  division: number
): PuzzleScore => {
  const BASE_SCORE = 10_000;
  const MOVE_PENALTY_PER = 50;
  const TIME_PENALTY_PER = 10;
  const HINT_PENALTY = 1_000;

  const movePenalty = Math.max(0, actualMoves - optimalMoves) * MOVE_PENALTY_PER;
  const timePenalty = elapsedSeconds * TIME_PENALTY_PER;
  const hintPenalty = hintUsed ? HINT_PENALTY : 0;
  const multiplier = DIVISION_MULTIPLIERS[division] ?? 1.0;

  const rawScore = (BASE_SCORE - movePenalty - timePenalty - hintPenalty) * multiplier;
  const totalScore = Math.max(0, Math.round(rawScore));
  const rank = determineRank(totalScore);

  return {
    totalScore,
    moveCount: actualMoves,
    elapsedTime: elapsedSeconds,
    hintUsed,
    division,
    rank,
    shuffleMoves: optimalMoves,
  };
};

/**
 * ランクを判定する
 */
export const determineRank = (score: number): PuzzleRank => {
  if (score >= RANK_THRESHOLDS.THREE_STAR) return '★★★';
  if (score >= RANK_THRESHOLDS.TWO_STAR) return '★★☆';
  if (score >= RANK_THRESHOLDS.ONE_STAR) return '★☆☆';
  return 'クリア';
};
```

### 4.2 正解率計算

```typescript
/**
 * 正解率を計算する
 * puzzle-utils.ts に追加
 *
 * @param pieces - ピース配列
 * @returns 正解率（0〜100）
 */
export const calculateCorrectRate = (pieces: PuzzlePiece[]): number => {
  const nonEmptyPieces = pieces.filter(p => !p.isEmpty);
  if (nonEmptyPieces.length === 0) return 0;

  const correctCount = nonEmptyPieces.filter(
    p => p.correctPosition.row === p.currentPosition.row
      && p.correctPosition.col === p.currentPosition.col
  ).length;

  return Math.round((correctCount / nonEmptyPieces.length) * 100);
};
```

### 4.3 テーマアンロック判定

```typescript
/**
 * テーマがアンロックされているかを判定する
 * src/utils/score-utils.ts に追加
 *
 * @param condition - アンロック条件
 * @param totalClears - 累計クリア回数
 * @param clearedThemes - クリア済みテーマID一覧
 * @returns アンロック済みか
 */
export const isThemeUnlocked = (
  condition: UnlockCondition,
  totalClears: number,
  clearedThemes: Set<ThemeId>
): boolean => {
  switch (condition.type) {
    case 'always':
      return true;
    case 'clearCount':
      return totalClears >= condition.count;
    case 'themesClear':
      return condition.themeIds.every(id => clearedThemes.has(id));
  }
};
```

---

## 5. オーディオシステム（Tone.js）設計（除外）

> **除外（2026-02-21）**: BGM・SE 機能はブラウザの自動再生ポリシーの問題により除外。以下の仕様は参考として残す。

### 5.1 BGM エンジン（`src/hooks/useBgm.ts`）

```typescript
/**
 * BGM 再生管理フック
 *
 * Tone.js を使用し、オシレーターベースのプロシージャル BGM を再生する。
 * AudioContext はユーザー操作後に初期化（ブラウザ自動再生制限対応）。
 */
export const useBgm = () => {
  // 状態: bgmTrackIdAtom, bgmVolumeAtom, bgmPlayingAtom

  /**
   * AudioContext を初期化する（ゲーム開始時に呼び出す）
   * Tone.start() を実行し、ブラウザの自動再生制限を解除
   */
  const initAudio: () => Promise<void>;

  /**
   * 再生/停止をトグル
   */
  const togglePlay: () => void;

  /**
   * 次のトラックに切り替え
   */
  const nextTrack: () => void;

  /**
   * 前のトラックに切り替え
   */
  const prevTrack: () => void;

  /**
   * 音量を変更（0〜100）
   * localStorage にも保存
   */
  const changeVolume: (volume: number) => void;
};
```

**内部実装詳細**:

- **Tone.js 動的インポート**: `import('tone')` で遅延読み込み
- **オシレーター構成**: トラックごとにメロディ用とベース用の 2 つの `Tone.Synth` を生成
- **スケジューリング**: `Tone.Transport` を使用し、BPM に応じたノートスケジューリング
- **ループ**: シーケンス末尾で index を 0 にリセット
- **フェード**: 再生開始時 0.5s フェードイン、停止時 0.3s フェードアウト
- **ノートエンベロープ**: Attack 0.02s → Sustain → Release 0.1s
- **GainNode**: BGM 専用の GainNode で SE と分離

### 5.2 SE プレイヤー（`src/hooks/useSePlayer.ts`）

```typescript
/**
 * SE 再生フック
 *
 * Tone.js の Synth を使い、ワンショット SE を再生する。
 * BGM とは別の GainNode を使用。
 */
export const useSePlayer = () => {
  /**
   * スライド SE を再生
   * - 周波数: 600Hz
   * - 波形: sine
   * - 音量: 0.04
   * - 持続時間: 0.05s
   */
  const playSlideSe: () => void;

  /**
   * 正解位置 SE を再生
   * - 周波数: 880Hz
   * - 波形: sine
   * - 音量: 0.06
   * - 持続時間: 0.12s
   */
  const playCorrectSe: () => void;

  /**
   * 完成 SE を再生
   * - 周波数: 523Hz
   * - 波形: triangle
   * - 音量: 0.08
   * - 持続時間: 0.3s
   */
  const playCompleteSe: () => void;
};
```

### 5.3 BGM トラックデータ（`src/utils/bgm-data.ts`）

| # | ID | 名前 | BPM | 調 | メロディ波形 | ベース波形 | メロディ音量 | ベース音量 | 雰囲気 |
|---|----|----|-----|-----|-------------|-----------|------------|----------|--------|
| 1 | `calm-water` | 静かな水面 | 72 | C Major | sine | triangle | 0.08 | 0.04 | 穏やかなアンビエント（デフォルト） |
| 2 | `starry-waltz` | 星空のワルツ | 84 | G Major | triangle | sine | 0.07 | 0.03 | エレガントな 3/4 拍子 |
| 3 | `morning-walk` | 朝の散歩道 | 96 | F Major | square | sine | 0.05 | 0.04 | 軽快なチップチューン風 |
| 4 | `deep-thought` | 深い思索 | 60 | A Minor | sine | triangle | 0.06 | 0.03 | ミニマルで集中向け |

**ノートシーケンス形式**:
- メロディ: 8 小節 × 4 拍 = 32 ノート（1 ノート = 四分音符）
- ベース: 8 小節 × 4 拍 = 32 ノート
- 値: MIDI ノート番号（60 = C4）または `null`（休符）

**静かな水面（calm-water）のメロディ例**:
```typescript
// C Major ペンタトニック: C4(60), D4(62), E4(64), G4(67), A4(69)
melody: [
  60, null, 64, null, 67, null, 64, null,  // 小節1-2
  69, null, 67, null, 64, null, 62, null,  // 小節3-4
  60, null, 62, null, 64, null, 67, null,  // 小節5-6
  69, null, 67, null, 64, null, 60, null,  // 小節7-8
],
bass: [
  48, null, null, null, 52, null, null, null,  // C3, E3
  55, null, null, null, 48, null, null, null,  // G3, C3
  48, null, null, null, 55, null, null, null,  // C3, G3
  52, null, null, null, 48, null, null, null,  // E3, C3
],
```

### 5.4 AudioContext 共有設計

```
Tone.getContext()  (共有 AudioContext)
    │
    ├── BGM GainNode (bgmVolumeAtom で制御)
    │     ├── Melody Synth
    │     └── Bass Synth
    │
    └── SE GainNode (sfxVolume で制御)
          ├── Slide SE Synth
          ├── Correct SE Synth
          └── Complete SE Synth
```

---

## 6. ストレージ設計

### 6.1 localStorage キー一覧

| キー | 型 | 用途 | Phase |
|------|----|------|-------|
| `puzzle_clear_history` | `ClearHistory[]` | 旧クリア履歴（マイグレーション後は読み取り専用） | 既存 |
| `puzzle_records` | `PuzzleRecord[]` | ベストスコア記録（画像×難易度） | Phase 1 |
| `puzzle_total_clears` | `number` | 累計クリア回数（テーマアンロック判定用） | Phase 3 |
| `puzzle_bgm_volume` | `number` | BGM 音量（0〜100） | Phase 2 |
| `puzzle_bgm_track` | `string` | 最後に選択した BGM トラック ID | Phase 2 |
| `game-platform-settings` | `GameSettings` | プラットフォーム共通設定（既存） | 既存 |

### 6.2 データマイグレーション

既存の `ClearHistory` を `PuzzleRecord` に変換する:

```typescript
/**
 * 旧 ClearHistory から PuzzleRecord へマイグレーションする
 *
 * - ClearHistory にはスコア・難易度が含まれないため、
 *   bestScore = 0, bestRank = 'クリア', bestMoves = 0, division = 4 をデフォルトとする
 * - 同一 imageId の ClearHistory は clearCount としてカウント
 * - マイグレーション済みフラグを localStorage に保存し、二重実行を防ぐ
 */
export const migrateClearHistory = (): void => {
  const MIGRATION_KEY = 'puzzle_migration_v1';
  if (localStorage.getItem(MIGRATION_KEY)) return;

  const oldHistory = getClearHistory();
  if (oldHistory.length === 0) {
    localStorage.setItem(MIGRATION_KEY, 'done');
    return;
  }

  // imageId ごとにグループ化
  const grouped = new Map<string, ClearHistory[]>();
  for (const entry of oldHistory) {
    const list = grouped.get(entry.imageName) ?? [];
    list.push(entry);
    grouped.set(entry.imageName, list);
  }

  // PuzzleRecord に変換
  const records: PuzzleRecord[] = [];
  for (const [imageId, entries] of grouped) {
    const bestEntry = entries.reduce((a, b) =>
      a.clearTime < b.clearTime ? a : b
    );
    records.push({
      imageId,
      division: 4,                    // 旧データには難易度情報なし
      bestScore: 0,                   // 旧データにはスコア情報なし
      bestRank: 'クリア',
      bestTime: bestEntry.clearTime,
      bestMoves: 0,                   // 旧データには手数情報なし
      clearCount: entries.length,
      lastClearDate: bestEntry.clearDate,
    });
  }

  savePuzzleRecords(records);
  localStorage.setItem(MIGRATION_KEY, 'done');
};
```

### 6.3 PuzzleRecord CRUD

```typescript
// src/utils/storage-utils.ts に追加

const RECORDS_KEY = 'puzzle_records';

export const getPuzzleRecords = (): PuzzleRecord[] => { ... };
export const savePuzzleRecords = (records: PuzzleRecord[]): void => { ... };

/**
 * スコアを記録し、ベスト更新があれば true を返す
 */
export const recordScore = (
  imageId: string,
  division: number,
  score: PuzzleScore
): { record: PuzzleRecord; isBestScore: boolean } => {
  const records = getPuzzleRecords();
  const existing = records.find(
    r => r.imageId === imageId && r.division === division
  );

  if (existing) {
    const isBestScore = score.totalScore > existing.bestScore;
    const updated: PuzzleRecord = {
      ...existing,
      bestScore: Math.max(existing.bestScore, score.totalScore),
      bestRank: isBestScore ? score.rank : existing.bestRank,
      bestTime: Math.min(existing.bestTime, score.elapsedTime),
      bestMoves: existing.bestMoves === 0
        ? score.moveCount
        : Math.min(existing.bestMoves, score.moveCount),
      clearCount: existing.clearCount + 1,
      lastClearDate: new Date().toISOString(),
    };
    savePuzzleRecords(records.map(r =>
      r.imageId === imageId && r.division === division ? updated : r
    ));
    return { record: updated, isBestScore };
  }

  const newRecord: PuzzleRecord = {
    imageId,
    division,
    bestScore: score.totalScore,
    bestRank: score.rank,
    bestTime: score.elapsedTime,
    bestMoves: score.moveCount,
    clearCount: 1,
    lastClearDate: new Date().toISOString(),
  };
  savePuzzleRecords([...records, newRecord]);
  return { record: newRecord, isBestScore: true };
};
```

---

## 7. 既存コードとの統合ポイント

### 7.1 `usePuzzle.ts` の変更

```
現行:
  initializePuzzle → generatePuzzlePieces → shufflePuzzlePieces → 状態更新
  movePiece → ピース位置更新 → isPuzzleCompleted チェック

変更後:
  initializePuzzle → generatePuzzlePieces → shufflePuzzlePieces → 状態更新
                                              + shuffleMovesAtom にシャッフル手数を保存
                                              + moveCountAtom を 0 にリセット
                                              + hintUsedAtom を false にリセット

  movePiece → ピース位置更新 → moveCountAtom + 1
              → correctRateAtom 更新（calculateCorrectRate）
              → 正解位置チェック → SE 再生（正解位置 SE）
              → isPuzzleCompleted → スコア計算 → recordScore → 完成 SE
```

### 7.2 `useGameState.ts` の変更

- `imageSourceMode` / `setImageSourceMode` を削除
- `handleImageUpload` を `handleImageSelect(image: PuzzleImage)` に変更
- スコア状態の追加（`score`, `isBestScore`）
- BGM 初期化のトリガー（`handleStartGame` で `initAudio` 呼び出し）

### 7.3 `PuzzleSections.tsx` の変更

**SetupSectionComponent**:
- `ToggleButtonsContainer` / `ToggleButton` を削除
- `ImageUploader` を削除
- `DefaultImageSelector` → `ThemeSelector` に置き換え

**GameSectionComponent**:
- `CompletionOverlay` → `ResultScreen` に置き換え
- `ShareButton` のテキストにスコア・ランクを追加
- `BgmController` を配置

### 7.4 `PuzzleBoard.tsx` の変更

- StatusBar を 3 列に拡張（経過時間・手数・正解率）
- スワイプイベントハンドラを `Board` に追加（`onTouchStart`, `onTouchMove`, `onTouchEnd`）
- キーボードイベントを `useEffect` で `window` にバインド
- 完成時の `CompletionOverlay` を `ResultScreen` コンポーネントに委譲
- ピース移動時の SE 呼び出しポイントを追加
- 正解位置ピースに `$isCorrect` prop を追加しアニメーション制御

### 7.5 `useVideoPlayback.ts` の変更

- `validFilenames` 配列のリネーム反映:
  - `'hokusai_kangchenjunga'` → `'snowy_mountain_ukiyoe'`
  - `'midnight_times_square'` → `'midnight_neon_street'`
- Phase 3 で新規画像 12 枚分のファイル名を追加

### 7.6 `storage-utils.ts` の変更

- `extractImageName` の data URL 分岐（`imageUrl.startsWith('data:')` → `'アップロード画像'`）を削除
- `PuzzleRecord` 関連の CRUD 関数を追加
- マイグレーション関数を追加
- 累計クリア回数の管理関数を追加

---

## 8. スワイプ操作仕様（`src/hooks/useSwipe.ts`）

```typescript
/**
 * スワイプ操作検出フック
 *
 * @param onSwipe - スワイプ検出時のコールバック
 * @param threshold - スワイプ判定閾値（デフォルト: 30px）
 * @returns ref - 対象要素にアタッチする ref
 */
export const useSwipe = (
  onSwipe: (direction: 'up' | 'down' | 'left' | 'right') => void,
  threshold: number = 30
) => {
  // タッチ開始位置を記録
  // タッチ終了時に移動量を計算
  // 閾値以上で最大移動方向をコールバック
  // 閾値未満は無視（クリックとして処理される）
};
```

**スワイプ方向とピース移動のマッピング**:
| スワイプ方向 | 移動するピースの位置（空白基準） | 説明 |
|------------|-------------------------------|------|
| 上 (↑) | 空白の下のピース | 下のピースが上（空白位置）に移動 |
| 下 (↓) | 空白の上のピース | 上のピースが下（空白位置）に移動 |
| 左 (←) | 空白の右のピース | 右のピースが左（空白位置）に移動 |
| 右 (→) | 空白の左のピース | 左のピースが右（空白位置）に移動 |

---

## 9. キーボード操作仕様（`src/hooks/useKeyboard.ts`）

```typescript
/**
 * キーボード操作フック
 *
 * ゲーム中のみアクティブ。completed 時は無効化。
 */
export const useKeyboard = (handlers: {
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onToggleHint: () => void;
  onReset: () => void;
  enabled: boolean;
}) => {
  // window.addEventListener('keydown', handler)
};
```

**キーバインド**:
| キー | アクション |
|------|----------|
| `ArrowUp` / `W` / `w` | ピースを上に移動（= 空白の下のピースを移動） |
| `ArrowDown` / `S` / `s` | ピースを下に移動 |
| `ArrowLeft` / `A` / `a` | ピースを左に移動 |
| `ArrowRight` / `D` / `d` | ピースを右に移動 |
| `H` / `h` | ヒントモードトグル |
| `R` / `r` | パズルリセット |

---

## 10. アニメーション仕様

### 10.1 正解位置フラッシュ

```css
/* PuzzlePiece.styles.ts に追加 */
@keyframes correctFlash {
  0% { border-color: #4caf50; box-shadow: 0 0 10px rgba(76, 175, 80, 0.8); }
  100% { border-color: #fff; box-shadow: none; }
}

/* $isCorrect prop が true → false に変わった瞬間はアニメなし */
/* $isCorrect prop が false → true に変わった瞬間にアニメ発火 */
animation: ${props => props.$justBecameCorrect ? 'correctFlash 0.5s ease-out' : 'none'};
```

### 10.2 完成アニメーション

```css
/* PuzzleBoard.styles.ts に追加 */
@keyframes confetti {
  0% { opacity: 1; transform: translateY(0) rotate(0deg); }
  100% { opacity: 0; transform: translateY(-200px) rotate(720deg); }
}

/* ボーダー溶解: 外周ピースから中心に向かって順にボーダーを非表示化 */
/* ピースの位置から中心までの距離を計算し、距離に応じた delay を設定 */
transition-delay: ${props => props.$dissolveDelay}s;
```

---

## 11. アセット仕様

### 11.1 画像アセット

| 項目 | 仕様 |
|------|------|
| フォーマット | WebP |
| 推奨サイズ | ~1024x1024px（正方形でなくてもよい） |
| 配置先 | `public/images/default/` |
| 命名規則 | `lowercase_snake_case.webp` |
| タイトル規則 | 実在の人名・商標・施設名・作品名を含めない。シーンの描写のみ |

### 11.2 動画アセット

| 項目 | 仕様 |
|------|------|
| フォーマット | MP4 (H.264) |
| 長さ | 5〜10 秒 |
| 配置先 | `public/videos/default/` |
| 命名規則 | 対応する画像と同じベース名 + `.mp4` |
| 内容 | 対応画像のアニメーション版（完成演出用） |

### 11.3 テーマ別画像一覧

#### イラストギャラリー（初期解放）
| # | ファイル名 | alt テキスト | 既存/新規 |
|---|----------|------------|----------|
| 1 | `snowy_mountain_ukiyoe.webp` | 雪山の浮世絵風イラスト | 既存（リネーム） |
| 2 | `moonlight_dancer.webp` | 月明かりのダンサー | 既存 |
| 3 | (新規画像 1) | (要決定) | 新規 |
| 4 | (新規画像 2) | (要決定) | 新規 |

#### 世界の風景（初期解放）
| # | ファイル名 | alt テキスト | 既存/新規 |
|---|----------|------------|----------|
| 1 | `camel_in_the_desert.webp` | 砂漠の中のキャメル | 既存 |
| 2 | `midnight_neon_street.webp` | 真夜中のネオン街 | 既存（リネーム） |
| 3 | (新規画像 3) | (要決定) | 新規 |
| 4 | (新規画像 4) | (要決定) | 新規 |

#### ノスタルジー（初期解放）
| # | ファイル名 | alt テキスト | 既存/新規 |
|---|----------|------------|----------|
| 1 | `sunset_candy_shop.webp` | 夕焼けの駄菓子屋 | 既存 |
| 2 | `chalk_drawing_kids.webp` | チョークで落書きをする子供達 | 既存 |
| 3 | (新規画像 5) | (要決定) | 新規 |
| 4 | (新規画像 6) | (要決定) | 新規 |

#### 海と空（5 回クリアで解放）
| # | ファイル名 | alt テキスト | 既存/新規 |
|---|----------|------------|----------|
| 1 | `coral_reef_fish.webp` | サンゴ礁の熱帯魚 | 新規 |
| 2 | `cumulonimbus_port_town.webp` | 入道雲の港町 | 新規 |
| 3 | `starry_beach.webp` | 星降る砂浜 | 新規 |

#### 四季（10 回クリアで解放）
| # | ファイル名 | alt テキスト | 既存/新規 |
|---|----------|------------|----------|
| 1 | `cherry_blossom_path.webp` | 桜並木の小道 | 新規 |
| 2 | `autumn_valley.webp` | 紅葉の渓谷 | 新規 |
| 3 | `snow_lantern_hotspring.webp` | 雪灯りの温泉 | 新規 |

#### ミステリー（全テーマ 1 回以上クリアで解放）
| # | ファイル名 | alt テキスト | 既存/新規 |
|---|----------|------------|----------|
| 1 | (新規画像 7) | ??? | 新規 |
| 2 | (新規画像 8) | ??? | 新規 |
| 3 | (新規画像 9) | ??? | 新規 |

### 11.4 BGM データフォーマット（除外）

> BGM 機能の除外に伴い不要。

---

## 12. ダークテーマ色整合性（後処理）

### 12.1 問題

アプリは `body.premium-theme`（ダークテーマ）がデフォルトで適用される（`App.tsx` の `useEffect` で設定）。CSS 変数は以下の通り:

```css
body.premium-theme {
  --bg-gradient: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.75);
  --accent-color: #00d2ff;
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
}
```

しかし、複数のコンポーネントでライトテーマ前提のハードコード色が使われており、ダーク背景上でテキストが読めない、または UI が不整合な状態だった。

### 12.2 修正方針

ハードコード色を CSS 変数に置換。ただし以下は意図的に変更しない:

- **パズル盤面**（`Board`）: 画像ピースが置かれる場所のため `#f0f0f0` 背景が適切
- **画像上のオーバーレイボタン**（`OverlayToggleButton`, `CloseButton`）: 画像/動画上で視認性を確保するため `rgba(255,255,255,0.7)` が適切
- **画像上のバッジ**（`RankBadge`, `SelectedIndicator`）: 自前の背景を持つためそのまま
- **`<option>` 要素**: ブラウザネイティブ要素のため CSS 変数が効かないケースがあり直値を使用

### 12.3 修正一覧

#### ThemeSelector.styles.ts

| コンポーネント | 変更前 | 変更後 |
|-------------|--------|--------|
| `Title` | `color: #333` | `color: var(--text-primary)` |
| `ThemeTab`（非選択） | `background: #fff; color: #333; border: #ccc` | `background: var(--glass-bg); color: var(--text-primary); border: var(--glass-border)` |
| `ThemeTab`（ロック） | `background: #e0e0e0; color: #999` | `background: rgba(255,255,255,0.03); color: var(--text-secondary)` |
| `ThemeTab`（ホバー） | `background: #f0f8f0` | `background: rgba(255,255,255,0.1)` |
| `ThemeDescription` | `color: #666` | `color: var(--text-secondary)` |
| `ProgressBar` | `background: #e0e0e0` | `background: rgba(255,255,255,0.15)` |

#### DifficultySelector.styles.ts

| コンポーネント | 変更前 | 変更後 |
|-------------|--------|--------|
| `Label` | `color: #333` | `color: var(--text-primary)` |
| `StyledSelect` | `background: white; border: #ccc` | `background: var(--glass-bg); color: var(--text-primary); border: var(--glass-border)` |
| `SelectArrow` | `border-top: #333` | `border-top: var(--text-secondary)` |
| `Description` | `color: #666` | `color: var(--text-secondary)` |

#### PuzzleBoard.styles.ts

| コンポーネント | 変更前 | 変更後 |
|-------------|--------|--------|
| `StatusBar` | `background: #f8f8f8` | `background: var(--glass-bg); border: var(--glass-border)` |
| `StatusItem` | `color: #333` | `color: var(--text-primary)` |
| `HintToggleButton`（非活性） | `background: #f8f8f8; color: #333; border: #ccc` | `background: var(--glass-bg); color: var(--text-primary); border: var(--glass-border)` |
| `HintToggleButton`（活性） | `background: #4caf50` | `background: var(--accent-color)` |

### 12.4 副次的バグ修正

`HintToggleButton` の `active` prop 判定を `props.active`（truthy チェック）から `props.active === 'true'`（文字列比較）に修正。元のコードでは `active="false"` も JavaScript で truthy なため、ヒント非表示時でも常に緑色で表示される潜在バグがあった。
