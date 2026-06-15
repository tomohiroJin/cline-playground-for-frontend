# IPNE Game.tsx 描画ロジックの抽出 設計（Phase D-1）

- 日付: 2026-06-15
- 対象: `src/features/ipne/presentation/screens/Game.tsx`
- 種別: リファクタリング（**描画順序・出力不変**の責務分離）
- 位置づけ: IPNE 包括リファクタリング・ロードマップの **Phase D** の第1サブプロジェクト（D-1）

## 1. 背景と目的

`Game.tsx`（990行）は、約645行の巨大な描画 `useEffect`（280〜925行）を抱える神コンポーネント。
この effect はマップ→罠→壁→アイテム→敵→（攻撃/被弾エフェクトのトリガーと更新）→プレイヤー→
低HP警告→コンボ→ボスWARNING→暗転→ミニマップ→デバッグ の順で Canvas に描画する。

問題:

- 描画ロジック・エフェクト状態の変更・UI 演出が1つの effect に凝集している。
- 23 props・約12 refs を closure で参照しており、変更の影響範囲が読みにくい。
- `Game.test.tsx`（272行）は「クラッシュせず render できる・要素が存在する」浅い統合テストのみ。
  **jsdom では Canvas のピクセル出力を検証できない**ため、描画の振る舞いを守るテストが無い。

本作業の目的:

1. 描画 effect を **`useGameRender` フック**へ移し、層ごとの **純粋描画関数（5〜6モジュール）**へ分離する。
2. `Game.tsx` を描画ロジックから解放し、薄いオーケストレーターにする。
3. **描画順序・出力（ctx へのコマンド列）を一切変えない**。

### 非目標（YAGNI）

- **refs の構造化（Phase D-2）はしない。** 約12個の ref を state オブジェクトへ集約するのは別 spec。
- `GameCanvas`/`GameHUD`/`GameControls`/`GameModals` など既存の兄弟コンポーネントの変更。
- エフェクトのトリガー条件・演出パラメータ・描画順序の変更。
- props インターフェースの変更（`GameScreen` の公開 props は不変）。

## 2. 現状調査の要点

- 描画 effect（280-925行）の依存配列: `[map, player, enemies, items, traps, walls, mapState, goalPos,
  debugState, renderTime, attackEffect, lastDamageAt, effectQueueRef, floatingTextManagerRef,
  comboStateRef, spriteRenderer, isDying]`。
- effect 内で `now = renderTime`（内部 state）を使い、**内部に `Date.now`/`Math.random` 直書きは無い**。
  非決定的なのは `effectManagerRef.current.getShakeOffset()`（内部 `Math.random`、アクティブな
  SCREEN_SHAKE が無ければ null＝デフォルト描画では決定的）と一部の攻撃演出（攻撃中のみ実行）。
- **純粋描画でない節がある**: 「パーティクルエフェクトシステム」節（321-370行）は `attackEffect`/
  `lastDamageAt` を見て `effectManagerRef`/`lastAttackEffectKeyRef`/`lastDamageAtRef` を**変更**し、
  外部エフェクトキューを処理し、`effectManagerRef.update/draw`・floating text を更新・描画する。
  この節は **敵描画とプレイヤー描画の間**（z-order のため）にあり、順序を厳守する必要がある。
- 各層が参照する値: ctx, viewport, tileSize, offsetX/Y, now, ドメインデータ（map/player/enemies/items/
  traps/walls/mapState/goalPos/debugState/attackEffect/lastDamageAt/isDying/currentStage/maxLevel/
  rewardEffects）, spriteRenderer, 約12個の ref。

## 3. 抽出後の構造

### RenderContext（描画コンテキスト）

各描画関数へ渡す単一のコンテキストオブジェクト。effect の closure で参照していた値を束ねる:

```typescript
// render/renderContext.ts
export interface RenderContext {
  // 描画プリミティブ
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  viewport: Viewport;
  tileSize: number;
  offsetX: number;
  offsetY: number;
  now: number;            // = renderTime（明示引数化で決定的にする）
  useFullMap: boolean;
  playerScreen: { x: number; y: number };
  // ドメインデータ
  map: GameMap;
  player: Player;
  enemies: Enemy[];
  items: Item[];
  traps: Trap[];
  walls: Wall[];
  mapState: AutoMapState;
  goalPos: { x: number; y: number };
  debugState: DebugState;
  attackEffect?: { position: Position; until: number };
  lastDamageAt: number;
  isDying: boolean;
  currentStage?: StageNumber;
  maxLevel: number;
  rewardEffects: ReturnType<typeof getActiveRewardEffects>;
  // サービス・ref（変更を伴う層が使用）
  spriteRenderer: SpriteRenderer;
  effectManagerRef: React.MutableRefObject<EffectManager>;
  deathEffectRef: React.MutableRefObject<DeathEffect>;
  bossWarningRef: React.MutableRefObject<BossWarningState>;
  afterImageManagerRef: React.MutableRefObject<AfterImageManager>;
  stageStartTimeRef: React.MutableRefObject<number>;
  dyingStartTimeRef: React.MutableRefObject<number>;
  playerAttackUntilRef: React.MutableRefObject<number>;
  playerDamageUntilRef: React.MutableRefObject<number>;
  lastAttackEffectKeyRef: React.MutableRefObject<string | null>;
  lastDamageAtRef: React.MutableRefObject<number>;
  floatingTextManagerRef?: React.MutableRefObject<FloatingTextManager>;
  comboStateRef?: React.MutableRefObject<ComboState>;
  effectQueueRef?: React.MutableRefObject<EffectEvent[]>;
}
```

> 注: 正確なフィールドは実装時に元 effect の参照から確定する。上記は設計時点の見込み。

### render/ モジュール（中粒度・5〜6個）と層の対応

| モジュール | 担当する層（元 effect の順序を保つ） | 性質 |
|-----------|----------------------------------|------|
| `render/drawWorld.ts` | 背景クリア＋シェイク適用 / マップ（タイル）/ パス（デバッグ）/ 罠 / 壁 / アイテム | 純粋描画 |
| `render/drawEnemies.ts` | 敵（スプライト・撃破アニメ・ボスHPオーラ・状態フレーム・HPバー）/ 攻撃スラッシュ | 純粋描画 |
| `render/combatEffects.ts` | 攻撃ヒット/ダメージのトリガー・画面シェイク・外部キュー処理・エフェクト更新描画・floating text | **状態変更＋描画** |
| `render/drawPlayer.ts` | プレイヤー（攻撃/被弾/移動/アイドル）・オーラ・シールド・残像・武器光跡・衝撃波・回転/回復パーティクル | 純粋描画（残像 ref は記録あり） |
| `render/drawOverlays.ts` | 低HP警告 / コンボ / ボスWARNING / シェイク復元 / ゲームオーバー暗転 / 自動マップ / デバッグパネル・座標 | 純粋描画＋bossWarningRef 変更 |

各関数は `(rc: RenderContext) => void`。`combatEffects` と `drawOverlays`(boss warning) は ref を変更するため
純粋ではないが、**呼び出し位置（順序）を元と厳密に一致**させる。

### useGameRender フック

```typescript
// useGameRender.ts
export function useGameRender(params: UseGameRenderParams): void {
  // 元の useEffect をここへ移設。canvas/ctx ガード・viewport/tileSize 計算・
  // RenderContext 構築の後、層を元の順序で呼ぶ:
  //   drawWorld(rc); drawEnemies(rc); combatEffects(rc); drawPlayer(rc); drawOverlays(rc);
  // 依存配列は元と同一に保つ。
}
```

`Game.tsx` は `useGameRender({ canvasRef, canvasWrapperRef, ...refs, ...props, renderTime })` を呼ぶだけになる。

### 段階的抽出の順序（鶏卵問題の回避）

特性化テストを成立させるため、**まず effect 本体を単一関数 `renderGameFrame(rc)` に抽出**してから分割する:

1. effect 本体（描画部分）を `renderGameFrame(rc: RenderContext): void` に丸ごと抽出。effect は
   canvas/viewport セットアップ＋rc 構築＋`renderGameFrame(rc)` 呼び出しになる。`now` を rc 経由の
   明示引数にすることで `renderGameFrame` は固定 rc に対して決定的になる。
2. `renderGameFrame` を特性化テストで baseline 固定（後述）。
3. `renderGameFrame` を5層関数（drawWorld/drawEnemies/combatEffects/drawPlayer/drawOverlays）へ分割。
   各分割後に特性化が不変であることを確認。
4. `renderGameFrame` 呼び出しごと `useGameRender` フックへ移設し、Game.tsx を薄くする。

### 依存方向（循環なし）

```
Game.tsx → useGameRender → render/{drawWorld,drawEnemies,combatEffects,drawPlayer,drawOverlays} → 既存の draw ヘルパー/sprites/effects
```

## 4. 安全網（描画の振る舞い不変の証明）

jsdom では Canvas のピクセル出力を検証できないため、**描画コマンド列（ctx メソッド呼び出しの順序・回数・
主要引数）を記録するモック ctx による特性化テスト**で守る。

- **記録するモック ctx**: `CanvasRenderingContext2D` の主要メソッド（`fillRect`/`drawImage`/`save`/
  `restore`/`translate`/`fillText`/`strokeText`/`beginPath`/`arc`/`fill`/`stroke`/`setTransform`/
  プロパティ代入 `fillStyle`/`globalAlpha` 等）への呼び出しを順に配列へ記録するスタブを作る。
- **決定的な入力**: `renderGameFrame(rc)` を、固定の `now`・アクティブシェイク無し（getShakeOffset が
  null になる初期 effectManager）・代表的なゲーム状態（既存テストの builder/fixture を流用）で呼ぶ。
- **特性化**: 記録した呼び出し列を `toMatchSnapshot()` で baseline 固定（Phase B と同じ一時手法）。
  各分割（drawWorld→…→drawOverlays）後に**差分ゼロ**を確認。Phase D-1 完了後に削除（恒久的負債を残さない）。
- 加えて既存 `Game.test.tsx`（render が成功する統合テスト）を全工程で緑に保つ。

> 攻撃中・被弾中・ボスWARNING・ゲームオーバーなど分岐の多い状態については、特性化の入力バリエーションを
> 数パターン用意し（attackEffect あり / isDying true 等）、各々の描画コマンド列を baseline 化する。
> ただし `Math.random` を使う演出（武器光跡・衝撃波・シェイク）が混ざる状態は、その関数をスタブするか
> 該当状態を避けて決定性を確保する（実装時に判断）。

## 5. 検証手順（refactor-safely）

1. effect 本体を `renderGameFrame(rc)` へ抽出（render/ に配置）。`Game.test.tsx` 緑を確認。
2. 特性化テストを追加し baseline 固定・コミット。
3. `renderGameFrame` を5層へ分割（1コミット=1〜2層）。各分割後に特性化差分ゼロ＋`Game.test.tsx` 緑。
4. `useGameRender` フックへ移設し Game.tsx を薄くする。特性化＋統合テスト緑。
5. 特性化テストを削除。
6. 最終確認: `npx jest Game` / `npx jest ipne` / `npm run typecheck` / `npm run lint:ci` 全パス。

各ステップで:

```bash
npx jest Game render 2>&1 | tail -8
npm run typecheck
```

### 完了の定義（Definition of Done）

- [ ] 描画ロジックが `useGameRender` フック＋`render/` の5〜6モジュールへ抽出されている
- [ ] `Game.tsx` が `useGameRender(...)` 呼び出し中心の薄いコンポーネントになっている（990行 → 大幅減）
- [ ] 描画順序・ctx コマンド列が抽出前後で一致（特性化テストで証明）
- [ ] 「効果トリガー＋更新」節の呼び出し位置（敵とプレイヤーの間）が保たれている
- [ ] `GameScreen` の公開 props・依存配列が不変、兄弟コンポーネント無変更
- [ ] refs の構造化（D-2）に手を付けていない（YAGNI）
- [ ] 一時特性化テストが削除されている（負債ゼロ）
- [ ] `npx jest ipne` / `npm run typecheck` / `npm run lint:ci` 全パス

## 6. リスクと緩和

| リスク | 緩和策 |
|--------|--------|
| 描画順序がずれて z-order が変わる | 層を元の順序で呼ぶ。特性化テストで描画コマンド列の順序一致を機械的に検証 |
| closure 変数の渡し漏れ | RenderContext に集約し typecheck で検出。特性化で出力差分も検出 |
| 「効果トリガー」節の副作用（ref 変更）の取りこぼし | combatEffects に閉じ込め、呼び出し位置を厳守。attackEffect ありの特性化入力で検証 |
| Math.random 由来の非決定性で特性化が不安定 | 決定的な状態（シェイク無し・攻撃中でない）を基本入力にし、必要なら該当演出関数をスタブ |
| 巨大 effect の一括抽出による事故 | まず renderGameFrame へ単一抽出 → baseline 固定 → 小さく分割、の順で段階化 |
