# 原始進化録 フィードバック対応 — 仕様書

本書は各フィードバック項目の**変更後の動作仕様**を定義する。
`plan.md` が「何を変更するか」を定義するのに対し、本書は「変更後どう動くか」を規定する。

---

## P1: バグ修正 + 小規模UI改善

### FB#9: 原始回帰の進化回数制限 (maxEvo ガード)

**現状の問題**: `hooks.ts` の `SELECT_EVO` で `maxEvo` チェックがないため、「原始回帰」チャレンジ（最大5回進化）でも無制限に進化できてしまう。

**変更後の動作**:

1. `hooks.ts` `SELECT_EVO` の先頭に `maxEvo` ガードを追加する
   - 条件: `run.maxEvo !== undefined && run.evs.length >= run.maxEvo`
   - ガードに該当する場合、進化をスキップしてバトル開始へ直行する
   - ログに `⚠️ 進化上限（${run.maxEvo}回）に達しました` を追加する

2. `hooks.ts` に新アクション `SKIP_EVO` を追加する
   - `GameAction` union に `{ type: 'SKIP_EVO' }` を追加
   - reducer で受け取ったら `startBattle(state.run, state.finalMode)` を呼び、`phase: 'battle'` に遷移

3. `EvolutionScreen.tsx` の表示分岐
   - `run.maxEvo !== undefined && run.evs.length >= run.maxEvo` の場合:
     - 進化選択肢を非表示にする
     - 「進化上限に達しました（${run.evs.length}/${run.maxEvo}）」メッセージを表示
     - 「バトルへ」ボタンを表示し、クリックで `SKIP_EVO` を dispatch

---

### FB#1: チャレンジに難易度選択がない

**現状の問題**: `ChallengeScreen.tsx` で `onStartChallenge(ch.id, 0)` と難易度0固定で開始される。

**変更後の動作**:

1. チャレンジ選択フロー（2段階）:
   - **Step 1**: チャレンジ一覧から1つ選択
   - **Step 2**: 難易度選択 UI を表示（DIFFS 配列を使用）
     - 各難易度: アイコン `dd.ic` + 名前 `dd.n` + 説明 `dd.d`
     - `save.best` による解放判定: `di === 0 || save.best[di - 1] !== undefined`
     - 未解放の難易度はグレーアウト + 「前の難易度をクリアして解放」テキスト
   - 確定ボタンで `onStartChallenge(ch.id, selectedDi)` を実行

2. コンポーネント変更:
   - `ChallengeScreen.tsx`: Props に `save: SaveData` を追加
   - `ChallengeScreen.tsx`: 内部ステート `selectedChallenge: ChallengeDef | null` を追加
   - `PrimalPathGame.tsx`: `ChallengeScreen` に `save={state.save}` prop を渡す

---

### FB#2: 最終ボス戦が自動で始まらない

**現状の問題**: `PreFinalScreen.tsx` で手動ボタンクリックが必要。

**変更後の動作**:

1. `PreFinalScreen.tsx` にカウントダウン機能を追加
   - 画面表示時に3秒カウントダウンを開始する
   - カウントダウン表示: 「最終戦開始まで…3」→「2」→「1」
   - カウントダウン完了で `onGoFinalBoss()` を自動呼び出し
   - 実装: `useEffect` + `setInterval(1000ms)` + ローカル state `countdown: number`

2. 手動ボタンは残す
   - カウントダウン中でも「すぐに挑む」ボタンでいつでも開始可能
   - ボタン押下でカウントダウンをキャンセル（clearInterval）して即開始

---

### FB#5: イベントの骨コストが高すぎる

**現状の問題**: `bone_merchant` イベントのコストが骨30/骨50で高すぎる。

**変更後の動作**:

`constants.ts` の `RANDOM_EVENTS` 内 `bone_merchant` イベントを変更:

| 選択肢 | 変更前 | 変更後 |
|--------|--------|--------|
| 小取引 | 骨30 → ATK+8 | 骨10 → ATK+4 |
| 大取引 | 骨50 → ATK+18 | 骨25 → ATK+10 |

- ラベルテキストも「骨10で取引する」「骨25で大取引する」に変更
- description も報酬値に合わせて更新

---

### FB#6: 戦闘ログ表示欄が小さい

**現状の問題**: `styles.ts` の `LogContainer` が `max-height: 100px` で表示行数が少ない。

**変更後の動作**:

| 項目 | 変更前 | 変更後 |
|------|--------|--------|
| `styles.ts` LogContainer max-height | 100px | 160px |
| `BattleScreen.tsx` ログスライス | `run.log.slice(-28)` | `run.log.slice(-40)` |

---

### FB#7: ゆっくり速度オプション

**現状の問題**: 最低速度が ×1（750ms）で、ゆっくり観察できない。

**変更後の動作**:

`constants.ts` の `SPEED_OPTS` 先頭に低速オプションを追加:

```
変更後: ['×0.5', 1500], ['×1', 750], ['×2', 400], ['×4', 200], ['×8', 100]
```

- `×0.5` は tick 間隔 1500ms（通常の2倍の時間）
- 既存の速度選択UIに自動的に反映される（SPEED_OPTS を参照しているため）

---

## P2: ステージ化 + ボス連戦

### FB#12: ステージ選択UIリフレーミング

**現状の問題**: UIラベルが「難易度選択」で、ステージ制が伝わりにくい。

**変更後の動作**:

1. `DifficultyScreen.tsx` の表示変更:
   - タイトル: 「難易度選択」→「ステージ選択」
   - 各ステージにテーマ説明を追加表示:

| ステージ | テーマ説明 |
|---------|-----------|
| 原始 | 穏やかな原野を巡る入門の旅 |
| 氷河期 | 極寒が襲う。環境ダメージに注意 |
| 大災厄 | 天変地異の中を生き延びろ |
| 神話世界 | 伝説の獣が待つ究極の試練 |

2. 内部ロジックは一切変更しない（`Difficulty` 型、`di` パラメータ等はそのまま）

---

### FB#13: ステージ別ボス連戦

**現状の問題**: すべてのステージでボスは1体のみ。

**変更後の動作**:

#### 型変更

- `Difficulty` 型に `bb: number`（boss battles = ボス連戦数）を追加
- `RunState` に `bossWave: number`（現在の連戦カウンター、0始まり）を追加

#### 定数変更

`constants.ts`:

| ステージ | bb (ボス連戦数) |
|---------|-----------------|
| 原始 | 1 |
| 氷河期 | 2 |
| 大災厄 | 3 |
| 神話世界 | 5 |

新定数:
```typescript
export const BOSS_CHAIN_SCALE: readonly number[] = [1.0, 1.15, 1.3, 1.45, 1.6];
```

#### afterBattle ロジック変更

`game-logic.ts` の `afterBattle` 関数:

```
ボス撃破判定:
  cW > wpb (ボス戦) の場合:
    bossWave++
    if bossWave < dd.bb:
      // 連戦継続
      HP を最大HPの20%回復
      次のボスを生成（BOSS_CHAIN_SCALE[bossWave] でスケーリング）
      biomeCleared = false を返す
      戻り値に bossChainContinue: true を追加
    else:
      // バイオームクリア
      bossWave = 0
      bc++
      cW = 0
      biomeCleared = true を返す
```

戻り値の型変更:
```typescript
{ nextRun: RunState; biomeCleared: boolean; bossChainContinue?: boolean }
```

#### hooks.ts AFTER_BATTLE 分岐

```
bossChainContinue === true の場合:
  phase を 'battle' のままにする（進化画面に遷移しない）
  ログに「🔥 ボス連戦 ${bossWave+1}/${dd.bb}！」を追加
```

#### BattleScreen 表示

- ボス連戦中の場合、画面上部に「BOSS ${bossWave+1}/${dd.bb}」カウンターを表示
- 表示条件: `run.dd.bb > 1 && run.cW > run.wpb`

#### startRunState 変更

- `bossWave: 0` を初期値に含める

#### テストヘルパー変更

- `__tests__/test-helpers.ts` の `makeRun` に `bossWave: 0` を追加

---

## P3: 周回 + エンドレス + ログ見返し

### FB#11: 周回システム

**現状の問題**: 神話世界クリア後、次の周回がない。

**変更後の動作**:

#### 型変更

- `SaveData` に `loopCount: number` を追加（初期値: 0）

#### 周回倍率

```typescript
const LOOP_SCALE_FACTOR = 0.5;
const loopScale = 1 + save.loopCount * LOOP_SCALE_FACTOR;
```

| 周回 | loopScale | 敵HP倍率 | 敵ATK倍率 |
|------|-----------|---------|----------|
| 1周目 | 1.0 | ×1.0 | ×1.0 |
| 2周目 | 1.5 | ×1.5 | ×1.5 |
| 3周目 | 2.0 | ×2.0 | ×2.0 |

#### startRunState 変更

`game-logic.ts`:
- `save.loopCount` を参照して `loopScale` を計算
- `dd.hm * loopScale`, `dd.am * loopScale` を敵スケーリングに適用
- `RunState` に `loopCount: number` を追加（表示用、`save.loopCount` をコピー）

#### 勝利時処理

`hooks.ts` のゲームクリア時:
- `run.di === 3`（神話世界）クリアで `save.loopCount++`
- インクリメントされた `loopCount` は次のランから全ステージに反映される

#### セーブデータマイグレーション

`storage.ts`:
- `Storage.load()` で `loopCount` がない場合、`loopCount: 0` を付与

#### constants.ts 変更

- `FRESH_SAVE` に `loopCount: 0` を追加
- `LOOP_SCALE_FACTOR = 0.5` 定数を追加

#### DifficultyScreen 表示

- `save.loopCount > 0` の場合、タイトルに「${loopCount + 1}周目」を表示
- 例: 「ステージ選択（2周目）」

---

### FB#4: エンドレスチャレンジ

**現状の問題**: エンドレスモードがない。

**変更後の動作**:

#### 型変更

- `ChallengeModifier` に `| { type: 'endless' }` を追加
- `RunState` に `isEndless: boolean`（初期値: false）と `endlessWave: number`（初期値: 0）を追加

#### チャレンジ定義

`constants.ts` の `CHALLENGES` に追加:

```typescript
{
  id: 'endless',
  name: '無限の試練',
  description: '終わりなき戦い。どこまで生き延びられるか挑め。',
  icon: '♾️',
  modifiers: [{ type: 'endless' }],
}
```

#### applyChallenge 変更

```typescript
case 'endless':
  next.isEndless = true;
  next.endlessWave = 0;
  break;
```

#### エンドレスフロー

1. 通常通り3バイオーム踏破（grassland → glacier → volcano）
2. 3バイオーム踏破後:
   - 通常: `prefinal` へ遷移
   - エンドレス: `prefinal` をスキップし、`endlessWave++`、バイオームをランダムに再選択して無限ループ
3. 敵スケール: `endlessScale = 1 + endlessWave * 0.1`
   - ループ1回目: ×1.1、2回目: ×1.2、...
   - `startBattle` の敵生成時に `endlessScale` を `hm`/`am` に乗算

#### transitionAfterBiome 変更

`hooks.ts`:
```
if (run.bc >= 3):
  if run.isEndless:
    endlessWave++
    バイオーム順序をリシャッフル
    bc = 0, cW = 0
    次の進化画面へ
  else:
    prefinal へ遷移
```

#### 死亡時スコア記録

- `RunStats` に `endlessWave: number | undefined` を追加
- エンドレス時の死亡: 到達ウェーブ数と総撃破数をスコアとして記録
- `GameOverScreen` にエンドレス結果を表示:「到達ウェーブ: ${endlessWave}, 撃破数: ${kills}」

---

### FB#8: 戦闘ログ見返し

**現状の問題**: ゲームオーバー後にバトルログを見返せない。

**変更後の動作**:

1. `GameOverScreen.tsx` に折りたたみ式ログパネルを追加
   - 初期状態: 折りたたみ（非表示）
   - 「戦闘ログを見る」ボタンで展開/折りたたみ切替
   - ローカル state: `isLogOpen: boolean`（初期値: false）

2. ログ内容:
   - `run.log` の全内容を表示（最大 LOG_TRIM=35 行）
   - 各エントリの色はそのまま（`LogEntry.c` を `LOG_COLORS` で変換）
   - スクロール可能なコンテナ（max-height: 200px, overflow-y: auto）

3. スタイル:
   - `styles.ts` に `LogReviewContainer` を追加（ゲームオーバー画面用ログパネル）
   - 背景: `rgba(0,0,0,0.5)`、ボーダー: `1px solid #555`

---

## P4: あそびかた進化図鑑 + ツリーUI改善

### FB#10: あそびかた進化図鑑

**現状の問題**: あそびかた画面が基本ルールのみで進化情報がない。

**変更後の動作**:

1. `HowToPlayScreen.tsx` をタブ切替式に拡張
   - タブ構成（3タブ）:

| タブ | ラベル | 内容 |
|------|--------|------|
| 1 | 基本ルール | 既存の遊び方説明（変更なし） |
| 2 | 進化図鑑 | EVOS 全一覧 + カテゴリフィルタ |
| 3 | シナジー | SYNERGY_BONUSES 一覧 |

2. 進化図鑑タブの仕様:
   - フィルタボタン: 「全て」「技術」「生活」「儀式」
   - 各進化カード: 名前 `n`、説明 `d`、文明タイプ `t`（色付き）、レアリティ `r`、タグ表示
   - フィルタ選択で `t` でフィルタリング

3. シナジータブの仕様:
   - SYNERGY_BONUSES を一覧表示
   - 各シナジー: タグアイコン + 名前、Tier1/Tier2 の効果を表示

4. タブ切替:
   - ローカル state: `activeTab: 0 | 1 | 2`
   - `styles.ts` に `TabBtn` スタイルを追加（選択中/非選択のスタイル差異）

---

### FB#3: ツリー効果の透明性改善

**現状の問題**: 戦闘画面でツリーボーナスが何に影響しているか見えにくい。

**変更後の動作**:

1. `BattleScreen.tsx` でツリーボーナスサマリーを小さく表示
   - 表示位置: ステータス表示の下
   - `TB_SUMMARY` 配列を使い、値が0でないものを列挙
   - フォントサイズ: 10px、色: #aaa
   - 例: 「🌳 ATK+3 HP+20 DEF+1 会心+8%」

2. `TreeScreen.tsx` で取得済みノードの累積効果サマリーを改善
   - 画面上部に「取得済み効果」セクションを追加
   - `TB_SUMMARY` を使って現在のツリーボーナス合計を表示
   - 色分け: カテゴリ別（`CAT_CL` を使用）

---

## 仕様確認チェックリスト

- [ ] P1: FB#9 の maxEvo ガードは `SELECT_EVO` と `EvolutionScreen` の両方で実装
- [ ] P1: FB#1 のチャレンジ難易度選択は2段階フロー
- [ ] P1: FB#2 のカウントダウンは3秒、手動ボタン併設
- [ ] P1: FB#5 の骨コストは 10/25 に変更
- [ ] P1: FB#6 のログ表示は 160px / 40行
- [ ] P1: FB#7 の速度は ×0.5（1500ms）を先頭に追加
- [ ] P2: FB#12 はUIラベルのみ変更、ロジック不変
- [ ] P2: FB#13 のボス連戦は Difficulty.bb で制御、BOSS_CHAIN_SCALE でスケール
- [ ] P3: FB#11 の周回倍率は `1 + loopCount * 0.5`
- [ ] P3: FB#4 のエンドレスは3バイオーム後に無限ループ、敵スケール `1 + wave * 0.1`
- [ ] P3: FB#8 のログパネルは折りたたみ式、max-height 200px
- [ ] P4: FB#10 のタブは3タブ構成（基本ルール/進化図鑑/シナジー）
- [ ] P4: FB#3 のツリーサマリーは BattleScreen と TreeScreen の2箇所
