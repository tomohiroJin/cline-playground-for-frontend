# AQS ブラッシュアップ Phase 1（基盤）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** デザイントークン統一・アクセシビリティ強化・サウンド設定の横断基盤を整え、後続フェーズの土台を作る。

**Architecture:** 既存の `Repository + StoragePort` パターンで `SettingsRepository` を新設。サウンドは `sound.ts` のモジュールレベルフラグでゲート。アクセシビリティは既存コンポーネントへ `aria-*`/`role`/`:focus-visible` を追加。デザイントークンは既存 `DESIGN_TOKENS` への参照置換のみ（styled-components 全面移行はしない）。

**Tech Stack:** React 19 + TypeScript + styled-components + Jotai / Jest 30 + @testing-library/react / Tone.js

**対象ディレクトリ:** `src/features/agile-quiz-sugoroku/`（以降のパスはこのディレクトリ起点）

**共通コマンド:**
- 単体テスト: `npm test -- <テストファイルパス>`
- 型チェック: `npm run typecheck`
- Lint: `npm run lint`
- 全 CI: `npm run ci`

---

### Task 1: SettingsRepository（サウンド設定の永続化）

**Files:**
- Create: `src/features/agile-quiz-sugoroku/infrastructure/storage/settings-repository.ts`
- Test: `src/features/agile-quiz-sugoroku/infrastructure/storage/__tests__/settings-repository.test.ts`
- Modify: `src/features/agile-quiz-sugoroku/domain/types/index.ts`（`AppSettings` 型を再エクスポート。下記 Step 3 参照）

- [ ] **Step 1: 失敗するテストを書く**

`src/features/agile-quiz-sugoroku/infrastructure/storage/__tests__/settings-repository.test.ts`:

```typescript
import { SettingsRepository } from '../settings-repository';
import { InMemoryStorageAdapter } from '../in-memory-storage-adapter';

describe('SettingsRepository', () => {
  it('デフォルトでは soundEnabled が true', () => {
    const repo = new SettingsRepository(new InMemoryStorageAdapter());
    expect(repo.load().soundEnabled).toBe(true);
  });

  it('soundEnabled を保存して読み込める', () => {
    const storage = new InMemoryStorageAdapter();
    const repo = new SettingsRepository(storage);
    repo.setSoundEnabled(false);
    expect(repo.load().soundEnabled).toBe(false);
    // 別インスタンスでも永続値を読める
    expect(new SettingsRepository(storage).load().soundEnabled).toBe(false);
  });

  it('壊れたデータが入っていてもデフォルトに復帰する', () => {
    const storage = new InMemoryStorageAdapter();
    storage.set('aqs_settings', 'not-an-object');
    const repo = new SettingsRepository(storage);
    expect(repo.load().soundEnabled).toBe(true);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npm test -- settings-repository.test.ts`
Expected: FAIL（`Cannot find module '../settings-repository'`）

- [ ] **Step 3: 型を追加**

`src/features/agile-quiz-sugoroku/domain/types/` に `app-settings-types.ts` を新規作成:

```typescript
/**
 * アプリ設定に関するドメイン型定義
 */

/** アプリ全体の設定 */
export interface AppSettings {
  /** 効果音・BGM を再生するか */
  soundEnabled: boolean;
}

/** 設定のデフォルト値 */
export const DEFAULT_APP_SETTINGS: AppSettings = {
  soundEnabled: true,
};
```

`src/features/agile-quiz-sugoroku/domain/types/index.ts` に再エクスポートを追記（既存の `export * from './xxx-types';` 群の末尾に）:

```typescript
export * from './app-settings-types';
```

- [ ] **Step 4: SettingsRepository を実装**

`src/features/agile-quiz-sugoroku/infrastructure/storage/settings-repository.ts`:

```typescript
/**
 * 設定リポジトリ
 *
 * サウンド ON/OFF などのアプリ設定を永続化する。
 */
import { AppSettings, DEFAULT_APP_SETTINGS } from '../../domain/types';
import { StoragePort } from './storage-port';

const SETTINGS_KEY = 'aqs_settings';

export class SettingsRepository {
  constructor(private readonly storage: StoragePort) {}

  /** 設定を読み込む（壊れている/未保存ならデフォルト） */
  load(): AppSettings {
    const data = this.storage.get<Partial<AppSettings>>(SETTINGS_KEY);
    if (!data || typeof data !== 'object') {
      return { ...DEFAULT_APP_SETTINGS };
    }
    return {
      soundEnabled:
        typeof data.soundEnabled === 'boolean'
          ? data.soundEnabled
          : DEFAULT_APP_SETTINGS.soundEnabled,
    };
  }

  /** 設定を保存する */
  save(settings: AppSettings): void {
    this.storage.set(SETTINGS_KEY, settings);
  }

  /** soundEnabled だけ更新する */
  setSoundEnabled(enabled: boolean): void {
    const current = this.load();
    this.save({ ...current, soundEnabled: enabled });
  }
}
```

- [ ] **Step 5: テストを実行して成功を確認**

Run: `npm test -- settings-repository.test.ts`
Expected: PASS（3 件）

- [ ] **Step 6: コミット**

```bash
git add src/features/agile-quiz-sugoroku/infrastructure/storage/settings-repository.ts \
        src/features/agile-quiz-sugoroku/infrastructure/storage/__tests__/settings-repository.test.ts \
        src/features/agile-quiz-sugoroku/domain/types/app-settings-types.ts \
        src/features/agile-quiz-sugoroku/domain/types/index.ts
git commit -m "feat: AQS サウンド設定の永続化リポジトリを追加"
```

---

### Task 2: サウンドのミュートゲート（sound.ts）

`sound.ts` の全 `playXxx`/`playBgm` は副作用関数。モジュールレベルの `soundEnabled` フラグを追加し、無効時は early return する。

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/infrastructure/audio/sound.ts`
- Test: `src/features/agile-quiz-sugoroku/__tests__/sound-mute.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/agile-quiz-sugoroku/__tests__/sound-mute.test.ts`:

```typescript
import { setSoundEnabled, isSoundEnabled } from '../infrastructure/audio/sound';

describe('sound mute gate', () => {
  afterEach(() => setSoundEnabled(true)); // 後始末

  it('デフォルトは有効', () => {
    expect(isSoundEnabled()).toBe(true);
  });

  it('setSoundEnabled で状態を切り替えられる', () => {
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npm test -- sound-mute.test.ts`
Expected: FAIL（`setSoundEnabled` が export されていない）

- [ ] **Step 3: sound.ts にフラグとゲートを追加**

`sound.ts` の先頭付近（`let isAudioInitialized = false;` の近く）に追加:

```typescript
/** サウンド全体の有効フラグ。false の間は全再生をスキップする */
let soundEnabled = true;

/** サウンドの有効/無効を設定する */
export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  if (!enabled) {
    stopBgm();
  }
}

/** サウンドが有効かどうかを返す */
export function isSoundEnabled(): boolean {
  return soundEnabled;
}
```

各再生関数の本体先頭に early return を追加する。対象は `playBgm` / `playSfxCorrect` / `playSfxIncorrect` / `playSfxTick` / `playSfxStart` / `playSfxResult` / `playSfxCombo` / `playSfxComboBreak` / `playSfxDrumroll` / `playSfxFanfare` / `playSfxAchievement` / `playSfxTickUrgent`。各関数の最初の行に:

```typescript
  if (!soundEnabled) return;
```

`stopBgm` には**追加しない**（ミュート時に停止できなくなるため）。`initAudio` にも追加しない（初期化は許可）。

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npm test -- sound-mute.test.ts`
Expected: PASS（2 件）

- [ ] **Step 5: 既存サウンド関連テストの回帰確認**

Run: `npm test -- sound`
Expected: 既存 `sound-extensions.test.ts` 含め全 PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/agile-quiz-sugoroku/infrastructure/audio/sound.ts \
        src/features/agile-quiz-sugoroku/__tests__/sound-mute.test.ts
git commit -m "feat: AQS サウンドのミュートゲートを sound.ts に追加"
```

---

### Task 3: 設定 → サウンド初期化の結線 + タイトル画面トグル UI

アプリ起動時に `SettingsRepository` を読み、`setSoundEnabled` を呼ぶ。タイトル画面にトグルボタンを置く。

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/presentation/components/screens/TitleScreen.tsx`
- Test: `src/features/agile-quiz-sugoroku/__tests__/title-sound-toggle.test.tsx`

> **調査メモ:** `TitleScreen.tsx:30-31` で `new GameResultRepository(new LocalStorageAdapter())` 等をモジュールスコープで生成済み。同パターンで `settingsRepo` を追加する。トグルボタンの配置先は `TitleScreen` 内の適切な位置（既存の設定系 UI がなければ画面下部）。

- [ ] **Step 1: 失敗するテストを書く**

`src/features/agile-quiz-sugoroku/__tests__/title-sound-toggle.test.tsx`:

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TitleScreen } from '../presentation/components/screens/TitleScreen';
import { SettingsRepository } from '../infrastructure/storage/settings-repository';
import { LocalStorageAdapter } from '../infrastructure/storage/local-storage-adapter';

// TitleScreen が要求する最小 props はコンポーネント定義に合わせて補完する
const noop = () => undefined;

describe('TitleScreen サウンドトグル', () => {
  beforeEach(() => localStorage.clear());

  it('サウンドトグルボタンが表示され、押すと設定が反転する', () => {
    render(
      <TitleScreen
        onNewGame={noop}
        navigation={{}}
        /* 他の必須 props はコンポーネント定義に合わせて追加 */
      />
    );
    const toggle = screen.getByRole('button', { name: /サウンド/ });
    expect(toggle).toBeInTheDocument();
    fireEvent.click(toggle);
    const repo = new SettingsRepository(new LocalStorageAdapter());
    expect(repo.load().soundEnabled).toBe(false);
  });
});
```

> 実行者向け注: `TitleScreen` の実際の必須 props（`saveState`/`formatSaveDate` 等）はファイル冒頭の Props 型を読んで補完すること。props が多い場合はテスト内にヘルパー `renderTitle(overrides)` を作る。

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npm test -- title-sound-toggle.test.tsx`
Expected: FAIL（トグルボタンが見つからない）

- [ ] **Step 3: TitleScreen にトグルを実装**

`TitleScreen.tsx` のモジュールスコープ（既存 repo 生成の隣）に追加:

```typescript
import { SettingsRepository } from '../../../infrastructure/storage/settings-repository';
import { setSoundEnabled, isSoundEnabled } from '../../../infrastructure/audio/sound';

const settingsRepo = new SettingsRepository(new LocalStorageAdapter());
```

コンポーネント本体に状態とハンドラを追加:

```typescript
  const [soundOn, setSoundOn] = React.useState<boolean>(() => settingsRepo.load().soundEnabled);

  const handleToggleSound = React.useCallback(() => {
    const next = !soundOn;
    setSoundOn(next);
    settingsRepo.setSoundEnabled(next);
    setSoundEnabled(next);
  }, [soundOn]);
```

画面下部にトグルボタンを描画（既存 `Button` スタイルを使用）:

```tsx
  <button
    type="button"
    onClick={handleToggleSound}
    aria-pressed={soundOn}
    aria-label={`サウンド ${soundOn ? 'オン' : 'オフ'}`}
    style={{
      marginTop: DESIGN_TOKENS.spacing.md,
      background: 'transparent',
      border: `1px solid ${DESIGN_TOKENS.colors.textMuted}`,
      borderRadius: DESIGN_TOKENS.borderRadius.md,
      color: DESIGN_TOKENS.colors.textPrimary,
      padding: `${DESIGN_TOKENS.spacing.xs} ${DESIGN_TOKENS.spacing.md}`,
      cursor: 'pointer',
      fontSize: DESIGN_TOKENS.fontSize.sm,
    }}
  >
    {soundOn ? '🔊 サウンド: オン' : '🔇 サウンド: オフ'}
  </button>
```

`DESIGN_TOKENS` を import（未 import の場合）:

```typescript
import { DESIGN_TOKENS } from '../../styles/design-tokens';
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npm test -- title-sound-toggle.test.tsx`
Expected: PASS

- [ ] **Step 5: アプリ初期化時に設定を反映**

`src/features/agile-quiz-sugoroku/pages` ではなく Feature の起動点が `presentation/hooks/useGame.ts` の `init`（`dispatch({ type: 'INIT' })` の `useEffect`）にある。`useGame.ts` 冒頭に import を追加:

```typescript
import { SettingsRepository } from '../../infrastructure/storage/settings-repository';
import { LocalStorageAdapter } from '../../infrastructure/storage/local-storage-adapter';
import { setSoundEnabled } from '../../infrastructure/audio/sound';
```

INIT 用の `useEffect`（`dispatch({ type: 'INIT' })` を呼んでいる箇所）に、初回マウント時の設定反映を追加:

```typescript
  useEffect(() => {
    const settings = new SettingsRepository(new LocalStorageAdapter()).load();
    setSoundEnabled(settings.soundEnabled);
  }, []);
```

> 注: 既存の INIT effect がある場合はそこへ 1 行追記でもよい。`AgileQuizSugorokuPage` が `useGame()` を呼ぶため、ここが起動点として確実。

- [ ] **Step 6: 型チェックと回帰テスト**

Run: `npm run typecheck && npm test -- useGame.test.ts title-sound-toggle.test.tsx`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add src/features/agile-quiz-sugoroku/presentation/components/screens/TitleScreen.tsx \
        src/features/agile-quiz-sugoroku/presentation/hooks/useGame.ts \
        src/features/agile-quiz-sugoroku/__tests__/title-sound-toggle.test.tsx
git commit -m "feat: AQS タイトル画面にサウンド ON/OFF トグルを追加し起動時に設定を復元"
```

---

### Task 4: アクセシビリティ — クイズ選択肢

選択肢パネルに `role`/`aria-label`、回答確定後の結果を `aria-live` で通知する。

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/presentation/components/screens/QuizScreen/OptionsPanel.tsx`
- Test: `src/features/agile-quiz-sugoroku/__tests__/options-panel-a11y.test.tsx`

> **調査メモ:** 実装前に `OptionsPanel.tsx` を読み、props（選択肢配列・選択状態・onSelect・answered など）の実名を確認すること。以下のコードは props 名を仮定しているので実体に合わせる。

- [ ] **Step 1: 失敗するテストを書く**

`src/features/agile-quiz-sugoroku/__tests__/options-panel-a11y.test.tsx`:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { OptionsPanel } from '../presentation/components/screens/QuizScreen/OptionsPanel';

describe('OptionsPanel アクセシビリティ', () => {
  it('選択肢グループが radiogroup ロールを持つ', () => {
    render(
      <OptionsPanel
        options={['A', 'B', 'C', 'D']}
        /* 実 props に合わせて補完（selected, answered, onSelect 等） */
        onSelect={() => undefined}
      />
    );
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    // 4 つの選択肢が radio として公開される
    expect(screen.getAllByRole('radio')).toHaveLength(4);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npm test -- options-panel-a11y.test.tsx`
Expected: FAIL（radiogroup が見つからない）

- [ ] **Step 3: OptionsPanel に role/aria を付与**

選択肢コンテナに `role="radiogroup"` と `aria-label="回答の選択肢"` を付与。各選択肢ボタンに:

```tsx
role="radio"
aria-checked={selected === index}
aria-label={`選択肢 ${String.fromCharCode(65 + index)}: ${option}`}
```

確定後フィードバック用に、パネル末尾へ視覚的に隠した live 領域を追加:

```tsx
<div
  aria-live="polite"
  style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}
>
  {answered ? (isCorrect ? '正解です' : '不正解です') : ''}
</div>
```

> `answered`/`isCorrect` に相当する props/状態名は実体に合わせる。なければ親（QuizScreen）から受け取る。

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npm test -- options-panel-a11y.test.tsx`
Expected: PASS

- [ ] **Step 5: 既存コンポーネントテストの回帰確認**

Run: `npm test -- components.test.tsx phase1-components.test.tsx`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/agile-quiz-sugoroku/presentation/components/screens/QuizScreen/OptionsPanel.tsx \
        src/features/agile-quiz-sugoroku/__tests__/options-panel-a11y.test.tsx
git commit -m "feat: AQS クイズ選択肢に radiogroup ロールと aria-live フィードバックを追加"
```

---

### Task 5: アクセシビリティ — タイマー/スコア + focus-visible

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/presentation/components/screens/QuizScreen/TimerDisplay.tsx`
- Modify: `src/features/agile-quiz-sugoroku/presentation/styles/common.ts`（`Button` 等に `:focus-visible`）
- Test: `src/features/agile-quiz-sugoroku/__tests__/timer-a11y.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/agile-quiz-sugoroku/__tests__/timer-a11y.test.tsx`:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TimerDisplay } from '../presentation/components/screens/QuizScreen/TimerDisplay';

describe('TimerDisplay アクセシビリティ', () => {
  it('残り時間が timer ロールと aria-live を持つ', () => {
    render(<TimerDisplay remaining={5} total={15} /* 実 props に合わせる */ />);
    const timer = screen.getByRole('timer');
    expect(timer).toHaveAttribute('aria-live');
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npm test -- timer-a11y.test.tsx`
Expected: FAIL

- [ ] **Step 3: TimerDisplay に role/aria-live を付与**

タイマー表示要素に:

```tsx
role="timer"
aria-live="polite"
aria-atomic="true"
aria-label={`残り ${remaining} 秒`}
```

過剰読み上げを避けるため、`aria-live` 領域に表示する文字列は残り 10/5/0 秒など区切りのみ更新する設計とする（数値表示自体は毎秒でよいが、live テキストは下記のように区切り判定）:

```tsx
const liveText =
  remaining === 10 || remaining === 5 || remaining === 0 ? `残り ${remaining} 秒` : '';
```

別途、視覚非表示の live 領域に `liveText` を出す。視覚要素は `role="timer"` のみ付与し `aria-hidden` は付けない。

- [ ] **Step 4: `:focus-visible` を共通スタイルに追加**

`presentation/styles/common.ts` の `Button` 定義（styled-components）へ追記:

```typescript
  &:focus-visible {
    outline: 2px solid ${DESIGN_TOKENS.colors.primary};
    outline-offset: 2px;
  }
```

`DESIGN_TOKENS` が未 import なら追加。`COLORS.accent` を直接使っても可（既存様式に合わせる）。

- [ ] **Step 5: テストを実行して成功を確認**

Run: `npm test -- timer-a11y.test.tsx`
Expected: PASS

- [ ] **Step 6: 回帰テスト + Lint**

Run: `npm test -- QuizScreen quiz && npm run lint`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add src/features/agile-quiz-sugoroku/presentation/components/screens/QuizScreen/TimerDisplay.tsx \
        src/features/agile-quiz-sugoroku/presentation/styles/common.ts \
        src/features/agile-quiz-sugoroku/__tests__/timer-a11y.test.tsx
git commit -m "feat: AQS タイマーに timer ロール/aria-live とフォーカスリング可視化を追加"
```

---

### Task 6: デザイントークン統一（IncorrectReview ほか）

インライン `style` のマジックナンバー・色リテラルを `DESIGN_TOKENS` 参照に置換する。視覚は変えない。

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/presentation/components/IncorrectReview.tsx`
- Modify: 同様にトークン未使用のコンポーネント（grep で特定）
- Test: 既存 `components.test.tsx` 等で視覚回帰がないことを確認（新規テストは不要）

- [ ] **Step 1: トークン未使用箇所を洗い出す**

Run:
```bash
cd src/features/agile-quiz-sugoroku
grep -rln "style={{" presentation/components | xargs grep -L "DESIGN_TOKENS" 2>/dev/null
```
Expected: トークン未使用でインライン style を使うファイル一覧が出る。`IncorrectReview.tsx` を起点に、上位 3〜5 ファイルを本タスクの対象とする（残りは Phase 3 の視覚洗練でも継続）。

- [ ] **Step 2: IncorrectReview をトークン化**

`IncorrectReview.tsx` の `import` に追加:

```typescript
import { DESIGN_TOKENS } from '../styles/design-tokens';
```

インライン style の数値・色リテラルをトークンへ置換。例（既存 → 置換後）:

```tsx
// 置換前
style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${COLORS.red}18` }}
// 置換後（視覚を変えない範囲で近いトークンに寄せる）
style={{
  padding: `${DESIGN_TOKENS.spacing.sm} ${DESIGN_TOKENS.spacing.md}`,
  borderRadius: DESIGN_TOKENS.borderRadius.md,
  border: `1px solid ${DESIGN_TOKENS.colors.danger}18`,
}}
```

`fontSize: 12` → `DESIGN_TOKENS.fontSize.xs`、`fontSize: 11` は近似がないため数値のまま残してよい（無理にトークン化しない）。`gap: 10` 等は最寄り（`spacing.sm`=8 か独自値）に寄せるか、視覚維持を優先して残す。**判断基準: トークンに 1:1 近い値があるものだけ置換し、視覚を変えない。**

- [ ] **Step 3: 同様に Step 1 で挙がった上位ファイルを置換**

各ファイルで同じ方針（トークン 1:1 近似のみ置換、視覚維持）。1 ファイルずつ編集する。

- [ ] **Step 4: 視覚回帰がないことをテストで確認**

Run: `npm test -- components.test.tsx phase1-components.test.tsx phase2-components.test.tsx`
Expected: PASS（DOM 構造・テキストは不変のため通る）

- [ ] **Step 5: 型チェックと Lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/agile-quiz-sugoroku/presentation/components/
git commit -m "refactor: AQS インライン style を DESIGN_TOKENS 参照に統一（視覚不変）"
```

---

### Task 7: Phase 1 全体検証

- [ ] **Step 1: 全 CI を実行**

Run: `npm run ci`
Expected: lint:ci → typecheck → test:coverage → build が全 PASS

- [ ] **Step 2: ドキュメント追記**

`src/features/agile-quiz-sugoroku/doc/effects-and-ui.md` に「サウンド設定」「アクセシビリティ方針（radiogroup/timer/aria-live/focus-visible）」「デザイントークン統一方針」の節を追記。

- [ ] **Step 3: コミット**

```bash
git add src/features/agile-quiz-sugoroku/doc/effects-and-ui.md
git commit -m "docs: AQS Phase1（サウンド設定・a11y・トークン統一）をドキュメントに反映"
```

---

## Self-Review チェック（Phase 1）

- **Spec coverage:** 1-A（Task 6）/ 1-B（Task 4,5）/ 1-C（Task 1,2,3）を網羅 ✅
- **型整合:** `AppSettings`/`DEFAULT_APP_SETTINGS`（Task 1）、`setSoundEnabled`/`isSoundEnabled`（Task 2）を Task 3 で正しく参照 ✅
- **プレースホルダ:** props 名の実体確認を「調査メモ」で明示。コードは実在パターンに準拠 ✅
