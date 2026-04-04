# Air Hockey S8 — リファクタリング・UI 改善・Chapter 2 実装計画

> 作成日: 2026-04-04
> ブランチ: `feature/air-hockey-s8-refactor-chapter2`

## 目的

1. **AirHockeyGame.tsx リファクタリング**: 586 行の巨大コンポーネントを責務ごとの Custom Hook に分割し、保守性・可読性を向上
2. **ConfirmDialog アニメーション追加**: CSS transition によるフェードイン/アウトで UX を向上
3. **ストーリー Chapter 2 実装**: 地区大会編（4 ステージ + 新キャラ「カナタ」）の追加

## フェーズ構成

| Phase | 内容 | サイズ | 依存 |
|-------|------|--------|------|
| S8-1 | AirHockeyGame.tsx Hook 分割リファクタリング | L | なし |
| S8-2 | ConfirmDialog CSS transition アニメーション | S | なし |
| S8-3 | Chapter 2 ステージ・キャラ・ダイアログ実装 | XL | なし |

**S8-1 と S8-2 は独立して並行可能。S8-3 も独立だが、S8-1 完了後に着手すると衝突を最小化できる。**

---

## Phase S8-1: AirHockeyGame.tsx リファクタリング

### 方針

`architecture.md` の推奨に基づき、以下の Custom Hook を抽出する。
**原則: 外部インターフェース（画面表示・ゲーム動作）は一切変更しない。リファクタリングのみ。**

### 抽出する Hook 一覧

| Hook | 責務 | 抽出元の状態/ロジック |
|------|------|---------------------|
| `useUIOverlayState` | モーダル/オーバーレイの表示状態管理 | `showHelp`, `showTutorial`, `isHelpMode`, `showSettings`, `showExitConfirm`, `selectedCharacterId` |
| `useStoryScreen` | ストーリーモード固有の派生データ | `cpuCharacter`, `storyCharacters`, `stageBackgroundUrl`, `hasNextStage`, `storyAiConfig` の useMemo 群 |
| `useFreeBattleScreen` | フリーバトル固有の派生データ | `freeBattleAiConfig`, `freeBattleCpuCharacter`, `freeBattleSelectableCharacters` の useMemo 群 |
| `usePairMatchSetup` | 2v2 キャラ選択のデフォルト値算出 | `pairAlly`, `pairEnemy1`, `pairEnemy2`, `resultPlayerCharacter`, `resultOpponentCharacter` |
| `useGameHandlers` | イベントハンドラの集約 | 25+ の useCallback を責務別にグループ化 |

### 制約

- **テストの追加は最小限**: 既存テスト（604 スイート / 7704 テスト）が全パスすることで正当性を担保
- Hook 抽出は段階的に実施し、各ステップで `npm run ci` を通す
- `useGameMode` は既存 Hook のためこのフェーズでは分割しない（影響範囲が大きすぎるため）

---

## Phase S8-2: ConfirmDialog CSS Transition アニメーション

### 方針

- `isOpen` で即 `return null` しているのを、CSS transition で fade in/out に変更
- `prefers-reduced-motion` メディアクエリでアニメーション無効化をサポート
- 既存テストとの互換性を維持

### 設計

- **表示**: `opacity: 0 → 1` + `scale(0.95) → scale(1)` の 200ms ease-out transition
  - 200ms: Material Design standard easing 推奨範囲（150-300ms）
- **非表示**: `opacity: 1 → 0` の 150ms ease-in transition 後に DOM から除去（`onTransitionEnd`）
  - closing を opening より短くする理由: ユーザーが意図した操作結果であり確認時間が不要（Nielsen Norman Group ガイドライン準拠）
- **操作ブロック**: closing フェーズ中は `pointer-events: none` でコールバックの再発火を防止
- **フォーカストラップ**: `Tab` キーでダイアログ内のボタン間のみフォーカスがループする明示的トラップを導入
- **アクセシビリティ**: `prefers-reduced-motion: reduce` では transition-duration を 0ms に

---

## Phase S8-3: ストーリー Chapter 2 実装

### 方針

- 既存のストーリーシステム（StageDefinition, StoryProgress, STAGE_BALANCE_MAP）を活用
- Chapter 2 のダイアログデータは `chapter2-dialogue-data.ts` として分離
- 新キャラ「カナタ」のみフル実装（リク・シオンはダイアログ出演のみ）
- **画像アセットは CharacterAvatar の既存フォールバック機能で対応**（画像生成は別タスク）

### ストーリー構成（4 ステージ）

| Stage | 名前 | 対戦相手 | フィールド | 難易度 | 得点 |
|-------|------|---------|-----------|--------|------|
| 2-1 | 嵐の前の一打 | ソウタ（既存: rookie） | zigzag | easy | 3 |
| 2-2 | 堅実なる壁 | ケンジ（既存: regular） | fortress | normal | 5 |
| 2-3 | 幻惑の罠 | カナタ（新規） | bastion | normal | 5 |
| 2-4 | 氷の頂へ | レン（既存: ace） | pillars | hard | 5 |

### 使用フィールド（既存定義を流用）

以下のフィールドは `config.ts` に定義済み。新規作成は不要。

| Field ID | 名前 | 既存状態 |
|----------|------|---------|
| zigzag | ジグザグ | 障害物 3 個、goalSize 180、色 #ffaa00 |
| fortress | フォートレス | 障害物 4 個、destructible、goalSize 140、色 #ff4488 |
| bastion | バスティオン | 障害物 7 個、destructible、goalSize 160、色 #ff8800 |
| pillars | ピラーズ | 障害物 5 個、goalSize 160、色 #ff00ff |

> ステージバランスとの相性で微調整が必要な場合のみ、障害物の位置・サイズを変更する。

### 新キャラクター

| ID | 名前 | 役割 | カラー | 実装レベル |
|----|------|------|--------|-----------|
| kanata | 白波カナタ | Stage 2-3 対戦相手 | #1abc9c | フル（AI プロファイル + ポートレート + ダイアログ） |
| riku | 風早リク | ダイアログ出演 | #f39c12 | 最小（アイコン + ダイアログ） |
| shion | 朝霧シオン | ダイアログ出演（1 行） | #bdc3c7 | 最小（アイコン + ダイアログ） |

### 新しい VictoryCutIn

- Chapter 2 フィナーレ（2-4 勝利時）用のカットインを追加
- Chapter 1 との差分: 地区大会優勝という文脈に合わせた演出変更
  - 背景色: Chapter 1（温かみのあるオレンジ/ゴールド）→ Chapter 2（より華やかなゴールド + パーティクル量増加）
  - テキスト演出: 達成感を強調する表現に変更

### キャラクター図鑑（CharacterDex）の解放条件

| キャラ | 解放条件 | フリーバトル対象 |
|--------|---------|---------------|
| カナタ | Stage 2-3 クリア | はい |
| リク | Stage 2-4 クリア（観客席で会話） | いいえ（ダイアログ出演のみ） |
| シオン | Stage 2-4 クリア（エピローグ台詞） | いいえ（ダイアログ出演のみ） |

### プレースホルダーアセット方針

画像ファイルの生成は行わず、`CharacterAvatar` の既存フォールバック機能（テーマカラー背景 + イニシャル表示）を活用する。画像パスに存在しないパスを設定し、`onError` でフォールバックに遷移させる。

---

## リスク・注意点

1. **S8-1**: リファクタリング中に画面遷移ロジックが壊れやすい → 各ステップで手動確認必須
2. **S8-1**: `useGameHandlers` が 200 行を超えた場合は二次分割を検討（メニュー系 / ゲーム操作系 / ストーリー系）
3. **S8-2**: `onTransitionEnd` が発火しないケースがある → フォールバック timer を設定
4. **S8-3**: 画像アセットは CharacterAvatar フォールバックで代替 → 後から画像差し替え
5. **S8-3**: Stage 2-3（カナタ）の wallBounce AI が初見で理不尽に感じる可能性 → pre-dialogue で壁バウンス特性を示唆 + comebackThreshold: 2 で早めの補正

## 成功基準

- `npm run ci` 全パス（lint:ci + typecheck + test + build）
- 既存の全ゲームモード（フリー・ストーリー Ch1・2P・2v2・デイリー）が正常動作
- Chapter 2 全ステージをクリア可能
- ConfirmDialog のアニメーションが `prefers-reduced-motion` で無効化される
