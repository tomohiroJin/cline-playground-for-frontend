# Air Hockey 打撃感の階調化＋モバイル触覚 設計書

- 作成日: 2026-07-02
- 対象: `src/features/air-hockey`
- スコープ: 案A（最小）— 打撃フィードバックの階調化 ＋ モバイル触覚 ＋ Canvas ループの reduced-motion 対応

## 1. 背景と目的

Air Hockey は演出要素（トレイル・shake・hitStop・衝撃波・combo・fever・particles・Web Audio サウンド）が既に豊富に実装済みである。一方で「パックを打った瞬間の手触り（打撃感）」には以下の弱点がある。

- **二値的なフィードバック**: 強打判定が `speed > STRONG_HIT_SPEED_THRESHOLD (=8)` の単一閾値。弱打・中打・強打の階調がなく、軽く当てても強く弾いても手応えの差が乏しい。
- **shake が速度非連動**: `HIT_SHAKE_INTENSITY (=3)` の固定強度。打撃の強さが画面反応に反映されない。
- **触覚フィードバックなし**: `navigator.vibrate` によるモバイル振動が未実装。
- **Canvas ループが reduced-motion 非対応**: `useReducedMotion` はコンポーネント側（VsScreen 等）でのみ使用。ゲームループの shake / hitStop は `prefers-reduced-motion` を考慮していない。

本設計は、打撃の強さに応じて反応量を**連続的にスケール**させ（階調化）、モバイル触覚を追加し、Canvas ループでも reduced-motion に対応することで、ゲームの核心である「打つ気持ちよさ」を根本から底上げする。

### スコープ外（今回やらないこと）

以下は「A＋B軽量」案に含まれていたが、本スコープ（案A）では**実装しない**。将来の拡張候補として記録する。

- パック squash & stretch（潰れ・伸びの変形描画）
- 接触点のスパークパーティクル
- マレットのリコイル（反動）演出
- 触覚 ON/OFF の設定パネルトグル（reduced-motion 連動のみで制御する）

## 2. 決定事項

| 項目 | 決定 |
|------|------|
| スコープ | 案A（最小）: 階調化 ＋ 触覚 ＋ reduced-motion |
| reduced-motion 有効時 | **強い動きのみ停止** = screen shake / hitStop / 振動を停止。**サウンドは残す** |
| 触覚 ON/OFF 設定 | **追加しない**（reduced-motion 連動のみで制御） |
| 打撃強度の指標 | 衝突「後」のパック速度（`postSpeed` = プレイヤーが体感する弾き速度） |

## 3. アーキテクチャ / 責務分割

Clean Architecture に沿い、「打撃の強さ → 反応量」の計算を**純粋関数として `core/` に隔離**する。UI・ゲームループはその結果を発火するだけにして、テスト可能性とチューニングの安全性を確保する。

| 追加/変更 | 場所 | 責務 |
|-----------|------|------|
| `computeImpact(hitSpeed)` | `core/impact.ts`（新規） | 打撃速度から反応量を返す純粋関数。下限未満は `null` |
| `ImpactResponse` 型 | `core/impact.ts`（新規） | 反応量の値オブジェクト（下記） |
| `vibrate(ms)` | `core/haptics.ts`（新規） | `navigator.vibrate` の feature-detection ラッパ |
| `reducedMotion?: boolean` を追加 | `presentation/hooks/useGameLoop.ts` の `GameLoopConfig` | reduced-motion フラグの受け渡し |
| 衝突時の反応発火を差し替え | `presentation/hooks/useGameLoop.ts` の `processCollisions` | 二値判定を `computeImpact` ベースへ置換。触覚・reduced-motion 分岐を追加 |
| `reducedMotion` を供給 | `presentation/AirHockeyGame.tsx`（呼び出し元） | `useReducedMotion()` の結果を `config.reducedMotion` に渡す |

### 依存方向の確認

- `core/impact.ts`・`core/haptics.ts` は外部依存なし（`core/haptics.ts` は `navigator` グローバルの feature-detection のみ）。ドメイン層の純粋性を保つ。
- `presentation/hooks/useGameLoop.ts` が `core/` を参照（既存の依存方向に一致）。

## 4. `core/impact.ts` の設計

### 型

```ts
/** 打撃の強さに応じた反応量（値オブジェクト） */
export type ImpactResponse = {
  /** shake 強度（px 相当） */
  shakeIntensity: number;
  /** shake 持続時間（ms） */
  shakeDuration: number;
  /** hitStop フレーム数（0 なら hitStop なし） */
  hitStopFrames: number;
  /** 衝撃波の最大半径（px） */
  shockwaveMaxRadius: number;
  /** モバイル振動時間（ms） */
  vibrationMs: number;
};
```

### 関数

```ts
export const computeImpact = (hitSpeed: number): ImpactResponse | null
```

- 入力: `hitSpeed` = 衝突後のパック速度の大きさ（magnitude）。
- 下限 `IMPACT_MIN_SPEED` 未満なら `null`（＝反応なし。呼び出し側は既存のヒット音のみ再生）。
- `t = clamp((hitSpeed - IMPACT_MIN_SPEED) / (IMPACT_MAX_SPEED - IMPACT_MIN_SPEED), 0, 1)` を線形補間の係数とし、各反応量を `lerp` でスケールする。

### チューニング初期値（`core/impact.ts` 内の名前付き定数）

| 定数 | 値 | 備考 |
|------|-----|------|
| `IMPACT_MIN_SPEED` | 4 | これ未満は `null`（従来の軽打挙動を維持） |
| `IMPACT_MAX_SPEED` | 16 | `PHYSICS.MAX_POWER` 相当で頭打ち |
| `shakeIntensity` | lerp(2, 9, t) | 従来固定 3 → 2〜9 の連続値 |
| `shakeDuration` | lerp(120, 220, t) | ms |
| `hitStopFrames` | round(lerp(0, 4, t)) | 低速では 0（hitStop なし）に落ちる |
| `shockwaveMaxRadius` | lerp(40, 110, t) | 従来固定 80 |
| `vibrationMs` | round(lerp(8, 40, t)) | 触覚の強弱 |

> 補間は当面**線形**とする。テストで単調性を固定した上で、実機チューニング時に係数（例: `t` へのイージング適用）を調整できる余地を残す。

## 5. `core/haptics.ts` の設計

```ts
/**
 * モバイル触覚フィードバック。
 * 非対応環境（navigator.vibrate 未実装 / SSR）では無害にスキップする。
 */
export const vibrate = (ms: number): void => {
  if (ms <= 0) return;
  if (typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(ms);
  } catch {
    // 一部環境では例外を投げるため握りつぶす（機能低下のみ、致命的でない）
  }
};
```

- reduced-motion 連動での抑制は**呼び出し側**（`useGameLoop`）で行う。`vibrate` 自体は純粋なラッパに保つ。

## 6. データフロー（1 回の打撃）

`processCollisions`（`useGameLoop.ts`）内、パック × マレット衝突が成立したブロックを以下へ差し替える。

```
マレット衝突成立
  ├ sound.hit(speed)                       ← 既存どおり常時再生
  └ if (isPuck):
       postSpeed = magnitude(obj.vx, obj.vy)
       impact = computeImpact(postSpeed)
       if (impact != null):
         if (!reducedMotion):
             triggerShake(impact.shakeIntensity, impact.shakeDuration)
             if (impact.hitStopFrames > 0 && !hitStop.active):
                 hitStop.active = true
                 hitStop.framesRemaining = impact.hitStopFrames
                 hitStop.impactX/Y = obj.x/obj.y
                 hitStop.shockwaveRadius = 0
                 hitStop.shockwaveMaxRadius = impact.shockwaveMaxRadius
             vibrate(impact.vibrationMs)
```

### 変更点の要旨

- 既存の `if (isPuck && speed > STRONG_HIT_SPEED_THRESHOLD) { triggerShake(固定値); ... hitStop(3フレーム, 半径80) }` を撤去。
- 反応量はすべて `computeImpact` の戻り値から取得（階調化）。
- `reducedMotion` が真のとき shake / hitStop / vibrate を**すべてスキップ**（サウンドは上位で常時再生済み）。
- `STRONG_HIT_SPEED_THRESHOLD` / `HIT_SHAKE_INTENSITY` / `HIT_SHAKE_DURATION` 定数は不要になり削除（`computeImpact` へ集約）。`GOAL_SHAKE_*` はゴール演出用として残す。

## 7. `reducedMotion` の受け渡し

- `GameLoopConfig` に `reducedMotion?: boolean`（省略時 `false`）を追加。
- `processCollisions` から参照できるよう、`useGameLoop` 本体で `const reducedMotion = config.reducedMotion ?? false;` を確定させる。
- 呼び出し元 `presentation/AirHockeyGame.tsx` で `useReducedMotion()`（既存フック `src/features/air-hockey/hooks/useReducedMotion.ts`）を呼び、`config.reducedMotion` に渡す。

> 注: `useReducedMotion` はメディアクエリ変化を購読するため、値が変化すると `useGameLoop` の依存配列経由でループが再構築される。プレイ中に OS 設定を切り替えるケースは稀であり、許容する。

## 8. エラー処理 / 安全性

- **触覚非対応環境**: `vibrate` の feature-detection で無害スキップ（iOS Safari 等でクラッシュしない）。
- **下限未満の打撃**: `computeImpact` が `null` を返し、既存の軽打挙動（ヒット音のみ）を完全に維持する（後方互換）。
- **hitStop 二重発火防止**: 既存の `!hitStop.active` ガードを維持。
- **reduced-motion 時の一貫性**: 視覚的な強い動き（shake / hitStop）と触覚を停止し、聴覚フィードバック（sound.hit）は維持する。

## 9. テスト戦略（TDD, Red → Green → Refactor）

| 対象 | ファイル | テスト内容 |
|------|---------|-----------|
| `computeImpact` | `core/impact.test.ts` | ① 下限未満 → `null` ② 下限以上で非 `null` ③ 速度増加に対し各反応量が単調非減少 ④ 最大速度超過でクランプ（頭打ち） ⑤ hitStopFrames は低速で 0 |
| `vibrate` | `core/haptics.test.ts` | ① `ms <= 0` で `navigator.vibrate` を呼ばない ② `navigator.vibrate` 未定義でも例外を投げない ③ 対応環境で正しい ms を渡す（モック） ④ `vibrate` が例外を投げても握りつぶす |
| `processCollisions` 統合 | `__tests__/integration/` 既存/新規 | ① 強打で shake が発火し、`computeImpact` 相当の強度になる ② 下限未満の打撃で shake / hitStop が発火しない ③ `reducedMotion=true` で shake / hitStop / vibrate が発火しない（sound.hit は発火） |

- カバレッジ目標: 新規コード 80%+、`computeImpact`（ビジネスロジック）90%+。
- テストは実装より先に書く。`navigator.vibrate` はテストでモック（jsdom 既定では未定義のため、③ は明示的に注入）。

## 10. 完了の定義（Definition of Done）

- [ ] `core/impact.ts` / `core/haptics.ts` が実装され、単体テストが通る
- [ ] `useGameLoop` の打撃フィードバックが `computeImpact` ベースへ置換され、統合テストが通る
- [ ] `AirHockeyGame.tsx` が `reducedMotion` を供給
- [ ] `npm run ci`（lint:ci + typecheck + test + build）がグリーン
- [ ] 既存の演出（trail / combo / fever / goal shake）が回帰していない
- [ ] README の演出関連記述を必要に応じて更新

## 11. 将来の拡張候補（本スコープ外）

- パック squash & stretch（`computeSquashScale` 純粋関数 ＋ renderer 変形描画）
- 接触点スパークパーティクル
- マレットリコイル演出
- 触覚 ON/OFF 設定トグル（設定パネル拡張）
- 音・BGM の状況連動化（別テーマ）
