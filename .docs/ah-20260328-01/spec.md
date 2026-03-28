# Air Hockey ペアマッチ完成版 — 仕様書

## 1. チーム構成モデル

### 1.1 チーム構成タイプ

P2（パートナー）は CPU/人間を切り替え可能:

| 構成 | チーム1（下） | チーム2（上） | 説明 |
|------|-------------|-------------|------|
| **人+CPU vs CPU+CPU** | P1: 人間 / P2: CPU味方 | P3: CPU / P4: CPU | 基本形（デフォルト） |
| **人+人 vs CPU+CPU** | P1: 人間 / P2: 人間（WASD/タッチ） | P3: CPU / P4: CPU | 協力プレイ |

> **将来拡張**: P3/P4 の人間操作は入力デバイス拡張後に対応（ゲームパッド API 等）

### 1.2 スロット定義

| スロット | 役割 | 入力 | キャラ選択 |
|---------|------|------|-----------|
| P1 | プレイヤー | マウス/タッチ | 固定（アキラ） |
| P2 | パートナー | CPU（AI制御）/ 人間（WASD/タッチ）切り替え | ユーザー選択 |
| P3 | 敵 CPU 1 | AI 制御 | ユーザー選択 |
| P4 | 敵 CPU 2 | AI 制御 | ユーザー選択 |

### 1.3 キャラクター選択ルール

- P1 は常に「アキラ」（プレイヤーキャラ）固定
- P2/P3/P4 は `allBattleCharacters`（アンロック済みキャラ）から選択可能
- 同じキャラクターを複数スロットに割り当て可能（制限なし）
- 各スロットにデフォルトキャラを設定:
  - P2: ルーキー（rookie）
  - P3: レギュラー（regular）
  - P4: エース（ace）

## 2. 状態管理の拡張

### 2.1 useGameMode への追加フィールド

```typescript
// 既存
selectedCpuCharacter: Character | undefined;   // フリー対戦用
player1Character: Character | undefined;       // 2P 用
player2Character: Character | undefined;       // 2P 用

// 追加（S5-1〜S5-6 で実装済み）
allyCharacter: Character | undefined;          // P2: パートナーキャラ
enemyCharacter1: Character | undefined;        // P3: 敵 CPU 1
enemyCharacter2: Character | undefined;        // P4: 敵 CPU 2
pairMatchDifficulty: Difficulty;               // 2v2 用難易度

// 追加（S5-7 で実装）
allyControlType: 'cpu' | 'human';              // P2: CPU/人間切り替え（デフォルト: 'cpu'）
```

### 2.2 resetToFree への追加

```typescript
const resetToFree = useCallback(() => {
  // ... 既存のリセット処理 ...
  setAllyCharacter(undefined);
  setEnemyCharacter1(undefined);
  setEnemyCharacter2(undefined);
  // pairMatchDifficulty はリセットしない（ユーザー設定を保持）
}, []);
```

## 3. TeamSetupScreen 機能仕様

### 3.1 画面構成

```
┌──────────────────────────────────┐
│ ← 戻る     ペアマッチ設定         │  ← ヘッダー
├──────────────────────────────────┤
│                                  │
│  ── チーム1（下）──               │
│  P1: アキラ（あなた）  [固定]     │  ← アイコン + 名前
│  P2: [CPU ⇔ 人間] [キャラ選択]   │  ← トグル + タップでキャラ選択
│                                  │
│  ── チーム2（上）──               │
│  P3: [キャラ選択ボタン]           │  ← タップでキャラ選択
│  P4: [キャラ選択ボタン]           │  ← タップでキャラ選択
│                                  │
│  ── 難易度 ──                     │
│  [ かんたん | ふつう | むずかしい ] │  ← 3択ボタン
│                                  │
│  ── フィールド / スコア ──        │
│  フィールド: [選択]  スコア: [±]  │  ← タイトル画面設定を流用
│                                  │
│        [ 対戦開始！ ]             │  ← 開始ボタン
└──────────────────────────────────┘
```

### 3.2 キャラクター選択 UI

- 各スロット（P2/P3/P4）はタップで**インラインキャラクター選択パネル**を展開
- パネルは `FreeBattleCharacterSelect` のグリッドレイアウトを流用
- アンロック済みキャラのみ選択可能（ロック済みはグレーアウト）
- 選択後パネルを閉じ、スロットにアイコン + 名前を表示

### 3.3 難易度設定

- 2v2 用の難易度は独立した状態（`pairMatchDifficulty`）で管理
- 難易度は P2（味方）/ P3 / P4 の全 CPU に共通適用
- 表示: かんたん / ふつう / むずかしい の 3 択ボタン

### 3.4 P2 操作タイプ切り替え

P2 スロットに CPU/人間の切り替えトグルを表示する:

- **CPU**（デフォルト）: P2 は AI が制御する。選択キャラの AI プロファイルで動作
- **人間**: P2 は WASD / マルチタッチ（2本目）で人間が操作する

切り替え時の挙動:
- 選択済みキャラクターは保持される（切り替えてもリセットしない）
- CPU → 人間に切り替えた場合、操作説明（WASD/タッチ）を表示する

### 3.5 Props インターフェース

```typescript
type TeamSetupScreenProps = {
  // キャラクター選択
  allCharacters: Character[];        // 選択候補
  unlockedIds: string[];             // アンロック済み ID
  allyCharacter: Character;          // P2 選択済みキャラ
  enemyCharacter1: Character;        // P3 選択済みキャラ
  enemyCharacter2: Character;        // P4 選択済みキャラ
  onAllyChange: (c: Character) => void;
  onEnemy1Change: (c: Character) => void;
  onEnemy2Change: (c: Character) => void;
  // P2 操作タイプ
  allyControlType: 'cpu' | 'human';
  onAllyControlTypeChange: (t: 'cpu' | 'human') => void;
  // 難易度
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  // アクション
  onStart: () => void;
  onBack: () => void;
};
```

## 4. VsScreen 2v2 対応仕様

### 4.1 レイアウト

2v2 時は **チーム対チーム** のレイアウトに切り替える:

```
┌─────────────────────────────────────┐
│                                     │
│   [P1アイコン]  [P2アイコン]        │  ← チーム1（左）
│    アキラ        ルーキー            │
│                                     │
│              VS                     │  ← 中央テキスト
│                                     │
│   [P3アイコン]  [P4アイコン]        │  ← チーム2（右）
│    レギュラー     エース             │
│                                     │
│         フィールド: Classic          │  ← ステージ情報
└─────────────────────────────────────┘
```

### 4.2 Props 拡張

```typescript
// 既存 Props（1v1 用）
type VsScreenProps = {
  playerCharacter: Character;
  cpuCharacter: Character;
  stageName: string;
  fieldName: string;
  onComplete: () => void;
};

// 2v2 追加（オプショナル）
type VsScreenProps = {
  playerCharacter: Character;
  cpuCharacter: Character;
  stageName: string;
  fieldName: string;
  onComplete: () => void;
  // 2v2 用（指定時は 2v2 レイアウトに切り替え）
  is2v2?: boolean;
  allyCharacter?: Character;         // P2
  enemyCharacter2?: Character;       // P4
};
```

### 4.3 アニメーション

- 1v1 と同じタイミングシーケンス（合計 3 秒）を維持
- チーム1（P1+P2）は左からスライドイン
- チーム2（P3+P4）は右からスライドイン
- VS テキストは中央に配置（変更なし）

## 5. ゲーム開始フローの接続

### 5.1 画面遷移フロー

```
TitleScreen
  └→ [ペアマッチ] ボタン
     └→ TeamSetupScreen（キャラ選択・難易度・フィールド設定）
        └→ [対戦開始！] ボタン
           └→ VsScreen（4キャラ VS 演出）
              └→ onComplete
                 └→ Game（2v2 ゲームプレイ）
                    └→ ゲーム終了
                       └→ ResultScreen（2v2 リザルト）
                          └→ [メニューに戻る]
                             └→ TitleScreen
```

### 5.2 handlePairMatchStart の変更

```typescript
// 現在
const handlePairMatchStart = useCallback(() => {
  mode.setGameMode('2v2-local');
  startGame(mode.field, '2v2-local');
}, [mode, startGame]);

// 変更後: VsScreen を挟む
const handlePairMatchStart = useCallback(() => {
  mode.setGameMode('2v2-local');
  navigateTo('vsScreen');  // VsScreen → onComplete → startGame
}, [mode, navigateTo]);
```

## 6. ResultScreen 2v2 最適化

### 6.1 表示の変更点

| 要素 | 1v1 / 2P 表示 | 2v2 表示 |
|------|-------------|---------|
| 勝者テキスト | 「WIN!」/「LOSE...」 | 「チーム1 WIN!」/「チーム2 WIN!」 |
| プレイヤー名 | キャラ名 / 1P | 「チーム1」 |
| 対戦相手名 | キャラ名 / 2P | 「チーム2」 |
| キャラアイコン | 1 キャラ表示 | チームごとに 2 キャラ並べて表示 |

### 6.2 Props への追加

```typescript
// 既存の is2PMode に加え、is2v2Mode を明示的に分離
type ResultScreenProps = {
  // ... 既存 Props ...
  is2v2Mode?: boolean;
  allyCharacterName?: string;       // P2 キャラ名
  enemyCharacter2Name?: string;     // P4 キャラ名
};
```

## 7. 難易度の CPU への適用

### 7.1 適用ルール

| スロット | 難易度適用 | 備考 |
|---------|----------|------|
| P2（パートナー） | `pairMatchDifficulty`（CPU 時のみ） | 人間操作時は AI 不使用 |
| P3（敵 CPU 1） | `pairMatchDifficulty` | 常に CPU |
| P4（敵 CPU 2） | `pairMatchDifficulty` | 常に CPU |

> **設計判断**: 全 CPU 同一難易度にすることで、チーム間の実力差はキャラの AI プロファイルで表現する。
> 難易度はあくまで「ゲーム全体の強さ」を制御するパラメータとする。

### 7.2 useGameLoop の P2 入力/AI 分岐

```typescript
// allyControlType による分岐
if (allyControlType === 'human') {
  // 現在の実装: WASD / マルチタッチで人間が操作
} else {
  // CPU AI: updateExtraMalletAI で ally を制御（enemy と同じ方式）
}
```
