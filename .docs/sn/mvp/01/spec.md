# 仕様・要件定義（Sprint Note Inc.1「Loop」）

## 1. 目的

`.docs/sn/specs/sprint_note_inc1_spec.md` をベースに、
**Inc.1「Loop」（スプリントループ検証）** を現行プロダクトへ追加する。

- スプリントの 5 フェーズが破綻なく回るかを検証する
- 選択に「考える余地」があるかを確認する
- 1 プレイ 5〜8 分の体験を実現する

### Inc.1 の本質

> Inc.1 は「ゲームとして面白いか」ではない。
> **スプリントループが機械的に回り、テンポが成立するか** を検証するフェーズである。

---

## 2. ゲーム概要

### 2.1 基本情報

| 項目 | 内容 |
|------|------|
| ジャンル | テキストベース・シミュレーション |
| テーマ | アジャイル開発プロジェクト管理 |
| プレイ時間 | 5〜8 分 / 1 プレイ |
| スプリント数 | 3（固定） |
| ゴール種類 | 4 種類 |
| チーム人数 | 5 人（PdM, FE, BE, QA, デザイナー） |
| 永続化 | なし（リロードでリセット） |

### 2.2 コンセプト

計画→開発→リリース→レビュー→振り返りの 5 フェーズを繰り返すサイクルが、
ゲームの骨格として機能するかを検証する **ループ検証プロトタイプ**。

---

## 3. ゲームフロー（状態遷移）

```
[START]
  │
  ▼
TITLE ─── "はじめる" ───┐
                        ▼
                  PROJECT_INTRO    （PM提示）
                        │
                        ▼
                  TEAM_FORMATION   （チーム結成）
                        │
                        ▼
                  GOAL_SELECTION   （ゴール選択）
                        │
                        ▼
               ┌─── SPRINT_LOOP ──────────────────────┐
               │                                       │
               │  PLANNING ──► DEVELOPMENT ──► RELEASE │
               │                                       │
               │  RELEASE ──► REVIEW ──► RETROSPECTIVE │
               │                                       │
               └───────────────────────────────────────┘
                        │  × 3回（Sprint 1, 2, 3）
                        │
                        ▼
                  RESULT             （リザルト）
                        │
                        ▼
                     [END] ──── "もう一度" ──── TITLE
```

### 3.1 状態一覧

| 状態 ID | 名称 | 概要 |
|---------|------|------|
| TITLE | タイトル | ゲーム開始画面 |
| PROJECT_INTRO | プロジェクト提示 | PM からのプロジェクト説明 |
| TEAM_FORMATION | チーム結成 | 5 人の紹介 |
| GOAL_SELECTION | ゴール選択 | 4 種類から 1 つ選択 |
| PLANNING | スプリントプランニング | タスク選択 |
| DEVELOPMENT | 開発 | 自動進行（Inc.1 ではイベントなし） |
| RELEASE | リリース判断 | 3 択の判断 |
| REVIEW | レビュー | フィードバック表示 |
| RETROSPECTIVE | 振り返り | 改善アクション選択 |
| RESULT | リザルト | 結末テキスト表示 |

### 3.2 状態遷移ルール

- 各状態はプレイヤーの入力（選択またはクリック/タップ）で次の状態に遷移する
- RETROSPECTIVE 終了時、現在のスプリント番号が 3 未満なら PLANNING に戻る（次スプリント）
- スプリント番号が 3 に達したら RESULT に遷移する
- RESULT から TITLE に戻ることで再プレイ可能

---

## 4. データモデル

### 4.1 ゲーム状態（GameState）

```typescript
type GameState = {
  currentPhase: Phase;              // 現在の状態ID
  selectedGoal: Goal | null;        // 選択されたゴール
  currentSprint: number;            // 現在のスプリント番号（1〜3）
  teamTrust: number;                // チーム信頼性（0〜100、初期値: 50）
  productProgress: number;          // プロダクト進捗（0〜100、初期値: 0）
  qualityScore: number;             // 品質スコア（0〜100、初期値: 50）
  sprints: SprintRecord[];          // 各スプリントの記録
  activeImprovements: string[];     // 現在有効な改善アクションIDリスト
};
```

### 4.2 フェーズ（Phase）

```typescript
type Phase =
  | 'TITLE'
  | 'PROJECT_INTRO'
  | 'TEAM_FORMATION'
  | 'GOAL_SELECTION'
  | 'PLANNING'
  | 'DEVELOPMENT'
  | 'RELEASE'
  | 'REVIEW'
  | 'RETROSPECTIVE'
  | 'RESULT';
```

### 4.3 ゴール（Goal）

```typescript
type GoalId = 'stability' | 'value' | 'deadline' | 'quality';

type Goal = {
  id: GoalId;
  name: string;
  description: string;
  evaluationAxis: string;
  evaluateScore: (state: GameState) => number;
};
```

### 4.4 タスク（Task）

```typescript
type TaskCategory = 'feature' | 'infra' | 'quality' | 'design' | 'debt';

type Task = {
  id: string;
  name: string;
  description: string;
  category: TaskCategory;
  effects: {
    productProgress: number;   // -10〜+20
    qualityScore: number;      // -10〜+15
    teamTrust: number;         // -5〜+10
  };
};
```

### 4.5 スプリント記録（SprintRecord）

```typescript
type ReleaseType = 'full' | 'partial' | 'postpone';

type SprintRecord = {
  sprintNumber: number;
  selectedTasks: Task[];
  releaseDecision: ReleaseType;
  selectedImprovement: string;
  reviewResult: ReviewResult;
};
```

### 4.6 改善アクション（Improvement）

```typescript
type Improvement = {
  id: string;
  name: string;
  description: string;
  effect: (state: GameState) => Partial<GameState>;
  duration: number;              // 持続スプリント数（Inc.1 では常に 1）
};
```

---

## 5. パラメータ仕様

### 5.1 チーム信頼性（teamTrust）

Inc.1 ではユーザー・ステークホルダーからの信用を統合的に表す。

| 項目 | 値 |
|------|-----|
| 範囲 | 0〜100（整数） |
| 初期値 | 50 |
| 表示 | プレイヤーには数値を見せない。レビューのテキスト温度感で間接的に伝える |

#### 増減ルール

| 要因 | 変動 |
|------|------|
| リリース：全機能リリース（品質スコア≧50） | +5 |
| リリース：全機能リリース（品質スコア＜50） | +2（出したが不安定） |
| リリース：一部削ってリリース | +0（安定だが期待を一部裏切る） |
| リリース：延期 | -5 |
| プロダクト進捗が前 Sprint 比 +15 以上 | +3（ボーナス） |
| プロダクト進捗が前 Sprint 比 +5 未満 | -3（進捗不足） |
| 改善アクション「ステークホルダー報告会」選択時 | +5（即時適用） |

### 5.2 プロダクト進捗（productProgress）

| 項目 | 値 |
|------|-----|
| 範囲 | 0〜100（整数） |
| 初期値 | 0 |
| 表示 | プレイヤーには見せない。レビューのテキストに反映 |

- タスク選択の `effects.productProgress` の合計で増加
- リリース判断による減算あり（一部削り: -5、延期: -10）
- 上限 100、下限 0 で clamp

### 5.3 品質スコア（qualityScore）

| 項目 | 値 |
|------|-----|
| 範囲 | 0〜100（整数） |
| 初期値 | 50 |
| 表示 | プレイヤーには見せない。リリース判断時のテキストに影響 |

- タスク選択の `effects.qualityScore` の合計で増減
- feature 系タスクを多く選ぶと低下傾向、quality 系タスクを選ぶと上昇傾向
- 上限 100、下限 0 で clamp

---

## 6. フェーズ詳細仕様

### 6.1 TITLE（タイトル画面）

#### 表示内容

```
Sprint Note ─ スプリントノート

[はじめる]
```

#### 動作

- 「はじめる」選択で PROJECT_INTRO に遷移
- GameState を初期値で新規作成

---

### 6.2 PROJECT_INTRO（プロジェクト提示）

#### 表示内容

```
── プロジェクト提示 ──

PM：
「新規のタスク管理ツールの開発をお願いしたい。
社内で使うもので、まずは基本機能が動くところまで。

期限は3スプリント。短いが、まずは最低限の形にしてほしい。
経営層も注目しているプロジェクトだ。
要件は……正直、まだ固まりきっていない部分もある。
走りながら詰めていくことになると思う。

期待しているよ。」

[次へ]
```

#### 動作

- 「次へ」選択で TEAM_FORMATION に遷移

---

### 6.3 TEAM_FORMATION（チーム結成）

#### 表示内容

```
── チーム結成 ──

あなたのチームが決まった。全員、今回が初めてのプロジェクトだ。

■ PdM（プロダクトマネージャー）
  方向性と価値の声。
  「何を作れば意味があるか、ちゃんと考えたい」

■ FE（フロントエンドエンジニア）
  ユーザー体験を形にする。
  「まずは触れるものを早く作りたいタイプです」

■ BE（バックエンドエンジニア）
  プロダクトの土台を支える。
  「基盤がしっかりしてないと、あとで絶対困りますよ」

■ QA（品質保証）
  品質とリスクを守る。
  「出す前にちゃんと確認させてください……」

■ デザイナー
  意味と一貫性をつなぐ。
  「ユーザーに伝わらなかったら、作った意味がないですから」

全員やる気はある。ただ、経験は浅い。

[次へ]
```

#### 動作

- 「次へ」選択で GOAL_SELECTION に遷移

---

### 6.4 GOAL_SELECTION（ゴール選択）

#### 表示内容

```
── ゴール選択 ──

このプロジェクトで、チームは何を目指す？

1. 安定稼働
   障害やバグを抑え、信頼できるプロダクトを届ける。
   評価：安定性と信頼の積み上げで判断される。

2. 価値最大化
   ユーザーにとっての価値を最大限に引き出す。
   評価：プロダクトの充実度と進捗で判断される。

3. 納期死守
   期限内に約束したものを必ず届ける。
   評価：スプリントごとの着実な前進で判断される。

4. 品質文化
   品質と改善の土台を作り、長く走れるチームになる。
   評価：品質の維持と改善の積み重ねで判断される。

[1] [2] [3] [4]
```

#### ゴール定義

| ID | 名称 | スコア算出ロジック |
|---|---|---|
| stability | 安定稼働 | `qualityScore * 0.6 + teamTrust * 0.4` |
| value | 価値最大化 | `productProgress * 0.6 + teamTrust * 0.4` |
| deadline | 納期死守 | `productProgress * 0.5 + (各Sprintで進捗+10以上の回数 * 15) + teamTrust * 0.2` |
| quality | 品質文化 | `qualityScore * 0.5 + (quality系タスク選択回数 * 10) + teamTrust * 0.2` |

#### 動作

- 4 択から 1 つ選択
- `selectedGoal` に選択結果を格納
- PLANNING（Sprint 1）に遷移

---

### 6.5 PLANNING（スプリントプランニング）

#### タスク候補の決定ロジック

1. タスクプール（セクション 7）から、現在のスプリント番号に対応するタスクセットを取得
2. 各スプリントには固定の 3 タスク候補が割り当てられている（Inc.1 では動的生成なし）
3. 有効な改善アクションによる修飾がある場合は効果適用時に反映

#### 表示内容

```
── Sprint {N} プランニング ──

今スプリントで取り組むタスクを2つ選んでください。

1. {task1.name}
   {task1.description}

2. {task2.name}
   {task2.description}

3. {task3.name}
   {task3.description}

2つ選択してください：[1と2] [1と3] [2と3]
```

#### 動作

- 3 つの候補から 2 つの組み合わせを選択（3 通りの選択肢）
- 選択したタスクの effects を GameState に適用:
  - `productProgress += task.effects.productProgress`（各タスク分）
  - `qualityScore += task.effects.qualityScore`（各タスク分）
  - 改善アクションボーナスはタスク 1 つ目の適用時にのみ加算（二重適用しない）
  - 各値は `clamp(0, 100)` で制限
- SprintRecord に selectedTasks を記録
- DEVELOPMENT に遷移

---

### 6.6 DEVELOPMENT（開発）

#### 表示内容

```
── Sprint {N} 開発中 ──

チームは計画に沿って開発を進めている……

▸ {selectedTask1.name} ─ 進行中
▸ {selectedTask2.name} ─ 進行中

{developmentFlavorText}

[次へ]
```

#### 開発フレーバーテキスト（developmentFlavorText）

| 条件 | テキスト |
|------|----------|
| Sprint 1 | 「初めてのスプリント。手探りだが、チームの空気は悪くない。」 |
| Sprint 2, qualityScore ≧ 50 | 「2回目のスプリント。少しずつ要領がわかってきた。」 |
| Sprint 2, qualityScore < 50 | 「2回目のスプリント。コードの粗さが気になり始めている。」 |
| Sprint 3, qualityScore ≧ 50 | 「最終スプリント。ここまで来た。最後まで走り切ろう。」 |
| Sprint 3, qualityScore < 50 | 「最終スプリント。積み残しが重い。何を優先するか──。」 |

#### 動作

- Inc.1 ではイベント発生なし。テキスト表示のみ
- 「次へ」選択で RELEASE に遷移

---

### 6.7 RELEASE（リリース判断）

#### 表示内容

```
── Sprint {N} リリース判断 ──

開発が完了した。このスプリントの成果をどうリリースする？

{qualityWarning}

1. 全機能リリース
   完成した機能をすべて出す。
   {fullReleaseRisk}

2. 一部を削ってリリース
   不安定な部分を切り、安定した機能だけ出す。
   確実だが、届けられる価値は小さくなる。

3. リリース延期
   今回はリリースしない。次スプリントで品質を上げてから出す。
   品質は守れるが、進捗ゼロと見なされる。

[1] [2] [3]
```

#### 動的テキスト

**qualityWarning**（品質スコアに応じた警告）

| 条件 | テキスト |
|------|----------|
| qualityScore ≧ 70 | 「品質は安定している。自信を持って出せる状態だ。」 |
| 50 ≦ qualityScore < 70 | 「大きな問題はなさそうだが、細かい粗は残っている。」 |
| 30 ≦ qualityScore < 50 | 「正直、不安が残る。出すかどうかは判断が分かれるところだ。」 |
| qualityScore < 30 | 「かなり荒い。このまま出すとトラブルになるかもしれない。」 |

**fullReleaseRisk**（全機能リリースのリスク表示）

| 条件 | テキスト |
|------|----------|
| qualityScore ≧ 50 | 「現状なら大きな問題はないだろう。」 |
| qualityScore < 50 | 「ただし、品質が低いままリリースすると信頼に影響するかもしれない。」 |

#### 効果処理

| 選択 | teamTrust 効果 | productProgress 効果 |
|------|----------------|----------------------|
| 全機能リリース（品質≧50） | +5 | 変動なし |
| 全機能リリース（品質＜50） | +2 | 変動なし |
| 一部削ってリリース | +0 | -5 |
| リリース延期 | -5 | -10 |

#### 進捗ボーナス/ペナルティ（リリース判断後に判定）

| 条件 | teamTrust 変動 |
|------|----------------|
| 今 Sprint の productProgress 増分 ≧ 15 | +3 |
| 今 Sprint の productProgress 増分 < 5 | -3 |

#### 動作

- 3 択から 1 つ選択
- 効果を GameState に適用（clamp 処理付き）
- SprintRecord に releaseDecision を記録
- REVIEW に遷移

---

### 6.8 REVIEW（レビュー）

#### ユーザー反応の決定

| 条件（優先順） | テキスト |
|----------------|----------|
| releaseDecision == "postpone" | 「ユーザー：今回は新しい機能が届かなかった。次に期待したい。」 |
| productProgress ≧ 70 | 「ユーザー：使える機能が増えてきた。これは助かる。」 |
| productProgress ≧ 40 | 「ユーザー：少しずつ形になってきている。もう少し充実すると嬉しい。」 |
| productProgress < 40 | 「ユーザー：まだ使えるものが少ない。本当に間に合うのだろうか。」 |

#### ステークホルダー反応の決定

| 条件（優先順） | テキスト |
|----------------|----------|
| releaseDecision == "postpone" | 「ステークホルダー：リリースが見送られた。進捗は大丈夫か？」 |
| teamTrust ≧ 70 | 「ステークホルダー：順調だな。この調子で頼むよ。」 |
| teamTrust ≧ 40 | 「ステークホルダー：まあ、悪くはない。引き続き注視している。」 |
| teamTrust < 40 | 「ステークホルダー：少し心配している。次はもう少し成果を見せてほしい。」 |

#### 品質追加コメント

releaseDecision が "full" かつ qualityScore < 40 の場合のみ：

```
「※ 一部のユーザーから『動作が不安定だ』という声が上がっている。」
```

#### 表示内容

```
── Sprint {N} レビュー ──

{ユーザー反応テキスト}

{ステークホルダー反応テキスト}

{品質追加コメント（該当する場合のみ）}

[次へ]
```

#### 動作

- テキスト表示のみ（判断なし）
- SprintRecord に reviewResult を記録
- 「次へ」選択で RETROSPECTIVE に遷移

---

### 6.9 RETROSPECTIVE（振り返り）

#### 改善アクションプール

| ID | 名称 | 説明 | 効果 |
|---|---|---|---|
| improve_process | 開発プロセスの見直し | 作業の進め方を振り返り、無駄を減らす。 | 次 Sprint のタスク効果 productProgress に +3 ボーナス |
| improve_quality | 品質チェック強化 | テスト観点を増やし、レビューを丁寧にする。 | 次 Sprint の qualityScore に +8 |
| improve_communication | コミュニケーション改善 | チーム内の情報共有を密にする。 | 次 Sprint のタスク効果の合計に +2 ボーナス（全パラメータ） |
| stakeholder_report | ステークホルダー報告会 | 進捗と課題を丁寧に報告する。 | teamTrust に即時 +5 |
| tech_study | 技術勉強会 | 新しい技術や手法を学ぶ時間を取る。 | 次 Sprint のタスク効果 qualityScore に +5 ボーナス |
| rest_and_recover | 休息の確保 | チームにしっかり休む時間を設ける。 | 次 Sprint の productProgress ボーナス +2、qualityScore ボーナス +2 |

#### 候補選出ロジック

**Sprint 1:**

- 候補 A: `improve_process`（固定。最初のスプリントではプロセスを見直すのが自然）
- 候補 B:
  - qualityScore < 50 → `improve_quality`
  - qualityScore ≧ 50 → `improve_communication`

**Sprint 2:**

- 候補 A:
  - teamTrust < 40 → `stakeholder_report`
  - teamTrust ≧ 40 → `tech_study`
- 候補 B:
  - qualityScore < 50 → `improve_quality`
  - qualityScore ≧ 50 → `rest_and_recover`

**Sprint 3（最終）:**

選択式ではなく、プロジェクト全体を振り返るナレーション形式。

#### 振り返りナレーション（retrospectiveNarrative）

| 条件 | テキスト |
|------|----------|
| productProgress ≧ 70 かつ qualityScore ≧ 50 | 「機能も品質も、最低限の形にはなった。チームとして悪くない仕事ができたと思う。」 |
| productProgress ≧ 70 かつ qualityScore < 50 | 「機能は揃ったが、品質には不安が残る。動くものは作れた──でも、これでいいのだろうか。」 |
| productProgress < 70 かつ qualityScore ≧ 50 | 「品質は守れたが、届けられた機能は多くない。堅実だが、期待に応えられたかは微妙だ。」 |
| productProgress < 70 かつ qualityScore < 50 | 「正直、厳しいスプリントだった。足りないものだらけだが、チームは最後まで走った。」 |

#### 表示内容（Sprint 1, 2）

```
── Sprint {N} 振り返り ──

このスプリントを振り返って、次に向けた改善を1つ選ぼう。

1. {improvement1.name}
   {improvement1.description}

2. {improvement2.name}
   {improvement2.description}

[1] [2]
```

#### 表示内容（Sprint 3）

```
── Sprint 3 振り返り ──

3スプリントを走りきった。

{retrospectiveNarrative}

このプロジェクトで、チームは何を学んだだろうか。

[結果を見る]
```

#### 改善アクション効果の適用タイミング

```
// 擬似コード
applyTaskEffects(task, state, isFirstTask) {
  let progressBonus = 0
  let qualityBonus = 0

  // ボーナスはタスク1つ目にのみ適用（二重適用防止）
  if (isFirstTask) {
    if (state.activeImprovements.includes("improve_process")) {
      progressBonus += 3
    }
    if (state.activeImprovements.includes("improve_quality")) {
      qualityBonus += 8
    }
    if (state.activeImprovements.includes("improve_communication")) {
      progressBonus += 2
      qualityBonus += 2
    }
    if (state.activeImprovements.includes("tech_study")) {
      qualityBonus += 5
    }
    if (state.activeImprovements.includes("rest_and_recover")) {
      progressBonus += 2
      qualityBonus += 2
    }
  }

  state.productProgress = clamp(
    state.productProgress + task.effects.productProgress + progressBonus, 0, 100
  )
  state.qualityScore = clamp(
    state.qualityScore + task.effects.qualityScore + qualityBonus, 0, 100
  )

  // stakeholder_report は即時効果のため、選択時に trust+5 を適用済み
  // activeImprovements は次スプリント開始時にリセット
}
```

#### 動作

- Sprint 1, 2: 2 択から 1 つ選択 → 効果を適用 → 次スプリントの PLANNING に遷移
- Sprint 3: テキスト表示のみ → 「結果を見る」選択で RESULT に遷移

---

### 6.10 RESULT（リザルト）

#### スコア算出

選択されたゴールの `evaluateScore` 関数でスコアを算出する（0〜100 の範囲に正規化）。

#### 結果ランクの決定

| スコア範囲 | ランク | ランク名 |
|-----------|--------|----------|
| 80〜100 | A | 上出来 |
| 60〜79 | B | まずまず |
| 40〜59 | C | 課題あり |
| 0〜39 | D | 厳しかった |

#### PM の一言

| ランク | テキスト |
|--------|----------|
| A | 「PM：正直、新人チームでここまでやれるとは思わなかった。よくやった。」 |
| B | 「PM：完璧ではないが、ちゃんと形になった。次も頼むよ。」 |
| C | 「PM：課題は多いが、走り切ったことは評価している。次に活かしてほしい。」 |
| D | 「PM：厳しい結果だったな……。でも、ここから学べることは多いはずだ。」 |

#### ユーザーの反応

| 条件 | テキスト |
|------|----------|
| productProgress ≧ 70 | 「ユーザー：必要な機能が揃ってきた。これなら日常的に使えそうだ。」 |
| 40 ≦ productProgress < 70 | 「ユーザー：まだ足りない部分はあるけど、方向性は悪くない。」 |
| productProgress < 40 | 「ユーザー：正直、まだ実用には遠い。次のアップデートに期待するしかない。」 |

#### ステークホルダーの態度

| 条件 | テキスト |
|------|----------|
| teamTrust ≧ 70 | 「ステークホルダー：このチームには安心して任せられる。継続して予算をつけよう。」 |
| 40 ≦ teamTrust < 70 | 「ステークホルダー：悪くはない。ただ、もう少し目に見える成果がほしいところだ。」 |
| teamTrust < 40 | 「ステークホルダー：率直に言って、期待を下回っている。体制の見直しが必要かもしれない。」 |

#### チームの空気

| 条件 | テキスト |
|------|----------|
| ランク A または B | 「チーム：大変だったけど、やりきった。もう少しうまくできた気もするけど、悪くない。」 |
| ランク C | 「チーム：反省点は多い。でも、次はもう少しうまくやれる気がする。」 |
| ランク D | 「チーム：正直、きつかった。でも──逃げなかったのは、悪くなかったと思う。」 |

#### 表示内容

```
── プロジェクト完了 ──

ゴール：{selectedGoal.name}
結果：{ランク名}

{PMの一言}

{ユーザーの反応}

{ステークホルダーの態度}

{チームの空気}

────────────────

開発は続く。
でも今は──走り続けられる状態を、作れただろうか。

[もう一度プレイする]
```

#### 動作

- テキスト表示
- 「もう一度プレイする」選択で TITLE に遷移（GameState リセット）

---

## 7. タスクプール定義

### 7.1 Sprint 1 タスク候補

| ID | 名称 | 説明 | category | progress | quality | trust |
|---|---|---|---|---|---|---|
| s1_t1 | ユーザー登録機能 | 基本的なユーザー登録・ログイン機能を実装する。 | feature | +15 | -5 | +0 |
| s1_t2 | データベース設計 | プロダクト全体のデータ構造を設計・構築する。 | infra | +5 | +10 | +0 |
| s1_t3 | UI プロトタイプ | 主要画面のプロトタイプを作成し、操作感を確認する。 | design | +10 | +0 | +5 |

### 7.2 Sprint 2 タスク候補

| ID | 名称 | 説明 | category | progress | quality | trust |
|---|---|---|---|---|---|---|
| s2_t1 | タスク一覧画面 | タスクの表示・並べ替え・フィルタリング機能を実装する。 | feature | +15 | -5 | +0 |
| s2_t2 | API 設計とテスト整備 | API の設計を整理し、自動テストの基盤を構築する。 | quality | +0 | +15 | +0 |
| s2_t3 | タスク作成機能 | 新規タスクの作成・編集・削除機能を実装する。 | feature | +15 | -5 | +3 |

### 7.3 Sprint 3 タスク候補

| ID | 名称 | 説明 | category | progress | quality | trust |
|---|---|---|---|---|---|---|
| s3_t1 | 通知機能 | タスクの期限通知・アサイン通知を実装する。 | feature | +15 | -5 | +3 |
| s3_t2 | パフォーマンス改善 | 画面表示速度と API 応答速度を改善する。 | quality | +0 | +15 | +5 |
| s3_t3 | ダッシュボード画面 | プロジェクト全体の進捗を俯瞰できる画面を実装する。 | feature | +10 | +0 | +5 |

---

## 8. UI 仕様

### 8.1 基本方針

- テキストベースの最小限 UI
- レイアウトは縦 1 カラム、中央配置
- フォントは読みやすいゴシック系（等幅は使わない）
- 背景は暗めのトーン（落ち着いたダーク UI）
- テキストは段階表示（パラグラフ単位で順次表示）
- 選択肢はボタンまたはカード形式

### 8.2 画面構成

```
┌─────────────────────────────────────────┐
│                                         │
│  ── Sprint {N} / 3  {フェーズ名} ──      │  ← ヘッダー
│                                         │
│  {本文テキスト}                           │  ← メインコンテンツ
│                                         │
│                                         │
│  [選択肢1]  [選択肢2]  [選択肢3]          │  ← 選択肢エリア
│                                         │
└─────────────────────────────────────────┘
```

### 8.3 ヘッダー表示ルール

| 状態 | ヘッダー表示 |
|------|-------------|
| TITLE | 表示なし |
| PROJECT_INTRO | 「プロジェクト提示」 |
| TEAM_FORMATION | 「チーム結成」 |
| GOAL_SELECTION | 「ゴール選択」 |
| PLANNING | 「Sprint {N} / 3 ── プランニング」 |
| DEVELOPMENT | 「Sprint {N} / 3 ── 開発」 |
| RELEASE | 「Sprint {N} / 3 ── リリース判断」 |
| REVIEW | 「Sprint {N} / 3 ── レビュー」 |
| RETROSPECTIVE | 「Sprint {N} / 3 ── 振り返り」 |
| RESULT | 「プロジェクト完了」 |

### 8.4 カラーパレット

| 用途 | 色 |
|------|-----|
| 背景 | #0f1117（深いダーク） |
| テキスト | #e0e0e0（明るいグレー） |
| サブテキスト | #888888（中間グレー） |
| アクセント（選択肢） | #4a9eff（淡い青） |
| 成功/良好 | #4ade80（淡い緑） |
| 警告/注意 | #fbbf24（暖色イエロー） |
| 危険/低い | #f87171（淡い赤） |
| ボーダー | #2a2d35（暗いグレー） |

### 8.5 選択肢のインタラクション

- 選択肢はホバー（PC）/ タップ（モバイル）で視覚的に反応する
- 選択後は他の選択肢がグレーアウトし、選択済みの項目がハイライトされる
- 選択後 0.5 秒のウェイトを入れてから次の画面に遷移する（即遷移しない）
- 一度選択した後の取り消しはできない

### 8.6 テキスト表示演出

- テキストは段落ごとに 0.3 秒間隔で順次表示（フェードイン）
- タップ/クリックで残りテキストを即時全表示可能（スキップ）
- 選択肢は本文テキストがすべて表示された後に表示される

### 8.7 スタイリング技術

- styled-components で統一（既存プロジェクトに合わせる）
- Tailwind CSS は使用しない（元仕様書では Tailwind を想定していたが、既存コードベースとの一貫性を優先）

### 8.8 画面サイズ

- モバイルファースト（横幅 320px〜）
- PC 表示時はコンテンツ幅を max-width: 672px（max-w-2xl 相当）で制限
- テキスト主体のためレスポンシブ対応は自然に成立

---

## 9. 統合仕様

### 9.1 ルーティング

- パス: `/sprint-note`
- lazy import パターン:
  ```typescript
  const SprintNotePage = lazy(() => import('./pages/SprintNotePage'));
  ```
- Route:
  ```tsx
  <Route path="/sprint-note" element={<SprintNotePage />} />
  ```

### 9.2 ページラッパー

`src/pages/SprintNotePage.tsx` は RiskLcdPage と同じパターン:

```typescript
import React from 'react';
import styled from 'styled-components';
import { SprintNoteGame } from '../features/sprint-note';

const FullScreenWrap = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow: hidden;
  background: #0f1117;
`;

const SprintNotePage: React.FC = () => (
  <FullScreenWrap>
    <SprintNoteGame />
  </FullScreenWrap>
);

export default SprintNotePage;
```

### 9.3 GameListPage へのカード追加

既存の GameListPage にカードを追加:

- タイトル: 「Sprint Note」
- 説明: 「テキストベースのアジャイル開発シミュレーション。計画・開発・リリース・レビュー・振り返りのスプリントループを回し、プロジェクトを成功に導け。」
- パス: `/sprint-note`

---

## 10. テスト要件

### 10.1 ユニットテスト（game-logic.test.ts）

1. タスク効果適用テスト（productProgress, qualityScore の増減）
2. clamp 処理テスト（0〜100 範囲制限）
3. リリース判断効果テスト（全機能/一部削り/延期 × 品質条件）
4. teamTrust 増減テスト（リリース判断 + 進捗ボーナス/ペナルティ）
5. 改善アクション効果テスト（6 種の効果適用）
6. 改善アクション二重適用防止テスト
7. 改善アクション候補選出テスト（Sprint 1, 2 の条件分岐）
8. スコア算出テスト（4 ゴール × 各条件パターン）
9. ランク判定テスト（A〜D の境界値）
10. レビューテキスト選出テスト（ユーザー + ステークホルダー）
11. 開発フレーバーテキスト選出テスト
12. 振り返りナレーション選出テスト
13. リザルトテキスト選出テスト（PM、ユーザー、SH、チーム）

### 10.2 コンポーネントテスト（SprintNoteGame.test.tsx）

1. フェーズ遷移の E2E テスト（TITLE → RESULT の全遷移）
2. 画面切替テスト（各フェーズで適切なコンポーネントが表示される）
3. 選択肢インタラクションテスト（選択 → グレーアウト → 遷移）

### 10.3 手動テスト

- 4 ゴール × 各種選択パターンでの通しプレイ
- テキスト表示演出の確認（段階表示、スキップ）
- モバイル表示の確認（320px〜）
- 1 プレイ 5〜8 分の確認

---

## 11. 受け入れ基準

- [ ] `/sprint-note` でゲームが開始できる
- [ ] TITLE → PROJECT_INTRO → TEAM_FORMATION → GOAL_SELECTION → [SPRINT×3] → RESULT の E2E が成立
- [ ] 4 つのゴールそれぞれでゲーム完走可能
- [ ] タスク選択で productProgress, qualityScore が正しく増減する
- [ ] リリース判断で teamTrust が正しく増減する
- [ ] 改善アクションの効果が次スプリントに正しく反映される
- [ ] リザルトのスコア算出・ランク判定が仕様通り
- [ ] テキストの条件分岐が全パターンで正しく動作する
- [ ] テストが追加され `npm test` が通る
- [ ] GameListPage にカードが追加されている

---

## 12. 実装しない要素（明確化）

Inc.1 では以下は **実装しない**。

- ロールの声（チームメンバーの個別発言）
- イベント（開発中のランダムイベント）
- 歪み（パラメータに応じた異常演出）
- ローグライク成長（プレイ間の引き継ぎ）
- 音声・SE・BGM
- 永続化（ローカルストレージ保存）
- チームメンバー個人パラメータ
- タスクの動的生成
- 改善アクションの遅効型（duration > 1）

---

## 13. 評価観点（Inc.1 完了後）

以下の 5 観点で検証する。

1. **テンポ**: 3 スプリントが退屈なく回るか
2. **選択の意味**: タスク・リリース・改善の各選択に「考える余地」があるか
3. **結末の実感**: リザルトで「自分の選択が反映された」と感じるか
4. **リプレイ性**: 違うゴールで再プレイしたくなるか
5. **時間感覚**: 5〜8 分で 1 プレイ完結するか

### NG 例

- フェーズが多すぎてテンポが悪い → テキスト量削減 / 自動進行フェーズの追加
- 何を選んでも結果が変わらない → パラメータバランス調整
- リザルトが単調 → テキストパターンの追加
