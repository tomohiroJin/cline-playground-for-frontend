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
│  ── CPU 難易度 ──                 │
│  [ かんたん | ふつう | むずかしい ] │  ← 3択ボタン（最上部に配置）
│                                  │
│  ▌チーム1（下）                   │  ← 青ボーダー
│  P1: アキラ（あなた） 🎮          │  ← 固定表示（opacity:1）
│  P2: [CPU|人間] [キャラ選択 ▼]    │  ← トグル + 選択パネル
│    └→ 展開時: キャラグリッド       │  ← 自動スクロール + アニメーション
│                                  │
│  ▌チーム2（上）                   │  ← 赤ボーダー
│  P3: [キャラ選択 ▼]              │
│  P4: [キャラ選択 ▼]              │
│                                  │
│        [ 対戦開始！ ]             │  ← 緑 CTA ボタン
└──────────────────────────────────┘
```

### 3.2 キャラクター選択 UI

- 各スロット（P2/P3/P4）はタップで**インラインキャラクター選択パネル**を展開
- パネルは `FreeBattleCharacterSelect` のグリッドレイアウトを流用
- アンロック済みキャラのみ選択可能（ロック済みはグレーアウト）
- 選択後パネルを閉じ、スロットにアイコン + 名前を表示
- **展開時の自動スクロール**: グリッド展開時に `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` を実行
- **開閉アニメーション**: `max-height` + `overflow: hidden` で 200ms ease-out

### 3.3 難易度設定

- 2v2 用の難易度は独立した状態（`pairMatchDifficulty`）で管理
- 難易度は P2（味方）/ P3 / P4 の全 CPU に共通適用
- 表示: かんたん / ふつう / むずかしい の 3 択ボタン
- **配置**: チーム構成セクションの上に配置（難易度 → チーム1 → チーム2 → 開始の流れ）

### 3.4 P2 操作タイプ切り替え

P2 スロットに CPU/人間の切り替えトグルを表示する:

- **CPU**（デフォルト）: P2 は AI が制御する。選択キャラの AI プロファイルで動作
- **人間**: P2 は WASD / マルチタッチ（2本目）で人間が操作する

切り替え時の挙動:
- 選択済みキャラクターは保持される（切り替えてもリセットしない）
- CPU → 人間に切り替えた場合、操作説明（WASD/タッチ）を表示する

ビジュアル仕様:
- セグメントコントロール `[CPU | 人間]` を P2 スロット行内に配置（別セクションにしない）
- 選択中: アクセントカラー（`#e67e22`）背景 + 白文字
- 未選択: 透明背景 + グレー文字（`#aaa`）
- タッチターゲット: 各ボタン 44x44px 以上

### 3.5 P1 固定スロットの表示

- `opacity: 1`（暗くしない）で表示し、`cursor: default` に設定
- 「P1: あなた」ラベルを明示し、プレイヤーキャラクターであることを強調
- 変更不可を示す視覚的ヒント: キャラカラーのボーダーで囲む

### 3.6 チーム色分け

チーム所属を色で直感的に判別する:
- チーム1 セクション: 左ボーダー 3px `#3498db`（青系 — プレイヤーカラー）、タイトル色も青系
- チーム2 セクション: 左ボーダー 3px `#e74c3c`（赤系 — 敵カラー）、タイトル色も赤系

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

### 4.3 レスポンシブ対応

- 画面幅 480px 以上: 横並びレイアウト（チーム1 左 / VS / チーム2 右）
- 画面幅 480px 未満: 縦並びレイアウト（チーム1 上段 / VS / チーム2 下段）
- 2v2 時の立ち絵サイズ: `min(128px, 20vw)` / `min(256px, 40vw)` で縮小
- portrait なしのキャラは `min(96px, 18vw)` のアイコン表示

### 4.4 アニメーション

- 1v1 と同じタイミングシーケンス（合計 3 秒）を維持
- チーム1（P1+P2）は左からスライドイン
- チーム2（P3+P4）は右からスライドイン
- VS テキストは中央に配置（変更なし）
- **`prefers-reduced-motion` 対応**: スライドイン・バウンスをスキップし即座に表示

### 4.5 チームラベル

- 2v2 時、チーム1/チーム2 のグループ上に小さなラベル（`fontSize: 12px`）を表示
- チーム1: 青系（`#3498db`）、チーム2: 赤系（`#e74c3c`）で色分け

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

### 6.2 2v2 キャラ立ち絵表示

2v2 時はキャラ立ち絵エリアを 4 体表示に拡張:

```
  チーム1 勝利時:
  [P1 happy] [P2 happy]    [P3 normal] [P4 normal]
      チーム1                     チーム2
```

- `allyCharacter` / `enemyCharacter2` を ResultScreen に追加で渡す
- 各キャラの portrait がない場合はアイコンにフォールバック

### 6.3 Props への追加

```typescript
type ResultScreenProps = {
  // ... 既存 Props ...
  is2v2Mode?: boolean;
  allyCharacter?: Character;        // P2 キャラ（2v2 立ち絵表示用）
  enemyCharacter2?: Character;      // P4 キャラ（2v2 立ち絵表示用）
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

## 8. シナリオレビュー指摘の実装仕様（Phase S5-9）

### 8.0 画面遷移フロー（更新版）

```
TitleScreen
  └→ [ペアマッチ] → TeamSetupScreen
                      ├→ [← 戻る] → TitleScreen
                      └→ [対戦開始！] → VsScreen(2v2)
                                          └→ [3秒後] → Game(2v2)
                                                         ├→ [メニュー] → TitleScreen
                                                         └→ [ゲーム終了] → ResultScreen(2v2)
                                                                            ├→ [BACK TO MENU] → TitleScreen
                                                                            ├→ [同じ設定でリプレイ] → Game(2v2)
                                                                            └→ [チーム設定に戻る] → TeamSetupScreen ← 新規追加
```

### 8.0.1 ResultScreen 2v2 の「チーム設定に戻る」ボタン

- 2P の「キャラ選択に戻る」と同等の導線
- `onBackToTeamSetup?: () => void` Props を追加
- `is2v2Mode` 時のみ表示
- ボタンカラー: オレンジ系グラデーション（既存の「キャラ選択に戻る」と統一）

### 8.0.2 VsScreen 2v2 の P2 操作タイプラベル

- P2 キャラ名の下に `fontSize: 10px` で「CPU」or「2P」を表示
- `allyControlType?: 'cpu' | 'human'` Props を追加（オプショナル）

### 8.0.3 2v2 リプレイボタンのラベル変更

- `is2v2Mode` 時: 「REPLAY」→「同じ設定でリプレイ」
- 1v1 / 2P: 従来の「REPLAY」を維持

## 9. デザイン残課題の実装仕様（Phase S5-9）

### 9.1 VsScreen 2v2 レスポンシブ立ち絵サイズ

`CharacterPanel` の立ち絵サイズを `min()` でビューポート依存にする:

```typescript
// 2v2 時のサイズ（インラインスタイルで min() を使用）
const portraitSize2v2 = {
  width: 'min(128px, 20vw)',
  height: 'min(256px, 40vw)',
};
const iconSize2v2 = {
  width: 'min(96px, 18vw)',
  height: 'min(96px, 18vw)',
};
// キャラ名
const nameStyle2v2 = {
  fontSize: 'clamp(12px, 3vw, 24px)',
};
```

> **設計判断**: `@media` クエリはインラインスタイルで使えないため、CSS の `min()` / `clamp()` で
> ブレイクポイント不要のレスポンシブ化を実現する。480px 未満での縦並びレイアウトは見送り、
> `min()` によるサイズ縮小で対応する（4 キャラが自然に収まるサイズになるため）。

### 9.2 CharacterPanel の reduced-motion 対応

`CharacterPanel` に `prefersReducedMotion` Props を追加:

```typescript
const CharacterPanel: React.FC<{
  character: Character;
  translateX?: number;
  prefersReducedMotion?: boolean;  // 追加
}> = ({ character, translateX = 0, prefersReducedMotion = false }) => {
  // transition を条件的に無効化
  transition: prefersReducedMotion ? 'none' : `transform ${CHAR_SLIDE_DURATION_MS}ms ease-out`,
};
```

### 9.3 キャラ選択パネルの開閉アニメーション

`useRef` でグリッドコンテナの実際の高さを計測し、`max-height` でアニメーション:

```typescript
const gridRef = useRef<HTMLDivElement>(null);
const [gridHeight, setGridHeight] = useState(0);

// 展開時に高さを計測
useEffect(() => {
  if (isOpen && gridRef.current) {
    setGridHeight(gridRef.current.scrollHeight);
  }
}, [isOpen]);

// スタイル
style={{
  maxHeight: isOpen ? `${gridHeight}px` : '0px',
  overflow: 'hidden',
  transition: 'max-height 200ms ease-out',
}}
```

### 9.4 グリッド展開時の自動スクロール

展開アニメーション完了後にスクロール:

```typescript
useEffect(() => {
  if (isOpen && gridRef.current) {
    const timer = setTimeout(() => {
      gridRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
      });
    }, 210); // アニメーション完了(200ms) + バッファ(10ms)
    return () => clearTimeout(timer);
  }
}, [isOpen, prefersReducedMotion]);
```

### 9.5 ResultScreen 2v2 チーム間区切り

```
  [P1] [P2]  ⚡  [P3] [P4]
```

- チーム内 gap: `8px`（近接の法則で同チームを認知）
- チーム間 gap: `24px`（分離で対立関係を表現）
- 間に小さな区切りマーク（`⚡` または縦線 `|`）を配置

```typescript
<div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px' }}>
  {/* チーム1 */}
  <div style={{ display: 'flex', gap: '8px' }}>
    <CharacterPortrait ... />
    <CharacterPortrait ... />
  </div>
  {/* 区切り */}
  <span style={{ color: '#666', fontSize: '1.2rem' }}>⚡</span>
  {/* チーム2 */}
  <div style={{ display: 'flex', gap: '8px' }}>
    <CharacterPortrait ... />
    <CharacterPortrait ... />
  </div>
</div>
```
