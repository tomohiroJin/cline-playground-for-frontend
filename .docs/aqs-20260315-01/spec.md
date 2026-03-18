# Agile Quiz Sugoroku リファクタリング仕様書

## 1. アーキテクチャ仕様

### 1.1 レイヤードアーキテクチャ

AQS を以下の4層 + 契約層に分離する。

```
┌──────────────────────────────────┐
│        presentation/             │  React コンポーネント、フック、スタイル
├──────────────────────────────────┤
│        application/              │  ユースケース（domain と infrastructure の接続）
├──────────────────────────────────┤
│    domain/     │  contracts/     │  純粋関数のビジネスロジック │ 不変条件・契約
├──────────────────────────────────┤
│        infrastructure/           │  副作用（Storage, Audio, Random）
└──────────────────────────────────┘
```

### 1.2 依存方向ルール

```
presentation → application → domain
                    ↓
              infrastructure → domain（型のみ参照）
```

**禁止される依存:**
- `domain/` → `infrastructure/`（ドメインは副作用を持たない）
- `domain/` → `presentation/`（ドメインは React に依存しない）
- `domain/` → `application/`（ドメインはユースケースに依存しない）
- `infrastructure/` → `presentation/`
- `infrastructure/` → `application/`

### 1.3 各層の責務

| 層 | 責務 | 含めるもの | 含めないもの |
|----|------|-----------|------------|
| **domain** | ビジネスルールの表現 | 純粋関数、型定義、値オブジェクト | React import、localStorage、Math.random |
| **contracts** | 不変条件の検証 | アサーション関数、事前/事後条件 | ビジネスロジック本体 |
| **infrastructure** | 外部システムとの接続 | localStorage、Tone.js、乱数生成 | ビジネスルール |
| **application** | ユースケースの実行 | domain + infrastructure の組み合わせ | UI ロジック |
| **presentation** | UI の表現 | React コンポーネント、フック、スタイル | ビジネスロジック |

---

## 2. ドメイン層仕様

### 2.1 ドメインモジュール構成

#### 2.1.1 game（ゲーム進行）

**game-state.ts** — ゲーム状態の値オブジェクト
```typescript
// ゲーム状態を表す不変のデータ構造
interface GameState {
  readonly phase: GamePhase
  readonly sprint: number
  readonly eventIndex: number
  readonly stats: GameStats
  readonly log: SprintSummary[]
  readonly usedQuestions: number[]
  readonly tagStats: TagStats
  readonly incorrectQuestions: number[]
}

// ゲーム状態の生成関数（不変性保証）
function createInitialGameState(config: GameConfig): GameState
function transitionPhase(state: GameState, nextPhase: GamePhase): GameState
```

**sprint.ts** — スプリントエンティティ
```typescript
// スプリント開始時のイベント生成
function generateSprintEvents(sprintNumber: number, debt: number, random: RandomFn): GameEvent[]

// 緊急対応判定
function shouldTriggerEmergency(debt: number, random: RandomFn): boolean
```

**event-generator.ts** — イベント生成ロジック
```typescript
// イベント生成（純粋関数、乱数は外部から注入）
function createEvents(sprintNumber: number, debt: number, randomFn: () => number): GameEvent[]
```

**game-rules.ts** — ゲームルール定数
```typescript
// ゲーム設定（Object.freeze で不変保証）
const GAME_RULES = Object.freeze({
  maxSprints: 5,
  questionsPerSprint: 5,
  timeLimit: 15,
  emergencyDebtThreshold: 3,
  emergencyProbabilityBase: 0.3,
  // ...
})
```

#### 2.1.2 quiz（クイズ）

**question-picker.ts** — 問題選択ロジック
```typescript
// 問題選択（未使用問題を優先、乱数は外部注入）
function pickQuestion(
  questions: readonly Question[],
  usedIndices: readonly number[],
  randomFn: () => number
): { question: Question; index: number }
```

**answer-evaluator.ts** — 回答評価ロジック
```typescript
// 回答評価（純粋関数）
function evaluateAnswer(input: AnswerInput): AnswerResult

// 技術的負債の増減計算
function calculateDebtDelta(isCorrect: boolean, eventId: string): number

// 次の統計状態を計算
function computeNextStats(
  currentStats: GameStats,
  result: AnswerResult,
  debtDelta: number
): GameStats
```

**combo-calculator.ts** — コンボ計算
```typescript
// コンボ数からスコアボーナスを計算
function calculateComboBonus(combo: number): number

// コンボカラーの決定
function getComboColor(combo: number): string
```

#### 2.1.3 scoring（スコアリング）

**score-calculator.ts** — スコア計算
```typescript
// 派生統計の計算（GameStats → DerivedStats）
function calculateDerivedStats(stats: GameStats, sprintCount: number): DerivedStats

// 最終スコアの計算
function calculateFinalScore(stats: GameStats, config: ScoringConfig): number
```

**debt-calculator.ts** — 技術的負債計算
```typescript
// 負債によるスコア修正
function applyDebtPenalty(score: number, debt: number): number
```

**grade-classifier.ts** — グレード分類
```typescript
// スコアからグレードを判定
function classifyGrade(score: number): Grade

// グレードに基づく表示テキスト取得
function getGradeText(grade: Grade): string
```

#### 2.1.4 team（チーム分類）

**team-classifier.ts** — チームタイプ分類
```typescript
// 統計からチームタイプを分類
function classifyTeamType(stats: ClassifyStats): TeamType
```

#### 2.1.5 achievement（実績）

**achievement-checker.ts** — 実績判定ロジック
```typescript
// 実績条件のチェック
function checkAchievements(
  context: AchievementContext,
  definitions: readonly AchievementDefinition[]
): AchievementDefinition[]
```

### 2.2 ドメイン型定義

#### 2.2.1 game-types.ts
```typescript
// ゲームフェーズ（13段階）
type GamePhase =
  | 'title' | 'story' | 'sprint-start' | 'game'
  | 'retro' | 'ending' | 'result' | 'guide'
  | 'study-select' | 'study' | 'study-result'
  | 'achievement' | 'history'

// ゲームイベント
interface GameEvent {
  readonly id: string
  readonly label: string
  readonly image: string
}

// ゲーム統計
interface GameStats {
  readonly correct: number
  readonly total: number
  readonly combo: number
  readonly maxCombo: number
  readonly debt: number
  readonly elapsed: number
}

// スプリント集計
interface SprintSummary {
  readonly sprintNumber: number
  readonly correct: number
  readonly total: number
  readonly averageTime: number
  readonly accuracy: number
  readonly debt: number
}
```

#### 2.2.2 quiz-types.ts
```typescript
// 問題
interface Question {
  readonly question: string
  readonly options: readonly string[]
  readonly answer: number
  readonly explanation: string
  readonly tags: readonly string[]
}

// 回答入力
interface AnswerInput {
  readonly question: Question
  readonly selectedOption: number
  readonly elapsed: number
  readonly combo: number
}

// 回答結果
interface AnswerResult {
  readonly isCorrect: boolean
  readonly score: number
  readonly combo: number
  readonly timeBonus: number
}

// タグ別統計
interface TagStats {
  readonly [tag: string]: { correct: number; total: number }
}
```

#### 2.2.3 scoring-types.ts
```typescript
// グレード
type Grade = 'S' | 'A' | 'B' | 'C' | 'D'

// 派生統計
interface DerivedStats {
  readonly accuracy: number
  readonly averageTime: number
  readonly debtRatio: number
  readonly comboEfficiency: number
}

// セーブデータ
interface SaveState {
  readonly version: number
  readonly gameState: GameState
  readonly timestamp: number
}

// ゲーム結果
interface SavedGameResult {
  readonly stats: GameStats
  readonly derived: DerivedStats
  readonly grade: Grade
  readonly teamTypeId: string
  readonly date: string
}
```

---

## 3. 契約（Contracts）仕様

### 3.1 ゲーム契約（game-contracts.ts）

```typescript
// 不変条件: ゲーム状態は常に有効
function assertValidGameState(state: GameState): void {
  // スプリント番号は 1 以上
  assert(state.sprint >= 1, `スプリント番号が不正: ${state.sprint}`)
  // スコアは非負
  assert(state.stats.correct >= 0, `正解数が負: ${state.stats.correct}`)
  assert(state.stats.total >= state.stats.correct, `合計 < 正解`)
  // 負債は非負
  assert(state.stats.debt >= 0, `負債が負: ${state.stats.debt}`)
  // コンボは非負
  assert(state.stats.combo >= 0, `コンボが負: ${state.stats.combo}`)
  assert(state.stats.maxCombo >= state.stats.combo, `最大コンボ < 現在コンボ`)
}

// 事前条件: スプリント開始
function assertCanStartSprint(state: GameState, maxSprints: number): void {
  assert(state.sprint <= maxSprints, `最大スプリント数超過`)
  assert(state.phase === 'sprint-start', `フェーズが sprint-start でない`)
}
```

### 3.2 クイズ契約（quiz-contracts.ts）

```typescript
// 事前条件: 問題選択
function assertCanPickQuestion(
  questions: readonly Question[],
  usedIndices: readonly number[]
): void {
  assert(questions.length > 0, `問題プールが空`)
  usedIndices.forEach(i => {
    assert(i >= 0 && i < questions.length, `使用済みインデックスが範囲外: ${i}`)
  })
}

// 事後条件: 回答評価
function assertValidAnswerResult(result: AnswerResult): void {
  assert(result.score >= 0, `スコアが負: ${result.score}`)
  assert(result.combo >= 0, `コンボが負: ${result.combo}`)
  assert(result.timeBonus >= 0, `タイムボーナスが負: ${result.timeBonus}`)
}
```

### 3.3 スコア契約（scoring-contracts.ts）

```typescript
// 不変条件: グレード分類
function assertValidGradeClassification(score: number, grade: Grade): void {
  // 全スコアがいずれかのグレードに分類される
  const validGrades: Grade[] = ['S', 'A', 'B', 'C', 'D']
  assert(validGrades.includes(grade), `不正なグレード: ${grade}`)
}

// 事後条件: 派生統計
function assertValidDerivedStats(stats: DerivedStats): void {
  assert(stats.accuracy >= 0 && stats.accuracy <= 1, `正答率が範囲外`)
  assert(stats.averageTime >= 0, `平均時間が負`)
}
```

---

## 4. インフラ層仕様

### 4.1 Port インターフェース

#### 4.1.1 StoragePort
```typescript
// ストレージ操作のインターフェース
interface StoragePort {
  get<T>(key: string): T | undefined
  set<T>(key: string, value: T): void
  remove(key: string): void
  clear(): void
}
```

#### 4.1.2 AudioPort
```typescript
// オーディオ操作のインターフェース
interface AudioPort {
  initialize(): Promise<void>
  playBgm(track: string): void
  stopBgm(): void
  playSfx(effect: string): void
  setVolume(volume: number): void
  dispose(): void
}
```

#### 4.1.3 RandomPort
```typescript
// 乱数生成のインターフェース
interface RandomPort {
  random(): number                    // 0-1 の乱数
  randomInt(min: number, max: number): number
  shuffle<T>(array: readonly T[]): T[]
}
```

### 4.2 Adapter 実装

#### 4.2.1 LocalStorageAdapter
```typescript
class LocalStorageAdapter implements StoragePort {
  get<T>(key: string): T | undefined {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : undefined
  }
  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value))
  }
  remove(key: string): void {
    localStorage.removeItem(key)
  }
  clear(): void {
    localStorage.clear()
  }
}
```

#### 4.2.2 InMemoryStorageAdapter（テスト用）
```typescript
class InMemoryStorageAdapter implements StoragePort {
  private store = new Map<string, string>()
  get<T>(key: string): T | undefined { ... }
  set<T>(key: string, value: T): void { ... }
  remove(key: string): void { ... }
  clear(): void { ... }
}
```

#### 4.2.3 Repository パターン

各リポジトリは StoragePort を注入して使用する。

```typescript
class GameResultRepository {
  constructor(private readonly storage: StoragePort) {}

  save(result: SavedGameResult): void {
    this.storage.set(STORAGE_KEYS.LAST_RESULT, result)
  }

  load(): SavedGameResult | undefined {
    const raw = this.storage.get<SavedGameResult>(STORAGE_KEYS.LAST_RESULT)
    return raw ? this.migrate(raw) : undefined
  }

  private migrate(raw: unknown): SavedGameResult {
    // マイグレーションロジック
  }
}
```

---

## 5. アプリケーション層仕様

### 5.1 ユースケース

各ユースケースは domain の純粋関数と infrastructure のリポジトリを組み合わせる。

#### 5.1.1 AnswerQuestionUseCase
```typescript
interface AnswerQuestionInput {
  readonly gameState: GameState
  readonly selectedOption: number
  readonly elapsed: number
}

interface AnswerQuestionOutput {
  readonly nextState: GameState
  readonly result: AnswerResult
  readonly debtDelta: number
  readonly unlockedAchievements: AchievementDefinition[]
}

function executeAnswerQuestion(
  input: AnswerQuestionInput,
  deps: { audioPort: AudioPort }
): AnswerQuestionOutput {
  // 1. 回答評価（domain）
  const result = evaluateAnswer(...)

  // 2. 負債計算（domain）
  const debtDelta = calculateDebtDelta(...)

  // 3. 状態更新（domain）
  const nextState = computeNextStats(...)

  // 4. 効果音再生（infrastructure）
  if (result.isCorrect) {
    deps.audioPort.playSfx('correct')
  } else {
    deps.audioPort.playSfx('incorrect')
  }

  // 5. 実績チェック（domain）
  const unlockedAchievements = checkAchievements(...)

  return { nextState, result, debtDelta, unlockedAchievements }
}
```

---

## 6. プレゼンテーション層仕様

### 6.1 Reducer パターン（useGame の再設計）

```typescript
// Action 定義
type GameAction =
  | { type: 'INIT'; config: GameConfig }
  | { type: 'START_SPRINT'; sprintNumber: number }
  | { type: 'ANSWER'; selectedOption: number; elapsed: number }
  | { type: 'ADVANCE_EVENT' }
  | { type: 'FINISH_SPRINT' }
  | { type: 'TRANSITION_PHASE'; phase: GamePhase }
  | { type: 'RESTORE_SAVE'; saveState: SaveState }

// Reducer 定義（純粋関数）
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT':
      return createInitialGameState(action.config)
    case 'ANSWER':
      return processAnswer(state, action.selectedOption, action.elapsed)
    // ...
  }
}

// フック定義
function useGame(deps: GameDependencies) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  const answer = useCallback((optionIndex: number) => {
    const elapsed = /* 計測 */
    dispatch({ type: 'ANSWER', selectedOption: optionIndex, elapsed })
    // 副作用はフック内で実行
  }, [deps])

  return { state, dispatch, answer, /* ... */ }
}
```

### 6.2 コンポーネント分割仕様

#### ResultScreen の分割
```
ResultScreen/
  ├─ ResultScreen.tsx      # レイアウト・フェーズ管理
  ├─ GradeDisplay.tsx      # グレード表示・アニメーション
  ├─ StatsPanel.tsx        # 統計パネル（正答率、平均時間等）
  └─ ResultActions.tsx     # アクションボタン（もう一度、勉強会等）
```

#### GuideScreen の分割
```
GuideScreen/
  ├─ GuideScreen.tsx       # レイアウト・ナビゲーション管理
  ├─ GuideSection.tsx      # 各セクション表示
  └─ GuideNavigation.tsx   # セクション間ナビゲーション
```

### 6.3 デザイントークン

```typescript
// design-tokens.ts
export const DESIGN_TOKENS = Object.freeze({
  colors: {
    primary: '#4a90d9',
    secondary: '#34c759',
    danger: '#ff3b30',
    warning: '#ff9500',
    background: '#1a1a2e',
    surface: '#16213e',
    text: '#e0e0e0',
    textMuted: '#888',
    // グレード別カラー
    gradeS: '#ffd700',
    gradeA: '#c0c0c0',
    gradeB: '#cd7f32',
    gradeC: '#4a90d9',
    gradeD: '#888',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '16px',
    round: '50%',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.25rem',
    xl: '1.5rem',
    xxl: '2rem',
  },
  transition: {
    fast: '150ms ease',
    normal: '300ms ease',
    slow: '500ms ease',
  },
})
```

---

## 7. テスト仕様

### 7.1 テスト戦略

```
テストピラミッド:
         ┌───┐
         │E2E│  ← 画面遷移・構造検証（Playwright）
        ┌┴───┴┐
        │統合  │  ← ユースケース + リポジトリ
       ┌┴─────┴┐
       │ユニット│  ← ドメイン純粋関数、コンポーネント
       └───────┘
```

### 7.2 ランダム要素のテスト戦略

AQS にはランダム要素（問題選択、イベント生成、緊急対応確率、キャラクターコメント等）が多数存在する。
テスト層ごとに以下の戦略で対処する。

#### 7.2.1 ランダム要素の分類と対処方針

| ランダム要素 | 影響範囲 | テスト戦略 | 担当層 |
|------------|---------|-----------|--------|
| **問題選択順序** | 毎回異なる問題が出題 | 「問題が表示される」構造を検証、内容は問わない | E2E |
| **選択肢シャッフル** | 選択肢の並び順が変動 | 「4つの選択肢がある」ことを検証、順序は問わない | E2E |
| **緊急対応イベント発生** | 確率でイベントが挿入/非挿入 | `Math.random` モックでユニットテスト、E2E では検証しない | ユニット |
| **緊急対応挿入位置** | イベント配列内の位置が変動 | `randomFn` 注入でユニットテスト | ユニット |
| **キャラクターコメント** | コメントプールからランダム選択 | 「コメントが表示される」ことだけ検証 | E2E |
| **パーティクルエフェクト** | 位置・サイズ・時間が変動 | UI 装飾のため検証不要 | - |
| **デイリークイズ** | 日付シード付き疑似乱数 | **完全再現可能** — 特定日付で内容検証可能 | ユニット + E2E |

#### 7.2.2 テスト層別の原則

**ユニットテスト（確定的に検証）:**
- ランダム依存関数には `randomFn: () => number` を注入可能にする（フェーズ 2 で対応）
- `jest.spyOn(Math, 'random')` でモックし、特定のシナリオを再現
- 確率的分岐（緊急対応の発生/非発生）は両パスをユニットテストでカバー
- コンボ計算、スコア計算、グレード分類は純粋関数として完全検証

**E2E テスト（構造と遷移を検証）:**
- **ランダムな「内容」ではなく「構造」を検証する**
- 「何かの問題が表示され、選択肢が存在する」ことを検証
- 「回答後にフィードバックが表示される」ことを検証
- 「最終的に結果画面に到達し、グレードが表示される」ことを検証
- 確率的イベント（緊急対応）は E2E の検証対象外とする
- primal-path の E2E 実装パターン（複数パス許容、test.skip、自動中間画面処理）を参考にする

### 7.3 ドメインテスト仕様

**テスト配置**: `domain/<module>/__tests__/`

```typescript
describe('evaluateAnswer', () => {
  describe('正常系', () => {
    it('正解の場合、isCorrect が true でコンボが継続する', () => {
      // Arrange
      const input: AnswerInput = {
        question: createQuestion({ answer: 1 }),
        selectedOption: 1,
        elapsed: 5,
        combo: 2,
      }

      // Act
      const result = evaluateAnswer(input)

      // Assert
      expect(result.isCorrect).toBe(true)
      expect(result.combo).toBe(3)
    })

    it('不正解の場合、isCorrect が false でコンボがリセットされる', () => { ... })
  })

  describe('境界値', () => {
    it('制限時間ギリギリの回答でもタイムボーナスが付く', () => { ... })
    it('制限時間を超えた回答ではタイムボーナスが 0 になる', () => { ... })
  })
})
```

**ランダム依存関数のテスト例:**
```typescript
describe('createEvents', () => {
  it('緊急対応が発生する場合のイベント配列を検証する', () => {
    // Arrange: 乱数を固定して緊急対応が必ず発生するようにする
    const alwaysTrigger = () => 0.0  // 確率判定を必ず通過

    // Act
    const events = createEvents(2, 5, alwaysTrigger)

    // Assert
    expect(events.some(e => e.id === 'emergency')).toBe(true)
  })

  it('緊急対応が発生しない場合のイベント配列を検証する', () => {
    // Arrange: 乱数を固定して緊急対応が発生しないようにする
    const neverTrigger = () => 0.99

    // Act
    const events = createEvents(2, 5, neverTrigger)

    // Assert
    expect(events.some(e => e.id === 'emergency')).toBe(false)
  })
})

describe('pickQuestion', () => {
  it('乱数を固定した場合、特定の問題が選択される', () => {
    // Arrange
    const questions = [createQuestion({ id: 0 }), createQuestion({ id: 1 }), createQuestion({ id: 2 })]
    const fixedRandom = () => 0.5

    // Act
    const { index } = pickQuestion(questions, [], fixedRandom)

    // Assert: 乱数固定なので再現可能な結果
    expect(index).toBeDefined()
    expect(index).toBeGreaterThanOrEqual(0)
    expect(index).toBeLessThan(questions.length)
  })
})
```

### 7.4 インフラテスト仕様

**テスト配置**: `infrastructure/<module>/__tests__/`

```typescript
describe('GameResultRepository', () => {
  let storage: InMemoryStorageAdapter
  let repository: GameResultRepository

  beforeEach(() => {
    storage = new InMemoryStorageAdapter()
    repository = new GameResultRepository(storage)
  })

  it('結果を保存して読み込める', () => { ... })
  it('旧形式のデータをマイグレーションできる', () => { ... })
  it('データが存在しない場合は undefined を返す', () => { ... })
})
```

### 7.5 E2E テスト仕様

**テスト配置**: `e2e/agile-quiz-sugoroku/`

#### 設計原則: ランダム耐性のある E2E テスト

E2E テストは以下の原則に従い、ランダム要素に左右されない安定したテストを構築する。

1. **構造検証**: 「何かの問題が表示される」「選択肢が存在する」等の構造を検証し、具体的な内容は問わない
2. **遷移検証**: 画面遷移が正しく行われることを検証する（タイトル → ゲーム → 結果）
3. **存在検証**: UI 要素が表示されることを検証する（グレード、統計パネル等）
4. **確率的要素の除外**: 緊急対応イベント等の確率的要素は E2E の検証対象外とする
5. **中間画面の自動処理**: ランダムに出現する画面（ストーリー、演出等）はヘルパーで自動スキップする

#### Page Object: AqsHelper

```typescript
class AqsHelper {
  constructor(private page: Page) {}

  /** ゲーム画面に遷移し、注意事項ダイアログを自動処理する */
  async navigateToGame(): Promise<void>

  /** ゲームを開始する（難易度・スプリント数は指定可能） */
  async startGame(options?: { difficulty?: string; sprints?: number }): Promise<void>

  /**
   * 表示されている選択肢のうち任意の1つをクリックする。
   * 選択肢の順序はランダムなので、インデックスではなく
   * 「表示されている選択肢ボタンの N 番目」をクリックする。
   */
  async answerAnyOption(): Promise<void>

  /**
   * クイズ画面が表示されるまで待機する。
   * 中間画面（スプリント開始演出等）は自動でスキップする。
   */
  async waitForQuizScreen(): Promise<void>

  /**
   * 現在のフェーズを取得する。
   * ランダムな中間画面に対応するため、複数のフェーズマーカーを監視する。
   */
  async getCurrentPhase(): Promise<string>

  /**
   * 中間画面を自動処理しながら目的のフェーズまで進行する。
   * primal-path の advanceToPhase パターンを採用。
   */
  async advanceToPhase(target: string, maxIterations?: number): Promise<void>

  /** 結果画面が表示されるまで待機する */
  async waitForResult(): Promise<void>

  /** 結果画面からグレード（S/A/B/C/D）を取得する */
  async getGrade(): Promise<string>

  /** 勉強会モード画面に遷移する */
  async goToStudyMode(): Promise<void>

  /** 履歴画面に遷移する */
  async goToHistory(): Promise<void>

  /** 実績画面に遷移する */
  async goToAchievements(): Promise<void>
}
```

#### テストケース

**基本フロー（basic-flow.spec.ts）— 構造と遷移の検証**
```typescript
test('タイトルからゲーム完了までの基本フロー', async ({ page }) => {
  const aqs = new AqsHelper(page)
  await aqs.navigateToGame()

  // 構造検証: タイトル画面の要素が存在する
  await expect(page.getByText('アジャイルクイズすごろく')).toBeVisible()

  // 遷移検証: ゲームを開始できる
  await aqs.startGame()

  // 構造検証: スプリント中にクイズ画面が表示される
  // （問題の具体的な内容は検証しない — ランダムなため）
  await aqs.waitForQuizScreen()
  // 存在検証: 選択肢が表示される（順序は問わない）
  const options = page.locator('[data-testid="quiz-option"]')
  await expect(options).toHaveCount(4)

  // 遷移検証: 回答すると次に進む
  await aqs.answerAnyOption()
  // フィードバック（正解/不正解）が表示されることを検証
  // （どちらになるかはランダムな問題と選択に依存するため、いずれかの表示を許容）
  await expect(
    page.getByText('正解').or(page.getByText('不正解'))
  ).toBeVisible()
})

test('全スプリント完了後に結果画面が表示される', async ({ page }) => {
  const aqs = new AqsHelper(page)
  await aqs.navigateToGame()
  await aqs.startGame()

  // 中間画面を自動処理しながらゲームを最後まで進行する
  await aqs.advanceToPhase('result', 100)

  // 存在検証: グレードが表示される（具体的なグレードは問わない）
  const grade = await aqs.getGrade()
  expect(['S', 'A', 'B', 'C', 'D']).toContain(grade)
})
```

**勉強会モード（study-mode.spec.ts）**
```typescript
test('勉強会モードで問題に回答し、結果が表示される', async ({ page }) => {
  const aqs = new AqsHelper(page)
  await aqs.navigateToGame()
  await aqs.goToStudyMode()

  // 構造検証: ジャンル選択画面が表示される
  // 遷移検証: ジャンルを選択して勉強会を開始できる
  // 構造検証: 問題が表示される（具体的な内容は問わない）
  // 遷移検証: 回答後に結果画面に到達する
})
```

**セーブ/ロード（save-load.spec.ts）**
```typescript
test('ゲーム途中でページリロードしても状態が復元される', async ({ page }) => {
  const aqs = new AqsHelper(page)
  await aqs.navigateToGame()
  await aqs.startGame()

  // いくつかのクイズに回答した後
  await aqs.waitForQuizScreen()
  await aqs.answerAnyOption()

  // リロード
  await page.reload()

  // 遷移検証: セーブデータから復元される
  // （具体的なスプリント番号や問題は問わない）
})
```

**デイリークイズ（daily-quiz.spec.ts）— シード付きなので安定テスト可能**
```typescript
test('デイリークイズが表示され、回答できる', async ({ page }) => {
  // デイリークイズは日付シード付き乱数のため、同日なら同一問題セット
  const aqs = new AqsHelper(page)
  await aqs.navigateToGame()

  // 構造検証: デイリークイズ画面に遷移できる
  // 存在検証: 問題と選択肢が表示される
  // 遷移検証: 回答後にスコアが表示される
})
```

#### E2E テストで検証しないもの（ユニットテストで担保）

以下はランダム要素に強く依存するため、E2E テストの対象外とし、ユニットテストで検証する：

- 特定の問題が出題されること
- 緊急対応イベントの発生/非発生
- 緊急対応イベントの挿入位置
- 特定のキャラクターコメントの内容
- 特定のコンボ数やスコアの値

### 7.6 カバレッジ目標

| 対象 | 目標 |
|------|------|
| `domain/` | branches: 70%, functions: 85%, lines: 85%, statements: 85% |
| `infrastructure/` | functions: 80%, lines: 80% |
| `application/` | functions: 80%, lines: 80% |
| 全体 | branches: 35%, functions: 45%, lines: 50%, statements: 50%（既存維持） |

---

## 8. マイグレーション仕様

### 8.1 後方互換の維持

リファクタリング中、既存のインポートパスを壊さないよう、再エクスポートファイルを維持する。

```typescript
// 旧 types.ts（後方互換用）
export * from './domain/types'
```

```typescript
// 旧 game-logic.ts（後方互換用）
export { pickQuestion } from './domain/quiz/question-picker'
export { makeEvents } from './domain/game/event-generator'
export { createSprintSummary } from './domain/game/sprint'
```

### 8.2 段階的削除

フェーズ 10（最終検証）で、後方互換用の再エクスポートファイルを削除し、直接インポートに置き換える。

### 8.3 localStorage キーの維持

既存の localStorage キーは変更しない（ユーザーデータの互換性維持）：
- `aqs_save_state`
- `aqs_last_result`
- `aqs_history`
- `aqs_achievements`
- `aqs_challenge_highscore`
- `aqs_daily_quiz`

---

## 9. 非機能要件

### 9.1 パフォーマンス
- Reducer 化により不要な再レンダリングを削減
- `useMemo` / `useCallback` の適切な使用
- 遅延ロード（lazy import）の維持

### 9.2 アクセシビリティ
- 既存のアクセシビリティレベルを維持（劣化させない）
- E2E テストで `getByRole` を優先使用

### 9.3 ビルドサイズ
- リファクタリングによるバンドルサイズの増加を最小限に
- 不要な抽象化による overhead を避ける
