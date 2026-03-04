# Agile Quiz Sugoroku ブラッシュアップ仕様書 (Phase 3)

---

## 1. GOAL結果のTEAM化

### 1.1 概要

現在の「エンジニアタイプ分類」をチーム視点の「チームタイプ分類」に変更する。
個人の能力診断ではなく、チームとしてどのような成熟段階にあるかを判定する。

### 1.2 チームタイプ定義（6種類）

| ID | 名前 | 絵文字 | 説明 | 判定条件 |
|---|---|---|---|---|
| `synergy` | シナジーチーム | 🌟 | メンバーの強みが結合し、1+1>2を実現するチーム | `stability >= 65 && debt <= 20 && totalPoints >= 60` |
| `resilient` | レジリエントチーム | 🔥 | 障害に強く、困難を乗り越える回復力を持つチーム | `emergencySuccess >= 2` |
| `evolving` | 成長するチーム | 📈 | スプリントごとに改善を重ね、着実に成長していくチーム | `sprintRates.length >= 2 && sprintRates[0] < 50 && sprintRates[last] >= 65` |
| `agile` | アジャイルチーム | ⚡ | 素早い判断と実行力で価値を迅速に届けるチーム | `averageSpeed <= 5.5 && totalPoints >= 50` |
| `struggling` | もがくチーム | 💪 | 技術的負債に苦しみながらも前に進もうとするチーム | `debt >= 35` |
| `forming` | 結成したてのチーム | 🌱 | まだ互いを知り始めたばかり。これから成長していくチーム | デフォルト（上記いずれにも該当しない場合） |

### 1.3 チームタイプ別フィードバックテキスト

各チームタイプに対して以下の構成でフィードバックを提供:

```typescript
interface TeamType {
  id: string;
  name: string;
  emoji: string;
  description: string;        // 1行の簡潔な説明
  feedback: string;           // タカ（BO）からの2〜3行のフィードバック
  nextStep: string;           // 次のステップへのアドバイス
  condition: (data: ClassifyStats) => boolean;
}
```

#### フィードバック例

**シナジーチーム 🌟**
- description: 「全員の力が噛み合い、チームとして最高のパフォーマンスを発揮した」
- feedback: 「素晴らしい。このチームはまさにスクラムが目指す姿だ。安定したベロシティ、低い技術的負債、そしてメンバー全員が各自の強みを活かしている。ステークホルダーとしても、安心してプロダクトを任せられる。」
- nextStep: 「次の挑戦は、この成功パターンを組織全体に広げること。他チームのメンタリングや、より大きなプロダクトへの挑戦を検討しよう。」

**レジリエントチーム 🔥**
- description: 「緊急事態にも動じず、チーム全体で問題を解決する力を持つ」
- feedback: 「このチームの真価は、危機の時にこそ発揮される。緊急対応を ${emergencySuccess} 回成功させた実績は、チームの結束力と問題解決能力の証だ。」
- nextStep: 「障害対応力は十分。次はプロアクティブな改善 — 技術的負債の計画的な返済やリスクの事前検知に取り組もう。」

**成長するチーム 📈**
- description: 「スプリントを重ねるごとに改善し、チームとして成長し続けている」
- feedback: 「最初のスプリントでは手探りだったが、レトロスペクティブでの振り返りを活かし、確実に成長している。この改善のサイクルこそアジャイルの本質だ。」
- nextStep: 「成長の勢いを維持するために、チーム内でのナレッジ共有を強化しよう。ペアプログラミングやモブプログラミングも効果的だ。」

**アジャイルチーム ⚡**
- description: 「素早い判断と実行力で、価値あるプロダクトを迅速にデリバリーする」
- feedback: 「スピード感のある開発で、ビジネス価値を素早く届けている。平均 ${averageSpeed} 秒の意思決定速度は、チームの知識レベルと判断力の高さを物語る。」
- nextStep: 「スピードは武器だが、品質とのバランスも忘れずに。テスト自動化やコードレビューの文化を強化して、持続可能な速度を保とう。」

**もがくチーム 💪**
- description: 「技術的負債に苦しみながらも、諦めずに前に進み続けている」
- feedback: 「技術的負債が ${debt} まで積み上がっているのは厳しい状況だ。しかし、このチームは諦めていない。苦しい中でも走り続ける姿勢は評価に値する。」
- nextStep: 「まずはリファインメントの時間を確保して負債を減らそう。20%ルール（スプリントの20%を改善に充てる）の導入を提案する。」

**結成したてのチーム 🌱**
- description: 「まだチームとしての形を模索中。伸びしろは無限大」
- feedback: 「${sprintCount}スプリントを完走したことは、それ自体が大きな一歩だ。タックマンモデルで言えば、まだForming（形成期）の段階。ここからStorming（混乱期）を経て、チームは成長していく。」
- nextStep: 「チームの約束事（ワーキングアグリーメント）を作ることから始めよう。お互いの得意・不得意を共有し、チームとしての強みを見つけていこう。」

### 1.4 グレード判定のリフレーム

グレードラベルをチーム成熟度に変更:

| グレード | 最小スコア | 変更前ラベル | 変更後ラベル | チーム成熟度 |
|---|---|---|---|---|
| S | 90 | Legendary | Dream Team | 自己組織化されたチーム |
| A | 75 | Excellent | High-Performing | 高パフォーマンスチーム |
| B | 60 | Good | Collaborative | 協調的なチーム |
| C | 45 | Average | Developing | 発展途上のチーム |
| D | 0 | Needs Work | Kick-off | スタートしたばかりのチーム |

### 1.5 ResultScreen UI変更

- ヘッダー: 「あなたのエンジニアタイプ」→「チームの成熟度」
- チームタイプ画像: エンジニアタイプ画像をチーム向けイラストに差し替え
- タカのフィードバック: チーム視点のコメントに変更
- レーダーチャート: 軸ラベルをチーム指標に変更
  - 正答率 → チーム知識力
  - 安定度 → プロセス安定性
  - 速度 → 意思決定速度
  - コンボ → チーム連携力
  - 技術的負債 → 技術健全性

### 1.6 影響範囲

| ファイル | 変更内容 |
|---------|---------|
| `engineer-classifier.ts` → `team-classifier.ts` | ファイルリネーム＋ロジック変更 |
| `constants.ts` | ENGINEER_TYPES → TEAM_TYPES、グレードラベル変更 |
| `types.ts` | EngineerType → TeamType インターフェース変更 |
| `ResultScreen.tsx` | 表示テキスト・画像の全面変更 |
| `result-storage.ts` | engineerTypeId/Name → teamTypeId/Name |
| `images.ts` | チームタイプ画像の import 変更 |

---

## 2. スプリント切れ目のSAVE/LOAD機能

### 2.1 概要

スプリントの振り返り画面（RetrospectiveScreen）で途中経過を保存し、後日「続きから」再開できる機能。

### 2.2 セーブデータ構造

```typescript
interface SaveState {
  version: number;                    // スキーマバージョン（マイグレーション用）
  timestamp: number;                  // 保存日時
  sprintCount: number;                // 選択されたスプリント数
  currentSprint: number;              // 現在のスプリント番号
  stats: GameStats;                   // ゲーム統計
  log: SprintSummary[];               // スプリントログ
  usedQuestions: Record<string, number[]>; // 使用済み問題（Set→配列で保存）
  tagStats: TagStats;                 // ジャンル別統計
  incorrectQuestions: AnswerResultWithDetail[]; // 不正解リスト
}
```

### 2.3 localStorage キー設計

| キー | 用途 | 変更 |
|-----|------|------|
| `aqs_last_result` | 最終結果保存（既存） | TeamType対応に更新 |
| `aqs_save_state` | ゲーム途中セーブ（新規） | 新規追加 |

### 2.4 UI仕様

#### RetrospectiveScreen（振り返り画面）
- 画面下部に「保存して中断」ボタンを追加
- ボタン押下時:
  1. 現在のゲーム状態を `aqs_save_state` に保存
  2. 「保存しました」のトースト表示（2秒で消える）
  3. タイトル画面に戻る

#### TitleScreen（タイトル画面）
- セーブデータが存在する場合、「続きから」ボタンを表示
- ボタンには保存日時とスプリント進捗を表示
  - 例: 「続きから（スプリント 3/5 - 3月4日 14:30）」
- 「続きから」押下時:
  1. セーブデータをロード
  2. 次のスプリントの `sprint-start` フェーズから再開
  3. セーブデータを削除（二重ロード防止）
- 「新しいゲーム」を開始した場合:
  1. 既存のセーブデータがあれば確認ダイアログを表示
  2. 「上書きする」選択でセーブデータを削除して新規開始

### 2.5 セーブ/ロードロジック

```typescript
// save-manager.ts

const SAVE_KEY = 'aqs_save_state';
const SAVE_VERSION = 1;

export function saveGameState(state: SaveState): void;
export function loadGameState(): SaveState | undefined;
export function deleteSaveState(): void;
export function hasSaveState(): boolean;
```

### 2.6 エラーハンドリング

- localStorage が使用不可（プライベートブラウジング等）→ SAVEボタンを非表示
- セーブデータが破損 → 自動削除してクリーンスタート
- スキーマバージョン不一致 → マイグレーション or 削除

---

## 3. スプリント間の成長物語

### 3.1 概要

スプリント開始前にストーリー画面を表示し、5キャラクターの出会いから真のTeam完成までの成長物語を演出する。

### 3.2 ストーリー構成（8スプリント分）

| スプリント | タイトル | テーマ | シーン概要 |
|-----------|---------|--------|----------|
| 1 | 「はじめまして」 | 出会い・結成 | 5人のメンバーが初めて顔を合わせる。タカがプロジェクトの意義を語り、チーム結成。それぞれが自己紹介し、期待と不安が入り混じる。 |
| 2 | 「それぞれのやり方」 | 衝突・混乱 | メンバーごとにやり方が違い、意見がぶつかる。イヌが優先順位で悩み、ネコとウサギの品質観が対立。ペンギンが間に入って対話を促す。 |
| 3 | 「最初の壁」 | 最初の失敗 | 初めてのスプリントレビューで期待通りの成果が出ない。技術的負債が積み上がり始める。しかし、レトロスペクティブで率直に問題を共有できた。 |
| 4 | 「変わり始める空気」 | 気づき・変化 | ペンギンのファシリテーションで振り返りが機能し始める。ネコが自らテストを書き始め、イヌがバックログの整理を改善。小さな成功体験が生まれる。 |
| 5 | 「助け合いの芽」 | 協力・支え合い | 緊急対応が発生するが、メンバーが自発的に協力して解決。ウサギがネコにテスト技法を教え、タカが現場の声をステークホルダーに伝える。 |
| 6 | 「自分たちのリズム」 | 自己組織化 | チーム独自のワークフローが確立。ペンギンが介入しなくてもメンバーが自律的に動き始める。ベロシティが安定し、予測可能性が上がる。 |
| 7 | 「嵐を超えて」 | 試練と克服 | 大きな障害（要件変更、技術的課題）が発生。しかしチームは動じず、冷静に対応を議論。困難を乗り越えたことで信頼がさらに深まる。 |
| 8 | 「真のTeam」 | 完成・絆 | チームが自己組織化され、互いの強みを最大限に活かしている状態。タカが「このチームにプロダクトを任せて正解だった」と語る。5人が笑顔で未来のスプリントに向かう。 |

### 3.3 スプリント数とストーリーのマッピング

選択されたスプリント数に応じて、ストーリーの表示を最適化する:

| 選択スプリント数 | 表示するストーリー | マッピング |
|-----------------|-------------------|-----------|
| 1 | Sprint 1 のみ | 1→結成 |
| 2 | Sprint 1, 8 | 1→結成、2→完成 |
| 3 | Sprint 1, 4, 8 | 1→結成、2→変化、3→完成 |
| 5 | Sprint 1, 2, 4, 6, 8 | 1→結成、2→衝突、3→変化、4→自己組織化、5→完成 |
| 8 | Sprint 1〜8 全て | 全ストーリー表示 |

### 3.4 StoryScreen コンポーネント仕様

```typescript
interface StoryScreenProps {
  sprintNumber: number;          // 現在のスプリント番号
  storyData: StoryEntry;         // ストーリーデータ
  onComplete: () => void;        // ストーリー完了時のコールバック
  onSkip: () => void;            // スキップ時のコールバック
}

interface StoryEntry {
  sprintNumber: number;          // 対応するスプリント番号
  title: string;                 // ストーリータイトル
  narratorId: string;            // 語り手キャラクターID
  lines: StoryLine[];            // テキスト行
  imageKey: string;              // 対応する画像キー
}

interface StoryLine {
  speakerId?: string;            // 発言者キャラクターID（ナレーションの場合はundefined）
  text: string;                  // テキスト内容
}
```

### 3.5 表示仕様

- **背景**: 対応するストーリーイラスト（半透明オーバーレイ付き）
- **テキスト表示**: ノベルゲーム風に1行ずつフェードイン
- **キャラクター発言**: 発言者の名前とアイコンを左側に表示
- **ナレーション**: 中央揃えのイタリック体で表示
- **操作**:
  - クリック / Enter / Space: 次の行へ進む
  - 全行表示後にもう一度操作: ストーリー完了
  - 「スキップ」ボタン（右上）: 即座にストーリーをスキップ
  - Escape キー: スキップ

### 3.6 フェーズ遷移の変更

```
変更前:
  retro → sprint-start → game

変更後:
  retro → story → sprint-start → game
  (※ story はスキップ可能)
  (※ 最初のスプリント開始前にも story を表示)
```

GamePhase 型に `'story'` を追加。

---

## 4. 背景画像の作成と切り替え

### 4.1 概要

透過処理済みのキャラクター画像を活かすため、シーン別の背景画像を用意し、ゲーム進行に応じて切り替える。

### 4.2 背景画像一覧

| ID | ファイル名 | シーン | 使用画面 |
|---|-----------|--------|---------|
| `office` | `aqs_bg_office.webp` | オフィス / チームルーム | TitleScreen, GuideScreen |
| `planning` | `aqs_bg_planning.webp` | 会議室 / ホワイトボード前 | SprintStartScreen, planning/refinement/reviewイベント |
| `dev` | `aqs_bg_dev.webp` | 開発スペース / モニター群 | impl1/impl2/test1/test2イベント |
| `emergency` | `aqs_bg_emergency.webp` | 赤い警告灯 / 緊迫した空気 | emergencyイベント |
| `retro` | `aqs_bg_retro.webp` | カフェスペース / リラックス | RetrospectiveScreen |

### 4.3 背景切り替えロジック

```typescript
// イベントIDと背景IDのマッピング
const EVENT_BACKGROUND_MAP: Record<string, string> = {
  planning: 'planning',
  impl1: 'dev',
  test1: 'dev',
  refinement: 'planning',
  impl2: 'dev',
  test2: 'dev',
  review: 'planning',
  emergency: 'emergency',
};
```

### 4.4 背景表示仕様

- 背景画像はフルスクリーンで表示（`background-size: cover`）
- キャラクター画像はその上にオーバーレイ表示
- 画面遷移時にフェードトランジション（0.5秒）
- 背景に半透明の暗幕を重ね、テキストの可読性を確保

---

## 5. 勉強会モードのキャラクター別ジャンル絞り込み

### 5.1 概要

勉強会モードにおいて、キャラクターを選択することで、そのキャラクターの役割・スキルに関連するジャンルに自動的に絞り込む機能。

### 5.2 キャラクター×ジャンルマッピング

| キャラクター | 役割 | 関連ジャンル |
|-------------|------|-------------|
| タカ（BO） | ビジネスオーナー | `agile`, `scrum`, `team`, `release` |
| イヌ（PO） | プロダクトオーナー | `scrum`, `backlog`, `estimation`, `agile` |
| ペンギン（SM） | スクラムマスター | `scrum`, `agile`, `team`, `estimation` |
| ネコ（Dev） | フルスタックエンジニア | `design-principles`, `design-patterns`, `programming`, `data-structures`, `refactoring` |
| ウサギ（QA） | QAエンジニア | `testing`, `code-quality`, `ci-cd`, `sre`, `incident` |

### 5.3 UI仕様

#### StudySelectScreen の変更

現在のジャンル選択UIの上部に「キャラクターで絞り込み」セクションを追加:

```
┌─────────────────────────────────────┐
│ 📚 勉強会モード                       │
│                                      │
│ ■ キャラクターで絞り込み               │
│ ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐│
│ │🦅タカ││🐶イヌ││🐧ペン││🐱ネコ││🐰ウサ││
│ │  BO  ││  PO  ││  SM  ││ Dev  ││  QA  ││
│ └──────┘└──────┘└──────┘└──────┘└──────┘│
│                                      │
│ ■ ジャンル選択                        │
│ [✓] スクラム  [✓] アジャイル  ...     │
│ (キャラ選択時は関連ジャンルが自動選択)  │
│                                      │
│ ■ 問題数: ○10問 ○20問 ○50問          │
│                                      │
│        [ 開始 ]                      │
└─────────────────────────────────────┘
```

#### 操作フロー

1. キャラクターカードをクリック → 関連ジャンルが自動選択（トグル）
2. キャラクター選択後もジャンルの手動追加・削除は可能
3. 複数キャラクターを選択した場合は、和集合でジャンルを選択
4. キャラクターを再度クリックで選択解除 → そのキャラクター固有のジャンルを解除

### 5.4 データ構造

```typescript
// character-genre-map.ts
interface CharacterGenreMapping {
  characterId: string;
  characterName: string;
  emoji: string;
  role: string;
  genres: string[];        // 関連するタグID配列
}

export const CHARACTER_GENRE_MAP: CharacterGenreMapping[];
```

---

## 6. キャラクター以外の各種画像一新

### 6.1 概要

Phase 2b でキャラクター画像を統一デザインに刷新済み。
今回は残りの全画像を同じデザインテイストで一新する。

### 6.2 画像一覧と新デザイン方針

#### A. イベント画像（8枚）

| ファイル名 | 現在の内容 | 新デザイン方針 |
|-----------|-----------|--------------|
| `aqs_event_planning.webp` | 計画イベントイラスト | 5キャラがホワイトボード前で計画中。イヌがバックログを指し、ペンギンがファシリテート |
| `aqs_event_impl1.webp` | 実装1イラスト | ネコがPC前でコーディング中。他のメンバーが見守る |
| `aqs_event_test1.webp` | テスト1イラスト | ウサギが虫眼鏡でバグを探索中。テスト結果のモニター |
| `aqs_event_refinement.webp` | リファインメントイラスト | チーム全員でバックログアイテムを議論。付箋を貼り替える様子 |
| `aqs_event_impl2.webp` | 実装2イラスト | ネコとウサギがペアプロ中。コードとテストの画面 |
| `aqs_event_test2.webp` | テスト2イラスト | CI/CDパイプラインが走る画面。グリーンのチェックマーク |
| `aqs_event_review.webp` | レビューイラスト | タカと外部ステークホルダーの前でデモ。チーム全員が参加 |
| `aqs_event_emergency.webp` | 緊急対応イラスト | 赤い警告灯。チーム全員が緊迫した表情で問題に取り組む |

#### B. UI画像（6枚）

| ファイル名 | 現在の内容 | 新デザイン方針 |
|-----------|-----------|--------------|
| `aqs_correct.webp` | 正解フィードバック | ペンギンが嬉しそうにOKサインを出す。緑色の背景 |
| `aqs_incorrect.webp` | 不正解フィードバック | ペンギンが励ましの表情で手を差し伸べる。優しい赤色の背景 |
| `aqs_timeup.webp` | タイムアップ | ウサギが時計を見て焦っている。タイマーのイラスト |
| `aqs_build_success.webp` | ビルド成功 | チーム全員がハイタッチ。グリーンのチェックマーク |
| `aqs_grade_celebration.webp` | グレード表示 | 紙吹雪とともにトロフィーを掲げるチーム |
| `aqs_retro.webp` | 振り返り画面 | カフェスペースでリラックスしたチーム。付箋ボード |

#### C. チームタイプ画像（6枚） — エンジニアタイプ画像の差し替え

| ファイル名 | 変更前 | 変更後 |
|-----------|-------|--------|
| `aqs_type_synergy.webp` | `aqs_type_stable.webp`（安定運用型） | 5キャラが手を合わせて光る。シナジーの星 |
| `aqs_type_resilient.webp` | `aqs_type_firefighter.webp`（火消し職人） | 嵐の中でも笑顔で立つ5キャラ。盾を構える |
| `aqs_type_evolving.webp` | `aqs_type_growth.webp`（成長曲線型） | 階段を上る5キャラ。上昇グラフ |
| `aqs_type_agile.webp` | `aqs_type_speed.webp`（高速レスポンス） | 風を切って走る5キャラ。スピード線 |
| `aqs_type_struggling.webp` | `aqs_type_debt.webp`（技術的負債型） | 重い荷物を背負いながらも前進する5キャラ |
| `aqs_type_forming.webp` | `aqs_type_default.webp`（デフォルト） | 新芽の前に並ぶ5キャラ。希望に満ちた表情 |

#### D. ストーリーイラスト（8枚）— 新規

| ファイル名 | スプリント | シーン |
|-----------|-----------|--------|
| `aqs_story_01.webp` | 1 | 5キャラが初めて顔を合わせるオフィス。名刺交換の雰囲気 |
| `aqs_story_02.webp` | 2 | 会議室で対立するネコとウサギ。ペンギンが仲裁 |
| `aqs_story_03.webp` | 3 | レビューでのがっかりした表情。しかしレトロで前を向く |
| `aqs_story_04.webp` | 4 | ペンギンのファシリテーションでチームに笑顔が戻る |
| `aqs_story_05.webp` | 5 | 緊急対応中にウサギがネコを助ける。タカが応援 |
| `aqs_story_06.webp` | 6 | 自律的に動くチーム。カンバンボードが整然 |
| `aqs_story_07.webp` | 7 | 嵐（大きな障害）に立ち向かう5キャラ |
| `aqs_story_08.webp` | 8 | 夕日を背景にチーム全員が笑顔。達成感と絆 |

#### E. 背景画像（5枚）— 新規

| ファイル名 | シーン |
|-----------|--------|
| `aqs_bg_office.webp` | モダンなオフィス / チームルーム。パステルカラー |
| `aqs_bg_planning.webp` | 会議室。ホワイトボードと付箋 |
| `aqs_bg_dev.webp` | 開発スペース。モニター群とコード |
| `aqs_bg_emergency.webp` | 赤い警告灯。暗めで緊迫した雰囲気 |
| `aqs_bg_retro.webp` | カフェスペース。温かい照明とリラックスした雰囲気 |

### 6.3 画像仕様

| 項目 | 仕様 |
|-----|------|
| アートスタイル | Phase 2b と同じフラットデザイン |
| 形式 | WebP |
| イベント画像サイズ | 800x450px |
| UI画像サイズ | 512x512px |
| チームタイプ画像サイズ | 512x512px |
| ストーリーイラストサイズ | 1280x720px |
| 背景画像サイズ | 1920x1080px |

---

## 7. 技術仕様（共通事項）

### 7.1 型定義の追加（types.ts）

```typescript
// ゲームフェーズに story を追加
export type GamePhase = 'title' | 'story' | 'sprint-start' | 'game' | 'retro' | 'result' | 'guide' | 'study-select' | 'study';

// チームタイプ
export interface TeamType {
  id: string;
  name: string;
  emoji: string;
  description: string;
  feedback: string;
  nextStep: string;
  condition: (data: ClassifyStats) => boolean;
}

// セーブ状態
export interface SaveState {
  version: number;
  timestamp: number;
  sprintCount: number;
  currentSprint: number;
  stats: GameStats;
  log: SprintSummary[];
  usedQuestions: Record<string, number[]>;
  tagStats: TagStats;
  incorrectQuestions: AnswerResultWithDetail[];
}

// ストーリーデータ
export interface StoryEntry {
  sprintNumber: number;
  title: string;
  narratorId: string;
  lines: StoryLine[];
  imageKey: string;
}

export interface StoryLine {
  speakerId?: string;
  text: string;
}

// 保存結果（TEAM化対応）
export interface SavedGameResult {
  // ...既存フィールド
  teamTypeId: string;      // engineerTypeId から変更
  teamTypeName: string;    // engineerTypeName から変更
}
```

### 7.2 後方互換性

- 既存の `aqs_last_result` のデータに `engineerTypeId` がある場合は `teamTypeId` として読み替え
- セーブデータの `version` フィールドでスキーマバージョンを管理
- 古いバージョンのデータはマイグレーション関数で変換

### 7.3 テスト方針

| テスト対象 | テスト種類 | 優先度 |
|-----------|-----------|-------|
| team-classifier.ts | ユニットテスト | 最高 |
| save-manager.ts | ユニットテスト | 最高 |
| character-genre-map.ts | ユニットテスト | 高 |
| story-data.ts | ユニットテスト（データ整合性） | 高 |
| StoryScreen.tsx | コンポーネントテスト | 中 |
| ResultScreen.tsx（TEAM化） | コンポーネントテスト | 高 |
| StudySelectScreen.tsx（キャラ選択） | コンポーネントテスト | 中 |
| TitleScreen.tsx（続きから） | コンポーネントテスト | 中 |
