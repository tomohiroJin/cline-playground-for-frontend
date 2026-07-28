# 灰燼の城壁 反復0「ベースライン計測」実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 行動ログ基盤（play-log）と戦闘の早送り/スキップを追加し、現状のゲームを3ラン計測してベースライン数値と判定閾値を確定できる状態にする。ゲーム体験の変更はこの2点のみ。

**Architecture:** feature 内 Clean Architecture で完結。`application/ports/play-log-port.ts` にポート、`infrastructure/play-log/` に localStorage 実装、記録呼び出しは `useAshenRampartGame` フックから。シミュレーション純粋関数 `simulateWave` には一切手を入れない（決定性は不変条件）。早送りは tick 再生間隔の変更のみ。

**Tech Stack:** React 19 + TypeScript + styled-components / Jest 30 + @testing-library/react

**Spec:** `docs/superpowers/specs/2026-07-28-ashen-rampart-e2e-brushup-design.md`（節1・節3・節4の反復0）／Epic #188

## Global Constraints

- コメント・テスト記述は日本語。`any` 禁止（`unknown`+型ガード）。named export のみ。ファイル名 kebab-case
- `domain/` への変更禁止（反復0はドメイン変更ゼロ）。他 feature への参照禁止
- **`git add` はパス明示**（`git add -A` / `git add .` 禁止。リポジトリ直下に未追跡スクラッチが常駐しているため）
- コミットメッセージは日本語 Conventional Commits。末尾に `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- ブランチ: `feature/ashen-rampart-e2e-0`（main から作成。PR #187 マージ後の main を起点にする）
- テストは対象と同じディレクトリに `*.test.ts(x)`。既存テストパターン（`src/infrastructure/storage/local-storage-adapter.test.ts` のフォールバック検証、`useAshenRampartGame.test.ts` のフックテスト）に倣う
- ログはプレイ行動のみを記録する。機密情報は扱わない（localStorage 利用はゲーム記録用途で規約準拠）
- 実行前に `git checkout main && git pull --ff-only && git checkout -b feature/ashen-rampart-e2e-0`

---

### Task 1: PlayLogPort 型定義と LocalStoragePlayLog アダプタ

**Files:**
- Create: `src/features/ashen-rampart/application/ports/play-log-port.ts`
- Create: `src/features/ashen-rampart/infrastructure/play-log/local-storage-play-log.ts`
- Test: `src/features/ashen-rampart/infrastructure/play-log/local-storage-play-log.test.ts`

**Interfaces:**
- Consumes: なし（新規）
- Produces: `PlayLogPort`（`record(event: PlayLogEventBody): void` / `exportAll(): PlayLogExport`）、`PlayLogEventBody`（判別共用体）、`BattleSpeed = 1 | 2 | 4`、`createRunId(): string`、`LocalStoragePlayLog`（クラス、引数なしコンストラクタ）。後続タスクはこの名前をそのまま import する

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/infrastructure/play-log/local-storage-play-log.test.ts
/**
 * 行動ログ localStorage アダプタのテスト
 *
 * 追記・エクスポート・破損データのフォールバック・書き込み失敗の握り潰しを検証する。
 */
import { LocalStoragePlayLog, PLAY_LOG_STORAGE_KEY } from './local-storage-play-log';
import type { PlayLogEventBody } from '../../application/ports/play-log-port';

const runStarted: PlayLogEventBody = { kind: 'run_started', runId: 'r1', iteration: 0 };

describe('LocalStoragePlayLog', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it('record した イベントが exportAll で at 付きで取り出せる', () => {
    const log = new LocalStoragePlayLog();
    log.record(runStarted);
    const exported = log.exportAll();
    expect(exported.version).toBe(1);
    expect(exported.events).toHaveLength(1);
    expect(exported.events[0]).toMatchObject(runStarted);
    expect(typeof exported.events[0].at).toBe('number');
  });

  it('record は localStorage に永続化する（別インスタンスから読める）', () => {
    new LocalStoragePlayLog().record(runStarted);
    const exported = new LocalStoragePlayLog().exportAll();
    expect(exported.events).toHaveLength(1);
  });

  it('複数イベントは記録順に追記される', () => {
    const log = new LocalStoragePlayLog();
    log.record(runStarted);
    log.record({ kind: 'battle_speed', runId: 'r1', wave: 0, speed: 2 });
    expect(log.exportAll().events.map((e) => e.kind)).toEqual(['run_started', 'battle_speed']);
  });

  it('破損データが保存されている場合は空ログにフォールバックする', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    localStorage.setItem(PLAY_LOG_STORAGE_KEY, 'broken-json');
    expect(new LocalStoragePlayLog().exportAll()).toEqual({ version: 1, events: [] });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('書き込みに失敗してもエラーを投げない', () => {
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('quota exceeded');
    });
    expect(() => new LocalStoragePlayLog().record(runStarted)).not.toThrow();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/infrastructure/play-log --no-coverage`
Expected: FAIL（モジュール未定義）

- [ ] **Step 3: ポート型を実装**

```ts
// src/features/ashen-rampart/application/ports/play-log-port.ts
/**
 * 灰燼の城壁 - 行動ログポート
 *
 * 一人プレイテストのバイアス対策として、プレイ行動を機械記録するための
 * インターフェース。Epic #188 の事前登録判定項目（配置行動・非スキップ率）の
 * データ源になる。記録スキーマは v1（反復0〜3 で固定。変更時は版数を上げる）。
 */

/** 戦闘リプレイの再生速度（1x/2x/4x） */
export type BattleSpeed = 1 | 2 | 4;

/** 準備フェーズの操作種別（現状のゲームに撤去操作は存在しない） */
export type PrepActionKind = 'place-tower' | 'place-trap' | 'use-spell' | 'use-tactic';

/** 記録イベント本体（at はアダプタが記録時に付与する） */
export type PlayLogEventBody =
  | { kind: 'run_started'; runId: string; iteration: number }
  | {
      kind: 'prep_action';
      runId: string;
      wave: number;
      action: PrepActionKind;
      /** カードID（配置はセル座標付き。例: "arrow-tower@2,3"） */
      target: string;
      /** 準備フェーズ開始からの経過秒 */
      elapsedSec: number;
    }
  | { kind: 'wave_started'; runId: string; wave: number; towerCount: number }
  | { kind: 'battle_speed'; runId: string; wave: number; speed: BattleSpeed | 'skip' }
  | {
      kind: 'wave_ended';
      runId: string;
      wave: number;
      /** 実際に観戦していた実時間（秒）。早送り・スキップで短くなる */
      durationSec: number;
      leaks: number;
      lifeDelta: number;
    }
  | { kind: 'run_ended'; runId: string; outcome: 'won' | 'lost'; totalSec: number }
  | { kind: 'run_note'; runId: string; text: string };

/** 保存されるイベント（記録時刻付き） */
export type PlayLogEvent = PlayLogEventBody & { at: number };

export interface PlayLogExport {
  version: number;
  events: PlayLogEvent[];
}

export interface PlayLogPort {
  record(event: PlayLogEventBody): void;
  exportAll(): PlayLogExport;
}

/** ラン識別子を生成する（決定性は不要。ドメイン乱数とは無関係） */
export const createRunId = (): string =>
  `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
```

- [ ] **Step 4: アダプタを実装**

```ts
// src/features/ashen-rampart/infrastructure/play-log/local-storage-play-log.ts
/**
 * 灰燼の城壁 - 行動ログの localStorage 実装
 *
 * ラン横断でイベントを追記保存する。読み込み失敗時は空ログに
 * フォールバックし、書き込み失敗はゲーム進行を止めない（記録より進行優先）。
 */
import type {
  PlayLogEventBody,
  PlayLogExport,
  PlayLogPort,
} from '../../application/ports/play-log-port';

export const PLAY_LOG_STORAGE_KEY = 'ashen-rampart:play-log';

const SCHEMA_VERSION = 1;

const emptyExport = (): PlayLogExport => ({ version: SCHEMA_VERSION, events: [] });

const isPlayLogExport = (value: unknown): value is PlayLogExport =>
  typeof value === 'object' &&
  value !== null &&
  'version' in value &&
  'events' in value &&
  Array.isArray((value as { events: unknown }).events);

export class LocalStoragePlayLog implements PlayLogPort {
  record(event: PlayLogEventBody): void {
    const current = this.exportAll();
    current.events.push({ ...event, at: Date.now() });
    try {
      localStorage.setItem(PLAY_LOG_STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.error('行動ログの保存に失敗しました', e);
    }
  }

  exportAll(): PlayLogExport {
    try {
      const raw = localStorage.getItem(PLAY_LOG_STORAGE_KEY);
      if (raw === null) return emptyExport();
      const parsed: unknown = JSON.parse(raw);
      return isPlayLogExport(parsed) ? parsed : emptyExport();
    } catch (e) {
      console.error('行動ログの読み込みに失敗しました', e);
      return emptyExport();
    }
  }
}
```

- [ ] **Step 5: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/infrastructure/play-log --no-coverage`
Expected: PASS（5件）

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/application/ports/play-log-port.ts src/features/ashen-rampart/infrastructure/play-log/local-storage-play-log.ts src/features/ashen-rampart/infrastructure/play-log/local-storage-play-log.test.ts
git commit -m "feat(ashen-rampart): 行動ログのポートと localStorage アダプタを追加

- Epic #188 反復0: 一人プレイテストのバイアス対策の計測基盤
- スキーマ v1（run/prep_action/wave/battle_speed/run_note）
- 破損データは空ログへフォールバック、書き込み失敗は進行を止めない

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: フックへのログ注入とライフサイクル記録（run/wave）

**Files:**
- Modify: `src/features/ashen-rampart/presentation/useAshenRampartGame.ts`
- Test: `src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts`（既存に追記）

**Interfaces:**
- Consumes: Task 1 の `PlayLogPort` / `PlayLogEventBody` / `createRunId` / `LocalStoragePlayLog`
- Produces: フック第2引数 `playLog?: PlayLogPort`（省略時 `LocalStoragePlayLog`）。記録: `run_started`（ラン開始・restart 時）/ `wave_started`（combat 突入時）/ `wave_ended`（リプレイ完走時）/ `run_ended`（result 突入時）。後続タスクはこの注入経路を使う

**実装方針（コード全体像）:** 既存フックに以下を加える。`dispatch` の不変条件（1ハンドラ1回）は変えない。記録はすべて try 不要（アダプタ側が握り潰す）。

- [ ] **Step 1: 失敗するテストを書く（既存テストファイルに describe を追記）**

```ts
// useAshenRampartGame.test.ts に追記
import type { PlayLogEventBody, PlayLogPort } from '../application/ports/play-log-port';

/** 記録イベントを配列に貯めるだけのモックポート */
const createMockPlayLog = (): PlayLogPort & { events: PlayLogEventBody[] } => {
  const events: PlayLogEventBody[] = [];
  return {
    events,
    record: (e) => {
      events.push(e);
    },
    exportAll: () => ({ version: 1, events: events.map((e) => ({ ...e, at: 0 })) }),
  };
};

describe('行動ログ記録', () => {
  it('マウント時に run_started が1回だけ記録される', () => {
    const log = createMockPlayLog();
    renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    expect(log.events.filter((e) => e.kind === 'run_started')).toHaveLength(1);
  });

  it('ウェーブ開始で wave_started が記録される', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    act(() => result.current.beginWave());
    const started = log.events.filter((e) => e.kind === 'wave_started');
    expect(started).toHaveLength(1);
    expect(started[0]).toMatchObject({ wave: 0 });
  });

  it('リプレイ完走で wave_ended が記録される', () => {
    jest.useFakeTimers();
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    act(() => result.current.beginWave());
    // リプレイを完走させる（tick 数 × 間隔ぶん進める）
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * (MAX_TICKS + 1));
    });
    expect(log.events.filter((e) => e.kind === 'wave_ended')).toHaveLength(1);
    jest.useRealTimers();
  });

  it('restart で新しい runId の run_started が記録される', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    act(() => result.current.restart());
    const started = log.events.filter(
      (e): e is Extract<PlayLogEventBody, { kind: 'run_started' }> => e.kind === 'run_started'
    );
    expect(started).toHaveLength(2);
    expect(started[0].runId).not.toBe(started[1].runId);
  });
});
```

既存テストの import 群に `MAX_TICKS`（`../domain/combat/simulate-wave`）を追加する。既存の renderHook/act/SeededRandom の import 方法はファイル先頭の既存記述に合わせる。

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/presentation/useAshenRampartGame --no-coverage`
Expected: FAIL（第2引数未対応・イベント未記録）

- [ ] **Step 3: フックを実装**

`useAshenRampartGame.ts` への変更（差分の全体像）:

```ts
// import に追加
import type { PlayLogPort, PlayLogEventBody } from '../application/ports/play-log-port';
import { createRunId } from '../application/ports/play-log-port';
import { LocalStoragePlayLog } from '../infrastructure/play-log/local-storage-play-log';
import type { RunPhase } from '../domain/run/run-state';

export const useAshenRampartGame = (rng?: RandomPort, playLog?: PlayLogPort) => {
  const rngRef = useRef<RandomPort>(rng ?? new DefaultRandom());
  const playLogRef = useRef<PlayLogPort>(playLog ?? new LocalStoragePlayLog());
  const [runId, setRunId] = useState<string>(() => createRunId());
  const runStartedAtRef = useRef<number>(Date.now());
  const prepStartedAtRef = useRef<number>(Date.now());
  const battleStartedAtRef = useRef<number>(0);
  /** StrictMode のマウント2重実行で run_started が重複しないためのガード */
  const loggedRunIdsRef = useRef<Set<string>>(new Set());
  // ...既存 state はそのまま...

  const record = useCallback((event: PlayLogEventBody) => {
    playLogRef.current.record(event);
  }, []);

  // ラン開始の記録（runId が変わるたびに1回だけ）
  useEffect(() => {
    if (loggedRunIdsRef.current.has(runId)) return;
    loggedRunIdsRef.current.add(runId);
    record({ kind: 'run_started', runId, iteration: 0 });
  }, [runId, record]);

  // フェーズ遷移の記録（準備開始時刻の更新・wave_started・run_ended）
  const prevPhaseRef = useRef<RunPhase>('preparation');
  useEffect(() => {
    const prev = prevPhaseRef.current;
    if (prev === run.phase) return;
    prevPhaseRef.current = run.phase;
    if (run.phase === 'preparation') prepStartedAtRef.current = Date.now();
    if (run.phase === 'combat') {
      battleStartedAtRef.current = Date.now();
      record({
        kind: 'wave_started',
        runId,
        wave: run.waveIndex,
        towerCount: run.board.towers.length,
      });
    }
    if (run.phase === 'result') {
      record({
        kind: 'run_ended',
        runId,
        outcome: run.status === 'won' ? 'won' : 'lost',
        totalSec: (Date.now() - runStartedAtRef.current) / 1000,
      });
    }
  }, [run.phase, run.waveIndex, run.board.towers.length, run.status, runId, record]);
```

リプレイ完走エフェクト（既存）に `wave_ended` 記録を差し込む:

```ts
  useEffect(() => {
    if (run.phase !== 'combat' || !run.lastResult) return;
    if (replayTick >= run.lastResult.ticks.length) {
      record({
        kind: 'wave_ended',
        runId,
        wave: run.waveIndex,
        durationSec: (Date.now() - battleStartedAtRef.current) / 1000,
        leaks: run.lastResult.leaked,
        lifeDelta: -run.lastResult.leaked,
      });
      dispatch((s) => finishWave(s, rngRef.current));
      setReplayTick(0);
    }
  }, [replayTick, run.phase, run.lastResult, run.waveIndex, runId, dispatch, record]);
```

`restart` に runId 再生成と開始時刻リセットを追加:

```ts
  const restart = useCallback(() => {
    setSelectedHandIndex(null);
    setReplayTick(0);
    setError(null);
    setRun(startRun(rngRef.current));
    runStartedAtRef.current = Date.now();
    prepStartedAtRef.current = Date.now();
    setRunId(createRunId());
  }, []);
```

戻り値に `runId` と `exportLogJson` を追加（Task 6 で使用）:

```ts
  const exportLogJson = useCallback(
    () => JSON.stringify(playLogRef.current.exportAll(), null, 2),
    []
  );

  return {
    run,
    // ...既存...
    runId,
    exportLogJson,
  };
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/presentation/useAshenRampartGame --no-coverage`
Expected: PASS（既存テスト含む全件）

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/presentation/useAshenRampartGame.ts src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts
git commit -m "feat(ashen-rampart): フックにラン/ウェーブのライフサイクル記録を追加

- run_started/wave_started/wave_ended/run_ended を行動ログへ記録
- wave_ended の durationSec は実観戦時間（早送り検証の土台）
- StrictMode の二重マウントでも run_started は1回

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: 準備フェーズ操作の記録（prep_action）

**Files:**
- Modify: `src/features/ashen-rampart/presentation/useAshenRampartGame.ts`
- Test: `src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts`（追記）

**Interfaces:**
- Consumes: Task 2 の `record` / `prepStartedAtRef` / `runId`
- Produces: `prep_action` イベント（スペル/戦術の即時使用と塔/罠の配置。**成功・失敗を問わず試行を記録**＝失敗した操作も行動データとして意味を持つ）

- [ ] **Step 1: 失敗するテストを書く（describe「行動ログ記録」に追記）**

```ts
  it('塔カードの配置で prep_action が記録される', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    // 手札から塔カードを探して選択→設置スロットに配置
    const towerIndex = result.current.run.deck.hand.findIndex(
      (id) => getCardDefinition(id).type === 'tower'
    );
    expect(towerIndex).toBeGreaterThanOrEqual(0);
    const slot = result.current.run.board.map.buildSlots[0];
    act(() => result.current.selectCard(towerIndex));
    act(() => result.current.placeAt(slot));
    const actions = log.events.filter(
      (e): e is Extract<PlayLogEventBody, { kind: 'prep_action' }> => e.kind === 'prep_action'
    );
    expect(actions).toHaveLength(1);
    expect(actions[0].action).toBe('place-tower');
    expect(actions[0].target).toContain('@');
    expect(actions[0].wave).toBe(0);
  });

  it('スペルカードの即時使用で prep_action が記録される', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    const spellIndex = result.current.run.deck.hand.findIndex((id) => {
      const t = getCardDefinition(id).type;
      return t === 'spell' || t === 'tactic';
    });
    // 初期手札にスペル/戦術が無いシードならこのテストは前提不成立で失敗させず skip
    if (spellIndex < 0) return;
    act(() => result.current.selectCard(spellIndex));
    expect(log.events.some((e) => e.kind === 'prep_action')).toBe(true);
  });
```

`getCardDefinition` は `../domain/cards/card-pool` から import（既存 import に追記）。`board.map.buildSlots` のプロパティ名は `domain/board/board-state.ts` を実装時に確認し、実際の名前に合わせる（`BoardState` が map を持たない場合は `stage-map` の定義から取得する）。

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/presentation/useAshenRampartGame --no-coverage`
Expected: FAIL（prep_action 未記録）

- [ ] **Step 3: フックに記録を実装**

```ts
// selectCard の即時使用分岐に追記
      if (card.type === 'spell' || card.type === 'tactic') {
        record({
          kind: 'prep_action',
          runId,
          wave: run.waveIndex,
          action: card.type === 'spell' ? 'use-spell' : 'use-tactic',
          target: cardId,
          elapsedSec: (Date.now() - prepStartedAtRef.current) / 1000,
        });
        dispatch((s) => playCard(s, handIndex));
        setSelectedHandIndex(null);
        return;
      }
```

```ts
// placeAt に追記
  const placeAt = useCallback(
    (pos: CellPos) => {
      if (selectedHandIndex === null) return;
      const cardId = run.deck.hand[selectedHandIndex];
      if (cardId !== undefined) {
        const type = getCardDefinition(cardId).type;
        record({
          kind: 'prep_action',
          runId,
          wave: run.waveIndex,
          action: type === 'trap' ? 'place-trap' : 'place-tower',
          target: `${cardId}@${pos.x},${pos.y}`,
          elapsedSec: (Date.now() - prepStartedAtRef.current) / 1000,
        });
      }
      dispatch((s) => playCard(s, selectedHandIndex, pos));
      setSelectedHandIndex(null);
    },
    [selectedHandIndex, run.deck.hand, run.waveIndex, runId, dispatch, record]
  );
```

useCallback の依存配列は上記のとおり更新する（`selectCard` 側も `runId` / `run.waveIndex` / `record` を追加）。

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/presentation/useAshenRampartGame --no-coverage`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/presentation/useAshenRampartGame.ts src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts
git commit -m "feat(ashen-rampart): 準備フェーズの操作を prep_action として記録

- 塔/罠の配置とスペル/戦術の即時使用を対象（試行も記録）
- 準備フェーズ開始からの経過秒を付与（判定項目1のデータ源）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: 再生速度（1x/2x/4x）とスキップ

**Files:**
- Modify: `src/features/ashen-rampart/presentation/useAshenRampartGame.ts`
- Test: `src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts`（追記）

**Interfaces:**
- Consumes: Task 2 の `record` / `runId`。`TICK_INTERVAL_MS`（既存定数、変更しない）
- Produces: 戻り値に `speed: BattleSpeed` / `changeSpeed(next: BattleSpeed): void` / `skipBattle(): void`。速度はウェーブをまたいで維持（sticky）。`battle_speed` イベント記録

- [ ] **Step 1: 失敗するテストを書く**

```ts
describe('再生速度とスキップ', () => {
  it('changeSpeed で速度が変わり battle_speed が記録される', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    act(() => result.current.beginWave());
    act(() => result.current.changeSpeed(4));
    expect(result.current.speed).toBe(4);
    expect(log.events.filter((e) => e.kind === 'battle_speed')).toHaveLength(1);
  });

  it('4x は 1x の 1/4 の時間でリプレイが進む', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1)));
    act(() => result.current.beginWave());
    act(() => result.current.changeSpeed(4));
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS); // 1x の1tick分の時間
    });
    expect(result.current.replayTick).toBe(4);
    jest.useRealTimers();
  });

  it('skipBattle でリプレイが即完走しウェーブが終了する', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    act(() => result.current.beginWave());
    act(() => result.current.skipBattle());
    // combat フェーズを抜けている（reward または result）
    expect(result.current.run.phase).not.toBe('combat');
    expect(
      log.events.filter((e) => e.kind === 'battle_speed' && e.speed === 'skip')
    ).toHaveLength(1);
    expect(log.events.filter((e) => e.kind === 'wave_ended')).toHaveLength(1);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/presentation/useAshenRampartGame --no-coverage`
Expected: FAIL（changeSpeed 未定義）

- [ ] **Step 3: フックに実装**

```ts
  const [speed, setSpeed] = useState<BattleSpeed>(1);

  const changeSpeed = useCallback(
    (next: BattleSpeed) => {
      setSpeed(next);
      record({ kind: 'battle_speed', runId, wave: run.waveIndex, speed: next });
    },
    [runId, run.waveIndex, record]
  );

  const skipBattle = useCallback(() => {
    if (run.phase !== 'combat' || !run.lastResult) return;
    record({ kind: 'battle_speed', runId, wave: run.waveIndex, speed: 'skip' });
    // 末尾 tick へ飛ばすと完走エフェクトが wave_ended → finishWave を実行する
    setReplayTick(run.lastResult.ticks.length);
  }, [run.phase, run.lastResult, run.waveIndex, runId, record]);
```

リプレイ進行の interval を速度対応にする（既存エフェクトの変更）:

```ts
  useEffect(() => {
    if (run.phase !== 'combat' || !run.lastResult) return undefined;
    const timer = setInterval(() => {
      setReplayTick((t) => t + 1);
    }, TICK_INTERVAL_MS / speed);
    return () => clearInterval(timer);
  }, [run.phase, run.lastResult, speed]);
```

`BattleSpeed` は `../application/ports/play-log-port` から import。戻り値に `speed` / `changeSpeed` / `skipBattle` を追加。

注: 4x テストの期待値 4 は「間隔 25ms × 100ms 経過 = 4回発火」による。fake timers の挙動で 1 差が出る場合は `toBeGreaterThanOrEqual(3)` に緩めず、advance 時間を `TICK_INTERVAL_MS * 2` にして 8 を期待する形で厳密に保つ。

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/presentation/useAshenRampartGame --no-coverage`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/presentation/useAshenRampartGame.ts src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts
git commit -m "feat(ashen-rampart): 戦闘リプレイの再生速度とスキップを追加

- 1x/2x/4x は tick 再生間隔の変更のみ（ドメイン変更なし・決定性不変）
- スキップは末尾 tick へのジャンプで既存の完走処理に合流
- battle_speed イベントを記録（判定項目2=非スキップ率の計測装置）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: 戦闘コントロール UI（BattleControls）

**Files:**
- Create: `src/features/ashen-rampart/presentation/BattleControls.tsx`
- Modify: `src/features/ashen-rampart/presentation/AshenRampartGame.tsx`
- Test: `src/features/ashen-rampart/presentation/BattleControls.test.tsx`

**Interfaces:**
- Consumes: Task 4 の `speed` / `changeSpeed` / `skipBattle`、`BattleSpeed` 型
- Produces: `BattleControls`（props: `{ speed: BattleSpeed; onChangeSpeed: (s: BattleSpeed) => void; onSkip: () => void }`）。combat フェーズ中のみ表示

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/features/ashen-rampart/presentation/BattleControls.test.tsx
/**
 * 戦闘コントロールのテスト
 *
 * 速度ボタンの押下・選択中表示・スキップ呼び出しを DOM レベルで検証する。
 * 「情報が存在する」ではなく「レンダリングされ操作できる」ことを確認する（S1 の教訓）。
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BattleControls } from './BattleControls';

describe('BattleControls', () => {
  it('速度ボタン 1x/2x/4x とスキップが表示される', () => {
    render(<BattleControls speed={1} onChangeSpeed={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByRole('button', { name: '等速' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2倍速' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4倍速' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'スキップ' })).toBeInTheDocument();
  });

  it('現在速度のボタンが aria-pressed=true になる', () => {
    render(<BattleControls speed={2} onChangeSpeed={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByRole('button', { name: '2倍速' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: '等速' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('速度ボタン押下で onChangeSpeed が呼ばれる', () => {
    const onChangeSpeed = jest.fn();
    render(<BattleControls speed={1} onChangeSpeed={onChangeSpeed} onSkip={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '4倍速' }));
    expect(onChangeSpeed).toHaveBeenCalledWith(4);
  });

  it('スキップ押下で onSkip が呼ばれる', () => {
    const onSkip = jest.fn();
    render(<BattleControls speed={1} onChangeSpeed={jest.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', { name: 'スキップ' }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/presentation/BattleControls --no-coverage`
Expected: FAIL（モジュール未定義）

- [ ] **Step 3: コンポーネントを実装**

```tsx
// src/features/ashen-rampart/presentation/BattleControls.tsx
/**
 * 灰燼の城壁 - 戦闘コントロール
 *
 * 戦闘リプレイの再生速度切替とスキップ。反復0では計測装置を兼ねる
 * （スキップ・早送りの使用率が「観戦が退屈か」の判定項目になる）。
 * ラベルは絵文字に意味を託さず日本語テキストで示す（S1 の表現方針）。
 */
import React from 'react';
import styled from 'styled-components';
import type { BattleSpeed } from '../application/ports/play-log-port';

const Bar = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`;

const ControlButton = styled.button<{ $active?: boolean }>`
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid #8b2635;
  background: ${({ $active }) => ($active ? '#8b2635' : 'transparent')};
  color: #e8ded2;
  cursor: pointer;
`;

const SPEED_LABELS: { value: BattleSpeed; label: string }[] = [
  { value: 1, label: '等速' },
  { value: 2, label: '2倍速' },
  { value: 4, label: '4倍速' },
];

interface Props {
  speed: BattleSpeed;
  onChangeSpeed: (speed: BattleSpeed) => void;
  onSkip: () => void;
}

export const BattleControls: React.FC<Props> = ({ speed, onChangeSpeed, onSkip }) => (
  <Bar>
    {SPEED_LABELS.map(({ value, label }) => (
      <ControlButton
        key={value}
        $active={speed === value}
        aria-pressed={speed === value}
        onClick={() => onChangeSpeed(value)}
      >
        {label}
      </ControlButton>
    ))}
    <ControlButton onClick={onSkip}>スキップ</ControlButton>
  </Bar>
);
```

- [ ] **Step 4: AshenRampartGame に組み込む**

`AshenRampartGame.tsx` の combat 分岐（現在 `{run.phase === 'combat' && <ErrorText as="p">⚔️ 戦闘中…</ErrorText>}`）を置き換え:

```tsx
          {run.phase === 'combat' && (
            <>
              <ErrorText as="p">⚔️ 戦闘中…</ErrorText>
              <BattleControls
                speed={game.speed}
                onChangeSpeed={game.changeSpeed}
                onSkip={game.skipBattle}
              />
            </>
          )}
```

import に `BattleControls` を追加。

- [ ] **Step 5: テストが通ることを確認（結合含む）**

Run: `npx jest src/features/ashen-rampart/presentation --no-coverage`
Expected: PASS（BattleControls 4件＋既存全件。AshenRampartGame.test.tsx が壊れていないこと）

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/presentation/BattleControls.tsx src/features/ashen-rampart/presentation/BattleControls.test.tsx src/features/ashen-rampart/presentation/AshenRampartGame.tsx
git commit -m "feat(ashen-rampart): 戦闘中の速度切替・スキップ UI を追加

- 等速/2倍速/4倍速/スキップ（日本語ラベル・aria-pressed）
- 反復0の計測装置（非スキップ率）を操作可能にする

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: リザルトの勝敗理由入力とログコピー

**Files:**
- Modify: `src/features/ashen-rampart/presentation/ResultPanel.tsx`
- Modify: `src/features/ashen-rampart/presentation/useAshenRampartGame.ts`（`noteRun` 追加）
- Modify: `src/features/ashen-rampart/presentation/AshenRampartGame.tsx`（props 接続）
- Test: `src/features/ashen-rampart/presentation/ResultPanel.test.tsx`（新規または既存に追記）

**Interfaces:**
- Consumes: Task 2 の `record` / `runId` / `exportLogJson`
- Produces: フック戻り値に `noteRun(text: string): void`（`run_note` を記録）。`ResultPanel` props 拡張: `{ run; onRestart; onNote: (text: string) => void; exportLogJson: () => string }`
- 設計書との差分（記録して進める）: 設計書は「run_ended に理由1文を含める」としたが、run_ended はフェーズ遷移時に自動記録され理由入力はその後になるため、**別イベント `run_note` として記録し「run_note が無いラン＝未記入」と解釈する**。集計上の情報量は同一

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/features/ashen-rampart/presentation/ResultPanel.test.tsx（新規の場合）
/**
 * リザルトパネルのテスト
 *
 * 勝敗理由の任意入力（run_note）とログコピーの動作を検証する。
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultPanel } from './ResultPanel';
import { startRun } from '../application/use-cases/start-run';
import { SeededRandom } from '../infrastructure/random/seeded-random';

const makeRun = () => ({ ...startRun(new SeededRandom(1)), phase: 'result' as const });

describe('ResultPanel 勝敗理由とログ', () => {
  it('理由を入力して記録ボタンで onNote が呼ばれ、入力欄が閉じる', () => {
    const onNote = jest.fn();
    render(
      <ResultPanel
        run={makeRun()}
        onRestart={jest.fn()}
        onNote={onNote}
        exportLogJson={() => '{}'}
      />
    );
    fireEvent.change(screen.getByLabelText('勝敗の理由（ひと言）'), {
      target: { value: '弓兵を入口に固めたので漏れなかった' },
    });
    fireEvent.click(screen.getByRole('button', { name: '理由を記録' }));
    expect(onNote).toHaveBeenCalledWith('弓兵を入口に固めたので漏れなかった');
    expect(screen.getByText('記録しました')).toBeInTheDocument();
  });

  it('空欄のまま記録ボタンを押しても onNote は呼ばれない', () => {
    const onNote = jest.fn();
    render(
      <ResultPanel
        run={makeRun()}
        onRestart={jest.fn()}
        onNote={onNote}
        exportLogJson={() => '{}'}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '理由を記録' }));
    expect(onNote).not.toHaveBeenCalled();
  });

  it('計測ログをコピーで exportLogJson の内容がクリップボードに渡る', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <ResultPanel
        run={makeRun()}
        onRestart={jest.fn()}
        onNote={jest.fn()}
        exportLogJson={() => '{"version":1}'}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '計測ログをコピー' }));
    expect(writeText).toHaveBeenCalledWith('{"version":1}');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/presentation/ResultPanel --no-coverage`
Expected: FAIL（props 未対応）

- [ ] **Step 3: ResultPanel を実装**

```tsx
// src/features/ashen-rampart/presentation/ResultPanel.tsx（全置換）
/**
 * 灰燼の城壁 - リザルトパネル
 *
 * 勝敗表示に加え、反復0の計測として「勝敗の理由」の任意入力（判定項目3）と
 * 行動ログの JSON コピー（レトロでの集計用）を提供する。
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import type { RunState } from '../domain/run/run-state';

const Panel = styled.div`
  text-align: center;
  color: #e8ded2;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
`;

const NoteArea = styled.textarea`
  width: min(480px, 90%);
  min-height: 60px;
  border-radius: 6px;
  padding: 8px;
`;

interface Props {
  run: RunState;
  onRestart: () => void;
  /** 勝敗理由の記録（判定項目3。空文字では呼ばれない） */
  onNote: (text: string) => void;
  /** 行動ログの JSON 文字列を返す（開発用コピー） */
  exportLogJson: () => string;
}

export const ResultPanel: React.FC<Props> = ({ run, onRestart, onNote, exportLogJson }) => {
  const [note, setNote] = useState('');
  const [isNoted, setIsNoted] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  const submitNote = () => {
    const text = note.trim();
    if (text === '') return;
    onNote(text);
    setIsNoted(true);
  };

  const copyLog = async () => {
    const json = exportLogJson();
    try {
      await navigator.clipboard.writeText(json);
      setCopyMessage('コピーしました');
    } catch {
      // クリップボード未対応環境ではコンソールに出す（開発用機能のため）
      console.log(json);
      setCopyMessage('コンソールに出力しました');
    }
  };

  return (
    <Panel>
      <h2>{run.status === 'won' ? '🏰 砦は守られた' : '💀 城壁は灰燼に帰した'}</h2>
      <p>スコア: {run.score}</p>
      {isNoted ? (
        <p>記録しました</p>
      ) : (
        <>
          <label htmlFor="run-note">勝敗の理由（ひと言）</label>
          <NoteArea
            id="run-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="なぜ勝てた/負けたと思うか（任意）"
          />
          <button onClick={submitNote}>理由を記録</button>
        </>
      )}
      <button onClick={onRestart}>もう一度挑む</button>
      <button onClick={copyLog}>計測ログをコピー</button>
      {copyMessage && <p>{copyMessage}</p>}
    </Panel>
  );
};
```

- [ ] **Step 4: フックに noteRun を追加し、AshenRampartGame を接続**

```ts
// useAshenRampartGame.ts に追加
  const noteRun = useCallback(
    (text: string) => {
      record({ kind: 'run_note', runId, text });
    },
    [runId, record]
  );
  // 戻り値に noteRun を追加
```

```tsx
// AshenRampartGame.tsx の ResultPanel 呼び出しを置換
        <ResultPanel
          run={run}
          onRestart={game.restart}
          onNote={game.noteRun}
          exportLogJson={game.exportLogJson}
        />
```

- [ ] **Step 5: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/presentation --no-coverage`
Expected: PASS（ResultPanel 3件＋既存全件）

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/presentation/ResultPanel.tsx src/features/ashen-rampart/presentation/ResultPanel.test.tsx src/features/ashen-rampart/presentation/useAshenRampartGame.ts src/features/ashen-rampart/presentation/AshenRampartGame.tsx
git commit -m "feat(ashen-rampart): リザルトに勝敗理由の記録とログコピーを追加

- 勝敗理由の任意入力を run_note として記録（判定項目3）
- 行動ログ JSON のクリップボードコピー（レトロ集計用）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: 全体検証と PR 作成

**Files:**
- 変更なし（検証のみ）

- [ ] **Step 1: feature 全テストを実行**

Run: `npx jest src/features/ashen-rampart --no-coverage`
Expected: PASS（全件）

- [ ] **Step 2: CI パイプライン全体をローカル実行**

Run: `npm run ci`
Expected: lint:ci / typecheck / test / build すべて成功（E2E はローカル実行不可のため CI に委ねる）

- [ ] **Step 3: 反復0 の Issue を作成**

```bash
gh issue create --title "[反復0] ベースライン計測 — 行動ログ基盤＋早送り/スキップ" --body "Epic #188 の反復0。

## 事前登録
- 実装: 行動ログ基盤（スキーマ v1）＋戦闘の早送り(2x/4x)/スキップのみ。体験の変更はこの2点に限定
- 実プレイ: 現状のゲームを3ラン計測（ログ自動記録＋勝敗理由の任意入力）
- 収集する項目: ①ウェーブごとの prep_action 数と内訳 ②非スキップ率（battle_speed） ③勝敗理由の記述有無（run_note） ④主観評（Keep/Problem）
- 出口条件: ベースライン数値の記録と、Epic #188 の判定閾値の較正・確定（Epic にコメント）
- この反復では面白さの判定はしない（計測のみ）

結果はこの Issue にコメントで記録する（実験ノート方式）。"
```

- [ ] **Step 4: プッシュして PR 作成**

```bash
git push -u origin feature/ashen-rampart-e2e-0
gh pr create --title "feat(ashen-rampart): 反復0 ベースライン計測基盤（行動ログ＋早送り/スキップ）" --body "## 概要
Epic #188（予告反証ゲーム化・E2E ブラッシュアップ）の反復0。一人プレイテストのバイアス対策として行動ログ基盤を追加し、判定項目の計測装置となる早送り/スキップを実装します。ゲーム体験の変更はこの2点のみです。

## 変更内容
- 行動ログのポートと localStorage アダプタ（スキーマ v1）
- フックでのライフサイクル/準備操作/速度変更の記録
- 戦闘の再生速度（等速/2倍速/4倍速）とスキップ UI
- リザルトの勝敗理由入力（run_note）とログ JSON コピー

## テスト方法
- [ ] CI 全緑（Lint/TypeCheck/Test/Build/E2E）
- [ ] マージ後: 実プレイ3ラン計測 → 反復0 Issue に結果記録 → Epic #188 に閾値確定コメント

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 5: CI 全緑を確認してマージ**

Run: `sleep 60 && gh pr checks <PR番号> --watch` → 全緑後 `gh pr merge <PR番号> --merge`
Expected: マージ完了。その後ユーザー実プレイ3ラン（計画外・人間の作業）へ

---

## 自己レビュー結果

- スペック網羅: 設計書の反復0スコープ（ログ基盤・早送り/スキップ・理由入力・コピー）を Task 1〜6 が全てカバー。ドメイン変更ゼロを維持
- 型整合: `PlayLogEventBody`/`BattleSpeed`/`createRunId`（Task 1）を Task 2〜6 が同名で使用。`ResultPanel` props は Task 6 内で定義と使用が一致
- 設計書との既知の差分1件（run_note 分離）は Task 6 に理由付きで明記済み
- 残リスク: `useAshenRampartGame.test.ts` の既存 import 構成と `BoardState` のスロット参照名は実装時に現物へ合わせる（Task 2/3 に注記済み）
