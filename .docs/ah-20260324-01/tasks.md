# Step 2: CPU AI のキャラ個性化 — タスクチェックリスト

## 進捗サマリー

| フェーズ | ステータス | タスク数 | 完了日 |
|---------|-----------|---------|--------|
| S2-1 型定義・データ構造 | [ ] 未着手 | 8 | |
| S2-2 AI ロジックの拡張 | [ ] 未着手 | 10 | |
| S2-3 ストーリー・フリー対戦への統合 | [ ] 未着手 | 6 | |
| S2-4 テスト・品質保証 | [ ] 未着手 | 10 | |

### 並行作業ガイド

```
S2-1（型定義・プロファイル）
  ├──→ S2-2（AI ロジック拡張）   ← S2-1 完了後に着手
  │     └──→ S2-3（統合）        ← S2-2 完了後に着手
  └──→ S2-4-1（型テスト）        ← S2-1 完了後すぐ並行可
              └──→ S2-4-2〜5     ← S2-3 完了後に一括
```

---

## Phase S2-1: 型定義・データ構造

### S2-1-1: AiPlayStyle 型の定義

- [ ] `core/story-balance.ts` に `AiPlayStyle` 型を追加
  - [ ] `sidePreference: number`（横方向の癖）
  - [ ] `lateralOscillation: number`（揺さぶり幅 px）
  - [ ] `lateralPeriod: number`（揺さぶり周期 ms）
  - [ ] `aggressiveness: number`（前後ポジショニング 0-1）
  - [ ] `adaptability: number`（スコア差適応度 0-1）
- [ ] `DEFAULT_PLAY_STYLE` 定数を定義

### S2-1-2: AiBehaviorConfig への playStyle 追加

- [ ] `AiBehaviorConfig` に `playStyle?: AiPlayStyle` を追加（オプショナル）
- [ ] 既存の `AI_BEHAVIOR_PRESETS` が後方互換を維持することを確認

### S2-1-3: キャラクター AI プロファイルの定義

- [ ] `core/character-ai-profiles.ts` を新規作成
- [ ] 各キャラクターの `AiPlayStyle` を定義
  - [ ] ヒロ（hiro）: ストレートシューター
  - [ ] ミサキ（misaki）: テクニシャン
  - [ ] タクマ（takuma）: パワーバウンサー
  - [ ] ユウ（yuu）: アナライザー
  - [ ] ルーキー（rookie）: ビギナー
  - [ ] レギュラー（regular）: オールラウンダー
  - [ ] エース（ace）: エリート
- [ ] `getCharacterAiProfile(characterId: string)` 関数をエクスポート

**確認**:
- [ ] `tsc --noEmit` で型エラーなし

---

## Phase S2-2: AI ロジックの拡張

### S2-2-1: calculateTargetWithBehavior にプレイスタイル反映

- [ ] `core/ai.ts` の `calculateTargetWithBehavior` に `playStyle` 取得ロジックを追加
- [ ] `config.playStyle ?? DEFAULT_PLAY_STYLE` でフォールバック

### S2-2-2: 揺さぶり（lateralOscillation）ロジック

- [ ] パック向かってくる時のターゲット X に周期的オフセットを加算
- [ ] `lateralOscillation = 0` の場合はスキップ
- [ ] 揺さぶりは待機中には適用しない

### S2-2-3: アグレッシブネス実装

- [ ] ターゲット Y 座標を `aggressiveness` で制御
- [ ] `aggressiveness = 0` → ゴール近く（守備的）
- [ ] `aggressiveness = 1` → 中央ライン近く（攻撃的）
- [ ] パック位置より前には出ない制約を維持

### S2-2-4: 適応度（adaptability）実装

- [ ] `updateWithBehavior` に `scoreDiff?: number` パラメータを追加（オプショナル）
- [ ] `applyAdaptability` 関数を実装
  - [ ] `maxSpeed` を最大 +20% 加速
  - [ ] `predictionFactor` を最大 +30% 強化
  - [ ] `wobble` を最大 -50% 減少
- [ ] `adaptability = 0` or `scoreDiff <= 0` の場合は無効
- [ ] 後方互換ラッパーの `update` も `scoreDiff` をオプショナルで受け取る

**確認**:
- [ ] `tsc --noEmit` で型エラーなし

---

## Phase S2-3: ストーリー・フリー対戦への統合

### S2-3-1: ストーリーバランスにキャラ AI プロファイルを統合

- [ ] `core/story-balance.ts` のステージ 1-1 に `playStyle: CHARACTER_AI_PROFILES['hiro']` を追加
- [ ] ステージ 1-2 に `playStyle: CHARACTER_AI_PROFILES['misaki']` を追加
- [ ] ステージ 1-3 に `playStyle: CHARACTER_AI_PROFILES['takuma']` を追加

### S2-3-2: フリー対戦キャラへの AI プロファイル適用

- [ ] `AI_BEHAVIOR_PRESETS.easy` に `playStyle: CHARACTER_AI_PROFILES['rookie']` を追加
- [ ] `AI_BEHAVIOR_PRESETS.normal` に `playStyle: CHARACTER_AI_PROFILES['regular']` を追加
- [ ] `AI_BEHAVIOR_PRESETS.hard` に `playStyle: CHARACTER_AI_PROFILES['ace']` を追加

### S2-3-3: ゲームループへのスコア差渡し

- [ ] `useGameLoop.ts` の AI 更新部分で `scoreDiff` を計算して渡す
- [ ] `scoreDiff = Math.max(0, scoreRef.current.p - scoreRef.current.c)`

### S2-3-4: 2P 対戦への影響確認

- [ ] 2P 対戦は CPU AI を使用しないため変更不要（確認のみ）

---

## Phase S2-4: テスト・品質保証

### S2-4-1: AiPlayStyle 型・プロファイルのテスト

- [ ] `core/character-ai-profiles.test.ts` を新規作成
  - [ ] 全キャラクターの AI プロファイルが定義されている（7 キャラ）
  - [ ] パラメータが有効範囲内（lateralOscillation >= 0, aggressiveness 0-1, adaptability 0-1）
  - [ ] DEFAULT_PLAY_STYLE のデフォルト値が正しい
  - [ ] ヒロは揺さぶりなし（lateralOscillation === 0）
  - [ ] ミサキは大きな揺さぶり（lateralOscillation > 20）
  - [ ] タクマは守備的（aggressiveness < 0.3）
  - [ ] ユウは高適応（adaptability > 0.5）

### S2-4-2: AI ロジック拡張のテスト

- [ ] `core/ai.test.ts` にプレイスタイルテストを追加
  - [ ] playStyle 未設定時は既存動作と同一（後方互換）
  - [ ] lateralOscillation > 0 でターゲット X が時間で変動する
  - [ ] aggressiveness = 0 でゴール近くに留まる
  - [ ] aggressiveness 高で前に出る
  - [ ] adaptability > 0 でスコア差に応じて速度上昇
  - [ ] adaptability = 0 でスコア差に無関係
  - [ ] scoreDiff = 0 で適応が発動しない

### S2-4-3: ストーリーバランス統合テスト

- [ ] `core/story-balance.test.ts` にプレイスタイルテストを追加
  - [ ] 各ステージの AI に playStyle が設定されている
  - [ ] AI_BEHAVIOR_PRESETS の各難易度に playStyle が設定されている

### S2-4-4: 既存テスト全パス確認

- [ ] `npm test` で全テストパス
- [ ] `tsc --noEmit` で型エラーなし

### S2-4-5: ビルド確認

- [ ] `npm run build` でビルド成功

---

## 各フェーズの共通完了条件

各フェーズ完了時に以下をすべて確認:

- [ ] `tsc --noEmit` で型エラーなし
- [ ] 既存モード（フリー対戦、ストーリー、2P、デイリー、図鑑）に影響なし
