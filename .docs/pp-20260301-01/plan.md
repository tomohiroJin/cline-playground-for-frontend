# 原始進化録 フィードバック対応 — 実装計画

## 1. コンテキスト

ユーザーから13件のフィードバックを受領。バグ修正3件、UI/UX改善5件、新機能5件。
4フェーズに分け、各フェーズを独立してテスト・コミット可能にする。

### フィードバック一覧

| # | 分類 | 内容 | フェーズ |
|---|------|------|---------|
| 1 | バグ | チャレンジに難易度選択が無く常に弱い | P1 |
| 2 | バグ | 神話世界の最終ボス戦が自動で始まらない | P1 |
| 3 | UI | 文明ツリーの効果が消えて見える（UIの透明性問題） | P4 |
| 4 | 機能 | エンドレスチャレンジが欲しい | P3 |
| 5 | UI | ランダムイベントの骨コストが高すぎる | P1 |
| 6 | UI | 戦闘ログ表示欄が小さすぎる | P1 |
| 7 | UI | ゆっくり速度のオプションが欲しい | P1 |
| 8 | 機能 | 戦闘終了後にログを見返したい | P3 |
| 9 | バグ | 原始回帰で進化が5回以上できてしまう | P1 |
| 10 | 機能 | あそびかたに進化図鑑が欲しい（ページ分け） | P4 |
| 11 | 機能 | 神話世界クリア後の周回システム（2周目/3周目） | P3 |
| 12 | 機能 | 難易度選択をステージ選択にリフレーミング | P2 |
| 13 | 機能 | ステージ別ボス連戦（氷河期2連戦、大災厄3連戦、神話世界5連戦） | P2 |

---

## 2. フェーズ1: バグ修正 + 小規模UI改善

### FB#9: 原始回帰の進化回数制限が効いていない

**原因**: `hooks.ts` の `SELECT_EVO` で `maxEvo` チェックなし

**修正**:
- `hooks.ts`: `SELECT_EVO` の先頭で `run.evs.length >= run.maxEvo` ガード追加
- `hooks.ts`: 新アクション `SKIP_EVO`（maxEvo到達時にバトルへ直行）
- `EvolutionScreen.tsx`: maxEvo到達時に「進化上限に達しました」メッセージ + スキップボタン

### FB#1: チャレンジに難易度選択がない

**原因**: `ChallengeScreen.tsx` で `onStartChallenge(ch.id, 0)` 固定

**修正**:
- `ChallengeScreen.tsx`: チャレンジ選択後に難易度選択UIを表示
- Props に `save: SaveData` 追加（解放判定に必要）
- `PrimalPathGame.tsx`: ChallengeScreen に `save` prop を渡す

### FB#2: 最終ボス戦が自動で始まらない

**修正**: `PreFinalScreen.tsx` にカウントダウン自動開始（3秒）追加。手動ボタンも残す

### FB#5: イベントの骨コストが高すぎる

**修正**: `constants.ts` の `bone_merchant` イベント: 骨30→10, 骨50→25。報酬も比例調整

### FB#6: 戦闘ログ表示欄が小さい

**修正**:
- `styles.ts`: LogContainer `max-height: 100px` → `160px`
- `BattleScreen.tsx`: `run.log.slice(-28)` → `run.log.slice(-40)`

### FB#7: ゆっくり速度

**修正**: `constants.ts` の SPEED_OPTS 先頭に `['×0.5', 1500]` 追加

### 修正ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `hooks.ts` | SELECT_EVO に maxEvo ガード、SKIP_EVO 新アクション |
| `constants.ts` | SPEED_OPTS 追加、bone_merchant コスト調整 |
| `styles.ts` | LogContainer max-height 拡大 |
| `components/ChallengeScreen.tsx` | 難易度選択UI追加 |
| `components/PreFinalScreen.tsx` | カウントダウン自動開始 |
| `components/EvolutionScreen.tsx` | maxEvo 到達時UI |
| `components/BattleScreen.tsx` | ログ表示行数増加 |
| `PrimalPathGame.tsx` | ChallengeScreen に save prop |

---

## 3. フェーズ2: ステージ化 + ボス連戦

### FB#12: ステージ化

**方針**: 既存名（原始/氷河期/大災厄/神話世界）を維持。UIラベルのみ「ステージ選択」に変更。各ステージにテーマ説明を追加。

**修正**: `DifficultyScreen.tsx` のタイトル変更 + ステージ説明テキスト追加

### FB#13: ステージ別ボス連戦

**方針**:
- `Difficulty` 型に `bb: number`（ボス連戦数）追加
- `RunState` に `bossWave: number`（現在のボス連戦カウンター）追加
- `afterBattle` を修正: ボス撃破後に `bossWave < dd.bb` なら次のボスを生成して連戦継続
- ボス連戦スケール: `BOSS_CHAIN_SCALE = [1.0, 1.15, 1.3, 1.45, 1.6]`

| ステージ | ボス連戦数 |
|---------|-----------|
| 原始 | 1 |
| 氷河期 | 2 |
| 大災厄 | 3 |
| 神話世界 | 5 |

**afterBattle の連戦ロジック**:
```
ボス撃破 → bossWave++ → bossWave < dd.bb ?
  YES → HP20%回復、次のボス生成（スケール強化）、battle維持
  NO  → バイオームクリア処理（bossWave=0, bc++, cW=0）
```

### 修正ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `types.ts` | Difficulty に bb 追加、RunState に bossWave 追加 |
| `constants.ts` | DIFFS に bb 追加、BOSS_CHAIN_SCALE 定数 |
| `game-logic.ts` | afterBattle 連戦ロジック、戻り値に bossChainContinue 追加 |
| `hooks.ts` | AFTER_BATTLE で bossChainContinue 分岐 |
| `components/DifficultyScreen.tsx` | 「ステージ選択」ラベル + 説明追加 |
| `components/BattleScreen.tsx` | ボス連戦カウンター表示（"BOSS 2/3"） |
| `__tests__/test-helpers.ts` | makeRun に bossWave 追加 |

---

## 4. フェーズ3: 周回 + エンドレス + ログ見返し

### FB#11: 周回システム

**方針**:
- `SaveData` に `loopCount: number` 追加
- 神話世界（di=3）クリアで `save.loopCount++`
- 周回倍率: `loopScale = 1 + loopCount * 0.5`（2周目=×1.5, 3周目=×2.0）
- `startRunState` で dd.hm/dd.am に loopScale を乗算

### FB#4: エンドレスチャレンジ

**方針**:
- CHALLENGES に「無限の試練」追加（修飾子: `{ type: 'endless' }`）
- `ChallengeModifier` に `{ type: 'endless' }` 追加
- `RunState` に `isEndless: boolean`, `endlessWave: number` 追加
- エンドレス時: 3バイオーム踏破後、prefinal をスキップしてバイオームを無限ループ
- 敵スケール: `endlessScale = 1 + endlessWave * 0.1`（ループごとに+10%）
- 死亡時点の到達ウェーブ・撃破数をスコアとして記録

### FB#8: 戦闘ログ見返し

**方針**:
- `GameOverScreen.tsx` に折りたたみ式ログパネル追加
- 既存の `run.log`（トリミング済み最大35行）を表示
- 「戦闘ログを見る」ボタンで展開/折りたたみ

### 修正ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `types.ts` | SaveData.loopCount, RunState.loopCount/isEndless/endlessWave, RunStats.endlessWave, ChallengeModifier に endless |
| `constants.ts` | FRESH_SAVE.loopCount, CHALLENGES に無限の試練, LOOP_SCALE_FACTOR |
| `game-logic.ts` | startRunState で周回倍率適用, applyChallenge にendless |
| `hooks.ts` | 勝利時 loopCount++, transitionAfterBiome でエンドレス分岐 |
| `storage.ts` | セーブデータマイグレーション（loopCount デフォルト0） |
| `components/DifficultyScreen.tsx` | 周回ラベル表示 |
| `components/GameOverScreen.tsx` | 折りたたみログパネル |
| `styles.ts` | LogReviewContainer スタイル追加 |

---

## 5. フェーズ4: あそびかた進化図鑑 + ツリーUI改善

### FB#10: あそびかた進化図鑑

**方針**:
- `HowToPlayScreen.tsx` をタブ切替式に拡張
- ページ構成: 基本ルール / 進化図鑑 / シナジー一覧
- 進化図鑑: EVOS からカテゴリ（tech/life/rit）フィルタ付き一覧表示

### FB#3: ツリー効果の透明性改善

**方針**（コードバグなし。UI改善のみ）:
- `BattleScreen.tsx`: ツリーボーナスサマリーを小さく表示（`tbSummary` 再利用）
- `TreeScreen.tsx`: 取得済みノードの累積効果サマリーを改善

### 修正ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `components/HowToPlayScreen.tsx` | タブ切替、進化図鑑ページ、シナジーページ |
| `components/BattleScreen.tsx` | ツリーボーナスサマリー表示 |
| `components/TreeScreen.tsx` | 累積効果サマリー改善 |
| `styles.ts` | TabBtn スタイル追加 |

---

## 6. 検証方法

```bash
# 全テスト
npm test

# 型チェック
npx tsc --noEmit

# ビルド
npm run build
```

各フェーズでブラウザ動作確認:
- P1: チャレンジ難易度選択、maxEvo制限、ログ拡大、低速再生、自動開始
- P2: ステージ選択UI、ボス連戦（各ステージ別カウント）
- P3: 周回ラベル、エンドレスモード、ログ見返し
- P4: あそびかたタブ切替、進化図鑑フィルタ、ツリーサマリー
