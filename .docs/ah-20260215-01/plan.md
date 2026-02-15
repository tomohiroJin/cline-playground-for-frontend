# Air Hockey ブラッシュアップ 実装計画

## 概要
Air Hockey ゲームの6項目のブラッシュアップを計画駆動で実施する。

## 変更対象ファイル

### コアロジック
- `core/constants.ts` - キャンバスサイズの動的化、フィーバー関連定数追加
- `core/types.ts` - サイズ設定型、フィーバー状態型追加
- `core/config.ts` - 新ステージ追加、サイズオプション追加
- `core/entities.ts` - エンティティ生成のサイズ対応
- `core/ai.ts` - CPU AI ロジック全面調整
- `core/physics.ts` - サイズ動的対応

### 描画
- `renderer.ts` - パックトレイル、マレットグロー強化、フィーバー演出、背景アニメーション

### フック
- `hooks/useGameLoop.ts` - フィーバータイム制御、サーブ方向修正、サイズ対応

### コンポーネント
- `components/TitleScreen.tsx` - サイズ選択UI追加
- `components/Field.tsx` - 動的キャンバスサイズ対応
- `components/Scoreboard.tsx` - スコアアニメーション対応

### スタイル
- `styles.ts` - キャンバスサイズ動的対応
- `AirHockeyGame.tsx` - サイズ状態管理追加

---

## 実装順序

### Phase 1: 基盤変更（サイズ動的化）
1. `core/types.ts` にサイズ設定型 `CanvasSize` を追加
2. `core/constants.ts` を関数ベースに変更（サイズに応じた定数を返す）
3. `core/config.ts` にサイズオプションを追加
4. 全体の座標計算を W/H 変数ベースに統一（現状でも大部分は対応済み）
5. `components/Field.tsx` と `styles.ts` を動的サイズ対応
6. `AirHockeyGame.tsx` にサイズ state を追加
7. `components/TitleScreen.tsx` にサイズ選択UI追加

### Phase 2: ステージ追加
8. `core/config.ts` に Zigzag ステージを追加
9. `core/config.ts` に Fortress ステージを追加

### Phase 3: サーブ方向修正
10. `hooks/useGameLoop.ts` のゴール後パック生成ロジックを修正
11. `core/entities.ts` の初期パック生成を修正

### Phase 4: CPU AI 調整
12. `core/constants.ts` の CPU 速度定数を調整
13. `core/ai.ts` の各難易度ロジックを調整
    - Easy: ブレ追加、スキップ率調整
    - Normal: 積極性向上、予測改善
    - Hard: 壁反射予測、ポジショニング改善

### Phase 5: フィーバータイム
14. `core/types.ts` にフィーバー状態型を追加
15. `core/constants.ts` にフィーバー関連定数を追加
16. `core/entities.ts` にフィーバーパック生成を追加
17. `hooks/useGameLoop.ts` にフィーバーロジック実装
18. `renderer.ts` にフィーバー演出描画を追加

### Phase 6: 見た目強化
19. `renderer.ts` にパックトレイル描画を追加
20. `renderer.ts` のマレットグロー強化
21. `renderer.ts` のゴールエフェクトにパーティクル追加
22. `renderer.ts` の背景アニメーション追加
23. `renderer.ts` のフィールド線ネオン強化

### Phase 7: テスト & 統合確認
24. 既存テストの修正・実行
25. 動作確認

---

## リスク・考慮事項
- サイズ動的化は全体に影響するため、Phase 1 を最初に実施し他への影響を最小限にする
- パフォーマンス: トレイルエフェクトやパーティクルは軽量実装にする
- 後方互換: デフォルトサイズを Standard (300x600) にすることで既存の動作を維持
