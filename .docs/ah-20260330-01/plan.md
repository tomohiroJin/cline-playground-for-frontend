# Air Hockey ペアマッチ品質向上 — 実装計画

## 背景

Phase S5-1〜S5-12 でペアマッチ（2v2）の**基本フローが完成**した（2026-03-29）。
チーム構成選択 → VS演出 → ゲーム → リザルトの一連フローが動作し、85スイート/1256テスト全パスの状態。

しかし、**ペアマッチの対戦体験としての完成度**にはまだ改善余地がある。

### 現在の問題点

| # | 問題 | 影響 |
|---|------|------|
| 1 | ally CPU がキャラ別 AI プロファイルを反映していない（SR-3） | P2 のキャラ選択が無意味になる |
| 2 | sidePreference ロジックが未実装（TODO: ai.ts:125） | キャラ固有の横方向ポジショニングが機能しない |
| 3 | CPU 戦略が aggressiveness / lateralOscillation 中心で浅い | 全キャラが似たような動きに見える |
| 4 | 4マレット同時処理でパフォーマンス低下（FB-4） | フレームレート低下、操作のもたつき |
| 5 | P3/P4 の人間操作に非対応（入力デバイス不足） | 4人対戦ができない |
| 6 | ゲーム中断時に確認なしで全設定リセット（SR-5） | 誤操作でチーム設定が失われる |

## 目標

> 「ペアマッチの対戦体験を、AI の個性・操作性・パフォーマンスの3軸で磨き上げる」
> — 遊んでいて「キャラごとの違い」を感じ、快適に4人対戦できる状態にする

### スコープ

**含む:**
- ally CPU へのキャラ別 AI プロファイル適用（SR-3 修正）
- sidePreference ロジックの実装
- CPU 戦略の深化（守備パターン・打ち返し角度・リアクション速度・連携 AI）
- パフォーマンス計測と最適化（Canvas 描画・物理演算・React レンダリング）
- Gamepad API による P3/P4 人間操作対応
- 中断時の確認ダイアログ追加
- 上記に対するテスト

**含まない:**
- ストーリー第2章の実装（別フェーズ）
- 新キャラクター画像アセットの生成
- デザインシステムの一元管理（大規模リファクタ）
- ネットワーク対戦

## フェーズ構成

```
Phase S6-1: ally CPU の AI プロファイル修正（SR-3）
  → P2 CPU 時にキャラ別 AI 設定が正しく反映されるようにする
      ↓
Phase S6-2: sidePreference ロジック実装
  → キャラ固有の横方向ポジショニングを AI に組み込む
      ↓
Phase S6-3: CPU 戦略の深化
  → 守備パターン・打ち返し角度・リアクション速度・連携 AI を実装
      ↓
Phase S6-4: パフォーマンス最適化
  → プロファイリング → ボトルネック特定 → 段階的最適化
      ↓
Phase S6-5: Gamepad API — P3/P4 人間操作対応
  → ゲームパッドによる4人同時操作を実現
      ↓
Phase S6-6: 中断時の確認ダイアログ（SR-5）
  → ゲーム中断時に設定リセット前の確認 UI を追加
      ↓
Phase S6-7: テスト・品質保証
  → 全フェーズの統合テスト・リグレッション確認
```

### Phase 間の依存関係

| 依存元 | 依存先 | 理由 |
|--------|--------|------|
| S6-1 | S6-2, S6-3 | AI プロファイル反映が基盤。修正前に深化しても効果が見えない |
| S6-2 | S6-3 | sidePreference が戦略深化の入力の一つ |
| S6-3 | S6-4 | AI 処理が増えた後にパフォーマンス計測する方が正確 |
| S6-4 | S6-5 | パフォーマンス確保後に入力デバイス追加（負荷増大に備える） |
| S6-6 | — | 独立。S6-5 完了後を推奨（#4: `src/components/` への書き込みでマージ競合リスクを回避） |

## 各フェーズ詳細

### Phase S6-1: ally CPU の AI プロファイル修正（S）

**問題**: `useGameLoop` 内で ally CPU の更新時に `buildAllyAiConfig(difficulty, characterId)` が呼ばれているが、
`allyCharacterId` が正しく伝達されていない可能性がある。結果、ally CPU がデフォルトの AI 設定で動作する。

**修正方針**:
1. `useGameLoop` 内の ally AI 更新箇所を確認
2. `allyCharacterId` → `buildAllyAiConfig` → `getCharacterAiProfile` の呼び出しチェーンを検証
3. `effectiveAiConfig` が ally/cpu/enemy それぞれ独立に構築されていることを確認
4. 不足があれば修正し、テストで検証

**影響範囲**: `presentation/hooks/useGameLoop.ts`, `core/story-balance.ts`

### Phase S6-2: sidePreference ロジック実装（M）

**問題**: `AiPlayStyle.sidePreference` が定義されているが、`ai.ts:125` の TODO として未実装。

**実装方針**:
1. `sidePreference` の定義: `-1`（左寄り）〜 `0`（中央）〜 `1`（右寄り）
2. `calculateTargetWithBehavior` 内で、ターゲット X 座標に `sidePreference * OFFSET_PX` を加算
3. `OFFSET_PX` はフィールド幅の 10〜15% 程度（60〜90px）
4. 各キャラの sidePreference 値を `character-ai-profiles.ts` で設定
5. テストで横方向のオフセットが反映されることを検証

**R-4 対応**: ally CPU は Y 軸反転して AI 計算するため、sidePreference の左右も反転させる。
`pair-match-logic.ts` の `updateExtraMalletAI` 内で `playStyle.sidePreference * -1` を渡す。

**影響範囲**: `core/ai.ts`, `core/character-ai-profiles.ts`, `core/pair-match-logic.ts`

### Phase S6-3: CPU 戦略の深化（L）

**現状**: aggressiveness（前後ポジション）と lateralOscillation（横揺さぶり）のみで個性を表現。

**追加する戦略要素**:

| 要素 | 概要 | パラメータ | 適用箇所 |
|------|------|-----------|---------|
| **守備パターン** | ゴール前のポジショニング傾向 | `defenseStyle: 'center' \| 'wide' \| 'aggressive'` | `calculateTargetWithBehavior` |
| **打ち返し角度** | 衝突時のパック方向への影響 | `deflectionBias: number` (-1〜1) | `resolveMalletPuckOverlap` or 新関数 |
| **リアクション速度** | パック方向転換への反応遅延 | `reactionDelay: number` (ms) | `updateWithBehavior` |
| **連携 AI** | ペアマッチでのチーム戦術 | `teamRole: 'attacker' \| 'defender' \| 'balanced'` | `updateExtraMalletAI` |

**守備パターンの詳細**:
- `center`: ゴール中央を守る（タクマ型）— X をゴール中央に吸引
- `wide`: ゴール幅全体をカバー（ミサキ型）— 横方向の揺さぶりを防御に転用
- `aggressive`: 前に出て打ち返す（ヒロ型）— ゴール前にこだわらず中盤で迎撃

**打ち返し角度の詳細**:
- `deflectionBias > 0`: パックを壁方向に弾く傾向（バウンスショット）
- `deflectionBias < 0`: パックをまっすぐ返す傾向（ストレートショット）
- 衝突解消時の法線ベクトルに bias をかけて方向を偏らせる

**リアクション速度の詳細**:
- パックの方向転換（ゴール方向→壁バウンス等）後、新ターゲット計算までの遅延
- 値が大きいほど反応が鈍い（初心者 CPU 表現）
- 実装: `targetTime` のリセットにディレイを追加

**連携 AI の詳細**:
- `attacker`: 前方（相手側）にポジションし、パックを積極的に追う
- `defender`: 自陣ゴール前に張り付き、パックが来た時だけ反応
- `balanced`: aggressiveness に応じた標準動作（現行と同等）
- 2v2 時に ally/enemy それぞれに teamRole を割り当て

**S-4 対応**: スコア差に応じた動的 teamRole 切り替え:
- 2点以上負けている → attacker 傾向を強化（aggressiveness 追加 +0.1）
- 2点以上勝っている → defender 傾向を強化（aggressiveness 追加 -0.1）
- `adaptability` パラメータが高いキャラほどこの動的調整の幅が大きい

**R-3 対応**: キャラ AI 特性の視覚的フィードバック:
- TeamSetupScreen の各キャラスロットに簡易特性アイコンを表示
- 攻撃型（剣アイコン）/ 守備型（盾アイコン）/ テクニック型（星アイコン）/ バランス型（丸アイコン）
- キャラ選択グリッドにも同様のアイコンを付与し、選択前に特性が分かるようにする

**#6 対応**: aggressiveness vs defenseStyle の優先ルール:
- `defenseStyle` はパックが**相手陣地にある時のみ**適用
- パックが自陣にある時は `aggressiveness` ベースの攻撃/追跡ロジックが優先
- これにより2つのパラメータが同時に前後ポジションを競合することがない

**#7 対応**: sidePreference と lateralOscillation の適用順序:
1. 基本ターゲット X → 2. sidePreference 適用 → 3. oscillation 適用 → 4. clamp
- sidePreference が「ホームポジション」を決め、oscillation がその周りで揺さぶり

**#3 対応**: deflectionBias の CPU/人間区別:
- `resolveMalletPuckOverlap` に `deflectionBias` パラメータを追加
- 呼び出し側で人間=0、CPU=キャラ値を渡す

**#9 対応**: ally CPU の reactionDelay キャップ:
- `buildAllyAiConfig` で `ALLY_REACTION_DELAY_CAP = 120ms` を適用
- ルーキーを ally に選んでも最低限の反応速度を保証

**#12 対応**: S6-3 はサブフェーズ単位で品質ゲートを設ける:
- S6-3a〜3b 完了時: 型定義 + 守備パターンで中間テスト
- S6-3c〜3e 完了時: 打ち返し + 反応 + 連携で中間テスト
- S6-3f〜3h 完了時: 動的切り替え + UI + 最終テスト
- 各品質ゲートで既存テスト全パス・型エラーなしを確認

**影響範囲**: `core/ai.ts`, `core/character-ai-profiles.ts`, `core/story-balance.ts`, `core/pair-match-logic.ts`, `core/entities.ts`, `components/TeamSetupScreen.tsx`

### Phase S6-4: パフォーマンス最適化（L）

**計測フェーズ**（最初に実施）:
1. Chrome DevTools Performance タブで 2v2 ゲーム中のフレーム分析
2. 以下の処理の実行時間を計測:
   - AI ターゲット計算（4マレット分）
   - 衝突判定ループ（マレット×パック×障害物）
   - Canvas 描画（全エンティティ）
   - React コンポーネント再レンダリング

**R-5 対応**: パフォーマンス計測の自動化:
- `performance.mark` / `performance.measure` を useGameLoop 内の主要処理（AI 更新、衝突判定、描画）に埋め込む
- 開発モード（`process.env.NODE_ENV === 'development'`）のみ Canvas 左上に FPS カウンターを表示
- 計測データは `console.table` で出力可能にし、before/after の定量比較を支援

**最適化候補**（計測結果に応じて優先順位決定）:

| 対策 | 期待効果 | 難易度 |
|------|---------|--------|
| **衝突判定の早期リターン（S-1）** | 距離の二乗比較（`dx*dx+dy*dy > r*r`）で sqrt 回避 | S |
| **Canvas ダーティリージョン** | 変更のあったエリアのみ再描画 | M |
| **AI 計算の間引き（MF-3 統合）** | reactionDelay と統合し、フレームスキップ分を含めた一元管理 | M |
| **オブジェクト生成の抑制** | 毎フレームの一時オブジェクト（Vector 等）をプール化 | M |
| **requestAnimationFrame フレームスキップ** | 描画が追いつかない場合に物理演算のみ実行 | M |

**MF-3 対応（#1/#11: 方式 A 確定）**: AI 間引きと reactionDelay の統合設計:
- **方式 A を確定採用**。`AI_UPDATE_INTERVAL` は使用しない
- S6-3 で実装した `shouldRecalculateTarget` を S6-4 で拡張する（上書きではない）
  - S6-3 の責務: パック方向転換時の遅延制御
  - S6-4 の追加: 通常時の定期再計算（reactionDelay * 3, 最低 100ms）
- ターゲット再計算のみ遅延、マレット移動の補間は毎フレーム実行

**#5 対応**: 計測結果が想定外だった場合のフォールバック:
- S6-4-4（ボトルネック特定）の後に判断分岐を設ける
- 想定外のボトルネックが見つかった場合、追加タスクを動的に作成
- 例: React 再レンダリングが主因 → memo/useMemo 見直しタスクを追加
- 例: 全モード共通の問題 → 影響範囲を拡大し、1v1/2P のテストも強化

**影響範囲**: `core/physics.ts`, `core/ai.ts`, `presentation/hooks/useGameLoop.ts`, `infrastructure/renderer/`

### Phase S6-5: Gamepad API — P3/P4 人間操作対応（L）

**概要**: Web Gamepad API を使い、ゲームパッド接続時に P3/P4 を人間操作可能にする。

**入力マッピング設計**:

| プレイヤー | 入力方式 | マッピング |
|-----------|---------|-----------|
| P1 | マウス / タッチ / 矢印キー | 既存のまま |
| P2 | WASD / タッチ / Gamepad 1 | 既存 + ゲームパッド追加 |
| P3 | Gamepad 2 | 新規 |
| P4 | Gamepad 3 | 新規 |

**実装構成**:
1. `core/gamepad.ts` — Gamepad API ラッパー（接続検出、軸/ボタン読み取り）
2. `hooks/useGamepadInput.ts` — React フック（ポーリングループ、スロット割り当て）
3. `useGameLoop.ts` — ゲームパッド入力を P3/P4 マレットに適用
4. `TeamSetupScreen.tsx` — P3/P4 の CPU/人間切り替え UI（ゲームパッド接続時のみ有効化）

**Gamepad API の使い方**:
```typescript
// ポーリング方式（requestAnimationFrame と同期）
const gamepads = navigator.getGamepads();
// axes[0]: 左スティック X, axes[1]: 左スティック Y
// デッドゾーン: |axis| < 0.15 は無視
```

**フォールバック**:
- ゲームパッド未接続時は P3/P4 の人間操作は無効（CPU のみ）
- `navigator.getGamepads` 非対応ブラウザでは機能自体を非表示

**R-2 対応**: ゲームパッド接続/切断時のトースト通知:
- 「🎮 コントローラー 1 が接続されました」「🎮 コントローラー 1 が切断されました」
- Canvas 下部に 3 秒間表示 → フェードアウト
- ゲーム中・TeamSetupScreen の両方で表示

**S-2 対応**: スティック感度の非線形カーブ:
- 線形 `axis * speed` → 非線形 `sign(axis) * axis^2 * speed`
- 微調整が効きやすく、フルチルトで最大速度に到達
- GAMEPAD_MOVE_SPEED は 12 に調整（非線形カーブで実効速度が下がるため）

**影響範囲**: 新規ファイル 2 つ + `presentation/hooks/useGameLoop.ts`, `components/TeamSetupScreen.tsx`, `presentation/AirHockeyGame.tsx`

### Phase S6-6: 中断時の確認ダイアログ（S）

**問題**: `resetToFree()` がメニューボタン・戻るボタンから直接呼ばれ、チーム設定が確認なしでリセットされる。

**実装方針**:
1. 確認ダイアログコンポーネントを `src/components/` に作成（S-3: 共通コンポーネント化）
2. 2v2 モードの**ゲーム中（pause）**と**リザルト画面**でのみ表示
3. 「続ける」→ダイアログを閉じる / 「メニューに戻る」→ `resetToFree()` を実行
4. 1v1 / ストーリーモードでは従来通り（確認なし）
5. **MF-2 対応**: TeamSetupScreen からの戻りでは確認ダイアログ不要（まだゲーム未開始のため）

**MF-1 対応**: キーマッピングの安全設計:
- 初期フォーカスを「続ける」ボタンに設定
- `Enter` → フォーカス中のボタンを実行（初期状態では「続ける」）
- `Escape` → 「続ける」（ダイアログを閉じる）
- Tab でボタン間移動（フォーカストラップ）
- 破壊的操作（メニューに戻る）は明示的にフォーカス移動 + Enter、またはクリック/タップが必要

**R-1 対応**: ダイアログアニメーション:
- オーバーレイ: `opacity: 0→0.7`（150ms ease-out）
- ダイアログ本体: `scale(0.95)→scale(1)` + `opacity: 0→1`（150ms ease-out）
- `prefers-reduced-motion` 時はアニメーションスキップ（即座表示）

**UI 仕様**:
```
┌─────────────────────────────┐
│                             │
│   ゲームを終了しますか？      │
│   チーム設定がリセットされます  │
│                             │
│  [*続ける*]  [ メニューに戻る ] │  ← 「続ける」に初期フォーカス
│                             │
└─────────────────────────────┘
```

**影響範囲**: `src/components/ConfirmDialog.tsx`（新規・共通） + `presentation/AirHockeyGame.tsx`

### Phase S6-7: テスト・品質保証（M）

- 既存テスト全パス確認（`npm test`）
- 型エラーなし確認（`npm run typecheck`）
- ESLint エラーなし確認（`npm run lint:ci`）
- ビルド成功確認（`npm run build`）
- 全ゲームモード（フリー・ストーリー・2P・2v2）の動作確認

## デザインレビュー指摘事項（2026-03-30）

以下の指摘を各フェーズに統合済み。

### 必須修正（Must Fix）

| # | 指摘 | 対応フェーズ | 対応内容 |
|---|------|------------|---------|
| MF-1 | ConfirmDialog の Enter キーが破壊的操作に割り当てられている | S6-6 | 初期フォーカスを「続ける」に設定。Enter はフォーカス中のボタンを実行 |
| MF-2 | TeamSetupScreen 戻るボタンの確認ダイアログが過剰 | S6-6 | TeamSetupScreen からの戻りでは確認不要に変更。ゲーム中・リザルトのみ |
| MF-3 | AI 間引きと reactionDelay の二重遅延リスク | S6-3/S6-4 | reactionDelay 計算にフレームスキップ分を含める統合設計に変更 |

### 推奨改善（Recommended）

| # | 指摘 | 対応フェーズ | 対応内容 |
|---|------|------------|---------|
| R-1 | ConfirmDialog にアニメーションがない | S6-6 | フェードイン（150ms）+ reduced-motion 対応を追加 |
| R-2 | Gamepad 接続時のフィードバックが不足 | S6-5 | トースト通知で接続/切断を表示 |
| R-3 | キャラ AI 特性の視覚的フィードバックがない | S6-3 | TeamSetupScreen にキャラ特性アイコン/レーダーを表示 |
| R-4 | sidePreference の Y 軸反転が未考慮 | S6-2 | ally CPU の座標反転時に sidePreference も反転する処理を追加 |
| R-5 | パフォーマンス計測の自動化がない | S6-4 | performance.mark/measure + 開発モード FPS カウンター |

### 提案（Suggestions）

| # | 指摘 | 対応フェーズ | 対応内容 |
|---|------|------------|---------|
| S-1 | quickReject を距離の二乗比較に変更 | S6-4 | `dx*dx + dy*dy > maxDist*maxDist` 方式に変更 |
| S-2 | Gamepad スティック感度の非線形カーブ | S6-5 | `axis^2 * speed` の非線形カーブを適用 |
| S-3 | ConfirmDialog を共通コンポーネント化 | S6-6 | `src/components/` に配置し他ゲームでも再利用可能に |
| S-4 | 連携 AI の動的 teamRole 切り替え | S6-3 | スコア差に応じて attacker/defender を動的に傾ける |

## シナリオレビュー指摘事項（2026-03-30）

以下の指摘を各フェーズ・spec・tasks に統合済み。

### 致命的/高（実装前に解決必須）

| # | カテゴリ | 指摘 | 対応 |
|---|---------|------|------|
| 1 | フラグ矛盾 | reactionDelay の S6-3→S6-4 での責務が不明確 | 方式 A 確定。S6-3=方向転換遅延、S6-4=定期再計算を追加（上書きではない） |
| 3 | フラグ矛盾 | deflectionBias が CPU/人間を区別できない | `resolveMalletPuckOverlap` に bias パラメータ追加、呼び出し側で制御 |
| 6 | キャラ整合性 | aggressiveness と defenseStyle の優先ルール未定義 | defenseStyle はパック相手陣地時のみ。自陣時は aggressiveness 優先 |
| 11 | 伏線未回収 | spec で AI 間引き方式 A/B が並記で未決定 | 方式 A 確定、方式 B は参考情報に格下げ |

### 中（品質向上のため対応推奨）

| # | カテゴリ | 指摘 | 対応 |
|---|---------|------|------|
| 2 | フラグ矛盾 | getScoreAdjustment の呼び出しタスクが欠落 | S6-3-15b タスクを追加 |
| 5 | 到達可能性 | S6-4 計測結果が想定外の場合の分岐なし | S6-4-4 後に判断分岐を明記 |
| 7 | キャラ整合性 | oscillation + sidePreference の累積 | 適用順序を確定（基本→side→osc→clamp） |
| 9 | キャラ整合性 | ally にルーキー選択時の UX 悪化 | buildAllyAiConfig で reactionDelay キャップ 120ms |
| 12 | テキスト量 | S6-3 が 22 タスクに肥大化 | サブフェーズ単位の品質ゲート（3段階）を追加 |
| 13 | テキスト量 | 1v1 での新パラメータ検証が不足 | S6-7-5 を拡充 |

### 低（余裕があれば対応）

| # | カテゴリ | 指摘 | 対応 |
|---|---------|------|------|
| 4 | 到達可能性 | S6-6 の並行実施でマージ競合リスク | S6-5 完了後の実施を推奨 |
| 8 | キャラ整合性 | タクマの reactionDelay=30ms の意図が不明 | パラメータ表に設計意図コメント列を追加 |
| 10 | 伏線未回収 | buttonA が未使用のまま型定義に含まれる | JSDoc で次フェーズ接続予定を明記 |

## リスク管理

| リスク | 影響度 | 対策 |
|--------|--------|------|
| AI 戦略追加でパフォーマンスがさらに悪化 | 高 | S6-4 で計測→最適化を S6-3 の直後に実施 |
| Gamepad API のブラウザ互換性 | 中 | feature detection で非対応ブラウザは機能非表示 |
| 連携 AI の設計複雑化 | 中 | まず `teamRole` の 3 パターンに限定、段階的に拡張 |
| 既存モード（1v1/2P/ストーリー）への影響 | 高 | 各フェーズで既存テスト全パスを確認 |
| 打ち返し角度の調整が難しい（ゲームバランス） | 中 | `deflectionBias` の範囲を狭く設定、プレイテストで調整 |
| AI 間引きと reactionDelay の二重遅延（MF-3） | 高 | reactionDelay にフレームスキップを統合し二重計上を防止 |
| Enter キー誤操作で設定喪失（MF-1） | 中 | 安全な操作に初期フォーカス、破壊的操作は明示クリック |

## 完了チェックリスト

- [ ] すべてのフェーズが完了（S6-1〜S6-7）
- [ ] 既存テスト全パス
- [ ] 新規テスト追加・全パス
- [ ] 型エラーなし
- [ ] ESLint エラーなし
- [ ] ビルド成功
- [ ] 全ゲームモードの動作確認

## 後続チケット（本フェーズのスコープ外）

| # | 項目 | 優先度 |
|---|------|--------|
| NEXT-1 | ストーリー第2章実装（新キャラ 3 名 + ダイアログ） | 高 |
| NEXT-2 | 新キャラ画像アセット生成（リク・カナタ・シオン） | 高 |
| NEXT-3 | アイテム使用履歴トラッキング | 低 |
| NEXT-4 | デザインシステム一元管理（色・フォント・スペーシング） | 低 |
