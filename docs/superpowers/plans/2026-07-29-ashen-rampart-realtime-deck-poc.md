# 灰燼の城壁 リアルタイム・デッキ PoC 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 既存の `src/features/ashen-rampart/` を同名のまま作り直し、「有限の札をいつ切るか」を判定できるリアルタイム・デッキ TD を1ラン通しで遊べる状態にする。

**Architecture:** 戦闘の事前計算（`simulateWave` → tick列）を廃し、1 tick だけ前進する純粋関数 `stepTick(state, actions, map) → state` に置き換える。時間を進めるのは presentation の `setInterval(100ms)` だけで、ロジックは一切持たせない。乱数はラン開始時のシャッフル1回のみで、`stepTick` は完全に決定的。

**Tech Stack:** React 19 + TypeScript + styled-components / Jest 30 + @testing-library/react

**Spec:** `docs/superpowers/specs/2026-07-29-ashen-rampart-realtime-deck-poc-design.md`

## Global Constraints

- コメント・テスト記述は日本語。コード（変数名・関数名）は英語
- `any` 禁止（`unknown` + 型ガード）。named export のみ。ファイル名 kebab-case（React コンポーネントは PascalCase.tsx）
- `domain/` は外部依存なし。`application/` は `domain/` のみ参照。`infrastructure/` は `application/ports/` を実装。他 feature（`features/Y/`）への参照禁止
- `dangerouslySetInnerHTML` 禁止
- 相対パスの `../` は2階層まで
- **`git add` はパス明示**（`git add -A` / `git add .` 禁止。リポジトリ直下に未追跡スクラッチが常駐）
- コミットメッセージは日本語 Conventional Commits。末尾に `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- ブランチ: `feature/ashen-rampart-realtime-poc`（main から作成）
- テストは対象と同じディレクトリに `*.test.ts(x)`
- **数値は設計書の値をそのまま使う**: ライフ10 / 初期マナ2 / 手札上限5 / 初期手札3 / デッキ20 / 同名3 / ドロー間隔40 tick / 配置クールダウン60 tick / 魔力炉60 tick で+1
- **配色**: ドミナント `#1a1614` / セカンダリ `#e8ded2` / 危険 `#8b2635` / 好機 `#e8a33d`。**赤は危険専用**で枠やパネルに使わない
- 実行前に `git checkout main && git pull --ff-only && git checkout -b feature/ashen-rampart-realtime-poc`

---

## ファイル構成

作り直し後の姿。「残す」は一切変更しないファイル。

| パス | 扱い | 責務 |
|---|---|---|
| `domain/board/stage-map.ts` | **残す** | 盤面・経路・スロット・地形。既存のまま |
| `domain/board/board-state.ts` | 削除 | 新モデルでは `CombatState` が盤面を持つ |
| `domain/shared/random.ts` | **残す** | `RandomFn` |
| `domain/cards/card-definition.ts` | 作り直し | カード型（tower/trap/spell/reactor/ember） |
| `domain/cards/card-pool.ts` | 作り直し | カード8種とプリセットデッキ2種 |
| `domain/cards/deck.ts` | 作り直し | 山札・手札・墓地・ドロー・手札上限 |
| `domain/combat/enemies.ts` | 作り直し | 敵5種（飛行フラグ付き） |
| `domain/combat/waves.ts` | 作り直し | ウェーブ4本（開始 tick・出現経路 index 付き） |
| `domain/combat/combat-state.ts` | 新規 | `CombatState` 型と初期状態 |
| `domain/combat/step-tick.ts` | 新規 | 1 tick 前進の純粋関数 |
| `domain/combat/simulate-wave.ts` | 削除 | バッチ計算は廃止 |
| `domain/run/run-state.ts` / `reward.ts` | 削除 | フェーズ分離と報酬は廃止 |
| `application/ports/random-port.ts` | **残す** | |
| `application/ports/play-log-port.ts` | 作り直し | スキーマ v2 |
| `application/use-cases/start-run.ts` | 作り直し | シャッフルと初期状態の生成 |
| `application/use-cases/*` （他） | 削除 | `stepTick` に統合 |
| `infrastructure/random/seeded-random.ts` | **残す** | |
| `infrastructure/play-log/local-storage-play-log.ts` | 軽微修正 | スキーマ版数のみ |
| `presentation/enemy-visual.ts` | 拡張 | 敵5種に対応（群れ・鴉を追加） |
| `presentation/cell-descriptor.ts` | **残す** | |
| `presentation/EnemyMarker.tsx` | 拡張 | スタック体数バッジ |
| `presentation/EnemyLegend.tsx` | 拡張 | 敵5種 |
| `presentation/enemy-stack.ts` | 新規 | 敵のスタック集約（純粋） |
| `presentation/BoardGrid.tsx` | 作り直し | 盤面・ハイライト・設置物 |
| `presentation/HandArea.tsx` | 作り直し | 手札5枚・マナ・統合タイマー |
| `presentation/RunStatusBar.tsx` | 新規 | ライフ・ウェーブ・予告・一時停止 |
| `presentation/useAshenRampartGame.ts` | 作り直し | ゲームループ・入力・ログ |
| `presentation/AshenRampartGame.tsx` | 作り直し | 三層レイアウトの組み立て |
| `presentation/BattleControls.tsx` / `ResultPanel.tsx` / `RewardPanel.tsx` / `StatusBar.tsx` / `WavePreview.tsx` | 削除・置換 | 下記タスクで整理 |

---

### Task 1: 旧実装の撤去とプレースホルダ

作り直しの土台。中間状態でも `npm run ci` が緑であることを保証するため、まず**壊れるものを全部消して**スタブ画面に差し替える。以降のタスクはここから積み上げる。

**Files:**
- Delete: `domain/board/board-state.ts` / `.test.ts`、`domain/combat/simulate-wave.ts` / `.test.ts`、`domain/combat/waves.ts` / `.test.ts`、`domain/cards/deck.ts` / `.test.ts`、`domain/cards/card-pool.ts` / `.test.ts`、`domain/run/run-state.ts`、`domain/run/reward.ts` / `.test.ts`、`application/use-cases/choose-reward.ts`、`application/use-cases/play-card.ts` / `.test.ts`、`application/use-cases/start-wave.ts` / `.test.ts`、`application/use-cases/start-run.ts`、`presentation/AshenRampartGame.test.tsx`、`presentation/BattleControls.tsx` / `.test.tsx`、`presentation/BoardGrid.tsx` / `.test.tsx`、`presentation/EnemyLegend.tsx` / `.test.tsx`、`presentation/HandArea.tsx`、`presentation/ResultPanel.tsx` / `.test.tsx`、`presentation/RewardPanel.tsx`、`presentation/StatusBar.tsx`、`presentation/WavePreview.tsx` / `.test.tsx`、`presentation/useAshenRampartGame.ts` / `.test.ts`、`presentation/enemy-visual.ts` / `.test.ts`、`presentation/EnemyMarker.tsx`、`presentation/cell-descriptor.ts` / `.test.ts`、`domain/combat/enemies.ts`、`domain/cards/card-definition.ts`
- Modify: `presentation/AshenRampartGame.tsx`（スタブに置換）
- 残す: `domain/board/stage-map.ts` / `.test.ts`、`domain/shared/random.ts`、`application/ports/random-port.ts`、`application/ports/play-log-port.ts`、`infrastructure/**`、`index.ts`

**Interfaces:**
- Consumes: なし
- Produces: `AshenRampartGame`（引数なしの React コンポーネント）。`index.ts` の export は変えない

> **注意**: `presentation/enemy-visual.ts` と `EnemyMarker.tsx` / `cell-descriptor.ts` は設計書で「再利用」としているが、依存する `enemies.ts` を作り直すため**いったん削除し、Task 3・10 で内容を引き継いで作り直す**。中身は後続タスクにコード全文を記載しているので失われない。

- [ ] **Step 1: 削除対象を消す**

```bash
cd src/features/ashen-rampart
rm -f domain/board/board-state.ts domain/board/board-state.test.ts \
      domain/combat/simulate-wave.ts domain/combat/simulate-wave.test.ts \
      domain/combat/waves.ts domain/combat/waves.test.ts \
      domain/combat/enemies.ts \
      domain/cards/deck.ts domain/cards/deck.test.ts \
      domain/cards/card-pool.ts domain/cards/card-pool.test.ts \
      domain/cards/card-definition.ts \
      domain/run/run-state.ts domain/run/reward.ts domain/run/reward.test.ts \
      application/use-cases/choose-reward.ts \
      application/use-cases/play-card.ts application/use-cases/play-card.test.ts \
      application/use-cases/start-wave.ts application/use-cases/start-wave.test.ts \
      application/use-cases/start-run.ts \
      presentation/AshenRampartGame.test.tsx \
      presentation/BattleControls.tsx presentation/BattleControls.test.tsx \
      presentation/BoardGrid.tsx presentation/BoardGrid.test.tsx \
      presentation/EnemyLegend.tsx presentation/EnemyLegend.test.tsx \
      presentation/EnemyMarker.tsx \
      presentation/HandArea.tsx \
      presentation/ResultPanel.tsx presentation/ResultPanel.test.tsx \
      presentation/RewardPanel.tsx presentation/StatusBar.tsx \
      presentation/WavePreview.tsx presentation/WavePreview.test.tsx \
      presentation/useAshenRampartGame.ts presentation/useAshenRampartGame.test.ts \
      presentation/enemy-visual.ts presentation/enemy-visual.test.ts \
      presentation/cell-descriptor.ts presentation/cell-descriptor.test.ts
rmdir domain/run 2>/dev/null || true
cd -
```

- [ ] **Step 2: AshenRampartGame をスタブに置換**

```tsx
// src/features/ashen-rampart/presentation/AshenRampartGame.tsx（全置換）
/**
 * 灰燼の城壁 - ゲーム画面（作り直し中のプレースホルダ）
 *
 * リアルタイム・デッキ PoC への作り替え中。実装が揃うまでの暫定表示。
 */
import React from 'react';
import styled from 'styled-components';

const Placeholder = styled.div`
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e8ded2;
  background: #1a1614;
  text-align: center;
  padding: 24px;
`;

export const AshenRampartGame: React.FC = () => (
  <Placeholder>
    <p>灰燼の城壁は改修中です。</p>
  </Placeholder>
);
```

- [ ] **Step 3: 型チェックと lint が通ることを確認**

Run: `npm run typecheck && npm run lint:ci`
Expected: どちらもエラー・警告ゼロ。削除漏れによる未解決 import があればここで露見する

- [ ] **Step 4: 全体テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart --no-coverage`
Expected: PASS（残るのは `stage-map.test.ts` / `seeded-random.test.ts` / `local-storage-play-log.test.ts` のみ）

- [ ] **Step 5: E2E を含まない CI パイプラインを通す**

Run: `npm run ci`
Expected: lint:ci / typecheck / test / build すべて成功

- [ ] **Step 6: コミット**

```bash
git add -u src/features/ashen-rampart
git add src/features/ashen-rampart/presentation/AshenRampartGame.tsx
git commit -m "refactor(ashen-rampart): リアルタイム化に向けて旧実装を撤去

- フェーズ分離・事前計算戦闘・報酬選択の一式を削除
- 画面を暫定プレースホルダに差し替え、CI 緑の土台を確保
- stage-map / 乱数 / 行動ログ基盤は残置して再利用する

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: カード型定義とカードプール8種

**Files:**
- Create: `domain/cards/card-definition.ts`
- Create: `domain/cards/card-pool.ts`
- Test: `domain/cards/card-pool.test.ts`

**Interfaces:**
- Consumes: なし
- Produces: `CardType` / `TowerSpec` / `TrapSpec` / `ReactorSpec` / `EmberSpec` / `SpellSpec` / `CardDefinition` / `PlacementKind` / `placementKindOf(card)` / `getCardDefinition(id)` / `CARD_IDS` / `PRESET_DECKS` / `DECK_SIZE` / `MAX_COPIES`。以降の全タスクがこの名前で import する

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/domain/cards/card-pool.test.ts
/**
 * カードプールのテスト
 *
 * 設計書の数値がそのままデータになっていること、プリセットデッキが
 * デッキ規則（20枚・同名3枚まで）を満たすことを検証する。
 */
import {
  getCardDefinition,
  CARD_IDS,
  PRESET_DECKS,
  DECK_SIZE,
  MAX_COPIES,
} from './card-pool';
import { placementKindOf } from './card-definition';

describe('カードプール', () => {
  it('カードは8種ある', () => {
    expect(CARD_IDS).toHaveLength(8);
  });

  it('弓兵の塔は地上のみで DPS 0.75 になる数値を持つ', () => {
    const card = getCardDefinition('arrow-tower');
    expect(card.cost).toBe(2);
    expect(card.tower?.damage).toBe(6);
    expect(card.tower?.cooldownTicks).toBe(8);
    expect(card.tower?.hitsFlying).toBe(false);
  });

  it('弩砲だけが飛行に当たる', () => {
    const flying = CARD_IDS.filter((id) => getCardDefinition(id).tower?.hitsFlying === true);
    expect(flying).toEqual(['ballista']);
  });

  it('魔力炉はコスト0で60tickごとに1マナ生む', () => {
    const card = getCardDefinition('reactor');
    expect(card.cost).toBe(0);
    expect(card.reactor?.intervalTicks).toBe(60);
    expect(card.reactor?.manaPerTick).toBe(1);
  });

  it('業火は半径2・8ダメージ・再起動300tick', () => {
    const card = getCardDefinition('ember-blast');
    expect(card.ember).toEqual({ radius: 2, damage: 8, cooldownTicks: 300 });
  });

  it('未知のカードIDは契約違反として例外', () => {
    expect(() => getCardDefinition('unknown')).toThrow('未知のカードIDです: unknown');
  });

  it('配置先の種別はカード種別から決まる', () => {
    expect(placementKindOf(getCardDefinition('arrow-tower'))).toBe('slot');
    expect(placementKindOf(getCardDefinition('reactor'))).toBe('slot');
    expect(placementKindOf(getCardDefinition('ember-blast'))).toBe('slot');
    expect(placementKindOf(getCardDefinition('spike-trap'))).toBe('path');
    expect(placementKindOf(getCardDefinition('mud-time'))).toBe('none');
  });
});

describe('プリセットデッキ', () => {
  it('2種類ある', () => {
    expect(Object.keys(PRESET_DECKS)).toEqual(['swift', 'heavy']);
  });

  it.each(Object.entries(PRESET_DECKS))('%s は20枚ちょうど', (_id, deck) => {
    expect(deck.cards).toHaveLength(DECK_SIZE);
  });

  it.each(Object.entries(PRESET_DECKS))('%s は同名3枚以内', (_id, deck) => {
    const counts = new Map<string, number>();
    deck.cards.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
    counts.forEach((count) => expect(count).toBeLessThanOrEqual(MAX_COPIES));
  });

  it.each(Object.entries(PRESET_DECKS))('%s は既知のカードだけで構成される', (_id, deck) => {
    deck.cards.forEach((id) => expect(() => getCardDefinition(id)).not.toThrow());
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/domain/cards --no-coverage`
Expected: FAIL（モジュール未定義）

- [ ] **Step 3: カード型を実装**

```ts
// src/features/ashen-rampart/domain/cards/card-definition.ts
/**
 * 灰燼の城壁 - カード型定義
 *
 * カードはデータ駆動。効果は少数のスペックの組み合わせで表現し、
 * カード追加＝データ追加にする。
 *
 * 設計原則（設計書 §7）: 最高効率のカードには必ず「効かない相手」を作る。
 * 塔は hitsFlying で適用範囲を制限し、効率差はそのまま残す。
 */

export type CardType = 'tower' | 'trap' | 'spell' | 'reactor' | 'ember';

/** タワー性能 */
export interface TowerSpec {
  /** 射程（セル距離・ユークリッド） */
  range: number;
  /** 1発のダメージ */
  damage: number;
  /** 攻撃間隔（tick） */
  cooldownTicks: number;
  /** 範囲ダメージ半径（0 = 単体攻撃） */
  splashRadius: number;
  /** 飛行敵を攻撃できるか */
  hitsFlying: boolean;
  /** オーラ効果（定義されていれば攻撃せず、隣接タワーを強化する） */
  aura?: { towerDamageBonus: number };
}

/** 罠性能（経路マスに設置、踏んだ地上敵に発動） */
export interface TrapSpec {
  damage: number;
  /** 発動可能回数 */
  uses: number;
}

/** 魔力炉性能（マナ源。スロットを消費する） */
export interface ReactorSpec {
  /** マナを生む間隔（tick） */
  intervalTicks: number;
  /** 1回あたりの生成量 */
  manaPerTick: number;
}

/** 燠火性能（設置後にクリックで再発動する範囲ダメージ） */
export interface EmberSpec {
  /** 効果半径（セル距離） */
  radius: number;
  damage: number;
  /** 再発動までの待機 tick */
  cooldownTicks: number;
}

/** 即時呪文（盤面に残らない） */
export interface SpellSpec {
  /** 敵速度の倍率 */
  speedMultiplier: number;
  /** 効果時間（tick） */
  durationTicks: number;
}

export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  description: string;
  tower?: TowerSpec;
  trap?: TrapSpec;
  reactor?: ReactorSpec;
  ember?: EmberSpec;
  spell?: SpellSpec;
}

/** カードを出すときに指定する対象の種別 */
export type PlacementKind = 'slot' | 'path' | 'none';

/**
 * カードの配置先種別を返す
 *
 * UI はこれを見て「置けるマスだけをハイライトする」（設計書 §9.7）。
 * 選択空間 60通りを数個に落とすための情報。
 */
export const placementKindOf = (card: CardDefinition): PlacementKind => {
  if (card.type === 'trap') return 'path';
  if (card.type === 'spell') return 'none';
  return 'slot';
};
```

- [ ] **Step 4: カードプールを実装**

```ts
// src/features/ashen-rampart/domain/cards/card-pool.ts
/**
 * 灰燼の城壁 - カードプール（8種）とプリセットデッキ
 *
 * 数値は設計書 §5 の値をそのまま持つ。DPS/マナは
 * 弓兵 0.375 > 弩砲 0.277 > 火砲台 0.223 で弓兵が最効率だが、
 * 弓兵は飛行に当たらず同名3枚が上限のため支配戦略にならない（§7）。
 */
import type { CardDefinition } from './card-definition';

const CARDS: readonly CardDefinition[] = [
  {
    id: 'reactor',
    name: '魔力炉',
    type: 'reactor',
    cost: 0,
    description: '60tick ごとにマナを1得る。設置スロットを1つ使う。',
    reactor: { intervalTicks: 60, manaPerTick: 1 },
  },
  {
    id: 'arrow-tower',
    name: '弓兵の塔',
    type: 'tower',
    cost: 2,
    description: '単体を速射する。飛行には当たらない。',
    tower: { range: 1.6, damage: 6, cooldownTicks: 8, splashRadius: 0, hitsFlying: false },
  },
  {
    id: 'ballista',
    name: '弩砲',
    type: 'tower',
    cost: 3,
    description: '射程が長く、唯一飛行を撃ち落とせる。効率は低い。',
    tower: { range: 2.2, damage: 10, cooldownTicks: 12, splashRadius: 0, hitsFlying: true },
  },
  {
    id: 'cannon-tower',
    name: '火砲台',
    type: 'tower',
    cost: 3,
    description: '着弾点の周囲にもダメージ。群れに強い。飛行には当たらない。',
    tower: { range: 1.5, damage: 12, cooldownTicks: 18, splashRadius: 1, hitsFlying: false },
  },
  {
    id: 'beacon',
    name: '篝火',
    type: 'tower',
    cost: 2,
    description: '攻撃しないが、隣接する塔の攻撃力を +25% する。',
    tower: {
      range: 0,
      damage: 0,
      cooldownTicks: 0,
      splashRadius: 0,
      hitsFlying: false,
      aura: { towerDamageBonus: 0.25 },
    },
  },
  {
    id: 'spike-trap',
    name: '棘罠',
    type: 'trap',
    cost: 1,
    description: '経路に仕掛ける棘。地上の敵3体まで傷つける。',
    trap: { damage: 5, uses: 3 },
  },
  {
    id: 'ember-blast',
    name: '業火',
    type: 'ember',
    cost: 2,
    description: '半径2の地上敵に8ダメージ。燠火として残り、300tick 後に再点火できる。',
    ember: { radius: 2, damage: 8, cooldownTicks: 300 },
  },
  {
    id: 'mud-time',
    name: '時泥',
    type: 'spell',
    cost: 2,
    description: '200tick のあいだ、すべての敵の足を 40% 遅くする。',
    spell: { speedMultiplier: 0.6, durationTicks: 200 },
  },
];

const CARD_MAP: ReadonlyMap<string, CardDefinition> = new Map(CARDS.map((c) => [c.id, c]));

export const CARD_IDS: readonly string[] = CARDS.map((c) => c.id);

/** カード定義を取得する。未知の id は契約違反として例外 */
export const getCardDefinition = (id: string): CardDefinition => {
  const card = CARD_MAP.get(id);
  if (!card) {
    throw new Error(`未知のカードIDです: ${id}`);
  }
  return card;
};

/** デッキの枚数 */
export const DECK_SIZE = 20;

/** 同名カードの上限。弓兵スパムを構造的に封じる（設計書 §7） */
export const MAX_COPIES = 3;

export interface PresetDeck {
  id: string;
  name: string;
  description: string;
  cards: readonly string[];
}

const repeat = (id: string, count: number): string[] => Array.from({ length: count }, () => id);

/**
 * プリセットデッキ2種
 *
 * カード8種 × 同名3枚 = 24枚が上限のため、20枚デッキの差は
 * 魔力炉の数とコスト曲線に限られる（設計書 §5.1 の既知の限界）。
 */
export const PRESET_DECKS: Readonly<Record<string, PresetDeck>> = {
  swift: {
    id: 'swift',
    name: '速攻型',
    description: '安い札を多く回す。魔力炉は2枚。',
    cards: [
      ...repeat('reactor', 2),
      ...repeat('arrow-tower', 3),
      ...repeat('ballista', 2),
      ...repeat('cannon-tower', 2),
      ...repeat('spike-trap', 3),
      ...repeat('mud-time', 3),
      ...repeat('ember-blast', 3),
      ...repeat('beacon', 2),
    ],
  },
  heavy: {
    id: 'heavy',
    name: '重厚型',
    description: '高コスト札を支えるため魔力炉を3枚積む。',
    cards: [
      ...repeat('reactor', 3),
      ...repeat('arrow-tower', 2),
      ...repeat('ballista', 3),
      ...repeat('cannon-tower', 3),
      ...repeat('spike-trap', 2),
      ...repeat('mud-time', 2),
      ...repeat('ember-blast', 3),
      ...repeat('beacon', 2),
    ],
  },
};
```

- [ ] **Step 5: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/domain/cards --no-coverage`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/domain/cards/card-definition.ts src/features/ashen-rampart/domain/cards/card-pool.ts src/features/ashen-rampart/domain/cards/card-pool.test.ts
git commit -m "feat(ashen-rampart): カード8種とプリセットデッキを定義

- 塔に hitsFlying を持たせ、適用範囲で差をつける設計原則を型で表現
- 魔力炉・燠火・即時呪文のスペックを追加
- プリセット2種（速攻型・重厚型）が20枚・同名3枚以内であることをテストで保証

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: 敵5種とウェーブ4本

**Files:**
- Create: `domain/combat/enemies.ts`
- Create: `domain/combat/waves.ts`
- Test: `domain/combat/waves.test.ts`

**Interfaces:**
- Consumes: なし
- Produces: `EnemySpec`（`flying: boolean` を持つ）/ `getEnemySpec(id)` / `ENEMY_IDS` / `WaveEntry`（`spawnPathIndex` を持つ）/ `WaveDefinition`（`startTick` を持つ）/ `PLAINS_WAVES` / `totalEnemyCount(waves)` / `totalEnemyHp(waves)`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/domain/combat/waves.test.ts
/**
 * 敵定義とウェーブ構成のテスト
 *
 * 設計書 §6 の数値がデータになっていること、および
 * カウンター要求3軸（属性・位置・テンポ）が敵として存在することを検証する。
 */
import { getEnemySpec, ENEMY_IDS } from './enemies';
import { PLAINS_WAVES, totalEnemyCount, totalEnemyHp } from './waves';

describe('敵定義', () => {
  it('敵は5種ある', () => {
    expect(ENEMY_IDS).toHaveLength(5);
  });

  it('飛行するのは鴉だけ（属性のカウンター要求）', () => {
    const flying = ENEMY_IDS.filter((id) => getEnemySpec(id).flying);
    expect(flying).toEqual(['raven']);
  });

  it('俊足は雑兵より速い（テンポのカウンター要求）', () => {
    expect(getEnemySpec('runner').speed).toBeGreaterThan(getEnemySpec('grunt').speed);
  });

  it('重装は最も硬く最も遅い', () => {
    const hps = ENEMY_IDS.map((id) => getEnemySpec(id).hp);
    expect(getEnemySpec('brute').hp).toBe(Math.max(...hps));
    const speeds = ENEMY_IDS.map((id) => getEnemySpec(id).speed);
    expect(getEnemySpec('brute').speed).toBe(Math.min(...speeds));
  });

  it('未知の敵IDは契約違反として例外', () => {
    expect(() => getEnemySpec('unknown')).toThrow('未知の敵IDです: unknown');
  });
});

describe('ウェーブ構成', () => {
  it('4ウェーブある', () => {
    expect(PLAINS_WAVES).toHaveLength(4);
  });

  it('開始 tick は 0/250/500/750 で単調増加する', () => {
    expect(PLAINS_WAVES.map((w) => w.startTick)).toEqual([0, 250, 500, 750]);
  });

  it('敵の総HPは設計書の較正値 1472 と一致する', () => {
    expect(totalEnemyHp(PLAINS_WAVES)).toBe(1472);
  });

  it('総体数は 82 体', () => {
    expect(totalEnemyCount(PLAINS_WAVES)).toBe(82);
  });

  it('鴉だけが経路の中盤から出現する（位置のカウンター要求）', () => {
    const entries = PLAINS_WAVES.flatMap((w) => w.entries);
    entries.forEach((entry) => {
      if (entry.enemyId === 'raven') {
        expect(entry.spawnPathIndex).toBe(5);
      } else {
        expect(entry.spawnPathIndex).toBe(0);
      }
    });
  });

  it('全ウェーブが既知の敵だけで構成される', () => {
    PLAINS_WAVES.flatMap((w) => w.entries).forEach((entry) => {
      expect(() => getEnemySpec(entry.enemyId)).not.toThrow();
    });
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/domain/combat --no-coverage`
Expected: FAIL（モジュール未定義）

- [ ] **Step 3: 敵定義を実装**

```ts
// src/features/ashen-rampart/domain/combat/enemies.ts
/**
 * 灰燼の城壁 - 敵定義（5種）
 *
 * 設計書 §6。3種のカウンター要求を最小構成で担う:
 * 属性=鴉(飛行) / 位置=鴉(経路中盤から出現) / テンポ=俊足(速い)。
 * 群れは範囲攻撃を、重装は単体高火力を要求する。
 */
export interface EnemySpec {
  id: string;
  name: string;
  hp: number;
  /** 移動速度（経路セル/tick） */
  speed: number;
  /** 飛行するか。true の敵には hitsFlying の塔と罠が当たらない */
  flying: boolean;
}

const ENEMIES: readonly EnemySpec[] = [
  { id: 'grunt', name: '雑兵', hp: 20, speed: 0.1, flying: false },
  { id: 'runner', name: '俊足', hp: 12, speed: 0.18, flying: false },
  { id: 'swarm', name: '群れ', hp: 8, speed: 0.12, flying: false },
  { id: 'brute', name: '重装', hp: 60, speed: 0.06, flying: false },
  { id: 'raven', name: '鴉', hp: 16, speed: 0.14, flying: true },
];

const ENEMY_MAP: ReadonlyMap<string, EnemySpec> = new Map(ENEMIES.map((e) => [e.id, e]));

export const ENEMY_IDS: readonly string[] = ENEMIES.map((e) => e.id);

export const getEnemySpec = (id: string): EnemySpec => {
  const spec = ENEMY_MAP.get(id);
  if (!spec) {
    throw new Error(`未知の敵IDです: ${id}`);
  }
  return spec;
};
```

- [ ] **Step 4: ウェーブ定義を実装**

```ts
// src/features/ashen-rampart/domain/combat/waves.ts
/**
 * 灰燼の城壁 - 平原ステージのウェーブ定義（事前定義・乱数なし）
 *
 * 設計書 §6 の較正値。総HP 1472 は「15回の配置枠を使い切る必然性」を
 * 生むために設定されており、難度は快適さではなく仮説成立の条件。
 *
 * 敵数を変更したら §9.3 の描画密度（スタック表示）を必ず再計算すること。
 */
import { getEnemySpec } from './enemies';

export interface WaveEntry {
  enemyId: string;
  count: number;
  /** 同一エントリ内のスポーン間隔（tick） */
  spawnIntervalTicks: number;
  /** 出現する経路 index。0 = 入口、5 = 中盤（鴉のみ） */
  spawnPathIndex: number;
}

export interface WaveDefinition {
  /** ラン開始からの絶対 tick。ウェーブは重なりうる */
  startTick: number;
  entries: WaveEntry[];
}

export const PLAINS_WAVES: readonly WaveDefinition[] = [
  // ウェーブ1: 雑兵の小隊
  {
    startTick: 0,
    entries: [{ enemyId: 'grunt', count: 12, spawnIntervalTicks: 8, spawnPathIndex: 0 }],
  },
  // ウェーブ2: 雑兵＋俊足（テンポ要求）
  {
    startTick: 250,
    entries: [
      { enemyId: 'grunt', count: 12, spawnIntervalTicks: 8, spawnPathIndex: 0 },
      { enemyId: 'runner', count: 8, spawnIntervalTicks: 6, spawnPathIndex: 0 },
    ],
  },
  // ウェーブ3: 群れの大量投入（範囲要求）
  {
    startTick: 500,
    entries: [
      { enemyId: 'swarm', count: 20, spawnIntervalTicks: 3, spawnPathIndex: 0 },
      { enemyId: 'grunt', count: 8, spawnIntervalTicks: 8, spawnPathIndex: 0 },
    ],
  },
  // ウェーブ4: 重装＋鴉（属性・位置要求）
  {
    startTick: 750,
    entries: [
      { enemyId: 'brute', count: 4, spawnIntervalTicks: 15, spawnPathIndex: 0 },
      { enemyId: 'raven', count: 6, spawnIntervalTicks: 10, spawnPathIndex: 5 },
      { enemyId: 'grunt', count: 12, spawnIntervalTicks: 8, spawnPathIndex: 0 },
    ],
  },
];

/** 全ウェーブの敵の総体数 */
export const totalEnemyCount = (waves: readonly WaveDefinition[]): number =>
  waves.reduce((sum, w) => sum + w.entries.reduce((s, e) => s + e.count, 0), 0);

/** 全ウェーブの敵の総HP。バランス較正の基準値 */
export const totalEnemyHp = (waves: readonly WaveDefinition[]): number =>
  waves.reduce(
    (sum, w) =>
      sum + w.entries.reduce((s, e) => s + e.count * getEnemySpec(e.enemyId).hp, 0),
    0
  );
```

- [ ] **Step 5: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/domain/combat --no-coverage`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/enemies.ts src/features/ashen-rampart/domain/combat/waves.ts src/features/ashen-rampart/domain/combat/waves.test.ts
git commit -m "feat(ashen-rampart): 敵5種とウェーブ4本を定義

- カウンター要求3軸（属性=鴉の飛行 / 位置=鴉の中盤出現 / テンポ=俊足）
- 群れは範囲、重装は単体高火力を要求する
- 総HP 1472 を較正値としてテストで固定

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: デッキ（山札・手札・墓地）

**Files:**
- Create: `domain/cards/deck.ts`
- Test: `domain/cards/deck.test.ts`

**Interfaces:**
- Consumes: Task 2 の `getCardDefinition`
- Produces: `DeckState { drawPile; hand; graveyard }` / `HAND_LIMIT` / `INITIAL_HAND_SIZE` / `shuffle(cards, rng)` / `createDeck(cardIds, rng)` / `DrawOutcome { deck; drawn; overflowed }` / `drawOne(deck)` / `discardFromHand(deck, handIndex)`。乱数はここでのみ使い、`stepTick` は決定的に保つ

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/domain/cards/deck.test.ts
/**
 * デッキのテスト
 *
 * ドロー・手札上限・溢れ・墓地行きを検証する。手札上限の溢れは
 * 「引いた札がそのまま墓地へ落ちる」仕様（設計書 §4）であり、
 * プレイヤーは捨て札を選ばない。
 */
import {
  createDeck,
  drawOne,
  discardFromHand,
  shuffle,
  HAND_LIMIT,
  INITIAL_HAND_SIZE,
} from './deck';
import type { RandomFn } from '../shared/random';

/** 常に 0 を返す＝Fisher-Yates が並びを変えない決定的な乱数 */
const zeroRng: RandomFn = () => 0;

describe('shuffle', () => {
  it('元の配列を変更しない', () => {
    const source = ['a', 'b', 'c'];
    shuffle(source, zeroRng);
    expect(source).toEqual(['a', 'b', 'c']);
  });

  it('要素の多重集合を保存する', () => {
    const result = shuffle(['a', 'b', 'b', 'c'], () => 0.5);
    expect([...result].sort()).toEqual(['a', 'b', 'b', 'c']);
  });
});

describe('createDeck', () => {
  it('初期手札を3枚配り、残りが山札になる', () => {
    const deck = createDeck(['a', 'b', 'c', 'd', 'e'], zeroRng);
    expect(deck.hand).toHaveLength(INITIAL_HAND_SIZE);
    expect(deck.drawPile).toHaveLength(2);
    expect(deck.graveyard).toEqual([]);
  });

  it('カードが初期手札より少なくても壊れない', () => {
    const deck = createDeck(['a'], zeroRng);
    expect(deck.hand).toEqual(['a']);
    expect(deck.drawPile).toEqual([]);
  });
});

describe('drawOne', () => {
  it('山札の先頭を手札に加える', () => {
    const deck = { drawPile: ['x', 'y'], hand: ['a'], graveyard: [] };
    const result = drawOne(deck);
    expect(result.drawn).toBe('x');
    expect(result.overflowed).toBe(false);
    expect(result.deck.hand).toEqual(['a', 'x']);
    expect(result.deck.drawPile).toEqual(['y']);
  });

  it('手札が上限なら引いた札は墓地へ直行する', () => {
    const full = Array.from({ length: HAND_LIMIT }, (_, i) => `h${i}`);
    const deck = { drawPile: ['x'], hand: full, graveyard: [] };
    const result = drawOne(deck);
    expect(result.drawn).toBe('x');
    expect(result.overflowed).toBe(true);
    expect(result.deck.hand).toEqual(full);
    expect(result.deck.graveyard).toEqual(['x']);
  });

  it('山札が空なら何も起きない', () => {
    const deck = { drawPile: [], hand: ['a'], graveyard: [] };
    const result = drawOne(deck);
    expect(result.drawn).toBeUndefined();
    expect(result.overflowed).toBe(false);
    expect(result.deck).toEqual(deck);
  });

  it('元の状態を変更しない', () => {
    const deck = { drawPile: ['x'], hand: ['a'], graveyard: [] };
    drawOne(deck);
    expect(deck.drawPile).toEqual(['x']);
    expect(deck.hand).toEqual(['a']);
  });
});

describe('discardFromHand', () => {
  it('指定した手札を墓地へ移す', () => {
    const deck = { drawPile: [], hand: ['a', 'b', 'c'], graveyard: ['z'] };
    const next = discardFromHand(deck, 1);
    expect(next.hand).toEqual(['a', 'c']);
    expect(next.graveyard).toEqual(['z', 'b']);
  });

  it('範囲外のインデックスは何もしない', () => {
    const deck = { drawPile: [], hand: ['a'], graveyard: [] };
    expect(discardFromHand(deck, 5)).toEqual(deck);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/domain/cards/deck --no-coverage`
Expected: FAIL（モジュール未定義）

- [ ] **Step 3: デッキを実装**

```ts
// src/features/ashen-rampart/domain/cards/deck.ts
/**
 * 灰燼の城壁 - デッキ（山札・手札・墓地）
 *
 * 使ったカードは墓地へ行き戻らない（有限）。山札はラン開始時に
 * 一度だけシャッフルし、以後は先頭から引くだけ。これにより
 * stepTick は乱数を必要とせず完全に決定的になる（設計書 §8.1）。
 */
import type { RandomFn } from '../shared/random';

export interface DeckState {
  drawPile: string[];
  hand: string[];
  graveyard: string[];
}

/** 手札上限。超えて引いた札は墓地へ直行する */
export const HAND_LIMIT = 5;

/** ラン開始時に配る枚数 */
export const INITIAL_HAND_SIZE = 3;

/** Fisher-Yates。元配列は変更しない */
export const shuffle = (cards: readonly string[], rng: RandomFn): string[] => {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = result[i];
    const b = result[j];
    if (a !== undefined && b !== undefined) {
      result[i] = b;
      result[j] = a;
    }
  }
  return result;
};

/** シャッフルして初期手札を配る */
export const createDeck = (cardIds: readonly string[], rng: RandomFn): DeckState => {
  const shuffled = shuffle(cardIds, rng);
  return {
    hand: shuffled.slice(0, INITIAL_HAND_SIZE),
    drawPile: shuffled.slice(INITIAL_HAND_SIZE),
    graveyard: [],
  };
};

export interface DrawOutcome {
  deck: DeckState;
  /** 引いた札。山札が空なら undefined */
  drawn?: string;
  /** 手札上限のため墓地へ直行したか */
  overflowed: boolean;
}

/**
 * 山札から1枚引く
 *
 * 手札が上限なら、引いた札はそのまま墓地へ落ちる。
 * 「出さないと引けない」という圧力がこの仕様から生まれる（設計書 §4.1）。
 */
export const drawOne = (deck: DeckState): DrawOutcome => {
  const [drawn, ...rest] = deck.drawPile;
  if (drawn === undefined) {
    return { deck, overflowed: false };
  }
  if (deck.hand.length >= HAND_LIMIT) {
    return {
      deck: { ...deck, drawPile: rest, graveyard: [...deck.graveyard, drawn] },
      drawn,
      overflowed: true,
    };
  }
  return {
    deck: { ...deck, drawPile: rest, hand: [...deck.hand, drawn] },
    drawn,
    overflowed: false,
  };
};

/** 手札の1枚を墓地へ移す（カードを使ったとき） */
export const discardFromHand = (deck: DeckState, handIndex: number): DeckState => {
  const card = deck.hand[handIndex];
  if (card === undefined) return deck;
  return {
    ...deck,
    hand: deck.hand.filter((_, i) => i !== handIndex),
    graveyard: [...deck.graveyard, card],
  };
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/domain/cards/deck --no-coverage`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/domain/cards/deck.ts src/features/ashen-rampart/domain/cards/deck.test.ts
git commit -m "feat(ashen-rampart): 山札・手札・墓地のデッキ規則を追加

- 使った札は墓地へ行き戻らない（有限デッキ）
- 手札上限5枚。溢れたドローは墓地へ直行しプレイヤーは選択しない
- シャッフルはラン開始時の1回のみで stepTick を決定的に保つ

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: CombatState と stepTick（時間・敵の移動・漏れ・勝敗）

戦闘の骨格。この時点では塔は撃たず、敵が湧いて歩いて漏れるだけ。射撃は Task 6 で足す。

**Files:**
- Create: `domain/combat/combat-state.ts`
- Create: `domain/combat/step-tick.ts`
- Test: `domain/combat/step-tick.test.ts`

**Interfaces:**
- Consumes: Task 3 の `getEnemySpec` / `PLAINS_WAVES` / `WaveDefinition`、Task 4 の `DeckState` / `drawOne`、既存の `StageMap` / `isSlowCell`
- Produces: `PlacedTower` / `PlacedTrap` / `PlacedReactor` / `PlacedEmber` / `ActiveEnemy` / `TickEvent` / `CombatState` / `createCombatState(deck, waves)` / `LIFE_INITIAL` / `MANA_INITIAL` / `DRAW_INTERVAL_TICKS` / `PLACE_COOLDOWN_TICKS` / `PlayerAction` / `stepTick(state, actions, map)`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/domain/combat/step-tick.test.ts
/**
 * stepTick のテスト（時間進行・敵の移動・漏れ・勝敗）
 *
 * stepTick は乱数を取らない純粋関数であり、同じ入力からは常に同じ結果になる。
 * この決定性がリプレイと事故の事後判別を支えている。
 */
import { createCombatState, LIFE_INITIAL, DRAW_INTERVAL_TICKS } from './combat-state';
import { stepTick } from './step-tick';
import type { WaveDefinition } from './waves';
import { PLAINS_MAP } from '../board/stage-map';

const emptyDeck = { drawPile: [], hand: [], graveyard: [] };

/** 雑兵1体だけの最小ウェーブ */
const oneGrunt: WaveDefinition[] = [
  { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 0 }] },
];

/** n tick 進める */
const advance = (state: ReturnType<typeof createCombatState>, n: number) => {
  let s = state;
  for (let i = 0; i < n; i++) s = stepTick(s, [], PLAINS_MAP);
  return s;
};

describe('stepTick の時間進行', () => {
  it('1 tick で tick が1進む', () => {
    const state = createCombatState(emptyDeck, oneGrunt);
    expect(stepTick(state, [], PLAINS_MAP).tick).toBe(1);
  });

  it('元の状態を変更しない', () => {
    const state = createCombatState(emptyDeck, oneGrunt);
    stepTick(state, [], PLAINS_MAP);
    expect(state.tick).toBe(0);
  });

  it('決定的: 同じ入力から同じ結果が出る', () => {
    const state = createCombatState(emptyDeck, oneGrunt);
    const a = advance(state, 50);
    const b = advance(state, 50);
    expect(a).toEqual(b);
  });
});

describe('敵の出現と移動', () => {
  it('開始 tick に達すると敵が出現する', () => {
    const state = createCombatState(emptyDeck, oneGrunt);
    const after = advance(state, 1);
    expect(after.enemies.filter((e) => e.alive)).toHaveLength(1);
  });

  it('速度ぶんだけ経路を進む', () => {
    const state = createCombatState(emptyDeck, oneGrunt);
    const after = advance(state, 11);
    const enemy = after.enemies[0];
    // 出現後10tick × 速度0.1 = 進行度1.0
    expect(enemy?.progress).toBeCloseTo(1.0, 5);
  });

  it('滞留セルでは移動が遅くなる', () => {
    const state = createCombatState(emptyDeck, oneGrunt);
    // 経路 index 4 (4,3) が滞留セル。到達までに 40tick 強かかる
    const before = advance(state, 41);
    const after = stepTick(before, [], PLAINS_MAP);
    const delta = (after.enemies[0]?.progress ?? 0) - (before.enemies[0]?.progress ?? 0);
    expect(delta).toBeCloseTo(0.06, 5);
  });

  it('ウェーブの開始 tick まで敵は出ない', () => {
    const late: WaveDefinition[] = [
      { startTick: 100, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 0 }] },
    ];
    const state = createCombatState(emptyDeck, late);
    expect(advance(state, 50).enemies.filter((e) => e.alive)).toHaveLength(0);
    expect(advance(state, 101).enemies.filter((e) => e.alive)).toHaveLength(1);
  });

  it('鴉は経路中盤から出現する', () => {
    const ravens: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'raven', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 5 }] },
    ];
    const after = advance(createCombatState(emptyDeck, ravens), 1);
    expect(after.enemies[0]?.progress).toBe(5);
  });
});

describe('漏れと勝敗', () => {
  it('砦に到達するとライフが1減り leak イベントが出る', () => {
    const state = createCombatState(emptyDeck, oneGrunt);
    // 経路11セル。滞留3セルぶん遅いので余裕を持って進める
    const after = advance(state, 200);
    expect(after.life).toBe(LIFE_INITIAL - 1);
    expect(after.enemies[0]?.leaked).toBe(true);
  });

  it('漏れた敵は二重にライフを減らさない', () => {
    const after = advance(createCombatState(emptyDeck, oneGrunt), 300);
    expect(after.life).toBe(LIFE_INITIAL - 1);
  });

  it('ライフが0になると敗北で止まる', () => {
    const many: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: LIFE_INITIAL, spawnIntervalTicks: 1, spawnPathIndex: 0 }] },
    ];
    const after = advance(createCombatState(emptyDeck, many), 400);
    expect(after.life).toBe(0);
    expect(after.outcome).toBe('lost');
  });

  it('全ての敵を処理し終えると勝利する', () => {
    // 敵0体のウェーブは即座に勝利条件を満たす
    const none: WaveDefinition[] = [{ startTick: 0, entries: [] }];
    expect(advance(createCombatState(emptyDeck, none), 2).outcome).toBe('won');
  });

  it('決着後は状態が変化しない', () => {
    const none: WaveDefinition[] = [{ startTick: 0, entries: [] }];
    const won = advance(createCombatState(emptyDeck, none), 5);
    expect(stepTick(won, [], PLAINS_MAP)).toEqual(won);
  });
});

describe('ドロー', () => {
  it('DRAW_INTERVAL_TICKS ごとに1枚引く', () => {
    const deck = { drawPile: ['arrow-tower', 'ballista'], hand: [], graveyard: [] };
    const state = createCombatState(deck, oneGrunt);
    expect(advance(state, DRAW_INTERVAL_TICKS).deck.hand).toEqual(['arrow-tower']);
    expect(advance(state, DRAW_INTERVAL_TICKS * 2).deck.hand).toEqual([
      'arrow-tower',
      'ballista',
    ]);
  });

  it('手札が上限なら溢れイベントが出る', () => {
    const full = ['a', 'b', 'c', 'd', 'e'];
    const deck = { drawPile: ['arrow-tower'], hand: full, graveyard: [] };
    const after = advance(createCombatState(deck, oneGrunt), DRAW_INTERVAL_TICKS);
    expect(after.deck.graveyard).toEqual(['arrow-tower']);
    expect(after.events).toContainEqual({ kind: 'overflow', cardId: 'arrow-tower' });
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick --no-coverage`
Expected: FAIL（モジュール未定義）

- [ ] **Step 3: CombatState を実装**

```ts
// src/features/ashen-rampart/domain/combat/combat-state.ts
/**
 * 灰燼の城壁 - 戦闘状態
 *
 * リアルタイムでは敵・盤面・手札・マナが相互に影響するため、
 * 1つの状態に集約する（設計書 §8.1）。分割すると追跡が難しくなる。
 */
import type { CellPos } from '../board/stage-map';
import type { DeckState } from '../cards/deck';
import type { WaveDefinition } from './waves';

/** 設置済みの塔（篝火を含む） */
export interface PlacedTower {
  cardId: string;
  pos: CellPos;
  /** 次に撃てるまでの残り tick */
  cooldownLeft: number;
}

/** 設置済みの罠 */
export interface PlacedTrap {
  cardId: string;
  pos: CellPos;
  usesLeft: number;
  /** 既に踏んだ敵の id（同じ敵が同じ罠で二度傷つかない） */
  hitEnemyIds: number[];
}

/** 設置済みの魔力炉 */
export interface PlacedReactor {
  pos: CellPos;
  /** 次にマナを生むまでの残り tick */
  ticksToMana: number;
}

/** 設置済みの燠火 */
export interface PlacedEmber {
  pos: CellPos;
  /** 再点火までの残り tick。0 なら点火できる */
  cooldownLeft: number;
}

/** 盤面にいる敵 */
export interface ActiveEnemy {
  id: number;
  enemyId: string;
  hp: number;
  maxHp: number;
  /** 経路上の進行度（0 = 入口、path.length - 1 = 砦） */
  progress: number;
  spawnTick: number;
  /** 出現する経路 index */
  spawnPathIndex: number;
  alive: boolean;
  leaked: boolean;
}

export type TickEvent =
  | { kind: 'shot'; towerIndex: number; targetId: number }
  | { kind: 'trap'; trapIndex: number; targetId: number }
  | { kind: 'ember'; emberIndex: number }
  | { kind: 'defeat'; enemyId: number }
  | { kind: 'leak'; enemyId: number }
  | { kind: 'mana'; amount: number }
  | { kind: 'draw'; cardId: string }
  | { kind: 'overflow'; cardId: string }
  | { kind: 'played'; cardId: string; pos?: CellPos }
  | { kind: 'rejected'; reason: 'cooldown' | 'mana' | 'target' | 'occupied' };

export type RunOutcome = 'playing' | 'won' | 'lost';

export interface CombatState {
  tick: number;
  life: number;
  mana: number;
  /** 次に配置できるまでの残り tick。0 なら置ける */
  placeCooldown: number;
  /** 次のドローまでの残り tick */
  ticksToDraw: number;
  deck: DeckState;
  towers: PlacedTower[];
  traps: PlacedTrap[];
  reactors: PlacedReactor[];
  embers: PlacedEmber[];
  enemies: ActiveEnemy[];
  /** 時泥の効果が切れる tick（0 = 効果なし） */
  slowUntilTick: number;
  waves: readonly WaveDefinition[];
  /** 直前の tick に起きたこと。描画とログが読む */
  events: TickEvent[];
  outcome: RunOutcome;
}

export const LIFE_INITIAL = 10;
export const MANA_INITIAL = 2;
export const DRAW_INTERVAL_TICKS = 40;
export const PLACE_COOLDOWN_TICKS = 60;

/** ラン開始時の戦闘状態を作る */
export const createCombatState = (
  deck: DeckState,
  waves: readonly WaveDefinition[]
): CombatState => ({
  tick: 0,
  life: LIFE_INITIAL,
  mana: MANA_INITIAL,
  placeCooldown: 0,
  ticksToDraw: DRAW_INTERVAL_TICKS,
  deck,
  towers: [],
  traps: [],
  reactors: [],
  embers: [],
  enemies: [],
  slowUntilTick: 0,
  waves,
  events: [],
  outcome: 'playing',
});
```

- [ ] **Step 4: stepTick を実装（射撃なし）**

```ts
// src/features/ashen-rampart/domain/combat/step-tick.ts
/**
 * 灰燼の城壁 - 1 tick 前進（決定的・純粋関数）
 *
 * 乱数を取らないため、同じ状態と同じ操作列からは常に同じ結果になる。
 * 時間を進めるのは presentation の setInterval だけで、
 * ここにはタイマーも副作用も持ち込まない（設計書 §8.2）。
 *
 * 1 tick の処理順:
 *   操作 → マナ生成 → ドロー → 出現 → 移動 → 罠 → 射撃 → 漏れ → 勝敗
 */
import type { CellPos, StageMap } from '../board/stage-map';
import { isSlowCell } from '../board/stage-map';
import { drawOne } from '../cards/deck';
import { getEnemySpec } from './enemies';
import type { CombatState, ActiveEnemy, TickEvent } from './combat-state';

/** プレイヤーがその tick に行った操作 */
export type PlayerAction =
  | { kind: 'play-card'; handIndex: number; pos?: CellPos }
  | { kind: 'reactivate'; emberIndex: number };

/** 滞留セル上の移動量倍率 */
export const SLOW_TERRAIN_MULT = 0.6;

/** 進行度から補間済みの盤面座標を求める */
export const positionOf = (progress: number, path: readonly CellPos[]): CellPos => {
  if (path.length === 0) return { x: 0, y: 0 };
  const last = path.length - 1;
  const clamped = Math.max(0, Math.min(progress, last));
  const i = Math.min(Math.floor(clamped), Math.max(0, last - 1));
  const a = path[i];
  const b = path[i + 1] ?? a;
  if (!a || !b) return { x: 0, y: 0 };
  const frac = clamped - i;
  return { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
};

/** そのウェーブ定義から、この tick に出現すべき敵を作る */
const spawnAt = (state: CombatState, tick: number, nextId: number): ActiveEnemy[] => {
  const spawned: ActiveEnemy[] = [];
  let id = nextId;
  state.waves.forEach((wave) => {
    wave.entries.forEach((entry) => {
      for (let c = 0; c < entry.count; c++) {
        if (wave.startTick + c * entry.spawnIntervalTicks !== tick) continue;
        const spec = getEnemySpec(entry.enemyId);
        spawned.push({
          id: id++,
          enemyId: entry.enemyId,
          hp: spec.hp,
          maxHp: spec.hp,
          progress: entry.spawnPathIndex,
          spawnTick: tick,
          spawnPathIndex: entry.spawnPathIndex,
          alive: true,
          leaked: false,
        });
      }
    });
  });
  return spawned;
};

/** 全ウェーブの敵が出尽くし、盤面に生きた敵がいないか */
const isCleared = (state: CombatState, tick: number): boolean => {
  const lastSpawnTick = state.waves.reduce((max, wave) => {
    const waveMax = wave.entries.reduce(
      (m, e) => Math.max(m, wave.startTick + Math.max(0, e.count - 1) * e.spawnIntervalTicks),
      wave.startTick
    );
    return Math.max(max, waveMax);
  }, 0);
  if (tick < lastSpawnTick) return false;
  return state.enemies.every((e) => !e.alive);
};

export const stepTick = (
  state: CombatState,
  actions: readonly PlayerAction[],
  map: StageMap
): CombatState => {
  if (state.outcome !== 'playing') return state;

  const events: TickEvent[] = [];
  const tick = state.tick + 1;
  let { life, mana, deck } = state;
  const goal = map.path.length - 1;

  // マナ生成
  const reactors = state.reactors.map((r) => {
    const next = r.ticksToMana - 1;
    if (next > 0) return { ...r, ticksToMana: next };
    const card = 60;
    mana += 1;
    events.push({ kind: 'mana', amount: 1 });
    return { ...r, ticksToMana: card };
  });

  // ドロー
  let ticksToDraw = state.ticksToDraw - 1;
  if (ticksToDraw <= 0) {
    ticksToDraw = 40;
    const outcome = drawOne(deck);
    deck = outcome.deck;
    if (outcome.drawn !== undefined) {
      events.push(
        outcome.overflowed
          ? { kind: 'overflow', cardId: outcome.drawn }
          : { kind: 'draw', cardId: outcome.drawn }
      );
    }
  }

  // 出現
  const nextId = state.enemies.reduce((max, e) => Math.max(max, e.id + 1), 0);
  const spawned = spawnAt(state, tick, nextId);

  // 移動
  const slowMult = tick <= state.slowUntilTick ? 0.6 : 1;
  const moved = [...state.enemies, ...spawned].map((enemy) => {
    if (!enemy.alive) return enemy;
    if (enemy.spawnTick === tick) return enemy;
    const spec = getEnemySpec(enemy.enemyId);
    const cell = map.path[Math.min(Math.floor(enemy.progress), goal)];
    const terrain = cell && isSlowCell(map, cell) ? SLOW_TERRAIN_MULT : 1;
    return { ...enemy, progress: enemy.progress + spec.speed * terrain * slowMult };
  });

  // 漏れ
  const settled = moved.map((enemy) => {
    if (!enemy.alive || enemy.progress < goal) return enemy;
    life -= 1;
    events.push({ kind: 'leak', enemyId: enemy.id });
    return { ...enemy, alive: false, leaked: true };
  });

  const next: CombatState = {
    ...state,
    tick,
    life,
    mana,
    deck,
    reactors,
    ticksToDraw,
    enemies: settled,
    placeCooldown: Math.max(0, state.placeCooldown - 1),
    events,
    outcome: 'playing',
  };

  if (life <= 0) return { ...next, life: 0, outcome: 'lost' };
  if (isCleared(next, tick)) return { ...next, outcome: 'won' };
  return next;
};
```

> **注**: 上記の `actions` は Task 7 で処理を追加する。この時点では受け取るだけで使わない（引数を先に確定させ、後続タスクが署名を変えずに済むようにする）。マナ生成間隔とドロー間隔のリテラル（60 / 40）は Task 7 で定数 import に置き換える。

- [ ] **Step 5: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick --no-coverage`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/combat-state.ts src/features/ashen-rampart/domain/combat/step-tick.ts src/features/ashen-rampart/domain/combat/step-tick.test.ts
git commit -m "feat(ashen-rampart): CombatState と stepTick の骨格を追加

- 1 tick 前進の純粋関数。乱数を取らず完全に決定的
- 敵の出現・移動・滞留地形・漏れ・勝敗判定を実装
- 時間経過ドローと手札溢れを tick イベントとして通知

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: stepTick の戦闘（塔の射撃・飛行判定・範囲・罠・オーラ）

**Files:**
- Modify: `domain/combat/step-tick.ts`
- Test: `domain/combat/step-tick-combat.test.ts`

**Interfaces:**
- Consumes: Task 5 の `CombatState` / `stepTick`、Task 2 の `getCardDefinition`
- Produces: `effectiveDamage(state, towerIndex, map)`（テストから直接検証するため export する）。`stepTick` の署名は変えない

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/domain/combat/step-tick-combat.test.ts
/**
 * stepTick の戦闘部分のテスト
 *
 * 設計原則「最高効率のカードには必ず効かない相手を作る」が
 * 実装として成立していることを、飛行敵への当たり判定で検証する。
 */
import { createCombatState } from './combat-state';
import type { CombatState } from './combat-state';
import { stepTick, effectiveDamage } from './step-tick';
import type { WaveDefinition } from './waves';
import { PLAINS_MAP } from '../board/stage-map';

const emptyDeck = { drawPile: [], hand: [], graveyard: [] };

const waveOf = (enemyId: string, count = 1): WaveDefinition[] => [
  { startTick: 0, entries: [{ enemyId, count, spawnIntervalTicks: 2, spawnPathIndex: 0 }] },
];

/** 塔を1基置いた状態を作る */
const withTower = (state: CombatState, cardId: string, x: number, y: number): CombatState => ({
  ...state,
  towers: [...state.towers, { cardId, pos: { x, y }, cooldownLeft: 0 }],
});

const advance = (state: CombatState, n: number): CombatState => {
  let s = state;
  for (let i = 0; i < n; i++) s = stepTick(s, [], PLAINS_MAP);
  return s;
};

describe('塔の射撃', () => {
  it('射程内の敵にダメージを与える', () => {
    // 経路(1,3) の隣 (1,2) に弓兵。射程1.6で届く
    const state = withTower(createCombatState(emptyDeck, waveOf('grunt')), 'arrow-tower', 1, 2);
    const after = advance(state, 20);
    const enemy = after.enemies[0];
    expect(enemy).toBeDefined();
    expect(enemy && enemy.hp < enemy.maxHp).toBe(true);
  });

  it('攻撃間隔を守る（8tickに1発）', () => {
    const state = withTower(createCombatState(emptyDeck, waveOf('brute')), 'arrow-tower', 1, 2);
    const after = advance(state, 17);
    const shots = after.enemies[0] ? (60 - after.enemies[0].hp) / 6 : 0;
    expect(shots).toBeLessThanOrEqual(3);
    expect(shots).toBeGreaterThanOrEqual(1);
  });

  it('HPが0になると撃破され defeat イベントが出る', () => {
    const state = withTower(createCombatState(emptyDeck, waveOf('swarm')), 'arrow-tower', 1, 2);
    const after = advance(state, 30);
    expect(after.enemies[0]?.alive).toBe(false);
    expect(after.enemies[0]?.leaked).toBe(false);
  });
});

describe('飛行への当たり判定（カウンター要求の中核）', () => {
  it('弓兵は鴉に当たらない', () => {
    const ravens: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'raven', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 5 }] },
    ];
    // 経路 index 5 は (4,2)。その隣 (5,2) に弓兵を置く
    const state = withTower(createCombatState(emptyDeck, ravens), 'arrow-tower', 5, 2);
    const after = advance(state, 20);
    const enemy = after.enemies[0];
    expect(enemy?.hp).toBe(enemy?.maxHp);
  });

  it('弩砲は鴉に当たる', () => {
    const ravens: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'raven', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 5 }] },
    ];
    const state = withTower(createCombatState(emptyDeck, ravens), 'ballista', 5, 2);
    const after = advance(state, 20);
    const enemy = after.enemies[0];
    expect(enemy).toBeDefined();
    expect(enemy && enemy.hp < enemy.maxHp).toBe(true);
  });
});

describe('範囲攻撃', () => {
  it('火砲台は着弾点の周囲にも当たる', () => {
    const state = withTower(
      createCombatState(emptyDeck, waveOf('swarm', 3)),
      'cannon-tower',
      1,
      2
    );
    const after = advance(state, 25);
    const damaged = after.enemies.filter((e) => e.hp < e.maxHp || !e.alive);
    expect(damaged.length).toBeGreaterThanOrEqual(2);
  });
});

describe('篝火のオーラ', () => {
  it('隣接する塔の攻撃力を +25% する', () => {
    const base = withTower(createCombatState(emptyDeck, waveOf('grunt')), 'arrow-tower', 1, 2);
    expect(effectiveDamage(base, 0, PLAINS_MAP)).toBe(6);
    const withBeacon = withTower(base, 'beacon', 2, 2);
    expect(effectiveDamage(withBeacon, 0, PLAINS_MAP)).toBe(8); // round(6 * 1.25)
  });

  it('高台の塔は火力が +30% される', () => {
    // (3,4) は高台
    const high = withTower(createCombatState(emptyDeck, waveOf('grunt')), 'arrow-tower', 3, 4);
    expect(effectiveDamage(high, 0, PLAINS_MAP)).toBe(8); // round(6 * 1.3)
  });

  it('篝火自身は攻撃しない', () => {
    const state = withTower(createCombatState(emptyDeck, waveOf('grunt')), 'beacon', 1, 2);
    const after = advance(state, 20);
    const enemy = after.enemies[0];
    expect(enemy?.hp).toBe(enemy?.maxHp);
  });
});

describe('罠', () => {
  it('経路を踏んだ地上敵にダメージを与え、回数を消費する', () => {
    const state: CombatState = {
      ...createCombatState(emptyDeck, waveOf('grunt', 2)),
      traps: [{ cardId: 'spike-trap', pos: { x: 1, y: 3 }, usesLeft: 3, hitEnemyIds: [] }],
    };
    const after = advance(state, 25);
    expect(after.traps[0]?.usesLeft).toBeLessThan(3);
    expect(after.enemies.some((e) => e.hp < e.maxHp || !e.alive)).toBe(true);
  });

  it('同じ敵は同じ罠で二度傷つかない', () => {
    const state: CombatState = {
      ...createCombatState(emptyDeck, waveOf('brute')),
      traps: [{ cardId: 'spike-trap', pos: { x: 1, y: 3 }, usesLeft: 3, hitEnemyIds: [] }],
    };
    const after = advance(state, 60);
    expect(60 - (after.enemies[0]?.hp ?? 0)).toBe(5);
  });

  it('罠は飛行に当たらない', () => {
    const ravens: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'raven', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 0 }] },
    ];
    const state: CombatState = {
      ...createCombatState(emptyDeck, ravens),
      traps: [{ cardId: 'spike-trap', pos: { x: 1, y: 3 }, usesLeft: 3, hitEnemyIds: [] }],
    };
    const after = advance(state, 30);
    expect(after.traps[0]?.usesLeft).toBe(3);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-combat --no-coverage`
Expected: FAIL（`effectiveDamage` 未定義・ダメージが入らない）

- [ ] **Step 3: 射撃・罠・オーラを実装**

`step-tick.ts` に以下を追加する。import に `getCardDefinition` / `isHighGround` を足し、`stepTick` の「漏れ」処理の**前**に罠と射撃を挿入する。

```ts
// import に追加
import { isSlowCell, isHighGround } from '../board/stage-map';
import { getCardDefinition } from '../cards/card-pool';

/** 高台に設置した塔の火力倍率 */
export const HIGH_GROUND_DAMAGE_MULT = 1.3;

/**
 * 塔の実効ダメージ
 *
 * round(基礎 × 高台倍率 × (1 + Σ隣接オーラ))。倍率の二重適用を避けるため
 * この関数だけがダメージ算出の責務を持つ。
 */
export const effectiveDamage = (
  state: CombatState,
  towerIndex: number,
  map: StageMap
): number => {
  const tower = state.towers[towerIndex];
  if (!tower) return 0;
  const spec = getCardDefinition(tower.cardId).tower;
  if (!spec || spec.aura) return 0;
  const auraBonus = state.towers.reduce((sum, other) => {
    const otherSpec = getCardDefinition(other.cardId).tower;
    if (!otherSpec?.aura) return sum;
    const adjacent =
      Math.abs(other.pos.x - tower.pos.x) <= 1 && Math.abs(other.pos.y - tower.pos.y) <= 1;
    return adjacent ? sum + otherSpec.aura.towerDamageBonus : sum;
  }, 0);
  const highGround = isHighGround(map, tower.pos) ? HIGH_GROUND_DAMAGE_MULT : 1;
  return Math.round(spec.damage * highGround * (1 + auraBonus));
};
```

`stepTick` 内、`// 漏れ` の直前に挿入する処理:

```ts
  // 罠（地上敵のみ・同じ敵は同じ罠で一度だけ）
  const hpById = new Map<number, number>();
  moved.forEach((e) => hpById.set(e.id, e.hp));
  const traps = state.traps.map((trap, trapIndex) => {
    if (trap.usesLeft <= 0) return trap;
    let usesLeft = trap.usesLeft;
    const hitEnemyIds = [...trap.hitEnemyIds];
    const spec = getCardDefinition(trap.cardId).trap;
    if (!spec) return trap;
    moved.forEach((enemy) => {
      if (!enemy.alive || usesLeft <= 0) return;
      if (getEnemySpec(enemy.enemyId).flying) return;
      if (hitEnemyIds.includes(enemy.id)) return;
      const pos = positionOf(enemy.progress, map.path);
      if (Math.hypot(pos.x - trap.pos.x, pos.y - trap.pos.y) > 0.5) return;
      hpById.set(enemy.id, (hpById.get(enemy.id) ?? 0) - spec.damage);
      hitEnemyIds.push(enemy.id);
      usesLeft -= 1;
      events.push({ kind: 'trap', trapIndex, targetId: enemy.id });
    });
    return { ...trap, usesLeft, hitEnemyIds };
  });

  // 射撃（クールダウンを消化し、射程内の先頭の敵を狙う）
  const towers = state.towers.map((tower, towerIndex) => {
    const spec = getCardDefinition(tower.cardId).tower;
    if (!spec || spec.aura) return tower;
    if (tower.cooldownLeft > 0) return { ...tower, cooldownLeft: tower.cooldownLeft - 1 };
    const damage = effectiveDamage(state, towerIndex, map);
    // 砦に近い敵を優先（progress 降順）
    const target = [...moved]
      .filter((e) => e.alive && (hpById.get(e.id) ?? 0) > 0)
      .filter((e) => spec.hitsFlying || !getEnemySpec(e.enemyId).flying)
      .filter((e) => {
        const pos = positionOf(e.progress, map.path);
        return Math.hypot(pos.x - tower.pos.x, pos.y - tower.pos.y) <= spec.range;
      })
      .sort((a, b) => b.progress - a.progress)[0];
    if (!target) return tower;
    hpById.set(target.id, (hpById.get(target.id) ?? 0) - damage);
    events.push({ kind: 'shot', towerIndex, targetId: target.id });
    if (spec.splashRadius > 0) {
      const center = positionOf(target.progress, map.path);
      moved.forEach((other) => {
        if (other.id === target.id || !other.alive) return;
        if (!spec.hitsFlying && getEnemySpec(other.enemyId).flying) return;
        const pos = positionOf(other.progress, map.path);
        if (Math.hypot(pos.x - center.x, pos.y - center.y) <= spec.splashRadius) {
          hpById.set(other.id, (hpById.get(other.id) ?? 0) - damage);
        }
      });
    }
    return { ...tower, cooldownLeft: spec.cooldownTicks };
  });

  // ダメージを反映し、撃破を確定する
  const damaged = moved.map((enemy) => {
    if (!enemy.alive) return enemy;
    const hp = hpById.get(enemy.id) ?? enemy.hp;
    if (hp > 0) return { ...enemy, hp };
    events.push({ kind: 'defeat', enemyId: enemy.id });
    return { ...enemy, hp: 0, alive: false };
  });
```

以降の「漏れ」処理は `moved` ではなく `damaged` を対象にし、戻り値の `enemies` / `towers` / `traps` を更新する:

```ts
  const settled = damaged.map((enemy) => {
    if (!enemy.alive || enemy.progress < goal) return enemy;
    life -= 1;
    events.push({ kind: 'leak', enemyId: enemy.id });
    return { ...enemy, alive: false, leaked: true };
  });

  const next: CombatState = {
    ...state,
    tick,
    life,
    mana,
    deck,
    reactors,
    towers,
    traps,
    ticksToDraw,
    enemies: settled,
    placeCooldown: Math.max(0, state.placeCooldown - 1),
    events,
    outcome: 'playing',
  };
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/domain/combat --no-coverage`
Expected: PASS（Task 5 のテストも含めて全件）

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/step-tick.ts src/features/ashen-rampart/domain/combat/step-tick-combat.test.ts
git commit -m "feat(ashen-rampart): 塔の射撃・範囲・罠・オーラを stepTick に実装

- hitsFlying による飛行の当たり判定（カウンター要求の中核）
- 実効ダメージは effectiveDamage に集約し倍率の二重適用を防ぐ
- 罠は地上のみ・同じ敵は同じ罠で一度だけ

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: カード配置・マナ・配置クールダウン・時泥

プレイヤー操作を `stepTick` に接続する。ここで初めて「札を出す」ことができる。

**Files:**
- Modify: `domain/combat/step-tick.ts`
- Test: `domain/combat/step-tick-actions.test.ts`

**Interfaces:**
- Consumes: Task 5 の `PlayerAction` / `CombatState`、Task 2 の `getCardDefinition` / `placementKindOf`、Task 4 の `discardFromHand`
- Produces: `canPlaceAt(state, card, pos, map)`（配置可否の純粋関数。UI のハイライトが使う）。`stepTick` が `play-card` アクションを処理するようになる

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/domain/combat/step-tick-actions.test.ts
/**
 * プレイヤー操作のテスト
 *
 * 「排他的な選択」（配置クールダウン）と「代償」（マナ・スロット消費）は
 * 仮説の必要条件そのものであり、ここが緩むと配分が発生しない（設計書 §4.1）。
 */
import { createCombatState, PLACE_COOLDOWN_TICKS, MANA_INITIAL } from './combat-state';
import type { CombatState } from './combat-state';
import { stepTick, canPlaceAt } from './step-tick';
import type { WaveDefinition } from './waves';
import { PLAINS_MAP } from '../board/stage-map';
import { getCardDefinition } from '../cards/card-pool';

const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];

const stateWithHand = (hand: string[]): CombatState =>
  createCombatState({ drawPile: [], hand, graveyard: [] }, noWave);

const play = (state: CombatState, handIndex: number, pos?: { x: number; y: number }) =>
  stepTick(state, [{ kind: 'play-card', handIndex, pos }], PLAINS_MAP);

describe('canPlaceAt', () => {
  it('塔は設置スロットにだけ置ける', () => {
    const card = getCardDefinition('arrow-tower');
    const empty = stateWithHand([]);
    expect(canPlaceAt(empty, card, { x: 1, y: 2 }, PLAINS_MAP)).toBe(true);
    expect(canPlaceAt(empty, card, { x: 1, y: 3 }, PLAINS_MAP)).toBe(false);
  });

  it('罠は経路にだけ置ける', () => {
    const card = getCardDefinition('spike-trap');
    const empty = stateWithHand([]);
    expect(canPlaceAt(empty, card, { x: 1, y: 3 }, PLAINS_MAP)).toBe(true);
    expect(canPlaceAt(empty, card, { x: 1, y: 2 }, PLAINS_MAP)).toBe(false);
  });

  it('埋まっているスロットには置けない', () => {
    const card = getCardDefinition('arrow-tower');
    const occupied: CombatState = {
      ...stateWithHand([]),
      towers: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, cooldownLeft: 0 }],
    };
    expect(canPlaceAt(occupied, card, { x: 1, y: 2 }, PLAINS_MAP)).toBe(false);
  });

  it('魔力炉も燠火もスロットを消費する', () => {
    const empty = stateWithHand([]);
    const occupied: CombatState = {
      ...empty,
      reactors: [{ pos: { x: 1, y: 2 }, ticksToMana: 60 }],
    };
    expect(canPlaceAt(occupied, getCardDefinition('ember-blast'), { x: 1, y: 2 }, PLAINS_MAP)).toBe(
      false
    );
  });
});

describe('カード配置', () => {
  it('塔を置くとマナが減り手札から墓地へ移る', () => {
    const state = stateWithHand(['arrow-tower']);
    const after = play(state, 0, { x: 1, y: 2 });
    expect(after.towers).toHaveLength(1);
    expect(after.mana).toBe(MANA_INITIAL - 2);
    expect(after.deck.hand).toEqual([]);
    expect(after.deck.graveyard).toEqual(['arrow-tower']);
  });

  it('配置クールダウンが立ち、次の tick では置けない', () => {
    const state = stateWithHand(['arrow-tower', 'spike-trap']);
    const first = play(state, 0, { x: 1, y: 2 });
    expect(first.placeCooldown).toBe(PLACE_COOLDOWN_TICKS);
    const second = play(first, 0, { x: 1, y: 3 });
    expect(second.traps).toHaveLength(0);
    expect(second.events).toContainEqual({ kind: 'rejected', reason: 'cooldown' });
  });

  it('マナが足りなければ置けない', () => {
    const state = stateWithHand(['ballista']); // コスト3、初期マナ2
    const after = play(state, 0, { x: 1, y: 2 });
    expect(after.towers).toHaveLength(0);
    expect(after.events).toContainEqual({ kind: 'rejected', reason: 'mana' });
  });

  it('魔力炉はコスト0なのでマナ0でも置ける', () => {
    const state: CombatState = { ...stateWithHand(['reactor']), mana: 0 };
    const after = play(state, 0, { x: 1, y: 2 });
    expect(after.reactors).toHaveLength(1);
  });

  it('置けない場所を指定すると拒否される', () => {
    const state = stateWithHand(['arrow-tower']);
    const after = play(state, 0, { x: 0, y: 0 });
    expect(after.towers).toHaveLength(0);
    expect(after.events).toContainEqual({ kind: 'rejected', reason: 'target' });
  });

  it('時泥は対象を取らず盤面に残らない', () => {
    const state = stateWithHand(['mud-time']);
    const after = play(state, 0);
    expect(after.towers).toHaveLength(0);
    expect(after.slowUntilTick).toBe(after.tick + 200);
    expect(after.deck.graveyard).toEqual(['mud-time']);
  });

  it('業火は即座にダメージを与え燠火として残る', () => {
    const wave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 0 }] },
    ];
    let state = createCombatState({ drawPile: [], hand: ['ember-blast'], graveyard: [] }, wave);
    state = stepTick(state, [], PLAINS_MAP); // 敵を出現させる
    const after = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: { x: 1, y: 2 } }], PLAINS_MAP);
    expect(after.embers).toHaveLength(1);
    expect(after.enemies[0]?.hp).toBe(12); // 20 - 8
  });
});

describe('燠火の再点火', () => {
  it('クールダウン中は点火できない', () => {
    const state: CombatState = {
      ...stateWithHand([]),
      embers: [{ pos: { x: 1, y: 2 }, cooldownLeft: 100 }],
    };
    const after = stepTick(state, [{ kind: 'reactivate', emberIndex: 0 }], PLAINS_MAP);
    expect(after.events).not.toContainEqual({ kind: 'ember', emberIndex: 0 });
  });

  it('クールダウン0なら点火でき、マナも配置クールダウンも消費しない', () => {
    const wave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 0 }] },
    ];
    let state = createCombatState({ drawPile: [], hand: [], graveyard: [] }, wave);
    state = { ...stepTick(state, [], PLAINS_MAP), embers: [{ pos: { x: 1, y: 2 }, cooldownLeft: 0 }] };
    const after = stepTick(state, [{ kind: 'reactivate', emberIndex: 0 }], PLAINS_MAP);
    expect(after.events).toContainEqual({ kind: 'ember', emberIndex: 0 });
    expect(after.mana).toBe(MANA_INITIAL);
    expect(after.placeCooldown).toBe(0);
    expect(after.embers[0]?.cooldownLeft).toBe(300);
  });

  it('再点火可能な状態はクールダウンが0で止まり消えない', () => {
    let state: CombatState = {
      ...stateWithHand([]),
      embers: [{ pos: { x: 1, y: 2 }, cooldownLeft: 2 }],
    };
    for (let i = 0; i < 10; i++) state = stepTick(state, [], PLAINS_MAP);
    expect(state.embers[0]?.cooldownLeft).toBe(0);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-actions --no-coverage`
Expected: FAIL（`canPlaceAt` 未定義・操作が無視される）

- [ ] **Step 3: 配置可否を実装**

`step-tick.ts` に追加する。

```ts
// import に追加
import { placementKindOf, type CardDefinition } from '../cards/card-definition';
import { discardFromHand } from '../cards/deck';
import { DRAW_INTERVAL_TICKS, PLACE_COOLDOWN_TICKS } from './combat-state';

const samePos = (a: CellPos, b: CellPos): boolean => a.x === b.x && a.y === b.y;

/** そのスロットが既に何かで埋まっているか */
const isSlotOccupied = (state: CombatState, pos: CellPos): boolean =>
  state.towers.some((t) => samePos(t.pos, pos)) ||
  state.reactors.some((r) => samePos(r.pos, pos)) ||
  state.embers.some((e) => samePos(e.pos, pos));

/**
 * そのカードをその位置に置けるか
 *
 * UI はこれを使って「置けるマスだけをハイライト」する（設計書 §9.7）。
 * 選択空間 60通りを数個に落とすための判定であり、ドメインが唯一の真実を持つ。
 */
export const canPlaceAt = (
  state: CombatState,
  card: CardDefinition,
  pos: CellPos,
  map: StageMap
): boolean => {
  const kind = placementKindOf(card);
  if (kind === 'none') return false;
  if (kind === 'path') {
    return (
      map.path.some((c) => samePos(c, pos)) && !state.traps.some((t) => samePos(t.pos, pos))
    );
  }
  return map.buildSlots.some((c) => samePos(c, pos)) && !isSlotOccupied(state, pos);
};
```

- [ ] **Step 4: stepTick に操作処理を実装**

`stepTick` の冒頭（`const events: TickEvent[] = []` の直後、マナ生成の前）に挿入する。ここで組み立てた設置物は、その tick の射撃・罠処理からそのまま使われる。

```ts
  // --- プレイヤー操作 ---
  let deckAfterActions = state.deck;
  let manaAfterActions = state.mana;
  let placeCooldown = Math.max(0, state.placeCooldown - 1);
  let slowUntilTick = state.slowUntilTick;
  const towersDraft = [...state.towers];
  const trapsDraft = [...state.traps];
  const reactorsDraft = [...state.reactors];
  const embersDraft = [...state.embers];
  /** 業火・燠火が与える即時ダメージ。敵の HP 反映時に適用する */
  const blasts: { pos: CellPos; radius: number; damage: number }[] = [];

  actions.forEach((action) => {
    if (action.kind === 'reactivate') {
      const ember = embersDraft[action.emberIndex];
      if (!ember || ember.cooldownLeft > 0) return;
      const spec = getCardDefinition('ember-blast').ember;
      if (!spec) return;
      embersDraft[action.emberIndex] = { ...ember, cooldownLeft: spec.cooldownTicks };
      blasts.push({ pos: ember.pos, radius: spec.radius, damage: spec.damage });
      events.push({ kind: 'ember', emberIndex: action.emberIndex });
      return;
    }
    if (placeCooldown > 0) {
      events.push({ kind: 'rejected', reason: 'cooldown' });
      return;
    }
    const cardId = deckAfterActions.hand[action.handIndex];
    if (cardId === undefined) {
      events.push({ kind: 'rejected', reason: 'target' });
      return;
    }
    const card = getCardDefinition(cardId);
    if (card.cost > manaAfterActions) {
      events.push({ kind: 'rejected', reason: 'mana' });
      return;
    }
    const kind = placementKindOf(card);
    if (kind !== 'none') {
      if (!action.pos || !canPlaceAt(state, card, action.pos, map)) {
        events.push({ kind: 'rejected', reason: 'target' });
        return;
      }
    }
    // ここから確定
    manaAfterActions -= card.cost;
    deckAfterActions = discardFromHand(deckAfterActions, action.handIndex);
    placeCooldown = PLACE_COOLDOWN_TICKS;
    events.push({ kind: 'played', cardId, pos: action.pos });

    if (card.type === 'tower' && action.pos) {
      towersDraft.push({ cardId, pos: action.pos, cooldownLeft: 0 });
    } else if (card.type === 'trap' && action.pos && card.trap) {
      trapsDraft.push({ cardId, pos: action.pos, usesLeft: card.trap.uses, hitEnemyIds: [] });
    } else if (card.type === 'reactor' && action.pos && card.reactor) {
      reactorsDraft.push({ pos: action.pos, ticksToMana: card.reactor.intervalTicks });
    } else if (card.type === 'ember' && action.pos && card.ember) {
      embersDraft.push({ pos: action.pos, cooldownLeft: card.ember.cooldownTicks });
      blasts.push({ pos: action.pos, radius: card.ember.radius, damage: card.ember.damage });
    } else if (card.type === 'spell' && card.spell) {
      slowUntilTick = tick + card.spell.durationTicks;
    }
  });
```

以降、`stepTick` 本体を次のように書き換える。

- マナ生成は `reactorsDraft` を対象にし、`manaAfterActions` を増やす。間隔リテラル 60 は `card.reactor.intervalTicks` ではなく設置時に入れた値を使うため、`ticksToMana` が 0 以下になったら `getCardDefinition('reactor').reactor.intervalTicks` で戻す
- ドロー間隔のリテラル 40 は `DRAW_INTERVAL_TICKS` に置き換える
- 燠火のクールダウンを毎 tick 1 減らす（0 で止める）:

```ts
  const embers = embersDraft.map((e) => ({
    ...e,
    cooldownLeft: Math.max(0, e.cooldownLeft - 1),
  }));
```

- 罠・射撃は `trapsDraft` / `towersDraft` を対象にする
- 業火の即時ダメージを `hpById` に適用する（射撃の直後、ダメージ反映の直前）:

```ts
  blasts.forEach((blast) => {
    moved.forEach((enemy) => {
      if (!enemy.alive || getEnemySpec(enemy.enemyId).flying) return;
      const pos = positionOf(enemy.progress, map.path);
      if (Math.hypot(pos.x - blast.pos.x, pos.y - blast.pos.y) <= blast.radius) {
        hpById.set(enemy.id, (hpById.get(enemy.id) ?? 0) - blast.damage);
      }
    });
  });
```

- 戻り値に `mana: manaAfterActions` / `deck: deckAfterActions` / `placeCooldown` / `slowUntilTick` / `embers` / `traps` / `towers` / `reactors` を反映する

- [ ] **Step 5: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/domain/combat --no-coverage`
Expected: PASS（Task 5・6 のテスト含む全件）

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/step-tick.ts src/features/ashen-rampart/domain/combat/step-tick-actions.test.ts
git commit -m "feat(ashen-rampart): カード配置・マナ・配置クールダウン・燠火の再点火を実装

- 配置クールダウン60tickで選択を排他的にする（仮説の必要条件）
- canPlaceAt をドメインに置き、UI のハイライトと判定を一元化
- 燠火の再点火はマナも配置クールダウンも消費せず、可能状態は消えない

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: ラン開始とプリセット選択（application 層）

**Files:**
- Create: `application/use-cases/start-run.ts`
- Test: `application/use-cases/start-run.test.ts`

**Interfaces:**
- Consumes: Task 2 の `PRESET_DECKS`、Task 4 の `createDeck`、Task 5 の `createCombatState`、既存の `RandomPort` / `PLAINS_WAVES`
- Produces: `startRun(presetId, random): CombatState`。presentation はこれだけを呼んでランを始める

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/application/use-cases/start-run.test.ts
/**
 * ラン開始のテスト
 *
 * 乱数はここでのシャッフル1回だけに閉じ込める。同じシードからは
 * 同じドロー順になり、事故と判断を事後に切り分けられる（設計書 §12.4）。
 */
import { startRun } from './start-run';
import { SeededRandom } from '../../infrastructure/random/seeded-random';
import { DECK_SIZE } from '../../domain/cards/card-pool';
import { INITIAL_HAND_SIZE } from '../../domain/cards/deck';
import { LIFE_INITIAL, MANA_INITIAL } from '../../domain/combat/combat-state';

describe('startRun', () => {
  it('初期手札3枚と残り山札で開始する', () => {
    const state = startRun('swift', new SeededRandom(1));
    expect(state.deck.hand).toHaveLength(INITIAL_HAND_SIZE);
    expect(state.deck.drawPile).toHaveLength(DECK_SIZE - INITIAL_HAND_SIZE);
    expect(state.deck.graveyard).toEqual([]);
  });

  it('ライフとマナが初期値になる', () => {
    const state = startRun('swift', new SeededRandom(1));
    expect(state.life).toBe(LIFE_INITIAL);
    expect(state.mana).toBe(MANA_INITIAL);
    expect(state.tick).toBe(0);
    expect(state.outcome).toBe('playing');
  });

  it('同じシードからは同じ手札になる（決定性）', () => {
    const a = startRun('swift', new SeededRandom(42));
    const b = startRun('swift', new SeededRandom(42));
    expect(a.deck.hand).toEqual(b.deck.hand);
    expect(a.deck.drawPile).toEqual(b.deck.drawPile);
  });

  it('異なるシードでは並びが変わる', () => {
    const a = startRun('swift', new SeededRandom(1));
    const b = startRun('swift', new SeededRandom(2));
    expect(a.deck.drawPile).not.toEqual(b.deck.drawPile);
  });

  it('プリセットごとに構成が変わる', () => {
    const swift = startRun('swift', new SeededRandom(1));
    const heavy = startRun('heavy', new SeededRandom(1));
    const countReactor = (cards: string[]) => cards.filter((c) => c === 'reactor').length;
    const all = (s: typeof swift) => [...s.deck.hand, ...s.deck.drawPile];
    expect(countReactor(all(swift))).toBe(2);
    expect(countReactor(all(heavy))).toBe(3);
  });

  it('未知のプリセットIDは契約違反として例外', () => {
    expect(() => startRun('unknown', new SeededRandom(1))).toThrow(
      '未知のプリセットデッキです: unknown'
    );
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/application --no-coverage`
Expected: FAIL（モジュール未定義）

- [ ] **Step 3: 実装**

```ts
// src/features/ashen-rampart/application/use-cases/start-run.ts
/**
 * 灰燼の城壁 - ラン開始
 *
 * 乱数を使うのはここだけ。以後 stepTick は決定的に進むため、
 * シードを記録すればランを完全に再現できる。
 */
import type { RandomPort } from '../ports/random-port';
import { PRESET_DECKS } from '../../domain/cards/card-pool';
import { createDeck } from '../../domain/cards/deck';
import { createCombatState, type CombatState } from '../../domain/combat/combat-state';
import { PLAINS_WAVES } from '../../domain/combat/waves';

export const startRun = (presetId: string, random: RandomPort): CombatState => {
  const preset = PRESET_DECKS[presetId];
  if (!preset) {
    throw new Error(`未知のプリセットデッキです: ${presetId}`);
  }
  const deck = createDeck(preset.cards, () => random.random());
  return createCombatState(deck, PLAINS_WAVES);
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/application --no-coverage`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/application/use-cases/start-run.ts src/features/ashen-rampart/application/use-cases/start-run.test.ts
git commit -m "feat(ashen-rampart): ラン開始ユースケースを追加

- 乱数はシャッフル1回に閉じ込め、以後の進行を決定的に保つ
- プリセットデッキから初期手札3枚を配る

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: 自動検算テストとバランス較正

**設計書 §7 の「支配戦略が生まれていないか」の回帰テスト。** 実プレイの前にここで難度を較正する。手で当てにいかない。

**Files:**
- Create: `domain/combat/balance.test.ts`
- Create: `test-helpers/run-simulation.ts`（feature 内: `domain/combat/run-simulation.ts`）
- Modify: `domain/combat/waves.ts`（較正の結果として数値を調整する場合のみ）

**Interfaces:**
- Consumes: Task 5〜8 のすべて
- Produces: `simulateRun(state, strategy, map): RunSimulationResult`。UI 抜きでランを丸ごと回すヘルパー

- [ ] **Step 1: シミュレーションヘルパーを書く**

```ts
// src/features/ashen-rampart/domain/combat/run-simulation.ts
/**
 * 灰燼の城壁 - UI 抜きでランを丸ごと回すヘルパー（テスト用）
 *
 * stepTick が純粋関数であることの見返り。バランス較正と
 * 支配戦略の検出を自動テストとして常設できる（設計書 §7）。
 */
import type { StageMap } from '../board/stage-map';
import type { CombatState } from './combat-state';
import { stepTick, type PlayerAction } from './step-tick';

/** その tick に何をするかを決める関数。プレイヤーの代役 */
export type Strategy = (state: CombatState, map: StageMap) => PlayerAction[];

export interface RunSimulationResult {
  outcome: CombatState['outcome'];
  ticks: number;
  lifeLeft: number;
  cardsPlayed: number;
  finalState: CombatState;
}

/** 安全弁。ラン長 950 tick を大きく超えたら打ち切る */
export const SIMULATION_MAX_TICKS = 3000;

export const simulateRun = (
  initial: CombatState,
  strategy: Strategy,
  map: StageMap
): RunSimulationResult => {
  let state = initial;
  let cardsPlayed = 0;
  while (state.outcome === 'playing' && state.tick < SIMULATION_MAX_TICKS) {
    const actions = strategy(state, map);
    state = stepTick(state, actions, map);
    cardsPlayed += state.events.filter((e) => e.kind === 'played').length;
  }
  return {
    outcome: state.outcome,
    ticks: state.tick,
    lifeLeft: state.life,
    cardsPlayed,
    finalState: state,
  };
};

/**
 * 素直な戦略: 置けるなら手札の先頭から置ける札を置き、燠火は点火できるなら点火する
 *
 * 人間の上手さを模さない。「雑に遊んでも勝ててしまうか」を測るための下限。
 */
export const greedyStrategy: Strategy = (state, map) => {
  const actions: PlayerAction[] = [];
  state.embers.forEach((ember, emberIndex) => {
    if (ember.cooldownLeft === 0) actions.push({ kind: 'reactivate', emberIndex });
  });
  if (state.placeCooldown > 0) return actions;
  // 実装は Step 3 で完成させる
  return actions;
};
```

- [ ] **Step 2: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/domain/combat/balance.test.ts
/**
 * バランスの回帰テスト
 *
 * 前作は支配戦略の検算をせずに実装し、3回の実プレイを費やして初めて
 * 欠陥を知った。同じことを繰り返さないため、CI で常時検証する。
 */
import { startRun } from '../../application/use-cases/start-run';
import { SeededRandom } from '../../infrastructure/random/seeded-random';
import { PLAINS_MAP } from '../board/stage-map';
import { PLAINS_WAVES, totalEnemyHp } from './waves';
import { createCombatState } from './combat-state';
import { createDeck } from '../cards/deck';
import { simulateRun, greedyStrategy } from './run-simulation';

const SEEDS = [1, 2, 3, 4, 5];

describe('支配戦略が存在しないこと', () => {
  it('弓兵だけのデッキでは勝てない（飛行に触れないため）', () => {
    const deck = createDeck(Array.from({ length: 20 }, () => 'arrow-tower'), () => 0.5);
    const result = simulateRun(createCombatState(deck, PLAINS_WAVES), greedyStrategy, PLAINS_MAP);
    expect(result.outcome).toBe('lost');
  });

  it('魔力炉だけのデッキでは勝てない（火力が無いため）', () => {
    const deck = createDeck(Array.from({ length: 20 }, () => 'reactor'), () => 0.5);
    const result = simulateRun(createCombatState(deck, PLAINS_WAVES), greedyStrategy, PLAINS_MAP);
    expect(result.outcome).toBe('lost');
  });

  it('業火だけのデッキでは勝てない（飛行に触れないため）', () => {
    const deck = createDeck(Array.from({ length: 20 }, () => 'ember-blast'), () => 0.5);
    const result = simulateRun(createCombatState(deck, PLAINS_WAVES), greedyStrategy, PLAINS_MAP);
    expect(result.outcome).toBe('lost');
  });
});

describe('難度の較正', () => {
  it('素直な戦略では過半数のランで勝てない（配分の余地が残っている）', () => {
    const wins = SEEDS.filter(
      (seed) =>
        simulateRun(startRun('swift', new SeededRandom(seed)), greedyStrategy, PLAINS_MAP)
          .outcome === 'won'
    ).length;
    expect(wins).toBeLessThanOrEqual(2);
  });

  it('素直な戦略でも全敗ではない（理不尽ではない）', () => {
    const survived = SEEDS.filter(
      (seed) =>
        simulateRun(startRun('swift', new SeededRandom(seed)), greedyStrategy, PLAINS_MAP)
          .lifeLeft > 0 ||
        simulateRun(startRun('heavy', new SeededRandom(seed)), greedyStrategy, PLAINS_MAP)
          .lifeLeft > 0
    ).length;
    expect(survived).toBeGreaterThan(0);
  });

  it('プリセット2種の勝敗が極端に偏らない', () => {
    const winsOf = (preset: string) =>
      SEEDS.filter(
        (seed) =>
          simulateRun(startRun(preset, new SeededRandom(seed)), greedyStrategy, PLAINS_MAP)
            .outcome === 'won'
      ).length;
    expect(Math.abs(winsOf('swift') - winsOf('heavy'))).toBeLessThanOrEqual(3);
  });
});

describe('較正の基準値', () => {
  it('敵の総HPが 1472 から変わっていない', () => {
    // 敵数を変えたら §9.3 の描画密度（スタック表示）を再計算すること
    expect(totalEnemyHp(PLAINS_WAVES)).toBe(1472);
  });
});
```

- [ ] **Step 3: greedyStrategy を完成させる**

```ts
// run-simulation.ts の greedyStrategy を差し替え
import { getCardDefinition } from '../cards/card-pool';
import { placementKindOf } from '../cards/card-definition';
import { canPlaceAt } from './step-tick';

export const greedyStrategy: Strategy = (state, map) => {
  const actions: PlayerAction[] = [];
  state.embers.forEach((ember, emberIndex) => {
    if (ember.cooldownLeft === 0) actions.push({ kind: 'reactivate', emberIndex });
  });
  if (state.placeCooldown > 0) return actions;

  for (let handIndex = 0; handIndex < state.deck.hand.length; handIndex++) {
    const cardId = state.deck.hand[handIndex];
    if (cardId === undefined) continue;
    const card = getCardDefinition(cardId);
    if (card.cost > state.mana) continue;
    const kind = placementKindOf(card);
    if (kind === 'none') {
      actions.push({ kind: 'play-card', handIndex });
      return actions;
    }
    const candidates = kind === 'path' ? map.path : map.buildSlots;
    const pos = candidates.find((c) => canPlaceAt(state, card, c, map));
    if (pos) {
      actions.push({ kind: 'play-card', handIndex, pos });
      return actions;
    }
  }
  return actions;
};
```

- [ ] **Step 4: テストを実行し、較正する**

Run: `npx jest src/features/ashen-rampart/domain/combat/balance --no-coverage`

Expected: 初回は「難度の較正」が落ちる可能性が高い。落ちた場合は次の順で `waves.ts` を調整し、**調整のたびに `totalEnemyHp` の期待値と `balance.test.ts` の基準値も更新する**:

1. 勝ちすぎる（`wins > 2`）→ 各ウェーブの `count` を 1.2 倍ずつ増やす
2. 負けすぎる（全ラン `lifeLeft === 0`）→ `count` を 0.85 倍ずつ減らす
3. どちらも 3 回調整して収束しない場合は `LIFE_INITIAL` を ±2 動かす

較正後の `totalEnemyHp` を設計書 §6 の表に反映すること（設計書のコミットは Task 12 でまとめて行う）。

- [ ] **Step 5: 全テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart --no-coverage`
Expected: PASS（全件）

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/run-simulation.ts src/features/ashen-rampart/domain/combat/balance.test.ts src/features/ashen-rampart/domain/combat/waves.ts
git commit -m "test(ashen-rampart): 支配戦略の回帰テストとバランス較正を追加

- UI 抜きでランを丸ごと回す simulateRun を追加
- 単一カードデッキ（弓兵/魔力炉/業火）では勝てないことを常時検証
- 素直な戦略で勝ちすぎないことを難度の基準にする

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: 盤面描画（敵の視覚表現・スタック表示・ハイライト）

**Files:**
- Create: `presentation/enemy-visual.ts`
- Create: `presentation/enemy-visual.test.ts`
- Create: `presentation/enemy-stack.ts`
- Create: `presentation/enemy-stack.test.ts`
- Create: `presentation/EnemyMarker.tsx`
- Create: `presentation/BoardGrid.tsx`
- Create: `presentation/BoardGrid.test.tsx`
- Create: `presentation/theme.ts`

**Interfaces:**
- Consumes: Task 3 の `getEnemySpec`、Task 5 の `ActiveEnemy` / `positionOf`、Task 7 の `canPlaceAt`
- Produces: `COLORS`（配色トークン）/ `getEnemyVisual(enemyId)` / `HP_BAR_COLOR` / `MAX_ENEMY_HP` / `getHpBarWidthPct(maxHp)` / `getShapeClipPath(shape)` / `stackEnemies(enemies, path)` / `EnemyStack` / `EnemyMarker` / `BoardGrid`

- [ ] **Step 1: 配色トークンを作る**

```ts
// src/features/ashen-rampart/presentation/theme.ts
/**
 * 灰燼の城壁 - 配色トークン（設計書 §9.4）
 *
 * 60-30-10。赤は危険専用に予約し、枠やパネルには使わない。
 * 前作は赤を主色に使ったため、リアルタイムで本当の危険を赤で伝えられなくなる
 * 問題を抱えていた。
 */
export const COLORS = {
  /** ドミナント60%: 灰燼の暗色。背景・盤面の地 */
  dominant: '#1a1614',
  /** セカンダリ30%: 灰白。テキスト・枠・パネル */
  secondary: '#e8ded2',
  /** アクセント10%: 危険専用（ライフ低下・被弾・警告） */
  danger: '#8b2635',
  /** アクセント: 好機（配置可能・再点火可能・要操作） */
  opportunity: '#e8a33d',
  /** 盤面のセル境界 */
  grid: '#3a322c',
} as const;
```

- [ ] **Step 2: 敵の視覚表現とスタック集約のテストを書く**

```ts
// src/features/ashen-rampart/presentation/enemy-visual.test.ts
/**
 * 敵の視覚表現のテスト
 *
 * 敵種は「形 × サイズ × 色」の3重符号で区別する。グレースケールでも
 * 形とサイズだけで見分けられることが要件（S1 の教訓）。
 */
import { getEnemyVisual, getHpBarWidthPct, getShapeClipPath, MAX_ENEMY_HP } from './enemy-visual';
import { ENEMY_IDS } from '../domain/combat/enemies';

describe('getEnemyVisual', () => {
  it('敵5種すべてに視覚表現がある', () => {
    ENEMY_IDS.forEach((id) => expect(() => getEnemyVisual(id)).not.toThrow());
  });

  it('形かサイズのどちらかが必ず異なる（色に依存しない）', () => {
    const keys = ENEMY_IDS.map((id) => {
      const v = getEnemyVisual(id);
      return `${v.shape}:${v.sizePct}`;
    });
    expect(new Set(keys).size).toBe(ENEMY_IDS.length);
  });

  it('表示名は敵定義の名前を引き継ぐ', () => {
    expect(getEnemyVisual('raven').name).toBe('鴉');
  });

  it('未知のIDは契約違反として例外', () => {
    expect(() => getEnemyVisual('unknown')).toThrow('視覚表現が未定義の敵IDです: unknown');
  });
});

describe('getHpBarWidthPct', () => {
  it('最大HPが大きいほどバーが長い（絶対スケール）', () => {
    expect(getHpBarWidthPct(60)).toBeGreaterThan(getHpBarWidthPct(20));
    expect(getHpBarWidthPct(20)).toBeGreaterThan(getHpBarWidthPct(8));
  });

  it('MAX_ENEMY_HP を超えても上限で頭打ちになる', () => {
    expect(getHpBarWidthPct(MAX_ENEMY_HP * 2)).toBe(getHpBarWidthPct(MAX_ENEMY_HP));
  });
});

describe('getShapeClipPath', () => {
  it('円は clip-path を使わない', () => {
    expect(getShapeClipPath('circle')).toBeUndefined();
  });

  it('菱形と六角形は clip-path を返す', () => {
    expect(getShapeClipPath('diamond')).toContain('polygon');
    expect(getShapeClipPath('hexagon')).toContain('polygon');
  });
});
```

```ts
// src/features/ashen-rampart/presentation/enemy-stack.test.ts
/**
 * 敵スタック集約のテスト
 *
 * ウェーブ3は群れ20体が経路7.2セル分を埋めるため、個別描画では
 * マーカーが重なって読めない（設計書 §9.3）。同種で近接する敵を
 * 1マーカーに束ねる。
 */
import { stackEnemies } from './enemy-stack';
import type { ActiveEnemy } from '../domain/combat/combat-state';
import { PLAINS_MAP } from '../domain/board/stage-map';

const enemy = (id: number, enemyId: string, progress: number, hp = 8): ActiveEnemy => ({
  id,
  enemyId,
  hp,
  maxHp: hp,
  progress,
  spawnTick: 0,
  spawnPathIndex: 0,
  alive: true,
  leaked: false,
});

describe('stackEnemies', () => {
  it('生きている敵だけを対象にする', () => {
    const dead = { ...enemy(1, 'grunt', 1), alive: false };
    expect(stackEnemies([dead], PLAINS_MAP.path)).toEqual([]);
  });

  it('同種で0.5セル以内の敵を1つに束ねる', () => {
    const stacks = stackEnemies(
      [enemy(1, 'swarm', 1.0), enemy(2, 'swarm', 1.2), enemy(3, 'swarm', 1.4)],
      PLAINS_MAP.path
    );
    expect(stacks).toHaveLength(1);
    expect(stacks[0]?.count).toBe(3);
  });

  it('種別が違えば束ねない', () => {
    const stacks = stackEnemies([enemy(1, 'swarm', 1.0), enemy(2, 'grunt', 1.0)], PLAINS_MAP.path);
    expect(stacks).toHaveLength(2);
  });

  it('離れていれば束ねない', () => {
    const stacks = stackEnemies([enemy(1, 'swarm', 1.0), enemy(2, 'swarm', 5.0)], PLAINS_MAP.path);
    expect(stacks).toHaveLength(2);
  });

  it('HPはスタック内の合計になる', () => {
    const stacks = stackEnemies([enemy(1, 'swarm', 1.0, 8), enemy(2, 'swarm', 1.1, 8)], PLAINS_MAP.path);
    expect(stacks[0]?.hp).toBe(16);
    expect(stacks[0]?.maxHp).toBe(16);
  });
});
```

- [ ] **Step 3: 実行して失敗を確認**

Run: `npx jest src/features/ashen-rampart/presentation --no-coverage`
Expected: FAIL（モジュール未定義）

- [ ] **Step 4: enemy-visual を実装**

```ts
// src/features/ashen-rampart/presentation/enemy-visual.ts
/**
 * 灰燼の城壁 - 敵の視覚表現マッピング（純粋）
 *
 * 敵種を「形 × サイズ × 色」の3重符号で区別する。色のみに依存すると
 * 色覚特性やコントラストで判別できなくなるため、グレースケールでも
 * 形とサイズだけで見分けられることを要件とする（S1 の教訓）。
 */
import { getEnemySpec } from '../domain/combat/enemies';

export type EnemyShape = 'circle' | 'diamond' | 'hexagon' | 'triangle' | 'square';

export interface EnemyVisual {
  name: string;
  shape: EnemyShape;
  color: string;
  /** 盤面幅に対するマーカー幅の割合（%） */
  sizePct: number;
  ringColor?: string;
}

const VISUALS: Readonly<Record<string, Omit<EnemyVisual, 'name'>>> = {
  // 雑兵: 基準となる中サイズの円
  grunt: { shape: 'circle', color: '#c0392b', sizePct: 5.5 },
  // 俊足: 小さく鋭い菱形。速さを形で示す
  runner: { shape: 'diamond', color: '#f0a830', sizePct: 4.5 },
  // 群れ: 最小の四角。数で押すことをサイズで示す
  swarm: { shape: 'square', color: '#7f8c8d', sizePct: 3.5 },
  // 重装: 大きな六角形＋装甲リング。硬さを面積とリングで示す
  brute: { shape: 'hexagon', color: '#9b59b6', sizePct: 7.5, ringColor: '#d7bde2' },
  // 鴉: 上向き三角。飛行を「地に着かない形」で示す
  raven: { shape: 'triangle', color: '#5dade2', sizePct: 5, ringColor: '#aed6f1' },
};

export const getEnemyVisual = (enemyId: string): EnemyVisual => {
  const visual = VISUALS[enemyId];
  if (!visual) {
    throw new Error(`視覚表現が未定義の敵IDです: ${enemyId}`);
  }
  return { ...visual, name: getEnemySpec(enemyId).name };
};

/**
 * HP バーの色は単色にする
 *
 * 残量で色を変える（緑→黄→赤）と、観察者がその色を敵の種別と誤読した。
 */
export const HP_BAR_COLOR = '#7fb069';

/** 盤面に登場する敵の最大 HP。バーを絶対スケールで描くための基準 */
export const MAX_ENEMY_HP = 60;

const BAR_MIN_PCT = 2.5;
const BAR_MAX_PCT = 8;

/**
 * 最大 HP から HP バーの幅を得る
 *
 * 残量比だけを描くと満タンの雑兵(20)と満タンの重装(60)が同じ見え方になり、
 * 個体間の強さの差が原理的に読めない。バー全長を絶対スケールにする。
 */
export const getHpBarWidthPct = (maxHp: number): number => {
  const ratio = Math.max(0, Math.min(1, maxHp / MAX_ENEMY_HP));
  return BAR_MIN_PCT + (BAR_MAX_PCT - BAR_MIN_PCT) * ratio;
};

/** CSS clip-path の値。円は border-radius で描くため clip-path を使わない */
export const getShapeClipPath = (shape: EnemyShape): string | undefined => {
  if (shape === 'diamond') return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
  if (shape === 'hexagon')
    return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
  if (shape === 'triangle') return 'polygon(50% 0%, 100% 100%, 0% 100%)';
  return undefined;
};
```

- [ ] **Step 5: enemy-stack を実装**

```ts
// src/features/ashen-rampart/presentation/enemy-stack.ts
/**
 * 灰燼の城壁 - 敵マーカーのスタック集約（純粋）
 *
 * 群れ20体は経路の7.2セル分を埋めるため、個別に描くとマーカーが重なり
 * HPバーが読めない（設計書 §9.3）。表示上だけ束ねる措置であり、
 * ドメインの敵は個体のまま扱う。
 */
import type { CellPos } from '../domain/board/stage-map';
import type { ActiveEnemy } from '../domain/combat/combat-state';
import { positionOf } from '../domain/combat/step-tick';

/** 同一マーカーに束ねる距離のしきい値（セル） */
const STACK_DISTANCE = 0.5;

export interface EnemyStack {
  /** 代表個体の id。React の key に使う */
  id: number;
  enemyId: string;
  /** 束ねた体数 */
  count: number;
  hp: number;
  maxHp: number;
  pos: CellPos;
}

export const stackEnemies = (
  enemies: readonly ActiveEnemy[],
  path: readonly CellPos[]
): EnemyStack[] => {
  const stacks: EnemyStack[] = [];
  enemies
    .filter((e) => e.alive)
    .forEach((enemy) => {
      const pos = positionOf(enemy.progress, path);
      const target = stacks.find(
        (s) =>
          s.enemyId === enemy.enemyId &&
          Math.hypot(s.pos.x - pos.x, s.pos.y - pos.y) <= STACK_DISTANCE
      );
      if (target) {
        target.count += 1;
        target.hp += enemy.hp;
        target.maxHp += enemy.maxHp;
        return;
      }
      stacks.push({
        id: enemy.id,
        enemyId: enemy.enemyId,
        count: 1,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        pos,
      });
    });
  return stacks;
};
```

- [ ] **Step 6: EnemyMarker と BoardGrid を実装**

```tsx
// src/features/ashen-rampart/presentation/EnemyMarker.tsx
/**
 * 灰燼の城壁 - 敵マーカー
 *
 * 形・サイズ・色の3重符号で敵種を示し、HPバーは最大HPの絶対スケールで描く。
 * 束ねた場合は体数バッジを添える（設計書 §9.3）。
 */
import React from 'react';
import styled from 'styled-components';
import type { EnemyStack } from './enemy-stack';
import {
  getEnemyVisual,
  getHpBarWidthPct,
  getShapeClipPath,
  HP_BAR_COLOR,
} from './enemy-visual';
import { COLORS } from './theme';

const Wrapper = styled.div<{ $left: number; $top: number }>`
  position: absolute;
  left: ${({ $left }) => $left}%;
  top: ${({ $top }) => $top}%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  pointer-events: none;
`;

const Body = styled.div<{ $size: number; $color: string; $clip?: string; $ring?: string }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  background: ${({ $color }) => $color};
  clip-path: ${({ $clip }) => $clip ?? 'none'};
  border-radius: ${({ $clip }) => ($clip ? '0' : '50%')};
  box-shadow: ${({ $ring }) => ($ring ? `0 0 0 2px ${$ring}` : 'none')};
`;

const BarTrack = styled.div<{ $width: number }>`
  width: ${({ $width }) => $width}px;
  height: 3px;
  background: ${COLORS.grid};
`;

const BarFill = styled.div<{ $ratio: number }>`
  width: ${({ $ratio }) => Math.max(0, Math.min(1, $ratio)) * 100}%;
  height: 100%;
  background: ${HP_BAR_COLOR};
`;

const Badge = styled.span`
  font-size: 10px;
  color: ${COLORS.secondary};
  background: ${COLORS.dominant};
  padding: 0 3px;
  border-radius: 3px;
`;

interface Props {
  stack: EnemyStack;
  /** 盤面のセル数 */
  columns: number;
  rows: number;
  /** 盤面の実寸（px） */
  boardWidth: number;
}

export const EnemyMarker: React.FC<Props> = ({ stack, columns, rows, boardWidth }) => {
  const visual = getEnemyVisual(stack.enemyId);
  const size = (visual.sizePct / 100) * boardWidth;
  const barWidth = (getHpBarWidthPct(stack.maxHp) / 100) * boardWidth;
  const label =
    stack.count > 1 ? `${visual.name} ${stack.count}体` : visual.name;
  return (
    <Wrapper
      $left={((stack.pos.x + 0.5) / columns) * 100}
      $top={((stack.pos.y + 0.5) / rows) * 100}
      role="img"
      aria-label={label}
    >
      <Body
        $size={size}
        $color={visual.color}
        $clip={getShapeClipPath(visual.shape)}
        $ring={visual.ringColor}
      />
      <BarTrack $width={barWidth}>
        <BarFill $ratio={stack.maxHp === 0 ? 0 : stack.hp / stack.maxHp} />
      </BarTrack>
      {stack.count > 1 && <Badge>×{stack.count}</Badge>}
    </Wrapper>
  );
};
```

```tsx
// src/features/ashen-rampart/presentation/BoardGrid.tsx
/**
 * 灰燼の城壁 - 盤面
 *
 * 経路・設置スロット・地形・設置物・敵を1つの視覚野にまとめる。
 * カード選択中は「置けるマスだけ」を琥珀でハイライトし、選択空間を
 * 60通りから数個に落とす（設計書 §9.7）。
 */
import React from 'react';
import styled from 'styled-components';
import type { CellPos, StageMap } from '../domain/board/stage-map';
import { isHighGround, isSlowCell } from '../domain/board/stage-map';
import type { CombatState } from '../domain/combat/combat-state';
import { stackEnemies } from './enemy-stack';
import { EnemyMarker } from './EnemyMarker';
import { COLORS } from './theme';

const Frame = styled.div<{ $columns: number; $rows: number }>`
  position: relative;
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, 1fr);
  grid-template-rows: repeat(${({ $rows }) => $rows}, 1fr);
  aspect-ratio: ${({ $columns, $rows }) => `${$columns} / ${$rows}`};
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  background: ${COLORS.dominant};
  border: 1px solid ${COLORS.grid};
`;

const Cell = styled.button<{ $kind: string; $highlighted: boolean }>`
  border: 1px solid ${COLORS.grid};
  background: ${({ $kind }) =>
    $kind === 'path' ? '#2a2320' : $kind === 'slot' ? '#211c19' : 'transparent'};
  outline: ${({ $highlighted }) =>
    $highlighted ? `2px solid ${COLORS.opportunity}` : 'none'};
  outline-offset: -2px;
  cursor: ${({ $highlighted }) => ($highlighted ? 'pointer' : 'default')};
  color: ${COLORS.secondary};
  font-size: 11px;
  padding: 0;
  /* ハイライト中はタッチ対象を 44px 以上に広げる（視覚サイズは変えない） */
  ${({ $highlighted }) =>
    $highlighted
      ? `
    position: relative;
    &::after {
      content: '';
      position: absolute;
      inset: 50% auto auto 50%;
      width: max(44px, 100%);
      height: max(44px, 100%);
      transform: translate(-50%, -50%);
    }
  `
      : ''}
`;

const Occupant = styled.span<{ $ready: boolean }>`
  color: ${({ $ready }) => ($ready ? COLORS.opportunity : COLORS.secondary)};
  font-weight: ${({ $ready }) => ($ready ? 700 : 400)};
`;

interface Props {
  map: StageMap;
  state: CombatState;
  /** 配置可能なマス（カード選択中のみ非空） */
  placeableCells: readonly CellPos[];
  onCellClick: (pos: CellPos) => void;
}

const samePos = (a: CellPos, b: CellPos): boolean => a.x === b.x && a.y === b.y;

export const BoardGrid: React.FC<Props> = ({ map, state, placeableCells, onCellClick }) => {
  const cells: CellPos[] = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) cells.push({ x, y });
  }
  const stacks = stackEnemies(state.enemies, map.path);

  const occupantLabel = (pos: CellPos): { text: string; ready: boolean } | undefined => {
    const tower = state.towers.find((t) => samePos(t.pos, pos));
    if (tower) return { text: tower.cardId === 'beacon' ? '篝' : '塔', ready: false };
    const reactor = state.reactors.find((r) => samePos(r.pos, pos));
    if (reactor) return { text: '炉', ready: false };
    const ember = state.embers.find((e) => samePos(e.pos, pos));
    if (ember) return { text: '燠', ready: ember.cooldownLeft === 0 };
    const trap = state.traps.find((t) => samePos(t.pos, pos));
    if (trap) return { text: '罠', ready: false };
    return undefined;
  };

  return (
    <Frame $columns={map.width} $rows={map.height}>
      {cells.map((pos) => {
        const isPath = map.path.some((c) => samePos(c, pos));
        const isSlot = map.buildSlots.some((c) => samePos(c, pos));
        const highlighted = placeableCells.some((c) => samePos(c, pos));
        const occupant = occupantLabel(pos);
        const terrain = isHighGround(map, pos) ? '高台' : isSlowCell(map, pos) ? '滞留' : '';
        const label = [
          `${pos.x},${pos.y}`,
          isPath ? '経路' : isSlot ? '設置可' : '',
          terrain,
          occupant?.text,
          highlighted ? 'ここに置ける' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <Cell
            key={`${pos.x},${pos.y}`}
            type="button"
            $kind={isPath ? 'path' : isSlot ? 'slot' : 'empty'}
            $highlighted={highlighted}
            aria-label={label}
            onClick={() => onCellClick(pos)}
          >
            {occupant && <Occupant $ready={occupant.ready}>{occupant.text}</Occupant>}
          </Cell>
        );
      })}
      {stacks.map((stack) => (
        <EnemyMarker
          key={stack.id}
          stack={stack}
          columns={map.width}
          rows={map.height}
          boardWidth={720}
        />
      ))}
    </Frame>
  );
};
```

- [ ] **Step 7: BoardGrid のテストを書いて通す**

```tsx
// src/features/ashen-rampart/presentation/BoardGrid.test.tsx
/**
 * 盤面のテスト
 *
 * 「情報が存在する」ではなく「レンダリングされ操作できる」ことを確認する
 * （S1 の教訓: aria-label だけを見るテストは描画の潰れを検出できなかった）。
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoardGrid } from './BoardGrid';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { createCombatState } from '../domain/combat/combat-state';
import { PLAINS_WAVES } from '../domain/combat/waves';

const emptyState = createCombatState({ drawPile: [], hand: [], graveyard: [] }, PLAINS_WAVES);

describe('BoardGrid', () => {
  it('経路と設置スロットが読み取れるラベルを持つ', () => {
    render(
      <BoardGrid map={PLAINS_MAP} state={emptyState} placeableCells={[]} onCellClick={jest.fn()} />
    );
    expect(screen.getByRole('button', { name: /0,3 経路/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1,2 設置可/ })).toBeInTheDocument();
  });

  it('高台と滞留が示される', () => {
    render(
      <BoardGrid map={PLAINS_MAP} state={emptyState} placeableCells={[]} onCellClick={jest.fn()} />
    );
    expect(screen.getByRole('button', { name: /3,4 設置可 高台/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /4,3 経路 滞留/ })).toBeInTheDocument();
  });

  it('配置可能なマスだけが「ここに置ける」と示される', () => {
    render(
      <BoardGrid
        map={PLAINS_MAP}
        state={emptyState}
        placeableCells={[{ x: 1, y: 2 }]}
        onCellClick={jest.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /1,2 設置可 ここに置ける/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /2,2 設置可 ここに置ける/ })).toBeNull();
  });

  it('セルをクリックすると座標が渡る', () => {
    const onCellClick = jest.fn();
    render(
      <BoardGrid
        map={PLAINS_MAP}
        state={emptyState}
        placeableCells={[{ x: 1, y: 2 }]}
        onCellClick={onCellClick}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /1,2 設置可 ここに置ける/ }));
    expect(onCellClick).toHaveBeenCalledWith({ x: 1, y: 2 });
  });

  it('設置物がセルに描画される', () => {
    const withTower = {
      ...emptyState,
      towers: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, cooldownLeft: 0 }],
    };
    render(
      <BoardGrid map={PLAINS_MAP} state={withTower} placeableCells={[]} onCellClick={jest.fn()} />
    );
    expect(screen.getByRole('button', { name: /1,2 設置可 塔/ })).toBeInTheDocument();
  });

  it('敵は種別と体数が読めるマーカーとして描画される', () => {
    const withEnemies = {
      ...emptyState,
      enemies: [
        { id: 1, enemyId: 'swarm', hp: 8, maxHp: 8, progress: 1, spawnTick: 0, spawnPathIndex: 0, alive: true, leaked: false },
        { id: 2, enemyId: 'swarm', hp: 8, maxHp: 8, progress: 1.2, spawnTick: 0, spawnPathIndex: 0, alive: true, leaked: false },
      ],
    };
    render(
      <BoardGrid map={PLAINS_MAP} state={withEnemies} placeableCells={[]} onCellClick={jest.fn()} />
    );
    expect(screen.getByRole('img', { name: '群れ 2体' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 8: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/presentation --no-coverage`
Expected: PASS

- [ ] **Step 9: コミット**

```bash
git add src/features/ashen-rampart/presentation/theme.ts src/features/ashen-rampart/presentation/enemy-visual.ts src/features/ashen-rampart/presentation/enemy-visual.test.ts src/features/ashen-rampart/presentation/enemy-stack.ts src/features/ashen-rampart/presentation/enemy-stack.test.ts src/features/ashen-rampart/presentation/EnemyMarker.tsx src/features/ashen-rampart/presentation/BoardGrid.tsx src/features/ashen-rampart/presentation/BoardGrid.test.tsx
git commit -m "feat(ashen-rampart): 盤面描画とスタック表示を実装

- 配色を 60-30-10 で定義し、赤を危険専用に予約
- 敵5種を形・サイズ・色の3重符号で区別（グレースケールでも判別可）
- 同種で近接する敵を1マーカーに束ね、体数バッジを付ける
- 配置可能マスのみハイライトし、タッチ対象を44px以上に拡大

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: 手札・状態表示・統合タイマー

**Files:**
- Create: `presentation/HandArea.tsx`
- Create: `presentation/HandArea.test.tsx`
- Create: `presentation/RunStatusBar.tsx`
- Create: `presentation/RunStatusBar.test.tsx`
- Create: `presentation/EnemyLegend.tsx`
- Create: `presentation/EnemyLegend.test.tsx`

**Interfaces:**
- Consumes: Task 2 の `getCardDefinition`、Task 5 の `CombatState` / `DRAW_INTERVAL_TICKS` / `PLACE_COOLDOWN_TICKS`、Task 10 の `COLORS` / `getEnemyVisual`
- Produces: `HandArea`（props: `{ state; selectedIndex; onSelect; overflowNotice }`）/ `RunStatusBar`（props: `{ state; nextWave; isPaused; onTogglePause }`）/ `EnemyLegend`

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/features/ashen-rampart/presentation/HandArea.test.tsx
/**
 * 手札エリアのテスト
 *
 * 配置クールダウンとドローは周期が異なる2本のタイマーだが、
 * 1本のトラックに統合して「次に何かできるのはいつか」を1箇所で読ませる（設計書 §9.2）。
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HandArea } from './HandArea';
import { createCombatState } from '../domain/combat/combat-state';
import { PLAINS_WAVES } from '../domain/combat/waves';

const stateWith = (hand: string[], mana = 5) => ({
  ...createCombatState({ drawPile: ['a'], hand, graveyard: [] }, PLAINS_WAVES),
  mana,
});

describe('HandArea', () => {
  it('手札のカード名とコストが表示される', () => {
    render(
      <HandArea state={stateWith(['arrow-tower'])} selectedIndex={null} onSelect={jest.fn()} />
    );
    expect(screen.getByRole('button', { name: /弓兵の塔/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /コスト2/ })).toBeInTheDocument();
  });

  it('カードを押すと index が渡る', () => {
    const onSelect = jest.fn();
    render(
      <HandArea
        state={stateWith(['arrow-tower', 'ballista'])}
        selectedIndex={null}
        onSelect={onSelect}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /弩砲/ }));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('選択中のカードは aria-pressed が true になる', () => {
    render(
      <HandArea state={stateWith(['arrow-tower'])} selectedIndex={0} onSelect={jest.fn()} />
    );
    expect(screen.getByRole('button', { name: /弓兵の塔/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('マナ不足のカードは押せず不足量が示される', () => {
    render(
      <HandArea state={stateWith(['ballista'], 1)} selectedIndex={null} onSelect={jest.fn()} />
    );
    const card = screen.getByRole('button', { name: /弩砲/ });
    expect(card).toBeDisabled();
    expect(screen.getByText('マナが2足りません')).toBeInTheDocument();
  });

  it('現在のマナと墓地の枚数が表示される', () => {
    const state = {
      ...stateWith(['arrow-tower'], 4),
      deck: { drawPile: ['a'], hand: ['arrow-tower'], graveyard: ['x', 'y'] },
    };
    render(<HandArea state={state} selectedIndex={null} onSelect={jest.fn()} />);
    expect(screen.getByText('マナ 4')).toBeInTheDocument();
    expect(screen.getByText('墓地 2')).toBeInTheDocument();
  });

  it('溢れて失った札が通知として表示される', () => {
    render(
      <HandArea
        state={stateWith(['arrow-tower'])}
        selectedIndex={null}
        onSelect={jest.fn()}
        overflowNotice="火砲台"
      />
    );
    expect(screen.getByText('火砲台 を手札に持てず失いました')).toBeInTheDocument();
  });

  it('配置とドローの残りが両方読める', () => {
    const state = { ...stateWith(['arrow-tower']), placeCooldown: 30, ticksToDraw: 10 };
    render(<HandArea state={state} selectedIndex={null} onSelect={jest.fn()} />);
    expect(screen.getByLabelText('次に置けるまで 3秒')).toBeInTheDocument();
    expect(screen.getByLabelText('次のドローまで 1秒')).toBeInTheDocument();
  });
});
```

```tsx
// src/features/ashen-rampart/presentation/RunStatusBar.test.tsx
/**
 * ラン状態バーのテスト
 *
 * ライフ・ウェーブ・予告・一時停止を上部に固定する（設計書 §9.1）。
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RunStatusBar } from './RunStatusBar';
import { createCombatState } from '../domain/combat/combat-state';
import { PLAINS_WAVES } from '../domain/combat/waves';

const state = createCombatState({ drawPile: [], hand: [], graveyard: [] }, PLAINS_WAVES);

describe('RunStatusBar', () => {
  it('ライフが数値で示される', () => {
    render(<RunStatusBar state={state} isPaused={false} onTogglePause={jest.fn()} />);
    expect(screen.getByText('残り 10')).toBeInTheDocument();
  });

  it('ライフが3以下になると警告テキストが加わる（色だけに依存しない）', () => {
    render(
      <RunStatusBar state={{ ...state, life: 2 }} isPaused={false} onTogglePause={jest.fn()} />
    );
    expect(screen.getByText('残り 2')).toBeInTheDocument();
    expect(screen.getByText('危険')).toBeInTheDocument();
  });

  it('次ウェーブの構成が予告される', () => {
    render(
      <RunStatusBar state={{ ...state, tick: 100 }} isPaused={false} onTogglePause={jest.fn()} />
    );
    expect(screen.getByText(/次: 雑兵12 俊足8/)).toBeInTheDocument();
  });

  it('一時停止ボタンで onTogglePause が呼ばれる', () => {
    const onTogglePause = jest.fn();
    render(<RunStatusBar state={state} isPaused={false} onTogglePause={onTogglePause} />);
    fireEvent.click(screen.getByRole('button', { name: '一時停止' }));
    expect(onTogglePause).toHaveBeenCalledTimes(1);
  });

  it('一時停止中はラベルが変わる', () => {
    render(<RunStatusBar state={state} isPaused onTogglePause={jest.fn()} />);
    expect(screen.getByRole('button', { name: '再開' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 実行して失敗を確認**

Run: `npx jest src/features/ashen-rampart/presentation/HandArea src/features/ashen-rampart/presentation/RunStatusBar --no-coverage`
Expected: FAIL（モジュール未定義）

- [ ] **Step 3: HandArea を実装**

```tsx
// src/features/ashen-rampart/presentation/HandArea.tsx
/**
 * 灰燼の城壁 - 手札と資源（下部固定）
 *
 * 手札・マナ・墓地・統合タイマーを1つのグループにまとめ、
 * 同時に走査する枠を減らす（設計書 §9.1）。
 */
import React from 'react';
import styled from 'styled-components';
import { getCardDefinition } from '../domain/cards/card-pool';
import type { CombatState } from '../domain/combat/combat-state';
import { DRAW_INTERVAL_TICKS, PLACE_COOLDOWN_TICKS } from '../domain/combat/combat-state';
import { COLORS } from './theme';

const Bar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: ${COLORS.dominant};
  color: ${COLORS.secondary};
  border-top: 1px solid ${COLORS.grid};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const Track = styled.div`
  position: relative;
  flex: 1;
  min-width: 160px;
  height: 6px;
  background: ${COLORS.grid};
`;

const Marker = styled.div<{ $ratio: number; $color: string }>`
  position: absolute;
  top: -2px;
  left: ${({ $ratio }) => Math.max(0, Math.min(1, $ratio)) * 100}%;
  width: 3px;
  height: 10px;
  background: ${({ $color }) => $color};
`;

const Cards = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Card = styled.button<{ $selected: boolean }>`
  min-width: 92px;
  min-height: 44px;
  padding: 6px 8px;
  text-align: left;
  background: ${({ $selected }) => ($selected ? COLORS.opportunity : 'transparent')};
  color: ${({ $selected }) => ($selected ? COLORS.dominant : COLORS.secondary)};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
  cursor: pointer;
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const Notice = styled.p`
  margin: 0;
  color: ${COLORS.opportunity};
`;

const toSeconds = (ticks: number): number => Math.ceil(ticks / 10);

interface Props {
  state: CombatState;
  selectedIndex: number | null;
  onSelect: (handIndex: number) => void;
  /** 溢れて失った札の名前。表示は呼び出し側が一定時間で消す */
  overflowNotice?: string;
}

export const HandArea: React.FC<Props> = ({
  state,
  selectedIndex,
  onSelect,
  overflowNotice,
}) => {
  const shortage = state.deck.hand
    .map((id) => getCardDefinition(id).cost - state.mana)
    .filter((diff) => diff > 0);
  const maxShortage = shortage.length > 0 ? Math.max(...shortage) : 0;

  return (
    <Bar>
      <Row>
        <span>マナ {state.mana}</span>
        <span>墓地 {state.deck.graveyard.length}</span>
        <Track>
          <Marker
            $ratio={1 - state.placeCooldown / PLACE_COOLDOWN_TICKS}
            $color={COLORS.opportunity}
            aria-label={`次に置けるまで ${toSeconds(state.placeCooldown)}秒`}
          />
          <Marker
            $ratio={1 - state.ticksToDraw / DRAW_INTERVAL_TICKS}
            $color={COLORS.secondary}
            aria-label={`次のドローまで ${toSeconds(state.ticksToDraw)}秒`}
          />
        </Track>
      </Row>
      {overflowNotice && <Notice>{overflowNotice} を手札に持てず失いました</Notice>}
      {maxShortage > 0 && <p>マナが{maxShortage}足りません</p>}
      <Cards>
        {state.deck.hand.map((cardId, index) => {
          const card = getCardDefinition(cardId);
          const affordable = card.cost <= state.mana;
          return (
            <Card
              key={`${cardId}-${index}`}
              type="button"
              $selected={selectedIndex === index}
              aria-pressed={selectedIndex === index}
              aria-label={`${card.name} コスト${card.cost}`}
              disabled={!affordable}
              onClick={() => onSelect(index)}
            >
              {card.name}
              <br />
              コスト{card.cost}
            </Card>
          );
        })}
      </Cards>
    </Bar>
  );
};
```

- [ ] **Step 4: RunStatusBar と EnemyLegend を実装**

```tsx
// src/features/ashen-rampart/presentation/RunStatusBar.tsx
/**
 * 灰燼の城壁 - ラン状態（上部固定）
 *
 * ライフ・進行・次ウェーブ予告・一時停止をまとめる（設計書 §9.1）。
 * 危険は赤に加えて必ずテキストでも示す（色だけに依存しない）。
 */
import React from 'react';
import styled from 'styled-components';
import type { CombatState } from '../domain/combat/combat-state';
import { getEnemySpec } from '../domain/combat/enemies';
import { COLORS } from './theme';

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 8px;
  background: ${COLORS.dominant};
  color: ${COLORS.secondary};
  border-bottom: 1px solid ${COLORS.grid};
`;

const Life = styled.span<{ $danger: boolean }>`
  color: ${({ $danger }) => ($danger ? COLORS.danger : COLORS.secondary)};
  font-weight: 700;
`;

const PauseButton = styled.button`
  min-height: 44px;
  padding: 0 12px;
  margin-left: auto;
  background: transparent;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
  cursor: pointer;
`;

/** ライフがこの値以下で危険表示に切り替える */
const DANGER_LIFE = 3;

interface Props {
  state: CombatState;
  isPaused: boolean;
  onTogglePause: () => void;
}

export const RunStatusBar: React.FC<Props> = ({ state, isPaused, onTogglePause }) => {
  const nextWave = state.waves.find((w) => w.startTick > state.tick);
  const preview = nextWave
    ? nextWave.entries
        .map((e) => `${getEnemySpec(e.enemyId).name}${e.count}`)
        .join(' ')
    : 'これが最後の波';
  const danger = state.life <= DANGER_LIFE;

  return (
    <Bar>
      <span>
        砦 <Life $danger={danger}>残り {state.life}</Life>
      </span>
      {danger && <span>危険</span>}
      <span>次: {preview}</span>
      <PauseButton type="button" onClick={onTogglePause}>
        {isPaused ? '再開' : '一時停止'}
      </PauseButton>
    </Bar>
  );
};
```

```tsx
// src/features/ashen-rampart/presentation/EnemyLegend.tsx
/**
 * 灰燼の城壁 - 敵の凡例
 *
 * S1 の教訓: 形を描き分けても、記号を意味に接続する索引が無いと
 * 「赤丸とオレンジ菱形がある」止まりになる。凡例は必須。
 */
import React from 'react';
import styled from 'styled-components';
import { ENEMY_IDS, getEnemySpec } from '../domain/combat/enemies';
import { getEnemyVisual, getShapeClipPath } from './enemy-visual';
import { COLORS } from './theme';

const List = styled.ul`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  list-style: none;
  margin: 0;
  padding: 8px;
  color: ${COLORS.secondary};
`;

const Item = styled.li`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
`;

const Swatch = styled.span<{ $color: string; $clip?: string }>`
  width: 12px;
  height: 12px;
  background: ${({ $color }) => $color};
  clip-path: ${({ $clip }) => $clip ?? 'none'};
  border-radius: ${({ $clip }) => ($clip ? '0' : '50%')};
`;

export const EnemyLegend: React.FC = () => (
  <List aria-label="敵の凡例">
    {ENEMY_IDS.map((id) => {
      const visual = getEnemyVisual(id);
      const spec = getEnemySpec(id);
      return (
        <Item key={id}>
          <Swatch $color={visual.color} $clip={getShapeClipPath(visual.shape)} />
          <span>
            {visual.name}
            {spec.flying ? '（飛行・弩砲のみ有効）' : ''}
          </span>
        </Item>
      );
    })}
  </List>
);
```

- [ ] **Step 5: EnemyLegend のテストを書く**

```tsx
// src/features/ashen-rampart/presentation/EnemyLegend.test.tsx
/**
 * 敵凡例のテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { EnemyLegend } from './EnemyLegend';

describe('EnemyLegend', () => {
  it('敵5種すべてが名前付きで並ぶ', () => {
    render(<EnemyLegend />);
    ['雑兵', '俊足', '群れ', '重装'].forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it('飛行する敵には対処法が添えられる', () => {
    render(<EnemyLegend />);
    expect(screen.getByText('鴉（飛行・弩砲のみ有効）')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/presentation --no-coverage`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add src/features/ashen-rampart/presentation/HandArea.tsx src/features/ashen-rampart/presentation/HandArea.test.tsx src/features/ashen-rampart/presentation/RunStatusBar.tsx src/features/ashen-rampart/presentation/RunStatusBar.test.tsx src/features/ashen-rampart/presentation/EnemyLegend.tsx src/features/ashen-rampart/presentation/EnemyLegend.test.tsx
git commit -m "feat(ashen-rampart): 手札・ラン状態・凡例の UI を実装

- 配置とドローの2本のタイマーを1本のトラックに統合
- マナ不足・手札溢れのフィードバックを明示
- 危険は色に加えてテキストでも示す（色だけに依存しない）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: ゲームループ結線・一時停止・ログ v2・全体検証

**Files:**
- Create: `presentation/useAshenRampartGame.ts`
- Create: `presentation/useAshenRampartGame.test.ts`
- Modify: `presentation/AshenRampartGame.tsx`
- Modify: `application/ports/play-log-port.ts`
- Modify: `infrastructure/play-log/local-storage-play-log.ts`（スキーマ版数のみ）
- Modify: `docs/superpowers/specs/2026-07-29-ashen-rampart-realtime-deck-poc-design.md`（Task 9 の較正結果を反映）

**Interfaces:**
- Consumes: Task 8 の `startRun`、Task 5〜7 の `stepTick` / `canPlaceAt`、Task 10・11 の各コンポーネント
- Produces: `useAshenRampartGame(seed?, playLog?)` → `{ state; selectedIndex; placeableCells; isPaused; overflowNotice; selectCard; clickCell; togglePause; restart; exportLogJson }`

- [ ] **Step 1: ログスキーマを v2 にする**

```ts
// src/features/ashen-rampart/application/ports/play-log-port.ts（全置換）
/**
 * 灰燼の城壁 - 行動ログポート（スキーマ v2）
 *
 * 反復0の教訓により、記録する項目はすべて判定に使う。
 * 判定に使わない項目は記録しない（設計書 §11 ログスキーマ v2）。
 */

/** 現在の反復番号。反復を進めるたびに必ず更新する */
export const CURRENT_ITERATION = 0;

export type PlayLogEventBody =
  | { kind: 'run_started'; runId: string; iteration: number; seed: number; presetId: string }
  | { kind: 'card_drawn'; runId: string; cardId: string; tick: number }
  | { kind: 'card_played'; runId: string; cardId: string; tick: number; mana: number; x?: number; y?: number }
  | { kind: 'card_discarded_overflow'; runId: string; cardId: string; tick: number }
  | { kind: 'wave_preview_shown'; runId: string; tick: number; content: string }
  | { kind: 'reactivated'; runId: string; tick: number }
  | { kind: 'paused'; runId: string; tick: number }
  | { kind: 'resumed'; runId: string; tick: number }
  | { kind: 'run_ended'; runId: string; outcome: 'won' | 'lost'; tick: number; handRemaining: string[] }
  | { kind: 'run_note'; runId: string; text: string };

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

`local-storage-play-log.ts` の `SCHEMA_VERSION` を `2` に、`PLAY_LOG_STORAGE_KEY` を `'ashen-rampart:play-log-v2'` に変更する（v1 のデータと混ざらないようにするため）。既存テストの期待値 `version: 1` も `2` に更新する。

- [ ] **Step 2: フックの失敗するテストを書く**

```ts
// src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts
/**
 * ゲームループのテスト
 *
 * 時間を進めるのは setInterval だけで、ロジックは domain にある。
 * このフックが持つのは「入力の受け取り」「タイマー」「ログ」だけ。
 */
import { renderHook, act } from '@testing-library/react';
import { useAshenRampartGame, TICK_INTERVAL_MS } from './useAshenRampartGame';
import { getCardDefinition } from '../domain/cards/card-pool';
import type { PlayLogEventBody, PlayLogPort } from '../application/ports/play-log-port';

const createMockPlayLog = (): PlayLogPort & { events: PlayLogEventBody[] } => {
  const events: PlayLogEventBody[] = [];
  return {
    events,
    record: (e) => {
      events.push(e);
    },
    exportAll: () => ({ version: 2, events: events.map((e) => ({ ...e, at: 0 })) }),
  };
};

describe('useAshenRampartGame', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('マウント時に run_started がシードとプリセット付きで1回記録される', () => {
    const log = createMockPlayLog();
    renderHook(() => useAshenRampartGame(1, log));
    const started = log.events.filter((e) => e.kind === 'run_started');
    expect(started).toHaveLength(1);
    expect(started[0]).toMatchObject({ seed: 1, iteration: 0 });
  });

  it('時間経過で tick が進む', () => {
    const { result } = renderHook(() => useAshenRampartGame(1));
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * 10);
    });
    expect(result.current.state.tick).toBe(10);
  });

  it('一時停止すると tick が進まず paused が記録される', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(1, log));
    act(() => result.current.togglePause());
    const before = result.current.state.tick;
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * 10);
    });
    expect(result.current.state.tick).toBe(before);
    expect(log.events.filter((e) => e.kind === 'paused')).toHaveLength(1);
  });

  it('再開すると resumed が記録され tick が再び進む', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(1, log));
    act(() => result.current.togglePause());
    act(() => result.current.togglePause());
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * 5);
    });
    expect(log.events.filter((e) => e.kind === 'resumed')).toHaveLength(1);
    expect(result.current.state.tick).toBe(5);
  });

  it('カードを選ぶと置けるマスだけが返る', () => {
    const { result } = renderHook(() => useAshenRampartGame(1));
    const towerIndex = result.current.state.deck.hand.findIndex((id) => id !== 'mud-time');
    act(() => result.current.selectCard(towerIndex));
    expect(result.current.placeableCells.length).toBeGreaterThan(0);
    expect(result.current.placeableCells.length).toBeLessThanOrEqual(12);
  });

  it('選択せずにセルを押しても何も起きない', () => {
    const { result } = renderHook(() => useAshenRampartGame(1));
    act(() => result.current.clickCell({ x: 1, y: 2 }));
    expect(result.current.state.towers).toHaveLength(0);
  });

  it('一時停止中は配置できない（戦術的優位を与えない）', () => {
    const { result } = renderHook(() => useAshenRampartGame(1));
    act(() => result.current.togglePause());
    // 手札の中身に依存させない: 一時停止中は選択しても置ける場所が無く、
    // セルを押しても設置物が増えないことを検証する
    act(() => result.current.selectCard(0));
    expect(result.current.placeableCells).toEqual([]);
    act(() => result.current.clickCell({ x: 1, y: 2 }));
    expect(result.current.state.towers).toHaveLength(0);
    expect(result.current.state.reactors).toHaveLength(0);
    expect(result.current.state.embers).toHaveLength(0);
    expect(result.current.state.traps).toHaveLength(0);
  });

  it('手札が溢れると失った札名が通知される', () => {
    const { result } = renderHook(() => useAshenRampartGame(1));
    // 初期手札3枚・上限5枚・一度も出さないので、3回目のドロー（120 tick）で必ず溢れる
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * 120);
    });
    expect(result.current.state.deck.hand).toHaveLength(5);
    expect(result.current.state.deck.graveyard).toHaveLength(1);
    const lost = result.current.state.deck.graveyard[0];
    expect(typeof lost).toBe('string');
    expect(result.current.overflowNotice).toBe(getCardDefinition(lost as string).name);
  });

  it('restart で新しいランが始まる', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(1, log));
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * 20);
    });
    act(() => result.current.restart());
    expect(result.current.state.tick).toBe(0);
    expect(log.events.filter((e) => e.kind === 'run_started')).toHaveLength(2);
  });
});
```

- [ ] **Step 3: 実行して失敗を確認**

Run: `npx jest src/features/ashen-rampart/presentation/useAshenRampartGame --no-coverage`
Expected: FAIL（モジュール未定義）

- [ ] **Step 4: フックを実装**

```ts
// src/features/ashen-rampart/presentation/useAshenRampartGame.ts
/**
 * 灰燼の城壁 - ゲームループ
 *
 * 時間を進めるのは setInterval だけで、ロジックは一切持たない（設計書 §8.2）。
 * 一時停止はループ制御であり、ドメインの状態ではない（§8.6）。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CellPos } from '../domain/board/stage-map';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { getCardDefinition } from '../domain/cards/card-pool';
import { placementKindOf } from '../domain/cards/card-definition';
import type { CombatState } from '../domain/combat/combat-state';
import { stepTick, canPlaceAt, type PlayerAction } from '../domain/combat/step-tick';
import { startRun } from '../application/use-cases/start-run';
import { SeededRandom } from '../infrastructure/random/seeded-random';
import { LocalStoragePlayLog } from '../infrastructure/play-log/local-storage-play-log';
import {
  createRunId,
  CURRENT_ITERATION,
  type PlayLogPort,
} from '../application/ports/play-log-port';

export const TICK_INTERVAL_MS = 100;

/** 溢れ通知を表示し続ける tick 数（0.6秒） */
const OVERFLOW_NOTICE_TICKS = 6;

const PRESET_ID = 'swift';

export const useAshenRampartGame = (seed = 1, playLog?: PlayLogPort) => {
  const logRef = useRef<PlayLogPort>(playLog ?? new LocalStoragePlayLog());
  const [runId, setRunId] = useState(() => createRunId());
  const [state, setState] = useState<CombatState>(() => startRun(PRESET_ID, new SeededRandom(seed)));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [overflowNotice, setOverflowNotice] = useState<string | undefined>(undefined);
  const noticeUntilRef = useRef(0);
  const pendingRef = useRef<PlayerAction[]>([]);
  const loggedRunIdsRef = useRef<Set<string>>(new Set());

  // ラン開始の記録（StrictMode の二重マウントでも1回）
  useEffect(() => {
    if (loggedRunIdsRef.current.has(runId)) return;
    loggedRunIdsRef.current.add(runId);
    logRef.current.record({
      kind: 'run_started',
      runId,
      iteration: CURRENT_ITERATION,
      seed,
      presetId: PRESET_ID,
    });
  }, [runId, seed]);

  // ゲームループ。一時停止中と決着後は進めない
  useEffect(() => {
    if (isPaused || state.outcome !== 'playing') return undefined;
    const timer = setInterval(() => {
      setState((current) => {
        const actions = pendingRef.current;
        pendingRef.current = [];
        return stepTick(current, actions, PLAINS_MAP);
      });
    }, TICK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isPaused, state.outcome]);

  // tick イベントをログと通知へ流す
  useEffect(() => {
    state.events.forEach((event) => {
      if (event.kind === 'draw') {
        logRef.current.record({ kind: 'card_drawn', runId, cardId: event.cardId, tick: state.tick });
      }
      if (event.kind === 'overflow') {
        logRef.current.record({
          kind: 'card_discarded_overflow',
          runId,
          cardId: event.cardId,
          tick: state.tick,
        });
        setOverflowNotice(getCardDefinition(event.cardId).name);
        noticeUntilRef.current = state.tick + OVERFLOW_NOTICE_TICKS;
      }
      if (event.kind === 'played') {
        logRef.current.record({
          kind: 'card_played',
          runId,
          cardId: event.cardId,
          tick: state.tick,
          mana: state.mana,
          x: event.pos?.x,
          y: event.pos?.y,
        });
      }
      if (event.kind === 'ember') {
        logRef.current.record({ kind: 'reactivated', runId, tick: state.tick });
      }
    });
    if (state.tick >= noticeUntilRef.current) setOverflowNotice(undefined);
  }, [state.events, state.tick, state.mana, runId]);

  // 決着の記録
  useEffect(() => {
    if (state.outcome === 'playing') return;
    logRef.current.record({
      kind: 'run_ended',
      runId,
      outcome: state.outcome,
      tick: state.tick,
      handRemaining: state.deck.hand,
    });
  }, [state.outcome, state.tick, state.deck.hand, runId]);

  const placeableCells: CellPos[] = (() => {
    if (selectedIndex === null || isPaused) return [];
    const cardId = state.deck.hand[selectedIndex];
    if (cardId === undefined) return [];
    const card = getCardDefinition(cardId);
    const kind = placementKindOf(card);
    if (kind === 'none') return [];
    const candidates = kind === 'path' ? PLAINS_MAP.path : PLAINS_MAP.buildSlots;
    return candidates.filter((pos) => canPlaceAt(state, card, pos, PLAINS_MAP));
  })();

  const selectCard = useCallback(
    (handIndex: number) => {
      if (isPaused) return;
      const cardId = state.deck.hand[handIndex];
      if (cardId === undefined) return;
      const card = getCardDefinition(cardId);
      if (placementKindOf(card) === 'none') {
        pendingRef.current.push({ kind: 'play-card', handIndex });
        setSelectedIndex(null);
        return;
      }
      setSelectedIndex((current) => (current === handIndex ? null : handIndex));
    },
    [isPaused, state.deck.hand]
  );

  const clickCell = useCallback(
    (pos: CellPos) => {
      if (isPaused || selectedIndex === null) return;
      pendingRef.current.push({ kind: 'play-card', handIndex: selectedIndex, pos });
      setSelectedIndex(null);
    },
    [isPaused, selectedIndex]
  );

  const reactivate = useCallback(
    (emberIndex: number) => {
      if (isPaused) return;
      pendingRef.current.push({ kind: 'reactivate', emberIndex });
    },
    [isPaused]
  );

  const togglePause = useCallback(() => {
    setIsPaused((current) => {
      logRef.current.record({
        kind: current ? 'resumed' : 'paused',
        runId,
        tick: state.tick,
      });
      return !current;
    });
    setSelectedIndex(null);
  }, [runId, state.tick]);

  const restart = useCallback(() => {
    pendingRef.current = [];
    setSelectedIndex(null);
    setIsPaused(false);
    setOverflowNotice(undefined);
    setState(startRun(PRESET_ID, new SeededRandom(seed)));
    setRunId(createRunId());
  }, [seed]);

  const noteRun = useCallback(
    (text: string) => {
      logRef.current.record({ kind: 'run_note', runId, text });
    },
    [runId]
  );

  const exportLogJson = useCallback(
    () => JSON.stringify(logRef.current.exportAll(), null, 2),
    []
  );

  return {
    state,
    selectedIndex,
    placeableCells,
    isPaused,
    overflowNotice,
    selectCard,
    clickCell,
    reactivate,
    togglePause,
    restart,
    noteRun,
    exportLogJson,
  };
};
```

- [ ] **Step 5: AshenRampartGame を組み立てる**

```tsx
// src/features/ashen-rampart/presentation/AshenRampartGame.tsx（全置換）
/**
 * 灰燼の城壁 - ゲーム画面
 *
 * 三層レイアウト（上部=ラン状態 / 中央=盤面 / 下部=手札と資源）。
 * 同時に走査する枠を7以内に収める（設計書 §9.1）。
 */
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { useAshenRampartGame } from './useAshenRampartGame';
import { RunStatusBar } from './RunStatusBar';
import { BoardGrid } from './BoardGrid';
import { HandArea } from './HandArea';
import { EnemyLegend } from './EnemyLegend';
import { COLORS } from './theme';

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 70vh;
  background: ${COLORS.dominant};
  color: ${COLORS.secondary};
`;

const Center = styled.div`
  flex: 1;
  padding: 12px;
`;

const Result = styled.div`
  text-align: center;
  padding: 16px;
`;

const RestartButton = styled.button`
  min-height: 44px;
  padding: 0 16px;
  background: transparent;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
  cursor: pointer;
`;

export const AshenRampartGame: React.FC = () => {
  const game = useAshenRampartGame();

  // スペースキーで一時停止（設計書 §9.6）
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      event.preventDefault();
      game.togglePause();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [game]);

  return (
    <Layout>
      <RunStatusBar
        state={game.state}
        isPaused={game.isPaused}
        onTogglePause={game.togglePause}
      />
      <Center>
        <BoardGrid
          map={PLAINS_MAP}
          state={game.state}
          placeableCells={game.placeableCells}
          onCellClick={game.clickCell}
        />
        <EnemyLegend />
        {game.state.outcome !== 'playing' && (
          <Result>
            <p>{game.state.outcome === 'won' ? '砦は守られた' : '城壁は灰燼に帰した'}</p>
            <RestartButton type="button" onClick={game.restart}>
              もう一度挑む
            </RestartButton>
          </Result>
        )}
      </Center>
      <HandArea
        state={game.state}
        selectedIndex={game.selectedIndex}
        onSelect={game.selectCard}
        overflowNotice={game.overflowNotice}
      />
    </Layout>
  );
};
```

- [ ] **Step 6: 全体テストを実行**

Run: `npx jest src/features/ashen-rampart --no-coverage`
Expected: PASS（全件）

- [ ] **Step 7: CI パイプライン全体を通す**

Run: `npm run ci`
Expected: lint:ci / typecheck / test / build すべて成功

- [ ] **Step 8: 設計書に較正結果を反映**

Task 9 で `waves.ts` を調整した場合、設計書 §6 のウェーブ構成表と総HP、§9.3 の描画密度の記述を実際の値に更新する。調整しなかった場合はこのステップを飛ばす。

- [ ] **Step 9: コミット**

```bash
git add src/features/ashen-rampart/presentation/useAshenRampartGame.ts src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts src/features/ashen-rampart/presentation/AshenRampartGame.tsx src/features/ashen-rampart/application/ports/play-log-port.ts src/features/ashen-rampart/infrastructure/play-log/local-storage-play-log.ts src/features/ashen-rampart/infrastructure/play-log/local-storage-play-log.test.ts docs/superpowers/specs/2026-07-29-ashen-rampart-realtime-deck-poc-design.md
git commit -m "feat(ashen-rampart): ゲームループと一時停止を結線しログを v2 化

- setInterval で stepTick を回すだけの薄い層。ロジックは domain に閉じる
- 一時停止は閲覧のみで配置不可（戦術的優位を与えない）
- ログ v2: シード・ドロー・配置・溢れ・一時停止を記録し全項目を判定に使う

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

- [ ] **Step 10: Issue と PR を作成**

```bash
gh issue create --title "[PoC] 灰燼の城壁 リアルタイム・デッキ — 有限の札の配分は面白いか" --body "設計書: docs/superpowers/specs/2026-07-29-ashen-rampart-realtime-deck-poc-design.md

## 仮説
プレイヤーは有限の札を「今切るか、この先のために温存するか」で配分し、切り時の判断が当たった／外れたことを実感して面白がる。

## 事前登録（記録する項目はすべて判定に使う）
1. 札の手札滞留時間と、最後まで出さなかった札
2. 同一シードの2ラン間で配置が変わったか
3. 予告を見た後に配置を変えたか
4. 勝敗理由の記述（run_note）
5. 主観判定（面白いか Yes/No）
6. 一時停止の回数と累計時間

## 実施
同一プリセットデッキで3ラン。うち2ランは同一シード。

## 反証条件
- 3ラン中2ラン以上で敗因が「引き」→ コスト札の事故込み採用を見直す
- 「何もできない時間」が目立つ → 最低限のマナ自然回復を検討
- 札の滞留時間がほぼ0 → 温存に利益がない。仮説そのものを疑う
- 15回の配置枠を使い切る前に勝てる → 難度が低すぎる。較正やり直し
- 一時停止が多用される → 情報量か時間設計が過大

結果はこの Issue にコメントで記録する（実験ノート方式）。"
```

```bash
git push -u origin feature/ashen-rampart-realtime-poc
gh pr create --title "feat(ashen-rampart): リアルタイム・デッキ PoC への作り直し" --body "## 概要
前コンセプト（Epic #188）が No 判定で終了したため、同名のまま作り直します。「有限の札をいつ切るか」の配分を面白さの仮説に据えた MTG × RTS × TD の PoC です。

## 変更内容
- 戦闘の事前計算（simulateWave）を廃し、1 tick 前進の純粋関数 stepTick に置き換え
- コストのカード化（魔力炉）・手札上限・配置クールダウン・墓地行き
- カード8種と敵5種でカウンター要求3軸（属性・位置・テンポ）をカバー
- 支配戦略の回帰テストを CI に常設（単一カードデッキでは勝てないこと）
- 画面設計一式（三層レイアウト・スタック表示・配色分離・一時停止）

## テスト方法
- [ ] CI 全緑（Lint/TypeCheck/Test/Build/E2E）
- [ ] マージ後: 実プレイ3ラン → Issue に結果記録 → Yes/No 判定

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 11: CI 全緑を確認してマージ**

Run: `gh pr checks <PR番号> --watch` → 全緑後 `gh pr merge <PR番号> --merge`
Expected: マージ完了。その後ユーザー実プレイ3ラン（計画外・人間の作業）へ

---

## 自己レビュー結果

**スペック網羅**: 設計書の全13節を確認した。§1〜§2（コンセプト）はタスク不要。§3スコープ→全タスク／§4資源とテンポ→Task 5・7／§5カード→Task 2／§6敵とウェーブ→Task 3／§7支配戦略チェック→Task 9／§8アーキテクチャ→Task 5〜8・12／§9画面設計→Task 10〜12／§10将来案→対象外（明示的に PoC 外）／§11判定の事前登録→Task 12 Step 10（Issue の事前登録）とログ v2／§12引き受けたリスク→設計変更なしのため実装タスクなし（反証条件は Issue に記載）／§13作業の進め方→Global Constraints のブランチ指定。**未カバーなし。**

**型整合**: `CombatState` のフィールド名（`placeCooldown` / `ticksToDraw` / `slowUntilTick` / `embers`）は Task 5 で定義し、Task 6・7・10・11・12 が同名で参照している。`PlayerAction` は Task 5 で定義し Task 7 で処理を実装、Task 9・12 が生成する。`canPlaceAt` は Task 7 で定義し Task 9・12 が使用。`EnemyStack` は Task 10 内で定義と使用が閉じている。`getCardDefinition` / `placementKindOf` は Task 2 で定義し以降が使用。

**プレースホルダ**: 全ステップにコードまたは具体的な実行コマンドがある。Task 9 Step 4 の較正だけは結果が実行時にしか分からないため、**調整の順序と判断基準を具体的な数値で明記**して曖昧さを排した。

**既知の残リスク**:
- Task 5 の `stepTick` は Task 6・7 で3回書き換わる。差分の形で示しているため、実装者は毎回ファイル全体を読んでから編集すること
- Task 9 の較正で `waves.ts` を変えた場合、Task 3 のテスト（総HP 1472）と Task 9 の基準値、設計書 §6 の3箇所を同時に更新する必要がある。Task 9 Step 4 と Task 12 Step 8 に明記済み
