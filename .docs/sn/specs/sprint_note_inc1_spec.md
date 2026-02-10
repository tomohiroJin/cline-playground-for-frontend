# スプリントノート Inc.1「Loop」仕様書

## 1. 概要

### 1.1 本ドキュメントの目的

Inc.1「Loop」の実装に必要なすべての仕様を定義する。本仕様書をもとにコーディングが可能なレベルの詳細度を目指す。

### 1.2 Inc.1の目的

計画→開発→リリース→レビュー→振り返りの5フェーズを繰り返すサイクルが、ゲームの骨格として機能するかを検証する。

### 1.3 スコープ

- 1プレイ＝3スプリントの短縮版
- イベント・歪み・ロールの声・ローグライク成長はなし
- 純粋なループの流れとテンポの検証
- 1プレイ目標時間：5〜8分

---

## 2. ゲームフロー（状態遷移）

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

### 2.1 状態一覧

| 状態ID | 名称 | 概要 |
|---|---|---|
| TITLE | タイトル | ゲーム開始画面 |
| PROJECT_INTRO | プロジェクト提示 | PMからのプロジェクト説明 |
| TEAM_FORMATION | チーム結成 | 5人の紹介 |
| GOAL_SELECTION | ゴール選択 | 4種類から1つ選択 |
| PLANNING | スプリントプランニング | タスク選択 |
| DEVELOPMENT | 開発 | 自動進行（Inc.1ではイベントなし） |
| RELEASE | リリース判断 | 3択の判断 |
| REVIEW | レビュー | フィードバック表示 |
| RETROSPECTIVE | 振り返り | 改善アクション選択 |
| RESULT | リザルト | 結末テキスト表示 |

### 2.2 状態遷移ルール

- 各状態はプレイヤーの入力（選択またはクリック/タップ）で次の状態に遷移する
- RETROSPECTIVE終了時、現在のスプリント番号が3未満なら PLANNING に戻る（次スプリント）
- スプリント番号が3に達したら RESULT に遷移する
- RESULT から TITLE に戻ることで再プレイ可能

---

## 3. データモデル

### 3.1 ゲーム状態（GameState）

```
GameState {
  currentPhase: Phase           // 現在の状態ID
  selectedGoal: Goal | null     // 選択されたゴール
  currentSprint: number         // 現在のスプリント番号（1〜3）
  teamTrust: number             // チーム信頼性（0〜100、初期値: 50）
  sprints: SprintRecord[]       // 各スプリントの記録
  productProgress: number       // プロダクト進捗（0〜100、初期値: 0）
  qualityScore: number          // 品質スコア（0〜100、初期値: 50）
  activeImprovements: string[]  // 現在有効な改善アクションIDリスト
}
```

### 3.2 ゴール（Goal）

```
Goal {
  id: string                    // "stability" | "value" | "deadline" | "quality"
  name: string                  // 表示名
  description: string           // 説明文
  evaluationAxis: string        // 評価軸の説明
  evaluateScore: (state) => number  // 最終スコア算出関数
}
```

### 3.3 タスク（Task）

```
Task {
  id: string                    // 一意識別子
  name: string                  // タスク名
  description: string           // 説明文
  category: TaskCategory        // "feature" | "infra" | "quality" | "design" | "debt"
  effects: {
    productProgress: number     // プロダクト進捗への影響（-10〜+20）
    qualityScore: number        // 品質スコアへの影響（-10〜+15）
    teamTrust: number           // チーム信頼性への影響（-5〜+10）
  }
}
```

### 3.4 スプリント記録（SprintRecord）

```
SprintRecord {
  sprintNumber: number
  selectedTasks: Task[]          // 選択したタスク（2つ）
  releaseDecision: ReleaseType   // リリース判断
  selectedImprovement: string    // 選択した改善アクションID
  reviewResult: ReviewResult     // レビュー結果
}
```

### 3.5 改善アクション（Improvement）

```
Improvement {
  id: string                     // 一意識別子
  name: string                   // 表示名
  description: string            // 説明文
  effect: (state) => void        // 適用時の効果
  duration: number               // 持続スプリント数（Inc.1では常に1）
}
```

---

## 4. パラメータ仕様

### 4.1 チーム信頼性（teamTrust）

Inc.1で唯一のパラメータ。ユーザー・ステークホルダーからの信用を統合的に表す。

| 項目 | 値 |
|---|---|
| 範囲 | 0〜100（整数） |
| 初期値 | 50 |
| 表示 | プレイヤーには数値を見せない。レビューのテキスト温度感で間接的に伝える |

#### 増減ルール

| 要因 | 変動 |
|---|---|
| リリース：全機能リリース（品質スコア≧50） | +5 |
| リリース：全機能リリース（品質スコア＜50） | +2（出したが不安定） |
| リリース：一部削ってリリース | +0（安定だが期待を一部裏切る） |
| リリース：延期 | -5 |
| プロダクト進捗が前Sprint比+15以上 | +3（ボーナス） |
| プロダクト進捗が前Sprint比+5未満 | -3（進捗不足） |
| 改善アクション「ステークホルダー報告会」選択時 | +5 |

### 4.2 プロダクト進捗（productProgress）

| 項目 | 値 |
|---|---|
| 範囲 | 0〜100（整数） |
| 初期値 | 0 |
| 表示 | プレイヤーには見せない。レビューのテキストに反映 |

- タスク選択の effects.productProgress の合計で増加
- 上限100を超えない（clamp処理）

### 4.3 品質スコア（qualityScore）

| 項目 | 値 |
|---|---|
| 範囲 | 0〜100（整数） |
| 初期値 | 50 |
| 表示 | プレイヤーには見せない。リリース判断時のテキストに影響 |

- タスク選択の effects.qualityScore の合計で増減
- feature系タスクを多く選ぶと低下傾向、quality系タスクを選ぶと上昇傾向
- 下限0、上限100で clamp

---

## 5. フェーズ詳細仕様

### 5.1 TITLE（タイトル画面）

#### 表示内容

```
Sprint Note ─ スプリントノート

[はじめる]
```

#### 動作

- 「はじめる」選択で PROJECT_INTRO に遷移
- GameState を初期値で新規作成

---

### 5.2 PROJECT_INTRO（プロジェクト提示）

#### 表示内容

PMの台詞としてプロジェクト概要を表示する。Inc.1では固定の1テンプレート。

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

### 5.3 TEAM_FORMATION（チーム結成）

#### 表示内容

5人のメンバーを順に紹介する。

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

### 5.4 GOAL_SELECTION（ゴール選択）

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

- 4択から1つ選択
- selectedGoal に選択結果を格納
- PLANNING（Sprint 1）に遷移

---

### 5.5 PLANNING（スプリントプランニング）

#### タスク候補の決定ロジック

1. タスクプール（後述のセクション6）から、現在のスプリント番号に対応するタスクセットを取得
2. 各スプリントには固定の3タスク候補が割り当てられている（Inc.1では動的生成なし）
3. 有効な改善アクションによる修飾がある場合は適用（タスク効果の微調整）

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

- 3つの候補から2つの組み合わせを選択（3通りの選択肢）
- 選択したタスクの effects を GameState に適用:
  - `productProgress += task.effects.productProgress`（各タスク分）
  - `qualityScore += task.effects.qualityScore`（各タスク分）
  - 各値は clamp(0, 100) で制限
- SprintRecord に selectedTasks を記録
- DEVELOPMENT に遷移

---

### 5.6 DEVELOPMENT（開発）

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

スプリント番号と品質スコアに応じて選出。

| 条件 | テキスト |
|---|---|
| Sprint 1 | 「初めてのスプリント。手探りだが、チームの空気は悪くない。」 |
| Sprint 2, qualityScore ≧ 50 | 「2回目のスプリント。少しずつ要領がわかってきた。」 |
| Sprint 2, qualityScore < 50 | 「2回目のスプリント。コードの粗さが気になり始めている。」 |
| Sprint 3, qualityScore ≧ 50 | 「最終スプリント。ここまで来た。最後まで走り切ろう。」 |
| Sprint 3, qualityScore < 50 | 「最終スプリント。積み残しが重い。何を優先するか──。」 |

#### 動作

- Inc.1ではイベント発生なし。テキスト表示のみ
- 「次へ」選択で RELEASE に遷移

---

### 5.7 RELEASE（リリース判断）

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
|---|---|
| qualityScore ≧ 70 | 「品質は安定している。自信を持って出せる状態だ。」 |
| 50 ≦ qualityScore < 70 | 「大きな問題はなさそうだが、細かい粗は残っている。」 |
| 30 ≦ qualityScore < 50 | 「正直、不安が残る。出すかどうかは判断が分かれるところだ。」 |
| qualityScore < 30 | 「かなり荒い。このまま出すとトラブルになるかもしれない。」 |

**fullReleaseRisk**（全機能リリースのリスク表示）

| 条件 | テキスト |
|---|---|
| qualityScore ≧ 50 | 「現状なら大きな問題はないだろう。」 |
| qualityScore < 50 | 「ただし、品質が低いままリリースすると信頼に影響するかもしれない。」 |

#### 効果処理

| 選択 | 効果 |
|---|---|
| 全機能リリース | teamTrust: 4.1 のルール適用。productProgress はそのまま（タスクで既に加算済み） |
| 一部削ってリリース | teamTrust: +0。productProgress: -5（一部削った分） |
| リリース延期 | teamTrust: -5。productProgress: -10（このSprintの成果が外から見えない） |

#### 動作

- 3択から1つ選択
- 効果を GameState に適用
- SprintRecord に releaseDecision を記録
- REVIEW に遷移

---

### 5.8 REVIEW（レビュー）

#### フィードバック生成ロジック

レビューテキストは「ユーザー反応」と「ステークホルダー反応」の2つで構成される。それぞれ teamTrust, productProgress, qualityScore, releaseDecision を入力として、条件分岐でテキストを選出する。

#### ユーザー反応の決定

| 条件（優先順） | テキスト |
|---|---|
| releaseDecision == "postpone" | 「ユーザー：今回は新しい機能が届かなかった。次に期待したい。」 |
| productProgress ≧ 70 | 「ユーザー：使える機能が増えてきた。これは助かる。」 |
| productProgress ≧ 40 | 「ユーザー：少しずつ形になってきている。もう少し充実すると嬉しい。」 |
| productProgress < 40 | 「ユーザー：まだ使えるものが少ない。本当に間に合うのだろうか。」 |

#### ステークホルダー反応の決定

| 条件（優先順） | テキスト |
|---|---|
| releaseDecision == "postpone" | 「ステークホルダー：リリースが見送られた。進捗は大丈夫か？」 |
| teamTrust ≧ 70 | 「ステークホルダー：順調だな。この調子で頼むよ。」 |
| teamTrust ≧ 40 | 「ステークホルダー：まあ、悪くはない。引き続き注視している。」 |
| teamTrust < 40 | 「ステークホルダー：少し心配している。次はもう少し成果を見せてほしい。」 |

#### 品質に関する追加コメント（releaseDecision が "full" かつ qualityScore < 40 の場合のみ）

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

### 5.9 RETROSPECTIVE（振り返り）

#### 改善アクション候補の決定

各スプリントで提示される2つの改善アクション候補は、スプリント番号とゲーム状態に基づいて決定する。

##### 改善アクションプール

| ID | 名称 | 説明 | 効果 |
|---|---|---|---|
| improve_process | 開発プロセスの見直し | 作業の進め方を振り返り、無駄を減らす。 | 次Sprintのタスク効果 productProgress に +3 ボーナス |
| improve_quality | 品質チェック強化 | テスト観点を増やし、レビューを丁寧にする。 | 次Sprintの qualityScore に +8 |
| improve_communication | コミュニケーション改善 | チーム内の情報共有を密にする。 | 次Sprintのタスク効果の合計に +2 ボーナス（全パラメータ） |
| stakeholder_report | ステークホルダー報告会 | 進捗と課題を丁寧に報告する。 | teamTrust に即時 +5 |
| tech_study | 技術勉強会 | 新しい技術や手法を学ぶ時間を取る。 | 次Sprintのタスク効果 qualityScore に +5 ボーナス |
| rest_and_recover | 休息の確保 | チームにしっかり休む時間を設ける。 | 次Sprint の productProgress ボーナス +2、qualityScore ボーナス +2 |

##### 候補選出ロジック

各スプリントで2つを選出する。以下の優先ルールに従う。

**Sprint 1:**
- 候補A：improve_process（固定。最初のスプリントではプロセスを見直すのが自然）
- 候補B：以下から品質スコアが低い方を優先
  - qualityScore < 50 → improve_quality
  - qualityScore ≧ 50 → improve_communication

**Sprint 2:**
- 候補A：以下から teamTrust が低い方を優先
  - teamTrust < 40 → stakeholder_report
  - teamTrust ≧ 40 → tech_study
- 候補B：以下から品質スコアが低い方を優先
  - qualityScore < 50 → improve_quality
  - qualityScore ≧ 50 → rest_and_recover

**Sprint 3（最終）:**
- Sprint 3 の振り返りは選択式ではなく、プロジェクト全体を振り返るナレーション形式。

```
── Sprint 3 振り返り ──

3スプリントを走りきった。

{retrospectiveNarrative}

このプロジェクトで、チームは何を学んだだろうか。

[結果を見る]
```

##### retrospectiveNarrative の決定

| 条件 | テキスト |
|---|---|
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

#### 動作

- Sprint 1, 2：2択から1つ選択 → 効果を適用 → 次スプリントの PLANNING に遷移
- Sprint 3：テキスト表示のみ → 「結果を見る」選択で RESULT に遷移

---

### 5.10 RESULT（リザルト）

#### スコア算出

選択されたゴールの evaluateScore 関数でスコアを算出する（0〜100の範囲に正規化）。

#### 結果ランクの決定

| スコア範囲 | ランク | ランク名 |
|---|---|---|
| 80〜100 | A | 上出来 |
| 60〜79 | B | まずまず |
| 40〜59 | C | 課題あり |
| 0〜39 | D | 厳しかった |

#### テキスト生成

リザルトは4つの視点で構成される。各視点は結果ランクとゲーム状態の組み合わせで決定する。

##### PMの一言

| ランク | テキスト |
|---|---|
| A | 「PM：正直、新人チームでここまでやれるとは思わなかった。よくやった。」 |
| B | 「PM：完璧ではないが、ちゃんと形になった。次も頼むよ。」 |
| C | 「PM：課題は多いが、走り切ったことは評価している。次に活かしてほしい。」 |
| D | 「PM：厳しい結果だったな……。でも、ここから学べることは多いはずだ。」 |

##### ユーザーの反応

| 条件 | テキスト |
|---|---|
| productProgress ≧ 70 | 「ユーザー：必要な機能が揃ってきた。これなら日常的に使えそうだ。」 |
| 40 ≦ productProgress < 70 | 「ユーザー：まだ足りない部分はあるけど、方向性は悪くない。」 |
| productProgress < 40 | 「ユーザー：正直、まだ実用には遠い。次のアップデートに期待するしかない。」 |

##### ステークホルダーの態度

| 条件 | テキスト |
|---|---|
| teamTrust ≧ 70 | 「ステークホルダー：このチームには安心して任せられる。継続して予算をつけよう。」 |
| 40 ≦ teamTrust < 70 | 「ステークホルダー：悪くはない。ただ、もう少し目に見える成果がほしいところだ。」 |
| teamTrust < 40 | 「ステークホルダー：率直に言って、期待を下回っている。体制の見直しが必要かもしれない。」 |

##### チームの空気

| 条件 | テキスト |
|---|---|
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
- 「もう一度プレイする」選択で TITLE に遷移

---

## 6. タスクプール定義

### 6.1 Sprint 1 タスク候補

| ID | 名称 | 説明 | category | progress | quality | trust |
|---|---|---|---|---|---|---|
| s1_t1 | ユーザー登録機能 | 基本的なユーザー登録・ログイン機能を実装する。 | feature | +15 | -5 | +0 |
| s1_t2 | データベース設計 | プロダクト全体のデータ構造を設計・構築する。 | infra | +5 | +10 | +0 |
| s1_t3 | UIプロトタイプ | 主要画面のプロトタイプを作成し、操作感を確認する。 | design | +10 | +0 | +5 |

### 6.2 Sprint 2 タスク候補

| ID | 名称 | 説明 | category | progress | quality | trust |
|---|---|---|---|---|---|---|
| s2_t1 | タスク一覧画面 | タスクの表示・並べ替え・フィルタリング機能を実装する。 | feature | +15 | -5 | +0 |
| s2_t2 | API設計とテスト整備 | APIの設計を整理し、自動テストの基盤を構築する。 | quality | +0 | +15 | +0 |
| s2_t3 | タスク作成機能 | 新規タスクの作成・編集・削除機能を実装する。 | feature | +15 | -5 | +3 |

### 6.3 Sprint 3 タスク候補

| ID | 名称 | 説明 | category | progress | quality | trust |
|---|---|---|---|---|---|---|
| s3_t1 | 通知機能 | タスクの期限通知・アサイン通知を実装する。 | feature | +15 | -5 | +3 |
| s3_t2 | パフォーマンス改善 | 画面表示速度とAPI応答速度を改善する。 | quality | +0 | +15 | +5 |
| s3_t3 | ダッシュボード画面 | プロジェクト全体の進捗を俯瞰できる画面を実装する。 | feature | +10 | +0 | +5 |

### 6.4 改善アクション効果の適用

改善アクションによるボーナスはタスク効果の適用時に加算する。

```
// 擬似コード
applyTaskEffects(task, state) {
  let progressBonus = 0
  let qualityBonus = 0

  if (state.activeImprovements.includes("improve_process")) {
    progressBonus += 3
  }
  if (state.activeImprovements.includes("improve_quality")) {
    qualityBonus += 8  // これはタスクではなく直接加算
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

  state.productProgress += task.effects.productProgress + progressBonus
  state.qualityScore += task.effects.qualityScore + qualityBonus

  // stakeholder_report は即時効果のため、選択時にtrust+5を適用済み
  // ボーナスはスプリント開始時にリセットされる
}
```

**注意**: 改善アクション効果はタスク1つ目の適用時にのみ加算する（2つのタスクそれぞれに二重適用しない）。

---

## 7. UI仕様

### 7.1 基本方針

- テキストベースの最小限UI
- レイアウトは縦1カラム、中央配置
- フォントは等幅は使わない。読みやすいゴシック系
- 背景は暗めのトーン（ターミナル風ではなく、落ち着いたダークUI）
- テキストは段階表示（一気に全文表示ではなく、パラグラフ単位で順次表示）
- 選択肢はボタンまたはカード形式

### 7.2 画面構成

```
┌─────────────────────────────────────────┐
│                                         │
│  ── Sprint {N} / 3  {フェーズ名} ──      │  ← ヘッダー（Sprint 番号とフェーズ名）
│                                         │
│  {本文テキスト}                           │  ← メインコンテンツ
│                                         │
│                                         │
│                                         │
│  [選択肢1]  [選択肢2]  [選択肢3]          │  ← 選択肢エリア（下部固定）
│                                         │
└─────────────────────────────────────────┘
```

### 7.3 ヘッダー表示ルール

| 状態 | ヘッダー表示 |
|---|---|
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

### 7.4 選択肢のインタラクション

- 選択肢はホバー（PC）/ タップ（モバイル）で視覚的に反応する
- 選択後は他の選択肢がグレーアウトし、選択済みの項目がハイライトされる
- 選択後0.5秒のウェイトを入れてから次の画面に遷移する（即遷移しない）
- 一度選択した後の取り消しはできない

### 7.5 テキスト表示演出

- テキストは段落ごとに0.3秒間隔で順次表示（フェードイン）
- タップ/クリックで残りテキストを即時全表示可能（スキップ）
- 選択肢は本文テキストがすべて表示された後に表示される

---

## 8. 技術要件

### 8.1 実装技術

- React（単一HTMLファイル、JSXアーティファクト形式）
- 状態管理：React useState / useReducer
- 外部ライブラリ：Tailwind CSS（ユーティリティのみ）
- ストレージ：Inc.1では永続化なし（リロードでリセット）

### 8.2 画面サイズ

- モバイルファースト（横幅 320px〜）
- PC表示時はコンテンツ幅を max-w-2xl（672px）で制限
- テキスト主体のためレスポンシブ対応は自然に成立

### 8.3 状態管理設計

```
// メインの状態管理
const [gameState, dispatch] = useReducer(gameReducer, initialState)

// アクション例
dispatch({ type: "SELECT_GOAL", payload: "stability" })
dispatch({ type: "SELECT_TASKS", payload: ["s1_t1", "s1_t3"] })
dispatch({ type: "SELECT_RELEASE", payload: "full" })
dispatch({ type: "SELECT_IMPROVEMENT", payload: "improve_quality" })
dispatch({ type: "ADVANCE_PHASE" })
dispatch({ type: "RESTART" })
```

---

## 9. テスト観点

### 9.1 ゲームフロー

- [ ] TITLE → PROJECT_INTRO → TEAM_FORMATION → GOAL_SELECTION → PLANNING の遷移が正常
- [ ] 各ゴール（4種）を選択した場合にゲーム進行が正常
- [ ] Sprint 1 → 2 → 3 → RESULT のループが正常
- [ ] RESULT → TITLE のリスタートが正常
- [ ] 全フェーズで適切なヘッダーが表示される

### 9.2 パラメータ計算

- [ ] タスク選択時に productProgress, qualityScore が正しく増減する
- [ ] 各値が 0〜100 の範囲に clamp される
- [ ] リリース判断で teamTrust が正しく増減する
- [ ] 改善アクションの効果が次スプリントに正しく反映される
- [ ] 改善アクション効果が二重適用されない
- [ ] 改善アクション効果が該当スプリント終了後にリセットされる

### 9.3 テキスト表示

- [ ] 品質スコアに応じた qualityWarning が正しく表示される
- [ ] レビューのユーザー反応・ステークホルダー反応が条件に応じて正しく切り替わる
- [ ] 品質追加コメントが条件を満たす場合のみ表示される
- [ ] 振り返りナレーション（Sprint 3）が条件に応じて正しく表示される
- [ ] リザルトの4視点テキストが条件に応じて正しく表示される

### 9.4 リザルト

- [ ] 各ゴールのスコア算出が正しい
- [ ] スコアに応じたランク（A〜D）が正しく決定される
- [ ] 全ゴール×全ランクの組み合わせ（4×4=16パターン）でリザルトが表示される

### 9.5 エッジケース

- [ ] 全スプリントで同じタスク組み合わせを選んだ場合にゲームが破綻しない
- [ ] 全スプリントでリリース延期を選んだ場合のリザルトが妥当なテキストになる
- [ ] productProgress が 0 のままゲームが終了した場合のリザルトが妥当
- [ ] qualityScore が 0 になった場合の表示が妥当

---

## 10. Inc.2 への引き継ぎ事項

Inc.1 の実装時に以下を意識し、Inc.2 での拡張を阻害しない設計にする。

| 項目 | Inc.2 で追加される内容 | Inc.1 で準備すべきこと |
|---|---|---|
| ロールの声 | 各フェーズでロールが意見を述べる | テキスト表示領域にロールの発言を差し込める構造にする |
| 個人パラメータ | 5人分の疲労パラメータ | GameState に members 配列を追加しやすい構造にする |
| 三者への影響 | 選択肢ごとにチーム/ユーザー/SH への影響差 | teamTrust を user/stakeholder に分離しやすい構造にする |
| タスクの動的生成 | 状態に応じたタスク候補の変化 | タスクプールとタスク選出ロジックを分離しておく |
| 改善アクションの拡張 | 遅効型アクションの追加 | duration フィールドを活かせる設計にする |
