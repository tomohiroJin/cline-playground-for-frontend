# RISK LCD ブラッシュアップ — 実装計画

## 概要

RISK LCD（液晶ゲーム機風3レーン回避×ローグライトゲーム）に以下4機能を追加し、リプレイ性・共有性・初期定着率を向上させる。

1. **デイリーチャレンジ** — 日替わり固定シードプレイ＋報酬
2. **リザルト共有** — シェアカード＋共有URL
3. **ゴースト表示** — サーバ不要の擬似対戦
4. **初回オンボーディング** — チュートリアル＋練習モード

## 設計方針

- **既存アーキテクチャ尊重**: `features/risk-lcd/` 配下の hooks/components/utils/constants 構造を維持
- **段階的実装**: 各スプリントは独立して動作確認可能。依存関係のあるスプリントは明示
- **サーバ不要**: 全データは localStorage + URL クエリで完結
- **LCD表現維持**: 新規UIもASCII/ピクセルフォントの既存表現に統一
- **型安全**: 新規型は `types.ts` に集約、既存型の拡張は後方互換を維持
- **テスト**: 純粋関数（シード生成・圧縮・デコード）はユニットテスト必須

---

## フェーズ構成

### Sprint 1: 基盤整備 + デイリーチャレンジ

**目標**: シード付き乱数基盤を整備し、デイリーモードを実装

#### Phase 1-1: シード付き乱数基盤

**新規ファイル**:
- `utils/seeded-random.ts` — `SeededRand` クラス（mulberry32 PRNG）

**変更ファイル**:
- `utils/index.ts` — `SeededRand` を re-export

**実装内容**:
1. `SeededRand` クラス: `int(n)`, `pick(arr)`, `chance(p)`, `shuffle(arr)` — 既存 `Rand` と同一 API
2. `dateToSeed(dateStr: string): number` — 日次ID → 数値シードの変換
3. `getDailyId(): string` — 現在日付から `YYYY-MM-DD` 形式の日次ID生成

#### Phase 1-2: デイリーゲーム状態

**変更ファイル**:
- `types.ts` — `DailyData` 型追加、`SaveData` にデイリーフィールド追加
- `hooks/useStore.ts` — デイリーデータの読み書きメソッド追加

**実装内容**:
1. `DailyData` 型: `{ date: string, played: boolean, bestScore: number, firstPlayRewarded: boolean }`
2. `SaveData` 拡張: `daily?: DailyData` フィールド追加
3. `useStore` に `getDailyData()`, `recordDailyPlay(score)`, `isDailyPlayed()` メソッド追加

#### Phase 1-3: デイリーモードUI

**新規ファイル**:
- `components/DailyScreen.tsx` — デイリー条件表示＋開始ボタン

**変更ファイル**:
- `constants/game-config.ts` — `MENUS` にデイリー導線追加（インデックス1に挿入）
- `components/TitleScreen.tsx` — 「DAILY」ボタン追加
- `components/RiskLcdGame.tsx` — デイリー画面のルーティング追加
- `components/styles.ts` — デイリー画面用スタイル追加
- `hooks/useGameEngine.ts` — `ScreenId` 'D' のディスパッチ追加

**実装内容**:
1. タイトルメニューに「DAILY」を追加（既存4項目のインデックス1に挿入）
2. Daily 選択 → DailyScreen 表示（今日のモディファイア一覧 + 開始ボタン）
3. 開始ボタン押下 → シード付きゲーム開始

#### Phase 1-4: デイリーゲームロジック

**変更ファイル**:
- `hooks/phases/types.ts` — `PhaseContext` に RNG インスタンス参照を追加
- `hooks/useGameEngine.ts` — RNG ref の管理（通常: `Rand` ラッパー / デイリー: `SeededRand`）
- `hooks/phases/useRunningPhase.ts` — デイリーモード時のシード付き乱数適用（`pickObs`, `announce`, `startGame`）
- `hooks/phases/usePerkPhase.ts` — パーク候補抽選のシード対応（`Rand.shuffle` × 2箇所）
- `hooks/phases/useResultPhase.ts` — デイリー報酬計算
- `utils/game-logic.ts` — `wPick` に RNG 引数追加（`Math.random()` 直接使用の排除）

**実装内容**:
1. `startGame` にデイリーモードフラグ追加
2. **RNG 注入設計**: `PhaseContext` に `rng` ref を追加。通常モードは既存 `Rand` をラップした互換オブジェクト、デイリーモードは `SeededRand` インスタンスを設定。各フェーズフックはこの `rng` を経由して乱数を取得
3. `wPick` 関数に `rng?: () => number` 引数を追加（デフォルト: `Math.random`）
4. デイリーモード時: `SeededRand` を使用してモディファイア・障害配置・パーク候補を決定
5. リザルト時: 初回プレイ報酬(+50PT) + 自己ベスト更新報酬(+差分の10%)

---

### Sprint 2: リザルト共有

**目標**: シェアカードUI + 共有URL生成

#### Phase 2-1: 共有URL設計・ユーティリティ

**新規ファイル**:
- `utils/share.ts` — URL生成・パース・ビルド要約エンコード

**実装内容**:
1. `encodeShareUrl(params: ShareParams): string` — 共有URL生成
2. `decodeShareUrl(search: string): ShareParams | null` — URLクエリ文字列パース
3. `encodeBuild(perks: PerkDef[], style: string[]): string` — ビルド情報を短縮文字列に変換
4. `decodeBuild(code: string): BuildInfo` — 短縮文字列からビルド情報を復元

**型定義**:
```typescript
interface ShareParams {
  daily?: string;     // 日次ID
  score: number;      // スコア
  build: string;      // ビルド要約コード
  ghost?: string;     // ゴーストデータ（Sprint 3 で追加）
}
```

#### Phase 2-2: シェアカードUI

**変更ファイル**:
- `components/ResultScreen.tsx` — シェアカード表示 + 共有/コピーボタン追加
- `components/styles.ts` — シェアカード用スタイル追加

**実装内容**:
1. リザルト画面下部に「SHARE」「COPY」ボタン配置
2. シェアカード表示: スコア、ランク、デイリー条件（デイリー時）、ビルド要約
3. 「SHARE」: Web Share API (`navigator.share`) が使える場合のみ表示
4. 「COPY」: `navigator.clipboard.writeText()` でURLコピー

#### Phase 2-3: 共有URL受信処理

**変更ファイル**:
- `components/RiskLcdGame.tsx` — URLクエリパラメータの読み取り
- `hooks/useGameEngine.ts` — 共有データの表示処理

**実装内容**:
1. ページ読み込み時にURLクエリをパース
2. `score` + `build` がある場合: リザルト画面（閲覧モード）を表示
3. `daily` がある場合: デイリーモードへの導線を表示

---

### Sprint 3: ゴースト表示

**目標**: プレイログ記録 + ゴースト再生

#### Phase 3-1: ゴーストデータ収集

**新規ファイル**:
- `utils/ghost.ts` — ゴーストデータの記録・圧縮・展開

**実装内容**:
1. `GhostRecorder` クラス: `record(lane: LaneIndex)` でサイクルごとのレーン位置記録
2. `compress(): string` — ランレングス圧縮 → Base64 エンコード
3. `GhostPlayer` クラス: `decompress(data: string)` → レーン位置配列に展開
4. `getPosition(tick: number): LaneIndex` — 指定 tick のゴースト位置取得

**圧縮形式**: レーン値(0/1/2)の連続をランレングス圧縮し、Base64url エンコード
- 例: `[1,1,1,0,0,2,2,2,2]` → `1:3,0:2,2:4` → Base64url

#### Phase 3-2: ゲームループへの記録統合

**変更ファイル**:
- `hooks/phases/useRunningPhase.ts` — サイクルごとのレーン記録追加
- `hooks/phases/useResultPhase.ts` — リザルト時にゴーストデータを共有URLに含める
- `types.ts` — `GameState` にゴースト記録フィールド追加

**実装内容**:
1. `GameState` に `ghostLog: number[]` フィールド追加
2. 各サイクルの resolve 時にプレイヤーのレーン位置を記録
3. リザルト時に `GhostRecorder.compress()` で圧縮

#### Phase 3-3: ゴースト再生UI

**変更ファイル**:
- `components/LaneGrid.tsx` — ゴースト表示（点滅ドット）追加
- `components/GameScreen.tsx` — ゴーストプレイヤー位置の受け渡し
- `hooks/useGameEngine.ts` — ゴーストプレイヤーの tick 管理

**実装内容**:
1. URLから `ghost` パラメータを取得 → `GhostPlayer` で展開
2. 各サイクルでゴーストのレーン位置を `LaneGrid` に渡す
3. ゴースト表示: 既存の `ghost` SegState を利用、点滅アニメーション
4. ゴーストは当たり判定なし（視覚のみ）

---

### Sprint 4: 初回オンボーディング

**目標**: チュートリアル + 練習モード

#### Phase 4-1: チュートリアル

**新規ファイル**:
- `components/TutorialScreen.tsx` — チュートリアル画面（4ステップ）

**変更ファイル**:
- `types.ts` — `ScreenId` に `'TU'` 追加
- `hooks/useStore.ts` — `SaveData` に `tutorialDone: boolean` 追加
- `hooks/useGameEngine.ts` — 初回プレイ時のチュートリアル遷移
- `components/RiskLcdGame.tsx` — チュートリアル画面ルーティング

**実装内容**:
1. 4ステップのチュートリアル画面:
   - Step 1: 「予告を見る」— 上から降りてくる警告の説明
   - Step 2: 「回避する」— ← → でレーン移動
   - Step 3: 「スコアと倍率」— 高倍率レーン ＝ ハイリスク・ハイリターン
   - Step 4: 「パークでビルド」— ステージクリアでパーク獲得 → ビルド構築
2. 各ステップは ACT ボタンで次へ進行
3. 最後のステップ完了で `tutorialDone = true` を保存
4. 初回 GAME START 時にチュートリアル未完了なら `TU` 画面に遷移

#### Phase 4-2: 練習モード

**変更ファイル**:
- `constants/game-config.ts` — `MENUS` に「PRACTICE」追加
- `components/TitleScreen.tsx` — 練習ボタン表示
- `hooks/useGameEngine.ts` — 練習モードフラグ管理
- `hooks/phases/useRunningPhase.ts` — 練習モード時の固定ステージ制御
- `hooks/phases/useResultPhase.ts` — 練習モードのスコア分離

**実装内容**:
1. メニューに「PRACTICE」項目追加
2. 練習モード: ステージ1固定（`maxStg = 0`）、モディファイアなし
3. 練習モードのスコアは通常ベストスコアに記録しない（`updateBest` をスキップ）
4. 練習モードのリザルトに「練習モード」表示、PT獲得なし

---

## 依存関係

```
Sprint 1 (デイリーチャレンジ)
  └── Phase 1-1: シード付き乱数基盤  ← 全 Phase の前提
  └── Phase 1-2: デイリーゲーム状態   ← Phase 1-1
  └── Phase 1-3: デイリーモードUI     ← Phase 1-2
  └── Phase 1-4: デイリーゲームロジック ← Phase 1-2, 1-3

Sprint 2 (リザルト共有)             ← Sprint 1 完了が望ましい（デイリー情報含むため）
  └── Phase 2-1: 共有URLユーティリティ ← 独立
  └── Phase 2-2: シェアカードUI       ← Phase 2-1
  └── Phase 2-3: 共有URL受信処理      ← Phase 2-1

Sprint 3 (ゴースト表示)             ← Sprint 2 完了が望ましい（共有URLに含めるため）
  └── Phase 3-1: ゴーストデータ収集   ← 独立
  └── Phase 3-2: ゲームループ統合     ← Phase 3-1
  └── Phase 3-3: ゴースト再生UI       ← Phase 3-1, 3-2

Sprint 4 (オンボーディング)          ← 独立（他スプリントと並行可能）
  └── Phase 4-1: チュートリアル       ← 独立
  └── Phase 4-2: 練習モード           ← 独立
```

## 並列実行戦略

```
ストリーム A（デイリー）:    Sprint 1 全 Phase（順次）
ストリーム B（共有/ゴースト）: Sprint 2 → Sprint 3（順次）
ストリーム C（オンボーディング）: Sprint 4（独立、いつでも開始可能）
```

- ストリーム A と C は並行実行可能
- ストリーム B は Sprint 1 完了後に開始するのが望ましいが、Phase 2-1 は独立実装可能

---

## 影響範囲まとめ

### 新規ファイル（6件）

| ファイル | Sprint | 内容 |
|---------|--------|------|
| `utils/seeded-random.ts` | S1 | シード付き PRNG |
| `utils/share.ts` | S2 | 共有URL生成・パース |
| `utils/ghost.ts` | S3 | ゴーストデータ記録・圧縮・展開 |
| `components/DailyScreen.tsx` | S1 | デイリー条件表示画面 |
| `components/TutorialScreen.tsx` | S4 | チュートリアル画面 |
| テストファイル（3件） | 各 | seeded-random/share/ghost のユニットテスト |

### 変更ファイル（主要）

| ファイル | 変更内容 |
|---------|---------|
| `types.ts` | `ScreenId`, `SaveData`, `GameState` の拡張 |
| `constants/game-config.ts` | `MENUS` 拡張 |
| `hooks/useStore.ts` | デイリーデータ管理、チュートリアルフラグ |
| `hooks/useGameEngine.ts` | デイリー/練習/チュートリアル/ゴースト対応、RNG ref 管理 |
| `hooks/phases/types.ts` | `PhaseContext` に RNG 参照追加 |
| `hooks/phases/useRunningPhase.ts` | シード付き乱数、ゴースト記録、練習モード |
| `hooks/phases/usePerkPhase.ts` | パーク候補抽選のシード対応 |
| `hooks/phases/useResultPhase.ts` | デイリー報酬、ゴーストデータ出力、練習分離 |
| `utils/game-logic.ts` | `wPick` に RNG 引数追加 |
| `components/TitleScreen.tsx` | メニュー拡張 |
| `components/ResultScreen.tsx` | シェアカード + 共有ボタン + props 拡張 |
| `components/RiskLcdGame.tsx` | 画面ルーティング拡張、URLクエリ処理 |
| `components/LaneGrid.tsx` | ゴースト表示 |
| `components/GameScreen.tsx` | ゴーストレーン位置の受け渡し |
| `components/styles.ts` | 新規画面用スタイル追加 |

---

## リスク・注意事項

1. **シード付き PRNG の品質**: mulberry32 は十分な品質だが、日次IDの衝突リスクはゼロ（日付文字列ベース）
2. **RNG 注入の影響範囲**: 既存の `Rand`（グローバル）と `wPick`（`Math.random()` 直接使用）を `SeededRand` で置き換える必要がある。`PhaseContext` に RNG ref を持たせる設計とし、`usePerkPhase.ts` の `Rand.shuffle` × 2箇所も含めて漏れなく対応すること
3. **URL長制限**: ゴーストデータの圧縮後サイズに注意。目安: 全6ステージ分で約200〜400文字以内に収める。超過時は `ghost` を省略
4. **localStorage 容量**: デイリーデータは最新1日分のみ保持し、古いデータは自動削除
5. **ScreenId 拡張**: 既存の `switch` 文を漏れなく更新する（`useGameEngine.ts` の `dispatch` 関数）
6. **メニュー項目数の増加**: 既存4項目 → 最大6項目。LCD画面の表示領域に収まるかUIテスト必須
7. **MENUS 変更の競合**: ストリーム A（DAILY 追加）と C（PRACTICE 追加）が両方 `MENUS` を変更する。並行実装する場合は MENUS 変更を先に統合するか、一方を先に完了させてからもう一方に着手すること
8. **Web Share API**: モバイルブラウザでは対応状況が限られる。フォールバックとして「COPY」ボタンは必須
9. **チュートリアルのスキップ**: 既存ユーザーは `plays > 0` なら自動スキップ（`tutorialDone` を true に初期化）
10. **`ghost` 命名の重複**: 既存コードでは `ghost` が `ArtKey`（非アクティブレーンのプレイヤー不在表示）と `SegState`（セグメント表示）で使われている。ゴースト再生機能のセグメント表示には `'ghostPlayer'` など別名を使い、既存の `ghost` と混同しないこと
11. **ResultScreen の props 拡張**: 共有機能にはデイリーモードフラグ・装備スタイルID・共有URL生成に必要な情報が必要。`ResultScreen` の Props を拡張するか、GameState に追加情報を持たせる設計とすること
