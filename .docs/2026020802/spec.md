# 迷宮の残響 (Labyrinth Echo) — 統合仕様

## 1. ゲーム概要

| 項目 | 内容 |
|------|------|
| 名称 | 迷宮の残響 (Labyrinth Echo) |
| ジャンル | テキストベース・ローグライク・ダンジョン探索 |
| ソースファイル | `.tmp/迷宮の残響.jsx` (4354行, 単一JSXモノリス) |
| 依存 | React のみ (`useState`, `useCallback`, `useEffect`, `useRef`, `useMemo`, `Component`) |
| Audio | Web Audio API 直接使用 (外部ライブラリ不要) |

### 主な特徴
- 全5階層のダンジョン探索（表層回廊 → 灰色の迷路 → 深淵の間 → 忘却の底 → 迷宮の心臓）
- 4段階の難易度（探索者 / 挑戦者 / 求道者 / 修羅）
- 11種類のエンディング
- 40種類の知見アビリティ（ローグライト型永続アンロック）
- 163種類のイベント
- 5種類の状態異常（負傷・混乱・出血・恐怖・呪い）
- セーブ/ロード対応（メタ進行の永続化）

---

## 2. 画面遷移フロー

```
title ─→ diff_select ─→ floor_intro ─→ event ⇆ result
  │                                           │
  ├→ unlocks (知見の継承)                      ├→ floor_intro (次階層)
  ├→ titles  (称号)                            ├→ gameover (死亡)
  ├→ records (実績)                            └→ victory  (脱出成功)
  └→ settings ─→ reset_confirm1 ─→ reset_confirm2
```

### フェーズ一覧（13フェーズ）

| フェーズ | 画面名 | 説明 |
|---------|--------|------|
| `title` | タイトル | ゲーム起動時の初期画面 |
| `diff_select` | 難易度選択 | 探索者/挑戦者/求道者/修羅から選択 |
| `floor_intro` | 階層導入 | 各階層突入時の演出・概要表示 |
| `event` | イベント選択 | テキストイベントの選択肢提示 |
| `result` | 選択結果 | 選択肢のリソース変動表示 |
| `victory` | クリア | エンディング判定・表示 |
| `gameover` | ゲームオーバー | 死亡時の演出 |
| `unlocks` | 知見の継承 | KPによるアビリティ解放画面 |
| `titles` | 称号 | 獲得した称号の一覧 |
| `records` | 実績 | 探索記録の統計 |
| `settings` | 設定 | オーディオ等の設定 |
| `reset_confirm1` | リセット確認1 | データリセットの第1段階確認 |
| `reset_confirm2` | リセット確認2 | データリセットの第2段階確認 |

---

## 3. ゲームシステム

### 3.1 ステータス

| 項目 | 基本値 | 説明 |
|------|--------|------|
| HP | 55 | 体力。0以下でゲームオーバー |
| 精神力 (MN) | 35 | 精神。0以下でゲームオーバー |
| 情報値 (INF) | 5 | 探索で蓄積する知識量 |

### 3.2 難易度

| ID | 名称 | HP補正 | MN補正 | ドレイン補正 | ダメージ倍率 | KP(死亡) | KP(勝利) |
|----|------|--------|--------|-------------|------------|---------|---------|
| `easy` | 探索者 | +12 | +8 | 0 | 0.8x | 1 | 2 |
| `normal` | 挑戦者 | 0 | 0 | -1 | 1.0x | 1 | 3 |
| `hard` | 求道者 | -15 | -12 | -3 | 1.35x | 2 | 5 |
| `abyss` | 修羅 | -25 | -20 | -5 | 1.8x | 3 | 8 |

### 3.3 状態異常（5種類）

| 名称 | 色 | 持続ダメージ | 説明 |
|------|-----|-------------|------|
| 負傷 | `#f87171` | なし | 回復系の負担状態 |
| 混乱 | `#c084fc` | なし | 判定干渉状態 |
| 出血 | `#fb7185` | HP -5/ターン | 持続HP減少 |
| 恐怖 | `#a78bfa` | MN -4/ターン | 持続精神減少 |
| 呪い | `#fb923c` | なし | 情報値取得50%削減 |

### 3.4 イベント

- 全163種類のイベントが `§6b EVENT DATA` セクションに定義
- 1階層あたり3イベント + 最終階層のボスイベント (`e030`)
- イベントはランダムに選出（使用済みID重複防止）
- 一部イベントはチェーン（連鎖）で次イベントを指定

### 3.5 フロア構成

| 階層 | 名称 | 説明 |
|------|------|------|
| Lv.1 | 表層回廊 | 初級 |
| Lv.2 | 灰色の迷路 | — |
| Lv.3 | 深淵の間 | — |
| Lv.4 | 忘却の底 | — |
| Lv.5 | 迷宮の心臓 | 最深部 |

### 3.6 知見アビリティ（40種類）

知見ポイント (KP) を消費してアンロックするローグライト型の永続強化。

| カテゴリ | 数 | 解放条件 | 色 |
|---------|-----|---------|-----|
| 基本 (u1-u20) | 20 | なし | `#818cf8` |
| 特別 (u21-u30) | 10 | 修羅クリア必須 | `#fbbf24` |
| 難易度クリア報酬 (u31-u35) | 5 | 各難易度クリア | `#f97316` |
| 実績解放 (u36-u40) | 5 | 累計実績条件 | `#4ade80` |

### 3.7 エンディング（11種類）

| ID | 名称 | サブタイトル | 条件概要 |
|----|------|-------------|---------|
| `abyss_perfect` | 修羅の覇者 | LORD OF CARNAGE | 修羅で完全勝利 (HP/MN≥70%, INF>35) |
| `abyss_clear` | 修羅を超えし者 | BEYOND THE ABYSS | 修羅難度クリア |
| `hard_clear` | 求道の果て | END OF ASCETICISM | 求道者難度クリア |
| `perfect` | 完全なる帰還 | THE PERFECT RETURN | HP/MN≥70%, INF>35 |
| `scholar` | 知識の導き | GUIDED BY WISDOM | INF≥40 |
| `iron` | 不屈の生還 | UNYIELDING SURVIVOR | HP>50%, 状態異常あり |
| `battered` | 満身創痍の脱出 | BARELY ALIVE | HP≤25% |
| `madness` | 狂気の淵より | EDGE OF MADNESS | MN≤25% |
| `cursed` | 呪われし帰還者 | CURSED RETURNER | 呪い状態で脱出 |
| `veteran` | 歴戦の探索者 | SEASONED EXPLORER | 13イベント以上到達 |
| `standard` | 生還 | ESCAPE | デフォルト（他に該当なし） |

### 3.8 称号

21個の称号定義。探索回数・生還率・特定エンディング達成等で解放される。

---

## 4. 技術仕様

### 4.1 変換が必要な項目

| 変換項目 | 箇所 | 方針 |
|----------|------|------|
| Storage API | 2箇所 (行146, 150) | `window.storage.set/get` → `localStorage.setItem/getItem` |
| JSX → TSX | ファイル全体 | 拡張子変更 + 段階的型付け。Phase 1 では `any` 許容 |
| ErrorBoundary | ゲーム内蔵 (行34-56) | そのまま維持（プラットフォーム側と二重で安全側に） |
| CSS | 文字列インジェクション (§7, 行3175-3234) | Phase 1 ではそのまま維持 |
| Audio | Web Audio API (§2, 行62-137) | そのまま維持（IPNE も直接使用の先例あり） |

### 4.2 Storage 変換の詳細

**変換前:**
```javascript
const Storage = Object.freeze({
  save: (data) => safeAsync(
    () => window.storage.set(SAVE_KEY, JSON.stringify(data)),
    "Storage.save"
  ),
  load: () => safeAsync(async () => {
    const r = await window.storage.get(SAVE_KEY);
    return r ? JSON.parse(r.value) : null;
  }, "Storage.load"),
});
```

**変換後 (storage.ts):**
```typescript
const Storage = Object.freeze({
  save: (data: unknown) => safeAsync(
    async () => { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); },
    "Storage.save"
  ),
  load: () => safeAsync(async () => {
    const r = localStorage.getItem(SAVE_KEY);
    return r ? JSON.parse(r) : null;
  }, "Storage.load"),
});
```

### 4.3 ファイル内部構造（§セクション）

| セクション | 行範囲 | 内容 |
|-----------|--------|------|
| §1 | 9行〜 | CONTRACTS & ERROR HANDLING |
| §2 | 59行〜 | AUDIO ENGINE |
| §3 | 139行〜 | PERSISTENCE (Storage) |
| §4 | 156行〜 | GAME CONFIGURATION |
| §5 | 261行〜 | PURE GAME LOGIC |
| §6a | 461行〜 | DEFINITIONS (Titles, Endings, Chains) |
| §6b | 608行〜 | EVENT DATA (163 events) |
| §7 | 3175行〜 | CSS |
| §8 | 3239行〜 | UI COMPONENTS |
| §9 | 3458行〜 | CUSTOM HOOKS |
| §10 | 3547行〜 | CONSTANTS |

---

## 5. 統合仕様

### 5.1 ルーティング

- パス: `/labyrinth-echo`
- App.tsx に lazy import + Route 追加

```typescript
const LabyrinthEchoPage = lazy(
  () => import(/* webpackChunkName: "LabyrinthEchoPage" */ './pages/LabyrinthEchoPage')
);

// Routes 内
<Route path="/labyrinth-echo" element={<LabyrinthEchoPage />} />
```

### 5.2 GameListPage カード追加

- 背景画像: `labyrinth_echo_card_bg.webp`
- ゲーム名: 迷宮の残響
- 遷移先: `/labyrinth-echo`
- 説明文: テキストベースのダンジョン探索ローグライク。全5階層の迷宮に挑み、知恵と運で脱出を目指す。40種類の知見アビリティと11種類のエンディングが待ち受ける。

### 5.3 アセット

- カード背景画像: `src/assets/images/labyrinth_echo_card_bg.webp`
- プレースホルダー画像を仮配置（後にデザイン差し替え可能）

---

## 6. ファイル構成

### Phase 1 最小構成

```
src/
├── pages/
│   └── LabyrinthEchoPage.tsx           # ページコンポーネント
├── features/
│   └── labyrinth-echo/
│       ├── index.ts                     # barrel export
│       ├── LabyrinthEchoGame.tsx        # メインゲーム (TSX変換済み)
│       ├── types.ts                     # 型定義
│       └── storage.ts                   # Storage ラッパー
└── assets/images/
    └── labyrinth_echo_card_bg.webp      # カード背景画像
```

### Phase 2 リファクタリング構成（今回スコープ外）

```
src/features/labyrinth-echo/
├── index.ts
├── LabyrinthEchoGame.tsx               # メインエントリ
├── types.ts                            # 全型定義
├── storage.ts                          # Storage
├── audio.ts                            # AudioEngine
├── config.ts                           # CFG, DIFFICULTY
├── logic.ts                            # Pure game logic (§5)
├── events.ts                           # EVENT DATA (§6b)
├── definitions.ts                      # Titles, Endings (§6a)
├── styles.ts                           # CSS, PAGE_STYLE (§7)
├── hooks/
│   ├── usePersistence.ts
│   └── useVisualFx.ts
└── components/
    ├── ErrorBoundary.tsx
    ├── Page.tsx
    ├── TypewriterText.tsx
    └── ...
```

---

## 7. 検証仕様

### 7.1 ビルド検証
- `npm run build` — ビルド成功（エラー0）
- `npm run lint` — lint エラー0

### 7.2 テスト検証
- `npm run test` — 全テストパス
- GameListPage テストの更新（10個目のゲームカード追加に対応）

### 7.3 機能シナリオ検証

| # | シナリオ | 確認内容 |
|---|---------|---------|
| 1 | ゲーム一覧→起動 | GameListPageから迷宮の残響カードをクリック→ページ遷移 |
| 2 | タイトル画面表示 | タイトル画面の正常表示 |
| 3 | 難易度選択→ゲーム開始 | 4難易度から選択→floor_intro→event遷移 |
| 4 | イベント選択→結果 | 選択肢選択→ステータス変動表示 |
| 5 | 階層進行 | 3イベント消化→次階層遷移 |
| 6 | ゲームオーバー | HP/MN 0以下→gameover画面 |
| 7 | クリア | 全5階層突破→victory画面→エンディング表示 |
| 8 | セーブ/ロード | ゲーム終了→再訪問→メタデータ(KP/エンディング記録)維持 |
| 9 | 知見の継承 | KP消費→アビリティ解放→次回プレイに反映 |
| 10 | 設定/リセット | 設定画面→データリセット→確認ダイアログ |
