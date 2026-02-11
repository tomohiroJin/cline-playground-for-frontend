# KEYS & ARMS src移植 仕様（再発防止版）

## 1. 目的

`public/games/keys-and-arms/index.html` のゲーム体験を、`src` 配下の React + TypeScript 実装として移植する。
本仕様の目的は「動くものを作る」ではなく「元実装と同等の体験を再現する」ことである。

## 2. 今回の失敗と対策

### 2.1 失敗要因
- 元HTMLの挙動を抽象化しすぎ、別ゲームに近い簡易実装へ逸脱した。
- テストが同等性を担保せず、表示確認中心だった。
- フェーズ完了時の比較証跡（差分表、手動確認）が不足していた。

### 2.2 対策（必須）
- **禁止事項**を明記し、違反時はそのフェーズを未完了とする。
- 元実装との**同等性チェックリスト**をフェーズごとに更新する。
- 最終受け入れはテスト成功だけでなく、手動比較合格を条件にする。

## 3. スコープ

### 3.1 対象
- `src/pages/KeysAndArmsPage.tsx` から iframe を撤廃する。
- `src/features/keys-and-arms/` にゲームロジックを分割実装する。
- 既存導線（`App.tsx`, `GameListPage.tsx`）と関連テストを更新する。
- キーボード/タッチ、音、保存を元実装相当に再現する。

### 3.2 非対象
- 新規ステージ、新規敵、新規UIデザインの追加。
- バランス調整を目的とした独自仕様変更。
- 他ゲーム機能の改修。
- `public/games/keys-and-arms/index.html` を実行する方式（iframe/直接読み込み）での対応。

## 4. 禁止事項（重要）

以下に該当する実装は「移植失敗」とみなし、完了扱いにしない。

- 元HTMLに存在しないゲームルールの新規設計。
- 進行条件を固定時間などで簡略化し、元挙動を置き換えること。
- スプライト/演出/HUDを汎用図形に置換したまま完了とすること。
- 元実装との差分を未記載でフェーズを進めること。
- `KeysAndArmsPage` に `iframe` を戻すこと。
- 元HTMLを実行して「忠実移植」とみなすこと。

## 5. 機能要件

### 5.1 シーン・進行
- 最低限次のシーンを再現すること:
  - `title`
  - `play`（`cave` / `grass` / `boss`）
  - `over`
  - `ending1`
  - `trueEnd`
- シーン遷移は元実装の条件に一致させる。

### 5.2 入力
- キーボード: `Arrow*`, `z`, `Space`, `Enter`, `Escape`。
- タッチ/ポインタ: D-Pad + ACT + RST。
- `justPressed` 判定を保持する。
- `touchcancel` と `window blur` で入力状態を必ず解放する。

### 5.3 描画
- Canvas サイズ: `440x340`。
- 描画順: 背景→主体→演出→HUD。
- 元実装のスプライト/演出（最小でも主要要素）を再現する。
- HUD: `SCORE / HP / LOOP / 状態表示`。

### 5.4 音声
- ユーザー操作後に AudioContext を開始する。
- BGM/SFX を元実装と同等のタイミングで再生する。

### 5.5 永続化
- ハイスコア保存/復元を実装する。
- 保存キー: `game_score_keys_and_arms`。
- 旧キー `kaG` の移行読み込みを実装する（初回のみ読み取り可）。

## 6. 非機能要件

- TypeScript strict を満たす（`any` 禁止）。
- ゲームループ初期化/破棄でイベントリークがないこと。
- `npm test`, `npm run build` が成功すること。

## 7. 実装構成要件

```text
src/features/keys-and-arms/
  index.ts
  KeysAndArmsGame.tsx
  constants.ts
  types.ts
  input.ts
  storage.ts
  audio.ts
  engine/
    update.ts
    transitions.ts
    scoring.ts
    collision.ts
  render/
    renderer.ts
    sprites.ts
    effects.ts
```

```text
.docs/2026021102/
  source-map.md                # 元HTMLとの対応表（必須）
  parity-report.md             # 同等性確認レポート（必須）
```

## 8. 同等性チェック項目（受け入れ基準）

以下をすべて満たすこと。

1. タイトル開始から `cave -> grass -> boss` へ進行できる。
2. HP 減少条件とゲームオーバー遷移が元実装と一致する。
3. 主要スコア加算（行動、クリア、ボーナス）が一致する。
4. `ending1` / `trueEnd` の分岐条件が一致する。
5. キーボード・タッチの入力固着が発生しない。
6. BGM/SFX がユーザー操作後に有効化される。
7. ハイスコアが保存・復元される。
8. `App` ルートと `GameListPage` から起動できる。
9. `npm test` と `npm run build` が成功する。
10. 実装コード上に `iframe` 参照が残っていない。

## 9. テスト要件

### 9.1 単体テスト
- 状態遷移: `title -> play -> over/ending`。
- 進行条件: ステージクリア条件、被弾条件。
- 保存: ハイスコア保存/旧キー移行。

### 9.2 UI/統合テスト
- `KeysAndArmsPage` が iframe なしでゲーム描画すること。
- `/keys-and-arms` ルート表示。
- `GameListPage` から導線維持。

### 9.3 手動チェック（必須）
- キーボード操作チェック。
- タッチ操作チェック。
- シーン遷移チェック。
- 音有効化チェック。

## 10. 完了定義

- 本仕様の受け入れ基準 1〜10 がすべて満たされている。
- `tasks.md` の全チェックが完了している。
- 未解決差分がある場合は、理由と影響を明記している。

## 11. 実装前固定条件（コンテキスト消失対策）

- 元実装基準ファイル: `public/games/keys-and-arms/index.html`。
- 実装開始前に `source-map.md` へ「主要状態/主要関数/保存/入力/音」を列挙する。
- `source-map.md` の TODO が残ったまま最終完了にしてはならない。
