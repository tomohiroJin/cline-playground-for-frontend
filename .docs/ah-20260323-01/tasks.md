# Step 1: フィールドリサイズ — タスクチェックリスト

## 進捗サマリー

| フェーズ | ステータス | タスク数 | 完了日 |
|---------|-----------|---------|--------|
| S1-1 定数・型定義の更新 | [ ] 未着手 | 11 | |
| S1-2 レンダラーの対応 | [ ] 未着手 | 9 | |
| S1-3 ゲームロジックの対応 | [ ] 未着手 | 10 | |
| S1-4 CSS・UI の対応 | [ ] 未着手 | 5 | |
| S1-5 テスト・品質保証 | [ ] 未着手 | 8 | |

### 並行作業ガイド

```
S1-1（定数更新）
  ├──→ S1-2（レンダラー）  ← S1-1 完了後に着手
  ├──→ S1-3（ゲームロジック） ← S1-3-1 は S1-1 待ち、S1-3-2〜4 は S1-1 と並行可
  └──→ S1-4（CSS・UI）     ← S1-1 と完全並行可
          └──→ S1-5（テスト） ← 全フェーズ完了後に一括
```

---

## Phase S1-1: 定数・型定義の更新

### S1-1-1: Canvas サイズ定数の変更

- [ ] `core/constants.ts` の `CONSTANTS.CANVAS` を `{ WIDTH: 600, HEIGHT: 1200 }` に変更
- [ ] コメントを更新: `// 内部解像度 600x1200 固定`

### S1-1-2: ゴール・障害物座標のスケーリング

- [ ] `core/config.ts` の全フィールドのゴールサイズを更新
  - [ ] Classic: 120 → 160
  - [ ] Wide: 180 → 240
  - [ ] Pillars: 120 → 160
  - [ ] Zigzag: 135 → 180
  - [ ] Fortress: 105 → 140
  - [ ] Bastion: 120 → 160
- [ ] `core/config.ts` の全障害物座標を 1.33x スケーリング（半径は据え置き）
  - [ ] Pillars: 5 障害物の x, y を更新
  - [ ] Zigzag: 3 障害物の x, y を更新
  - [ ] Fortress: 4 障害物の x, y を更新
  - [ ] Bastion: 7 障害物の x, y を更新
- [ ] コメントを更新: `// 障害物座標は 600x1200 解像度基準`

### S1-1-3: 物理・速度パラメータの調整

- [ ] `core/constants.ts` の物理パラメータ更新
  - [ ] `PHYSICS.MAX_POWER`: 12 → 16
  - [ ] `PHYSICS.MIN_SPEED`: 1.5 → 2.0
  - [ ] `CPU.easy`: 1.5 → 2.0
  - [ ] `CPU.normal`: 3.5 → 4.7
  - [ ] `CPU.hard`: 6.0 → 8.0
- [ ] `core/keyboard.ts` の `KEYBOARD_MOVE_SPEED`: 6 → 8
- [ ] `infrastructure/renderer/renderer-utils.ts` の速度閾値更新
  - [ ] `SPEED_NORMAL`: 6 → 8
  - [ ] `SPEED_FAST`: 10 → 13

**確認**:
- [ ] `tsc --noEmit` で型エラーなし

---

## Phase S1-2: レンダラーの対応

### S1-2-1: ハードコード座標の定数化（renderer.ts）

- [ ] `renderer.ts` 内の数値リテラルを洗い出し
- [ ] 外枠描画のオフセット値の確認・必要に応じて修正
- [ ] 中央サークル半径（60px）を `W * 0.1` に変更
- [ ] 中央ドット半径の確認
- [ ] ゴール LED 描画の座標確認
- [ ] カウントダウン・ゴールエフェクトのフォントサイズ確認

### S1-2-2: entity-renderer.ts の確認

- [ ] `infrastructure/renderer/entity-renderer.ts` のハードコード座標を確認
- [ ] マレット描画が `consts.SIZES.MALLET` を参照していることを確認
- [ ] パック描画が `consts.SIZES.PUCK` を参照していることを確認

### S1-2-3: その他描画関連の確認

- [ ] ポーズオーバーレイの座標確認
- [ ] ヘルプ表示の座標確認

---

## Phase S1-3: ゲームロジックの対応

### S1-3-1: マレット移動制約の確認

- [ ] `getPlayerYBounds` が `constants` パラメータから正しく計算されることを確認
- [ ] `getPlayerXBounds` が `constants` パラメータから正しく計算されることを確認
- [ ] `calculateKeyboardMovement` のクランプが `consts` を使用していることを確認

### S1-3-2: AI パラメータの再調整

- [ ] `core/story-balance.ts` のステージ 1-1 の AI パラメータを更新
  - [ ] maxSpeed: 1.2 → 1.6, predictionFactor: 0.5 → 0.7, wobble: 40 → 53
- [ ] `core/story-balance.ts` のステージ 1-2 の AI パラメータを更新
  - [ ] maxSpeed: 3.0 → 4.0, predictionFactor: 4 → 5.3, wobble: 10 → 13
- [ ] `core/story-balance.ts` のステージ 1-3 の AI パラメータを更新
  - [ ] maxSpeed: 5.0 → 6.7, predictionFactor: 10 → 13.3
- [ ] `core/ai.ts` のスタックリセット座標が `W/2` 参照であることを確認

### S1-3-3: キーボード移動速度の確認

- [ ] `KEYBOARD_MOVE_SPEED` 変更の影響範囲を確認（S1-1-3 で変更済み）
- [ ] 2P 用 WASD 入力が同じ定数を使用していることを確認

### S1-3-4: マルチタッチ入力の確認

- [ ] `core/multi-touch.ts` のゾーン判定が `canvasHeight / 2` 使用を確認
- [ ] タッチ座標→マレット位置の変換が `consts` 参照を確認

---

## Phase S1-4: CSS・UI の対応

### S1-4-1: GameCanvas の更新

- [ ] `styles.ts` の `GameCanvas` の `max-width` を `600px` に変更

### S1-4-2: ScoreBoardContainer の更新

- [ ] `styles.ts` の `ScoreBoardContainer` の `max-width` を `600px` に変更

### S1-4-3: MenuCard の確認

- [ ] `MenuCard` の `max-width` を据え置き（450px）とするか判断
- [ ] 他の UI コンポーネントで `max-width: 450px` がハードコードされている箇所を確認
- [ ] レスポンシブ表示の確認

---

## Phase S1-5: テスト・品質保証

### S1-5-1: テストの修正

- [ ] `core/keyboard.test.ts` のハードコード座標を `CONSTANTS` 参照に修正
- [ ] `core/multi-touch.test.ts` のハードコード座標を `CONSTANTS` 参照に修正
- [ ] `AirHockeyGame.test.tsx` のハードコード座標を確認・修正
- [ ] その他テストファイルの座標ハードコードを検索・修正

### S1-5-2: 全テスト実行

- [ ] `npm test` で全テストパス
- [ ] `tsc --noEmit` で型エラーなし
- [ ] `npm run build` でビルド成功

### S1-5-3: 各モード動作確認

- [ ] フリー対戦（easy/normal/hard）の動作確認
- [ ] ストーリーモード（3 ステージ）の動作確認
- [ ] 2P 対戦（キーボード）の動作確認
- [ ] デイリーチャレンジの動作確認

---

## 各フェーズの共通完了条件

各フェーズ完了時に以下をすべて確認:

- [ ] `tsc --noEmit` で型エラーなし
- [ ] 既存モード（フリー対戦、ストーリー、2P、デイリー、図鑑）に影響なし
